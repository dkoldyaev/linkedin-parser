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
from .scraper import extract_job_id
from .scraper import scrape_job
from .parsers import registry as parser_registry
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

        total_remaining = await self._calculate_total_remaining(user_id=user_id)

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

    async def _calculate_total_remaining(self, user_id: Optional[int] = None) -> int:
        if not self.redis:
            return 0
        tasks = await self.get_active_tasks(user_id=user_id)
        return len(tasks)

    async def get_status(self, user_id: Optional[int] = None) -> QueueStatusResponse:
        """Query Redis for queue status of both stages and recent task info."""
        if not self.redis:
            return QueueStatusResponse(
                pending=0, processing=0, total_remaining=0, completed=0, failed=0, recent_tasks=[]
            )

        active_tasks = await self.get_active_tasks(user_id=user_id)
        
        p_scrape = sum(1 for t in active_tasks if t.stage == "scraping" and t.status == "pending")
        p_ai = sum(1 for t in active_tasks if t.stage in ("ai", "ai_analysis") and t.status == "pending")
        pr_scrape = sum(1 for t in active_tasks if t.stage == "scraping" and t.status == "processing")
        pr_ai = sum(1 for t in active_tasks if t.stage in ("ai", "ai_analysis") and t.status == "processing")

        total_pending = p_scrape + p_ai
        total_processing = pr_scrape + pr_ai
        total_remaining = len(active_tasks)

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

    async def get_active_tasks(self, user_id: Optional[int] = None) -> List[TaskInfo]:
        if not self.redis:
            return []
            
        active_ids = []
        active_ids.extend(await self.redis.lrange(SCRAPE_QUEUE_KEY, 0, -1))
        active_ids.extend(await self.redis.lrange(AI_QUEUE_KEY, 0, -1))
        active_ids.extend(await self.redis.smembers(SCRAPE_PROCESSING_SET))
        active_ids.extend(await self.redis.smembers(AI_PROCESSING_SET))
        
        # Deduplicate
        active_ids = list(set([aid.decode('utf-8') if isinstance(aid, bytes) else aid for aid in active_ids]))
        
        tasks = []
        if active_ids:
            pipe = self.redis.pipeline()
            for tid in active_ids:
                pipe.get(f"{TASK_KEY_PREFIX}{tid}")
            raw_tasks = await pipe.execute()
            
            for raw in raw_tasks:
                if raw:
                    try:
                        task = JobTask.from_dict(json.loads(raw))
                        if task.status not in ("completed", "failed", "cancelled") and (user_id is None or task.user_id == user_id):
                            tasks.append(task.to_info())
                    except Exception as e:
                        logger.warning(f"Error decoding task JSON: {e}")
                        
        return tasks

    async def remove_task(self, task_id: str, user_id: Optional[int] = None) -> bool:
        if not self.redis:
            return False
            
        raw = await self.redis.get(f"{TASK_KEY_PREFIX}{task_id}")
        if not raw:
            return False
            
        try:
            task_dict = json.loads(raw)
            task = JobTask.from_dict(task_dict)
            if user_id is not None and task.user_id != user_id:
                return False
                
            # Remove from queues (0 means remove all occurrences)
            await self.redis.lrem(SCRAPE_QUEUE_KEY, 0, task_id)
            await self.redis.lrem(AI_QUEUE_KEY, 0, task_id)
            
            # Remove from processing sets
            await self.redis.srem(SCRAPE_PROCESSING_SET, task_id)
            await self.redis.srem(AI_PROCESSING_SET, task_id)
            
            # We'll just update its status in DB.
            task.status = "cancelled"
            await self.redis.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
            
            total_remaining = await self._calculate_total_remaining(user_id=user_id)
            mercure_topic = f"vacancies:{user_id}" if user_id else "vacancies"
            
            from .mercure import publish_mercure_event, EVENT_QUEUE_UPDATED, MSG_QUEUE_UPDATED
            asyncio.create_task(
                publish_mercure_event(
                    event_type=EVENT_QUEUE_UPDATED,
                    data={
                        "message_code": MSG_QUEUE_UPDATED,
                        "total_remaining": total_remaining,
                    },
                    topic=mercure_topic,
                )
            )
            return True
        except Exception as e:
            logger.error(f"Error removing task {task_id}: {e}")
            return False

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
            task_user_id = None
            try:
                raw = await self.redis.get(f"{TASK_KEY_PREFIX}{task_id}")
                if raw:
                    try:
                        t = JobTask.from_dict(json.loads(raw))
                        task_user_id = t.user_id
                    except Exception:
                        pass
                await self._process_scrape_task(task_id)
            except Exception as e:
                logger.error(f"Scrape worker {worker_id} uncaught error on task {task_id}: {e}", exc_info=True)
            finally:
                await self.redis.srem(SCRAPE_PROCESSING_SET, task_id)

                if task_user_id:
                    user_rem = await self._calculate_total_remaining(user_id=task_user_id)
                    if user_rem == 0:
                        asyncio.create_task(
                            publish_mercure_event(
                                event_type=EVENT_QUEUE_IDLE,
                                data={
                                    "message_code": MSG_QUEUE_IDLE,
                                    "total_remaining": 0,
                                },
                                topic=f"vacancies:{task_user_id}",
                            )
                        )

                total_rem = await self._calculate_total_remaining(user_id=None)
                if total_rem == 0:
                    asyncio.create_task(
                        publish_mercure_event(
                            event_type=EVENT_QUEUE_IDLE,
                            data={
                                "message_code": MSG_QUEUE_IDLE,
                                "total_remaining": 0,
                            },
                            topic="vacancies",
                        )
                    )

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
            # 1. Scrape job publicly via parser registry
            needs_extension = False
            scraped = {}
            parser = parser_registry.find(task.url)
            if parser and parser.needs_extension:
                needs_extension = True
            else:
                scraped = await scrape_job(task.url)

            if not needs_extension and scraped.get("title") == "Не удалось загрузить страницу":
                needs_extension = True

            if needs_extension:
                task.status = "pending_extension"
                task.updated_at = time.time()
                await self.redis.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                await self.redis.rpush("queue:extension", task_id)
                await self.redis.srem(SCRAPE_PROCESSING_SET, task_id)
                
                total_rem = await self._calculate_total_remaining(user_id=task.user_id)
                mercure_topic = f"vacancies:{task.user_id}" if task.user_id else "vacancies"
                
                from .mercure import EVENT_EXTENSION_TASK, MSG_EXTENSION_TASK
                
                await publish_mercure_event(
                    event_type=EVENT_QUEUE_UPDATED,
                    data={
                        "message_code": MSG_QUEUE_UPDATED,
                        "total_remaining": total_rem,
                    },
                    topic=mercure_topic,
                )
                
                await publish_mercure_event(
                    event_type=EVENT_EXTENSION_TASK,
                    data={
                        "message_code": MSG_EXTENSION_TASK,
                        "task_id": task_id,
                        "url": task.url
                    },
                    topic=mercure_topic,
                )
                logger.info(f"[Stage 1 - Scrape] Task {task.task_id} marked as pending_extension")
                return

            # 2. Save/update initial vacancy in Database immediately
            with SessionLocal() as db:
                job_id = scraped.get("job_id") or extract_job_id(task.url)
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
                    if scraped.get("source"):
                        existing.source = scraped["source"]

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
                        source=scraped.get("source"),
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
            total_rem = await self._calculate_total_remaining(user_id=task.user_id)
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
                    pipe.srem(SCRAPE_PROCESSING_SET, task_id)
                    await pipe.execute()
                
                total_rem = await self._calculate_total_remaining(user_id=task.user_id)
                if total_rem == 0:
                    topics = ["vacancies"]
                    if task.user_id:
                        topics.append(f"vacancies:{task.user_id}")
                    for top in topics:
                        asyncio.create_task(
                            publish_mercure_event(
                                event_type=EVENT_QUEUE_IDLE,
                                data={"message_code": MSG_QUEUE_IDLE, "total_remaining": 0},
                                topic=top,
                            )
                        )
            else:
                task.stage = "ai_analysis"
                task.status = "pending"
                task.updated_at = time.time()

                async with self.redis.pipeline(transaction=True) as pipe:
                    pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                    pipe.rpush(AI_QUEUE_KEY, task_id)
                    pipe.srem(SCRAPE_PROCESSING_SET, task_id)
                    await pipe.execute()

        except Exception as e:
            task.status = "failed"
            task.stage = "scraping"
            task.error = str(e)
            task.updated_at = time.time()

            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                pipe.hincrby(STATS_KEY, "failed", 1)
                pipe.srem(SCRAPE_PROCESSING_SET, task_id)
                await pipe.execute()

            total_rem = await self._calculate_total_remaining(user_id=task.user_id)
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
            task_user_id = None
            try:
                raw = await self.redis.get(f"{TASK_KEY_PREFIX}{task_id}")
                if raw:
                    try:
                        t = JobTask.from_dict(json.loads(raw))
                        task_user_id = t.user_id
                    except Exception:
                        pass
                await self._process_ai_task(task_id)
            except Exception as e:
                logger.error(f"AI worker {worker_id} uncaught error on task {task_id}: {e}", exc_info=True)
            finally:
                await self.redis.srem(AI_PROCESSING_SET, task_id)

                # Check if all queues and workers are idle for this user
                if task_user_id:
                    user_rem = await self._calculate_total_remaining(user_id=task_user_id)
                    if user_rem == 0:
                        asyncio.create_task(
                            publish_mercure_event(
                                event_type=EVENT_QUEUE_IDLE,
                                data={
                                    "message_code": MSG_QUEUE_IDLE,
                                    "total_remaining": 0,
                                },
                                topic=f"vacancies:{task_user_id}",
                            )
                        )

                # Check if all queues and workers are idle globally
                total_rem = await self._calculate_total_remaining(user_id=None)
                if total_rem == 0:
                    asyncio.create_task(
                        publish_mercure_event(
                            event_type=EVENT_QUEUE_IDLE,
                            data={
                                "message_code": MSG_QUEUE_IDLE,
                                "total_remaining": 0,
                            },
                            topic="vacancies",
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
                if llm_res.get("city") and (not vacancy.city or str(vacancy.city).strip().isdigit()):
                    vacancy.city = llm_res["city"]
                if llm_res.get("country") and (not vacancy.country or str(vacancy.country).strip().isdigit()):
                    vacancy.country = llm_res["country"]
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
                if llm_res.get("is_closed") is not None:
                    vacancy.is_closed = llm_res["is_closed"]

                db.commit()
                db.refresh(vacancy)
                vacancy_data = VacancyResponse.model_validate(vacancy).model_dump(mode="json")

            task.status = "completed"
            task.stage = "completed"
            task.updated_at = time.time()

            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.set(f"{TASK_KEY_PREFIX}{task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                pipe.hincrby(STATS_KEY, "completed", 1)
                pipe.srem(AI_PROCESSING_SET, task_id)
                await pipe.execute()

            total_rem = await self._calculate_total_remaining(user_id=task.user_id)
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
                pipe.srem(AI_PROCESSING_SET, task_id)
                await pipe.execute()

            total_rem = await self._calculate_total_remaining(user_id=task.user_id)
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


    async def process_extension_result(self, task_id: str, scraped: dict) -> dict:
        raw = await self.redis.get(f"{TASK_KEY_PREFIX}{task_id}")
        if not raw:
            return {"status": "error", "message": "Task not found"}
            
        task = JobTask.from_dict(json.loads(raw))
        if task.status != "pending_extension":
            return {"status": "already_processed"}
            
        await self.redis.lrem("queue:extension", 0, task_id)
        
        try:
                
            with SessionLocal() as db:
                job_id = scraped.get("job_id") or extract_job_id(task.url)
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
                    if scraped.get("is_closed") is not None:
                        existing.is_closed = scraped["is_closed"]
                    if scraped.get("source"):
                        existing.source = scraped["source"]

                    db.commit()
                    db.refresh(existing)
                    vacancy_data = VacancyResponse.model_validate(existing).model_dump(mode="json")
                    event_type = EVENT_VACANCY_UPDATED
                    msg_code = MSG_VACANCY_UPDATED
                else:
                    new_vacancy = Vacancy(
                        user_id=task.user_id,
                        url=task.url,
                        job_id=scraped.get("job_id"),
                        source=scraped.get("source"),
                        title=scraped.get("title", "Untitled Vacancy"),
                        company=scraped.get("company", "Unknown Company"),
                        company_url=scraped.get("company_url"),
                        company_info=scraped.get("company_info"),
                        location=scraped.get("location"),
                        city=scraped.get("city"),
                        country=scraped.get("country"),
                        description=scraped.get("description"),
                        salary_min=scraped.get("salary_min"),
                        salary_max=scraped.get("salary_max"),
                        salary_currency=scraped.get("salary_currency"),
                        salary_period=scraped.get("salary_period"),
                        workplace_type=scraped.get("workplace_type"),
                        is_closed=scraped.get("is_closed", False),
                        tags=initial_tags,
                        status="Еще не написан"
                    )
                    db.add(new_vacancy)
                    db.flush()
                    db.add(VacancyStatusHistory(
                        vacancy_id=new_vacancy.id,
                        from_status=None,
                        to_status=new_vacancy.status,
                        created_at=new_vacancy.created_at,
                    ))
                    db.commit()
                    db.refresh(new_vacancy)
                    task.vacancy_id = new_vacancy.id
                    vacancy_data = VacancyResponse.model_validate(new_vacancy).model_dump(mode="json")
                    event_type = EVENT_VACANCY_CREATED
                    msg_code = MSG_VACANCY_CREATED

            total_rem = await self._calculate_total_remaining(user_id=task.user_id)
            mercure_topic = f"vacancies:{task.user_id}" if task.user_id else "vacancies"
            await publish_mercure_event(
                event_type=event_type,
                data={
                    "message_code": msg_code,
                    "vacancy": vacancy_data,
                    "task_id": task.task_id,
                    "batch_id": task.batch_id,
                    "url": task.url,
                    "total_remaining": total_rem,
                },
                topic=mercure_topic,
            )
            
            task.stage = "ai_analysis"
            task.status = "pending"
            task.updated_at = time.time()
            
            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.set(f"{TASK_KEY_PREFIX}{task.task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
                pipe.rpush(AI_QUEUE_KEY, task.task_id)
                await pipe.execute()
                
            return {"status": "success", "vacancy_id": task.vacancy_id}
            
        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            task.updated_at = time.time()
            await self.redis.set(f"{TASK_KEY_PREFIX}{task.task_id}", json.dumps(task.to_dict()), ex=TASK_TTL)
            return {"status": "error", "message": str(e)}


# Global singleton instance with 1 scrape worker and 1 AI worker
queue_manager = RedisQueueManager(scrape_concurrency=1, ai_concurrency=1)
