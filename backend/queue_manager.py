import os
import json
import asyncio
import logging
import time
import uuid
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict

import redis.asyncio as aioredis

from .database import SessionLocal
from .models import Vacancy, VacancyStatusHistory, AppSetting
from .schemas import VacancyResponse, TaskInfo, QueueStatusResponse
from .scraper import scrape_linkedin_job, scrape_upwork_job, scrape_universal_job, extract_job_id
from .llm import analyze_vacancy_with_llm, get_setting_or_env
from .mercure import (
    publish_mercure_event,
    EVENT_VACANCY_CREATED,
    EVENT_VACANCY_UPDATED,
    EVENT_TASK_FAILED,
    EVENT_QUEUE_UPDATED,
    EVENT_QUEUE_IDLE,
    MSG_VACANCY_CREATED,
    MSG_VACANCY_UPDATED,
    MSG_TASK_FAILED,
    MSG_QUEUE_UPDATED,
    MSG_QUEUE_IDLE,
    ERR_SCRAPE_FAILED,
    ERR_AI_ANALYSIS_FAILED,
)

logger = logging.getLogger("linkedin_tracker.queue")

SCRAPE_QUEUE_KEY = "linkedin:scrape_queue"
AI_QUEUE_KEY = "linkedin:ai_queue"
SCRAPE_PROCESSING_SET = "linkedin:processing:scrape"
AI_PROCESSING_SET = "linkedin:processing:ai"
RECENT_LIST = "linkedin:recent"
STATS_KEY = "linkedin:stats"
TASK_KEY_PREFIX = "linkedin:task:"
TASK_TTL = 86400 * 7  # 7 days


@dataclass
class JobTask:
    task_id: str
    url: str
    default_tags: List[str]
    batch_id: str
    status: str = "pending"  # pending, processing, completed, failed
    stage: str = "scraping"  # scraping, ai_analysis, completed, failed
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    vacancy_id: Optional[int] = None
    user_id: Optional[int] = None
    title: Optional[str] = None
    company: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "JobTask":
        return cls(
            task_id=data["task_id"],
            url=data["url"],
            default_tags=data.get("default_tags", []),
            batch_id=data.get("batch_id", ""),
            status=data.get("status", "pending"),
            stage=data.get("stage", "scraping"),
            created_at=data.get("created_at", time.time()),
            updated_at=data.get("updated_at", time.time()),
            vacancy_id=data.get("vacancy_id"),
            user_id=data.get("user_id"),
            title=data.get("title"),
            company=data.get("company"),
            error=data.get("error"),
        )

    def to_info(self) -> TaskInfo:
        return TaskInfo(
            task_id=self.task_id,
            url=self.url,
            status=self.status,
            stage=self.stage,
            created_at=self.created_at,
            vacancy_id=self.vacancy_id,
            user_id=self.user_id,
            title=self.title,
            company=self.company,
            error=self.error,
        )


class RedisQueueManager:
    def __init__(self, broker_url: Optional[str] = None, scrape_concurrency: int = 1, ai_concurrency: int = 1):
        self.broker_url = broker_url or os.getenv("BROKER_URL", "redis://host.docker.internal:6379/0")
        if "host.docker.internal" in self.broker_url and not os.path.exists("/.dockerenv"):
            import socket
            try:
                socket.gethostbyname("host.docker.internal")
            except socket.gaierror:
                self.broker_url = self.broker_url.replace("host.docker.internal", "localhost")
        self.scrape_concurrency = scrape_concurrency
        self.ai_concurrency = ai_concurrency
        self.redis: Optional[aioredis.Redis] = None
        self._worker_tasks: List[asyncio.Task] = []
        self._running: bool = False

    async def start(self):
        """Connect to Redis broker and start background workers for Scraping and AI."""
        if self._running:
            return

        if not self.broker_url:
            raise RuntimeError("BROKER_URL is not set. Redis message broker is required.")

        logger.info(f"Connecting to Redis broker at {self.broker_url}...")
        self.redis = aioredis.from_url(
            self.broker_url,
            decode_responses=True,
            socket_timeout=5.0,
            socket_connect_timeout=5.0,
        )
        await self.redis.ping()
        logger.info("Successfully connected to Redis message broker.")

        self._running = True

        # Launch Scrape workers (Stage 1)
        for i in range(self.scrape_concurrency):
            t = asyncio.create_task(self._scrape_worker_loop(i), name=f"scrape-worker-{i}")
            self._worker_tasks.append(t)

        # Launch AI workers (Stage 2)
        for i in range(self.ai_concurrency):
            t = asyncio.create_task(self._ai_worker_loop(i), name=f"ai-worker-{i}")
            self._worker_tasks.append(t)

        logger.info(
            f"RedisQueueManager started with {self.scrape_concurrency} scrape worker(s) "
            f"and {self.ai_concurrency} AI worker(s)"
        )

    async def stop(self):
        """Gracefully stop all workers and close Redis connection."""
        self._running = False
        for worker_t in self._worker_tasks:
            worker_t.cancel()
        if self._worker_tasks:
            await asyncio.gather(*self._worker_tasks, return_exceptions=True)
            self._worker_tasks.clear()

        if self.redis:
            await self.redis.aclose()
            self.redis = None
        logger.info("RedisQueueManager stopped")

    async def enqueue(
        self,
        urls: List[str],
        default_tags: List[str],
        vacancy_ids: Optional[List[int]] = None,
        user_id: Optional[int] = None,
    ) -> Tuple[str, List[JobTask]]:
        """Add URLs to Stage 1 (Scraping) queue in Redis. Returns (batch_id, list_of_tasks)."""
        if not self.redis:
            raise RuntimeError("Redis broker is not connected")

        batch_id = uuid.uuid4().hex[:8]
        new_tasks = []

        async with self.redis.pipeline(transaction=True) as pipe:
            for i, url in enumerate(urls):
                clean_url = url.strip()
                if not clean_url:
                    continue

                task_id = uuid.uuid4().hex[:8]
                v_id = vacancy_ids[i] if vacancy_ids and i < len(vacancy_ids) else None
                task = JobTask(
                    task_id=task_id,
                    url=clean_url,
                    default_tags=list(default_tags),
                    batch_id=batch_id,
                    status="pending",
                    stage="scraping",
                    vacancy_id=v_id,
                    user_id=user_id,
                )
                new_tasks.append(task)

                # Store task definition
                pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                # Enqueue into scrape queue (Stage 1)
                pipe.rpush(SCRAPE_QUEUE_KEY, task_id)
                # Add to recent list
                pipe.lpush(RECENT_LIST, task_id)
                pipe.ltrim(RECENT_LIST, 0, 99)

            await pipe.execute()

        total_remaining = await self._calculate_total_remaining()

        # Notify Mercure about newly enqueued items (user topic and global topic)
        mercure_topic = f"vacancies:{user_id}" if user_id else "vacancies"
        asyncio.create_task(
            publish_mercure_event(
                event_type=EVENT_QUEUE_UPDATED,
                data={
                    "message_code": MSG_QUEUE_UPDATED,
                    "batch_id": batch_id,
                    "queued_count": len(new_tasks),
                    "total_remaining": total_remaining,
                },
                topic=mercure_topic,
            )
        )

        logger.info(
            f"Enqueued {len(new_tasks)} URLs in batch {batch_id} for user {user_id} into Scrape Queue. "
            f"Total remaining tasks: {total_remaining}"
        )
        return batch_id, new_tasks

    async def _calculate_total_remaining(self) -> int:
        if not self.redis:
            return 0
        p_scrape = await self.redis.llen(SCRAPE_QUEUE_KEY)
        p_ai = await self.redis.llen(AI_QUEUE_KEY)
        pr_scrape = await self.redis.scard(SCRAPE_PROCESSING_SET)
        pr_ai = await self.redis.scard(AI_PROCESSING_SET)
        return p_scrape + p_ai + pr_scrape + pr_ai

    async def get_status(self, user_id: Optional[int] = None) -> QueueStatusResponse:
        """Query Redis for queue status of both stages and recent task info."""
        if not self.redis:
            return QueueStatusResponse(
                pending=0, processing=0, total_remaining=0, completed=0, failed=0, recent_tasks=[]
            )

        p_scrape = await self.redis.llen(SCRAPE_QUEUE_KEY)
        p_ai = await self.redis.llen(AI_QUEUE_KEY)
        pr_scrape = await self.redis.scard(SCRAPE_PROCESSING_SET)
        pr_ai = await self.redis.scard(AI_PROCESSING_SET)

        total_pending = p_scrape + p_ai
        total_processing = pr_scrape + pr_ai
        total_remaining = total_pending + total_processing

        stats = await self.redis.hgetall(STATS_KEY)
        completed = int(stats.get("completed", 0))
        failed = int(stats.get("failed", 0))

        recent_ids = await self.redis.lrange(RECENT_LIST, 0, 19)
        recent_tasks = []
        if recent_ids:
            pipe = self.redis.pipeline()
            for tid in recent_ids:
                pipe.get(f"{TASK_KEY_PREFIX}{tid}")
            raw_tasks = await pipe.execute()

            for raw in raw_tasks:
                if raw:
                    try:
                        task = JobTask.from_dict(json.loads(raw))
                        if user_id is None or task.user_id == user_id:
                            recent_tasks.append(task.to_info())
                    except Exception as e:
                        logger.warning(f"Error decoding task JSON: {e}")

        return QueueStatusResponse(
            pending=total_pending,
            processing=total_processing,
            total_remaining=total_remaining,
            completed=completed,
            failed=failed,
            pending_scrape=p_scrape,
            pending_ai=p_ai,
            processing_scrape=pr_scrape,
            processing_ai=pr_ai,
            recent_tasks=recent_tasks,
        )

    # -------------------------------------------------------------------------
    # Stage 1: Scraping Worker Loop
    # -------------------------------------------------------------------------
    async def _scrape_worker_loop(self, worker_id: int):
        logger.info(f"Scrape worker {worker_id} started loop")
        while self._running:
            try:
                item = await self.redis.blpop(SCRAPE_QUEUE_KEY, timeout=1)
                if not item:
                    continue

                _, task_id = item
            except asyncio.CancelledError:
                break
            except Exception as e:
                if self._running:
                    logger.error(f"Scrape worker {worker_id} error popping queue: {e}")
                    await asyncio.sleep(1)
                continue

            await self.redis.sadd(SCRAPE_PROCESSING_SET, task_id)
            try:
                await self._process_scrape_task(task_id)
            except Exception as e:
                logger.error(f"Scrape worker {worker_id} uncaught error on task {task_id}: {e}", exc_info=True)
            finally:
                await self.redis.srem(SCRAPE_PROCESSING_SET, task_id)

    async def _process_scrape_task(self, task_id: str):
        raw = await self.redis.get(f"{TASK_KEY_PREFIX}{task_id}")
        if not raw:
            logger.error(f"Task payload {task_id} not found in Redis for scraping")
            return

        task = JobTask.from_dict(json.loads(raw))
        task.status = "processing"
        task.stage = "scraping"
        task.updated_at = time.time()
        await self.redis.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)

        logger.info(f"[Stage 1 - Scrape] Processing task {task.task_id} for URL: {task.url}")

        try:
            # 1. Scrape job publicly (LinkedIn or Upwork)
            if "upwork.com" in task.url.lower():
                scraped = await scrape_upwork_job(task.url)
            elif "linkedin.com" in task.url.lower():
                scraped = await scrape_linkedin_job(task.url)
            else:
                scraped = await scrape_universal_job(task.url)

            # 2. Save/update initial vacancy in Database immediately
            with SessionLocal() as db:
                job_id = extract_job_id(task.url)
                existing = None
                if task.vacancy_id:
                    existing = db.query(Vacancy).filter(Vacancy.id == task.vacancy_id).first()
                if not existing and job_id:
                    existing = db.query(Vacancy).filter(Vacancy.job_id == job_id).first()
                if not existing:
                    existing = db.query(Vacancy).filter(Vacancy.url == task.url).first()

                initial_tags = list(task.default_tags)
                if existing:
                    if scraped.get("job_id"):
                        existing.job_id = scraped["job_id"]
                    existing.title = scraped["title"]
                    existing.company = scraped["company"]
                    existing.company_url = scraped["company_url"]
                    existing.location = scraped["location"]
                    existing.city = scraped.get("city")
                    existing.country = scraped["country"]
                    existing.description = scraped["description"]
                    if scraped.get("company_info"):
                        existing.company_info = scraped["company_info"]

                    current_tags = set(existing.tags or [])
                    for t in initial_tags:
                        current_tags.add(t)
                    existing.tags = list(current_tags)

                    if scraped.get("salary_min") is not None:
                        existing.salary_min = scraped["salary_min"]
                    if scraped.get("salary_max") is not None:
                        existing.salary_max = scraped["salary_max"]
                    if scraped.get("salary_currency") is not None:
                        existing.salary_currency = scraped["salary_currency"]
                    if scraped.get("salary_period") is not None:
                        existing.salary_period = scraped["salary_period"]
                    if scraped.get("workplace_type"):
                        existing.workplace_type = scraped["workplace_type"]
                    if "is_closed" in scraped:
                        existing.is_closed = scraped["is_closed"]

                    if not existing.user_id and task.user_id:
                        existing.user_id = task.user_id
                    db.commit()
                    db.refresh(existing)
                    saved_vacancy = existing
                    event_type = "vacancy_updated"
                else:
                    new_v = Vacancy(
                        user_id=task.user_id,
                        job_id=scraped.get("job_id"),
                        url=task.url,
                        title=scraped["title"],
                        company=scraped["company"],
                        company_url=scraped["company_url"],
                        company_info=scraped.get("company_info"),
                        location=scraped["location"],
                        city=scraped.get("city"),
                        country=scraped["country"],
                        description=scraped["description"],
                        workplace_type=scraped.get("workplace_type"),
                        is_closed=scraped.get("is_closed", False),
                        salary_min=scraped.get("salary_min"),
                        salary_max=scraped.get("salary_max"),
                        salary_currency=scraped.get("salary_currency"),
                        salary_period=scraped.get("salary_period"),
                        ai_summary=None,
                        tech_stack=[],
                        tags=initial_tags,
                        status="Еще не написан",
                    )
                    db.add(new_v)
                    db.flush()
                    db.add(VacancyStatusHistory(
                        vacancy_id=new_v.id,
                        from_status=None,
                        to_status=new_v.status,
                        created_at=new_v.created_at,
                    ))
                    db.commit()
                    db.refresh(new_v)
                    saved_vacancy = new_v
                    event_type = "vacancy_created"

                task.vacancy_id = saved_vacancy.id
                task.title = saved_vacancy.title
                task.company = saved_vacancy.company
                vacancy_data = VacancyResponse.model_validate(saved_vacancy).model_dump(mode="json")

            # 3. Publish Mercure SSE: vacancy card appears on Kanban immediately!
            total_rem = await self._calculate_total_remaining()
            logger.info(
                f"[Stage 1 - Scrape] Saved vacancy {saved_vacancy.id}: '{saved_vacancy.title}' "
                f"({saved_vacancy.company}) for user {task.user_id}. Pushing to Stage 2 (AI queue)..."
            )

            mercure_topic = f"vacancies:{task.user_id}" if task.user_id else "vacancies"
            await publish_mercure_event(
                event_type=event_type,
                data={
                    "message_code": MSG_VACANCY_CREATED if event_type == EVENT_VACANCY_CREATED else MSG_VACANCY_UPDATED,
                    "vacancy": vacancy_data,
                    "task_id": task.task_id,
                    "batch_id": task.batch_id,
                    "url": task.url,
                    "total_remaining": total_rem,
                },
                topic=mercure_topic,
            )

            # 4. Enqueue into Stage 2 (AI Queue)
            if "upwork.com" in task.url.lower():
                task.status = "completed"
                task.stage = "completed"
                task.updated_at = time.time()
                async with self.redis.pipeline(transaction=True) as pipe:
                    pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                    pipe.hincrby(STATS_KEY, "completed", 1)
                    await pipe.execute()
                
                total_rem = await self._calculate_total_remaining()
                if total_rem == 0:
                    asyncio.create_task(
                        publish_mercure_event(
                            event_type=EVENT_QUEUE_IDLE,
                            data={"message_code": MSG_QUEUE_IDLE, "total_remaining": 0}
                        )
                    )
            else:
                task.stage = "ai_analysis"
                task.status = "pending"
                task.updated_at = time.time()

                async with self.redis.pipeline(transaction=True) as pipe:
                    pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                    pipe.rpush(AI_QUEUE_KEY, task_id)
                    await pipe.execute()

        except Exception as e:
            task.status = "failed"
            task.stage = "scraping"
            task.error = str(e)
            task.updated_at = time.time()

            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                pipe.hincrby(STATS_KEY, "failed", 1)
                await pipe.execute()

            total_rem = await self._calculate_total_remaining()
            logger.error(f"[Stage 1 - Scrape] Task {task.task_id} failed for {task.url}: {e}", exc_info=True)

            mercure_topic = f"vacancies:{task.user_id}" if task.user_id else "vacancies"
            await publish_mercure_event(
                event_type=EVENT_TASK_FAILED,
                data={
                    "message_code": MSG_TASK_FAILED,
                    "error_code": ERR_SCRAPE_FAILED,
                    "task_id": task.task_id,
                    "batch_id": task.batch_id,
                    "url": task.url,
                    "total_remaining": total_rem,
                },
                topic=mercure_topic,
            )

    # -------------------------------------------------------------------------
    # Stage 2: AI Summarization Worker Loop
    # -------------------------------------------------------------------------
    async def _ai_worker_loop(self, worker_id: int):
        logger.info(f"AI worker {worker_id} started loop")
        while self._running:
            try:
                item = await self.redis.blpop(AI_QUEUE_KEY, timeout=1)
                if not item:
                    continue

                _, task_id = item
            except asyncio.CancelledError:
                break
            except Exception as e:
                if self._running:
                    logger.error(f"AI worker {worker_id} error popping queue: {e}")
                    await asyncio.sleep(1)
                continue

            await self.redis.sadd(AI_PROCESSING_SET, task_id)
            try:
                await self._process_ai_task(task_id)
            except Exception as e:
                logger.error(f"AI worker {worker_id} uncaught error on task {task_id}: {e}", exc_info=True)
            finally:
                await self.redis.srem(AI_PROCESSING_SET, task_id)

                # Check if all queues and workers are idle
                total_rem = await self._calculate_total_remaining()
                if total_rem == 0:
                    asyncio.create_task(
                        publish_mercure_event(
                            event_type=EVENT_QUEUE_IDLE,
                            data={
                                "message_code": MSG_QUEUE_IDLE,
                                "total_remaining": 0,
                            }
                        )
                    )

    async def _process_ai_task(self, task_id: str):
        raw = await self.redis.get(f"{TASK_KEY_PREFIX}{task_id}")
        if not raw:
            logger.error(f"Task payload {task_id} not found in Redis for AI processing")
            return

        task = JobTask.from_dict(json.loads(raw))
        task.status = "processing"
        task.stage = "ai_analysis"
        task.updated_at = time.time()
        await self.redis.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)

        logger.info(f"[Stage 2 - AI] Processing task {task.task_id} for vacancy #{task.vacancy_id}")

        try:
            with SessionLocal() as db:
                vacancy = db.query(Vacancy).filter(Vacancy.id == task.vacancy_id).first()
                if not vacancy:
                    raise RuntimeError(f"Vacancy #{task.vacancy_id} not found in DB")
                user_id = task.user_id or (vacancy.user_id if vacancy else None)
                provider = os.getenv("LLM_PROVIDER")
                language = get_setting_or_env(db, "locale", os.getenv("LOCALE", "ru"), user_id=user_id).lower()

                # Call LLM summarization with required provider and language
                llm_res = await analyze_vacancy_with_llm(
                    title=vacancy.title,
                    company=vacancy.company,
                    location=vacancy.location or "",
                    description=vacancy.description or "",
                    provider=provider,
                    language=language,
                    db=db,
                    user_id=user_id,
                )

                # Update vacancy in DB
                if llm_res.get("title") and (not vacancy.title or vacancy.title.startswith("http") or vacancy.title == "Не удалось загрузить страницу"):
                    vacancy.title = llm_res["title"]
                if llm_res.get("location") and (not vacancy.location or vacancy.location == "Not specified"):
                    vacancy.location = llm_res["location"]
                if llm_res.get("summary"):
                    vacancy.ai_summary = llm_res["summary"]
                if llm_res.get("tech_stack"):
                    vacancy.tech_stack = llm_res["tech_stack"]
                if llm_res.get("company_info") and not vacancy.company_info:
                    vacancy.company_info = llm_res["company_info"]
                if llm_res.get("salary_min") is not None:
                    vacancy.salary_min = llm_res["salary_min"]
                if llm_res.get("salary_max") is not None:
                    vacancy.salary_max = llm_res["salary_max"]
                if llm_res.get("salary_currency") is not None:
                    vacancy.salary_currency = llm_res["salary_currency"]
                if llm_res.get("salary_period") is not None:
                    vacancy.salary_period = llm_res["salary_period"]
                if llm_res.get("workplace_type") and not vacancy.workplace_type:
                    vacancy.workplace_type = llm_res["workplace_type"]

                db.commit()
                db.refresh(vacancy)
                vacancy_data = VacancyResponse.model_validate(vacancy).model_dump(mode="json")

            task.status = "completed"
            task.stage = "completed"
            task.updated_at = time.time()

            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                pipe.hincrby(STATS_KEY, "completed", 1)
                await pipe.execute()

            total_rem = await self._calculate_total_remaining()
            logger.info(
                f"[Stage 2 - AI] Task {task.task_id} AI completed for '{vacancy.title}'. "
                f"Remaining tasks in pipeline: {total_rem}"
            )

            # Publish updated vacancy to Mercure Hub: frontend updates card with AI summary & tech stack!
            mercure_topic = f"vacancies:{task.user_id}" if task.user_id else "vacancies"
            await publish_mercure_event(
                event_type=EVENT_VACANCY_UPDATED,
                data={
                    "message_code": MSG_VACANCY_UPDATED,
                    "vacancy": vacancy_data,
                    "task_id": task.task_id,
                    "batch_id": task.batch_id,
                    "url": task.url,
                    "total_remaining": total_rem,
                },
                topic=mercure_topic,
            )

        except Exception as e:
            task.status = "failed"
            task.stage = "ai_analysis"
            task.error = str(e)
            task.updated_at = time.time()

            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                pipe.hincrby(STATS_KEY, "failed", 1)
                await pipe.execute()

            total_rem = await self._calculate_total_remaining()
            logger.error(f"[Stage 2 - AI] Task {task.task_id} failed for {task.url}: {e}", exc_info=True)

            mercure_topic = f"vacancies:{task.user_id}" if task.user_id else "vacancies"
            await publish_mercure_event(
                event_type=EVENT_TASK_FAILED,
                data={
                    "message_code": MSG_TASK_FAILED,
                    "error_code": ERR_AI_ANALYSIS_FAILED,
                    "task_id": task.task_id,
                    "batch_id": task.batch_id,
                    "url": task.url,
                    "total_remaining": total_rem,
                },
                topic=mercure_topic,
            )


# Global singleton instance with 1 scrape worker and 1 AI worker
queue_manager = RedisQueueManager(scrape_concurrency=1, ai_concurrency=1)
