import asyncio
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Vacancy
from backend.queue_manager import queue_manager, JobTask, TASK_KEY_PREFIX


def test_extension_worker_does_not_overwrite_same_url_of_other_user():
    a, b = TestClient(app), TestClient(app)
    a_id = a.post('/api/v2/auth/dev-login', json={'email': 'worker-a@test.local'}).json()['user']['id']
    b_id = b.post('/api/v2/auth/dev-login', json={'email': 'worker-b@test.local'}).json()['user']['id']
    url = 'https://www.linkedin.com/jobs/view/12345678/'
    original = a.post('/api/v2/vacancies', json={'url': url, 'title': 'A private card', 'company': 'A'}).json()

    async def scenario():
        task = JobTask(task_id='isolation', url=url, default_tags=[], batch_id='test',
                       user_id=b_id, status='pending_extension')
        await queue_manager.redis.set(TASK_KEY_PREFIX + task.task_id, json.dumps(task.to_dict()))
        result = await queue_manager.process_extension_result(task.task_id,
                    {'job_id': '12345678', 'title': 'B card', 'company': 'B', 'source': 'LinkedIn'})
        assert result['status'] == 'success'
        return result
    result = asyncio.run(scenario())
    assert result['vacancy_id'] != original['id']
    with SessionLocal() as db:
        card_a = db.get(Vacancy, original['id'])
        card_b = db.get(Vacancy, result['vacancy_id'])
        assert (card_a.user_id, card_a.title) == (a_id, 'A private card')
        assert (card_b.user_id, card_b.title) == (b_id, 'B card')


def test_extension_pending_list_uses_current_key_and_string_ids():
    client = TestClient(app)
    user_id = client.post('/api/v2/auth/dev-login', json={'email': 'extension@test.local'}).json()['user']['id']
    async def seed():
        task = JobTask(task_id='pending-task', url='https://example.com/job', default_tags=[],
                       batch_id='test', user_id=user_id, status='pending_extension')
        await queue_manager.redis.set(TASK_KEY_PREFIX + task.task_id, json.dumps(task.to_dict()))
        await queue_manager.redis.rpush('queue:extension', task.task_id)
        await queue_manager.redis.sadd(f'linkedin:active:user:{user_id}', task.task_id)
        await queue_manager.redis.hset('linkedin:stats', mapping={'completed': '999', 'failed': '888'})
        await queue_manager.redis.hset(f'linkedin:stats:{user_id}', mapping={'completed': '2', 'failed': '1'})
    asyncio.run(seed())
    assert client.get('/api/extension/tasks').json() == [{'task_id': 'pending-task', 'url': 'https://example.com/job'}]
    status = client.get('/api/queue/status').json()
    assert status['total_remaining'] == 1
    assert (status['completed'], status['failed']) == (2, 1)
