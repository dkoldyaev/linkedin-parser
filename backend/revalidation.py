import asyncio
import logging
import os
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import RevalidationQueue

logger = logging.getLogger(__name__)

FRONTEND_INTERNAL_URL = os.getenv("FRONTEND_INTERNAL_URL", "http://frontend:3000")


def enqueue_revalidation(db: Session, item_type: str, item_value: str):
    """
    Enqueue a revalidation item into the database table with deduplication.
    item_type: 'tag' or 'path'
    item_value: e.g. 'vacancies', '/vacancies/12', '/'
    """
    try:
        exists = (
            db.query(RevalidationQueue)
            .filter(
                RevalidationQueue.item_type == item_type,
                RevalidationQueue.item_value == item_value,
            )
            .first()
        )
        if not exists:
            entry = RevalidationQueue(item_type=item_type, item_value=item_value)
            db.add(entry)
            db.commit()
    except Exception as e:
        db.rollback()
        logger.warning(f"Failed to enqueue revalidation ({item_type}:{item_value}): {e}")


class RevalidationWorker:
    def __init__(self):
        self._running = False
        self._task = None

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._worker_loop(), name="revalidation-worker")
        logger.info("Revalidation background worker started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Revalidation background worker stopped.")

    async def _worker_loop(self):
        while self._running:
            try:
                await asyncio.sleep(1.0)
                await self._process_batch()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in revalidation worker loop: {e}", exc_info=True)
                await asyncio.sleep(1.0)

    async def _process_batch(self):
        db = SessionLocal()
        tags = []
        paths = []
        try:
            records = db.query(RevalidationQueue).all()
            if not records:
                return

            for r in records:
                if r.item_type == "tag":
                    tags.append(r.item_value)
                elif r.item_type == "path":
                    paths.append(r.item_value)

            # Clear all processed records in one atomic transaction
            db.query(RevalidationQueue).delete()
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to fetch/clear revalidation queue records: {e}")
            return
        finally:
            db.close()

        if not tags and not paths:
            return

        # Send batch request to Next.js frontend
        url = f"{FRONTEND_INTERNAL_URL}/api/revalidate"
        payload = {"tags": tags, "paths": paths}
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    logger.debug(f"Successfully revalidated Next.js cache: tags={tags}, paths={paths}")
                else:
                    logger.warning(f"Next.js revalidate returned {res.status_code}: {res.text}")
        except Exception as e:
            # Frontend might be starting up or under load, do not crash backend
            logger.debug(f"Could not deliver revalidation batch to {url}: {e}")


revalidation_worker = RevalidationWorker()
