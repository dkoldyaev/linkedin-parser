import asyncio
import logging
import time
import uuid
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

from .database import SessionLocal
from .models import Vacancy
from .schemas import VacancyResponse, TaskInfo, QueueStatusResponse
from .scraper import scrape_linkedin_job, extract_job_id
from .llm import analyze_vacancy_with_llm
from .mercure import publish_mercure_event

logger = logging.getLogger("linkedin_tracker.queue")


@dataclass
class JobTask:
    task_id: str
    url: str
    default_tags: List[str]
    batch_id: str
    status: str = "pending"  # pending, processing, completed, failed
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    vacancy_id: Optional[int] = None
    title: Optional[str] = None
    company: Optional[str] = None
    error: Optional[str] = None

    def to_info(self) -> TaskInfo:
        return TaskInfo(
            task_id=self.task_id,
            url=self.url,
            status=self.status,
            created_at=self.created_at,
            vacancy_id=self.vacancy_id,
            title=self.title,
            company=self.company,
            error=self.error,
        )


class QueueManager:
    def __init__(self, concurrency: int = 1):
        self.concurrency = concurrency
        self._queue: asyncio.Queue[JobTask] = asyncio.Queue()
        self._tasks: Dict[str, JobTask] = {}
        self._worker_tasks: List[asyncio.Task] = []
        self._processing_count: int = 0
        self._completed_count: int = 0
        self._failed_count: int = 0
        self._running: bool = False

    def start(self):
        """Start background worker(s)."""
        if self._running:
            return
        self._running = True
        for i in range(self.concurrency):
            worker_t = asyncio.create_task(self._worker_loop(i), name=f"vacancy-worker-{i}")
            self._worker_tasks.append(worker_t)
        logger.info(f"QueueManager started with {self.concurrency} worker(s)")

    async def stop(self):
        """Gracefully stop background worker(s)."""
        self._running = False
        for worker_t in self._worker_tasks:
            worker_t.cancel()
        await asyncio.gather(*self._worker_tasks, return_exceptions=True)
        self._worker_tasks.clear()
        logger.info("QueueManager stopped")

    def enqueue(self, urls: List[str], default_tags: List[str]) -> Tuple[str, List[JobTask]]:
        """Add URLs to the queue. Returns (batch_id, list_of_tasks)."""
        batch_id = uuid.uuid4().hex[:8]
        new_tasks = []

        for url in urls:
            clean_url = url.strip()
            if not clean_url:
                continue

            task_id = uuid.uuid4().hex[:8]
            task = JobTask(
                task_id=task_id,
                url=clean_url,
                default_tags=list(default_tags),
                batch_id=batch_id,
            )
            self._tasks[task_id] = task
            self._queue.put_nowait(task)
            new_tasks.append(task)

        # Notify Mercure about new items queued
        total_remaining = self._queue.qsize() + self._processing_count
        asyncio.create_task(
            publish_mercure_event(
                event_type="queue_updated",
                data={
                    "batch_id": batch_id,
                    "queued_count": len(new_tasks),
                    "total_remaining": total_remaining,
                }
            )
        )

        logger.info(f"Enqueued {len(new_tasks)} URLs in batch {batch_id}. Total remaining: {total_remaining}")
        return batch_id, new_tasks

    def get_status(self) -> QueueStatusResponse:
        total_remaining = self._queue.qsize() + self._processing_count
        # Get 10 most recent tasks
        recent = sorted(self._tasks.values(), key=lambda t: t.created_at, reverse=True)[:15]
        return QueueStatusResponse(
            pending=self._queue.qsize(),
            processing=self._processing_count,
            total_remaining=total_remaining,
            completed=self._completed_count,
            failed=self._failed_count,
            recent_tasks=[t.to_info() for t in recent],
        )

    async def _worker_loop(self, worker_id: int):
        logger.info(f"Worker {worker_id} started loop")
        while self._running:
            try:
                task = await self._queue.get()
            except asyncio.CancelledError:
                break

            self._processing_count += 1
            try:
                await self._process_task(task)
            except Exception as e:
                logger.error(f"Worker {worker_id} uncaught error processing task {task.task_id}: {e}", exc_info=True)
            finally:
                self._processing_count -= 1
                self._queue.task_done()

                # If queue is empty and nothing is processing, notify idle
                if self._queue.qsize() == 0 and self._processing_count == 0:
                    asyncio.create_task(
                        publish_mercure_event(
                            event_type="queue_idle",
                            data={"total_remaining": 0}
                        )
                    )

    async def _process_task(self, task: JobTask):
        task.status = "processing"
        task.updated_at = time.time()
        logger.info(f"Processing task {task.task_id} for URL: {task.url}")

        try:
            with SessionLocal() as db:
                job_id = extract_job_id(task.url)

                # Check if vacancy with same job_id or url already exists
                existing = None
                if job_id:
                    existing = db.query(Vacancy).filter(Vacancy.job_id == job_id).first()
                if not existing:
                    existing = db.query(Vacancy).filter(Vacancy.url == task.url).first()

                # Scrape vacancy
                scraped = await scrape_linkedin_job(task.url)

                # Run LLM summarization
                llm_res = await analyze_vacancy_with_llm(
                    title=scraped["title"],
                    company=scraped["company"],
                    location=scraped["location"],
                    description=scraped["description"],
                    db=db,
                )

                initial_tags = list(task.default_tags)
                if existing:
                    # Update existing vacancy
                    existing.title = scraped["title"]
                    existing.company = scraped["company"]
                    existing.company_url = scraped["company_url"]
                    existing.company_info = llm_res.get("company_info") or scraped.get("company_info")
                    existing.location = scraped["location"]
                    existing.country = scraped["country"]
                    existing.description = scraped["description"]
                    existing.ai_summary = llm_res.get("summary")
                    existing.tech_stack = llm_res.get("tech_stack", [])

                    current_tags = set(existing.tags or [])
                    for t in initial_tags:
                        current_tags.add(t)
                    existing.tags = list(current_tags)

                    db.commit()
                    db.refresh(existing)
                    saved_vacancy = existing
                    event_type = "vacancy_updated"
                else:
                    # Create new vacancy
                    new_v = Vacancy(
                        job_id=scraped.get("job_id"),
                        url=task.url,
                        title=scraped["title"],
                        company=scraped["company"],
                        company_url=scraped["company_url"],
                        company_info=llm_res.get("company_info") or scraped.get("company_info"),
                        location=scraped["location"],
                        country=scraped["country"],
                        description=scraped["description"],
                        ai_summary=llm_res.get("summary"),
                        tech_stack=llm_res.get("tech_stack", []),
                        tags=initial_tags,
                        status="Еще не написан",
                    )
                    db.add(new_v)
                    db.commit()
                    db.refresh(new_v)
                    saved_vacancy = new_v
                    event_type = "vacancy_created"

                task.vacancy_id = saved_vacancy.id
                task.title = saved_vacancy.title
                task.company = saved_vacancy.company
                task.status = "completed"
                task.updated_at = time.time()
                self._completed_count += 1

                # Prepare JSON response
                vacancy_data = VacancyResponse.model_validate(saved_vacancy).model_dump(mode="json")

            # Calculate remaining tasks in queue
            remaining = self._queue.qsize() + max(0, self._processing_count - 1)

            logger.info(
                f"Task {task.task_id} completed: '{task.title}' ({task.company}). "
                f"Remaining in queue: {remaining}"
            )

            # Publish event to Mercure Hub
            await publish_mercure_event(
                event_type=event_type,
                data={
                    "vacancy": vacancy_data,
                    "task_id": task.task_id,
                    "batch_id": task.batch_id,
                    "url": task.url,
                    "total_remaining": remaining,
                }
            )

        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            task.updated_at = time.time()
            self._failed_count += 1

            remaining = self._queue.qsize() + max(0, self._processing_count - 1)
            logger.error(f"Task {task.task_id} failed for {task.url}: {e}", exc_info=True)

            # Publish failure event to Mercure Hub
            await publish_mercure_event(
                event_type="task_failed",
                data={
                    "task_id": task.task_id,
                    "batch_id": task.batch_id,
                    "url": task.url,
                    "error": str(e),
                    "total_remaining": remaining,
                }
            )


# Global singleton instance
queue_manager = QueueManager(concurrency=1)
