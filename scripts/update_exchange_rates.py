#!/usr/bin/env python3
"""
Cron script to enqueue asynchronous exchange rate update tasks.
For each pair of currencies (from every currency to every currency),
it puts a task into the Redis queue.

Usage:
  python3 scripts/update_exchange_rates.py
  (or via cron, e.g. 0 3 * * * cd /path/to/project && python3 scripts/update_exchange_rates.py)
"""
import os
import sys
import asyncio
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Supported currencies to pair
CURRENCIES = ["USD", "EUR", "RUB", "GBP"]


async def main():
    import redis.asyncio as aioredis
    from backend.queue_manager import queue_manager, RATES_QUEUE_KEY

    print(f"Connecting to Redis broker at {queue_manager.broker_url}...")
    r = aioredis.from_url(queue_manager.broker_url, decode_responses=True)
    queue_manager.redis = r

    enqueued_count = 0
    # Enqueue tasks for each currency to every other currency
    for source in CURRENCIES:
        for target in CURRENCIES:
            if source == target:
                continue
            task_id = await queue_manager.enqueue_rate_update(source, target)
            print(f"Enqueued rate update: {source} -> {target} [task: {task_id}]")
            enqueued_count += 1

    queue_length = await r.llen(RATES_QUEUE_KEY)
    print(f"\nSuccessfully enqueued {enqueued_count} currency rate tasks.")
    print(f"Total tasks currently in '{RATES_QUEUE_KEY}': {queue_length}")

    await r.aclose()


if __name__ == "__main__":
    asyncio.run(main())

