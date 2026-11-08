import os
import asyncio
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from backend.sentry import init_sentry, get_sentry_dsn
from backend.queue_manager import RedisQueueManager, JobTask, MAX_TASK_ATTEMPTS

def test_sentry_config_resolution():
    with patch.dict(os.environ, {"SENTRY_DSN": "https://key@sentry.test/123"}, clear=True):
        assert get_sentry_dsn() == "https://key@sentry.test/123"

    with patch.dict(os.environ, {"SENTRY_URL": "https://key@sentry.test/456"}, clear=True):
        assert get_sentry_dsn() == "https://key@sentry.test/456"

    with patch.dict(os.environ, {}, clear=True):
        assert get_sentry_dsn() is None
        assert init_sentry() is False


def test_permanent_scrape_failure_sent_to_sentry():
    async def _test():
        qm = RedisQueueManager()
        qm.redis = MagicMock()
        pipe = AsyncMock()
        qm.redis.pipeline.return_value.__aenter__.return_value = pipe
        qm._calculate_total_remaining = AsyncMock(return_value=0)

        task = JobTask(
            task_id="test-task-1",
            url="https://linkedin.com/jobs/view/123",
            default_tags=[],
            batch_id="batch-1",
            user_id=1,
            attempts=MAX_TASK_ATTEMPTS - 1,  # Next failure reaches MAX_TASK_ATTEMPTS
        )

        with patch("backend.queue_manager.publish_mercure_event", AsyncMock()), \
             patch("sentry_sdk.capture_exception") as mock_capture_exc, \
             patch("sentry_sdk.isolation_scope") as mock_scope:
            
            mock_scope_instance = MagicMock()
            mock_scope.return_value.__enter__.return_value = mock_scope_instance

            err = RuntimeError("Connection timeout after retries")
            failed = await qm._fail_or_retry(task, err)

            assert failed is True
            assert task.status == "failed"
            mock_capture_exc.assert_called_once_with(err)
            mock_scope_instance.set_tag.assert_any_call("task_stage", "scraping")
            mock_scope_instance.set_tag.assert_any_call("permanent_failure", True)
            mock_scope_instance.set_extra.assert_any_call("task_id", "test-task-1")
            mock_scope_instance.set_extra.assert_any_call("attempts", MAX_TASK_ATTEMPTS)

    asyncio.run(_test())


def test_retry_scrape_failure_not_sent_to_sentry_until_max_attempts():
    async def _test():
        qm = RedisQueueManager()
        qm.redis = MagicMock()
        pipe = AsyncMock()
        qm.redis.pipeline.return_value.__aenter__.return_value = pipe

        task = JobTask(
            task_id="test-task-2",
            url="https://linkedin.com/jobs/view/456",
            default_tags=[],
            batch_id="batch-2",
            user_id=1,
            attempts=0,  # First try
        )

        with patch("sentry_sdk.capture_exception") as mock_capture_exc:
            err = RuntimeError("Temporary rate limit")
            failed = await qm._fail_or_retry(task, err)

            assert failed is False
            assert task.status == "pending"
            assert task.attempts == 1
            mock_capture_exc.assert_not_called()

    asyncio.run(_test())

