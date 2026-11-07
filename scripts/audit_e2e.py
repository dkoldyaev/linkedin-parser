"""Real HTTP/PostgreSQL/Mercure checks. Run only through run_audit_e2e.sh (fresh stack)."""
import asyncio
import json
from pathlib import Path
import httpx
from backend.models import STATUS_NOT_CONTACTED

BASE = 'http://localhost:18000'
HUB = 'http://localhost:13000/.well-known/mercure'
report = {'checks': [], 'sql_queries': {}}


def checked(name, condition):
    assert condition, name
    report['checks'].append(name)
    print('PASS', name, flush=True)


async def main():
    async with httpx.AsyncClient(base_url=BASE, timeout=15) as a, httpx.AsyncClient(base_url=BASE, timeout=15) as b:
        for _ in range(40):
            try:
                if (await a.get('/api/health')).status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            await asyncio.sleep(1)
        checked('frontend served', 'id="root"' in (await a.get('/')).text)
        checked('anonymous cards denied', (await a.get('/api/vacancies')).status_code == 401)
        users = []
        for client, name in [(a, 'alice'), (b, 'bob')]:
            login = await client.post('/api/auth/dev-login', json={'email': f'e2e-{name}@audit.local', 'name': name})
            checked(f'{name} registration', login.status_code == 200)
            users.append(login.json()['user'])
            checked(f'{name} clean board', (await client.get('/api/vacancies')).json() == [])
            checked(f'{name} SSE cookie minted', (await client.get('/api/config')).status_code == 200 and client.cookies.get('mercureAuthorization') is not None)
        checked('admin self-escalation denied', (await b.put('/api/auth/me/feature-flags', json={'feature_flags': ['admin']})).status_code == 403)
        checked('OAuth missing state denied', (await a.get('/api/auth/google/callback?code=invalid')).status_code == 400)
        checked('anonymous hub denied', (await httpx.AsyncClient().get(HUB, params={'topic': f"vacancies:{users[0]['id']}"}, timeout=3)).status_code == 401)
        payload = {'title': 'Audit Engineer', 'company': 'Audit Corp', 'url': 'https://example.com/jobs/e2e',
                   'country': 'Spain', 'city': 'Madrid', 'tags': ['audit', 'Python'], 'description': 'Private description'}
        own_topic = f"vacancies:{users[0]['id']}"
        # Bob tries to subscribe to Alice's topic; hub must never send Alice's private update.
        forbidden_messages = []
        ready = asyncio.Event()
        async def forbidden_subscription():
            try:
                async with b.stream('GET', HUB, params={'topic': own_topic}, timeout=httpx.Timeout(3, read=2)) as stream:
                    if stream.status_code == 401:
                        ready.set()
                        return
                    checked('foreign-topic subscription established for negative delivery test', stream.status_code == 200)
                    ready.set()
                    async for line in stream.aiter_lines():
                        if line.startswith('data:'):
                            forbidden_messages.append(line)
            except httpx.ReadTimeout:
                ready.set()
        async def own_subscription():
            async with a.stream('GET', HUB, params={'topic': own_topic}, timeout=httpx.Timeout(8, read=6)) as stream:
                checked('own hub subscription authorized', stream.status_code == 200)
                await ready.wait()
                response = await a.post('/api/vacancies', json=payload)
                checked('card creation', response.status_code == 200)
                card = response.json()
                async for line in stream.aiter_lines():
                    if line.startswith('data:'):
                        event = json.loads(line[5:].strip())
                        if event.get('type') == 'vacancy_created' and event.get('vacancy', {}).get('id') == card['id']:
                            checked('real private Mercure delivery', True)
                            return card
                raise AssertionError('No private update received')
        foreign = asyncio.create_task(forbidden_subscription())
        card = await own_subscription()
        await foreign
        checked('no cross-user SSE leak', forbidden_messages == [])
        vid = card['id']
        checked('foreign card hidden', (await b.get(f'/api/vacancies/{vid}')).status_code == 404)
        checked('foreign card edit denied', (await b.patch(f'/api/vacancies/{vid}', json={'notes': 'attack'})).status_code == 404)
        changed = await a.patch(f'/api/vacancies/{vid}', json={'status': 'Написал', 'notes': 'Applied', 'status_comment': 'Sent CV'})
        checked('card editing and movement', changed.status_code == 200 and changed.json()['status'] == 'Написал')
        checked('history created', len(changed.json()['history']) >= 2)
        settings = await a.post('/api/settings', json={'locale': 'en', 'salary_display_format': 'year'})
        checked('settings persisted', settings.status_code == 200 and (await a.get('/api/settings')).json()['locale'] == 'en')
        checked('settings isolation', (await b.get('/api/settings')).json()['locale'] == 'ru')
        column = await a.post('/api/columns', json={'name': 'Audit round', 'color': '#123456', 'has_lanes': True})
        checked('custom column creation', column.status_code == 200)
        checked('custom column rename', (await a.patch('/api/columns/Audit round', json={'new_name': 'Audit final', 'color': '#654321'})).status_code == 200)
        checked('custom column deletion', (await a.request('DELETE', '/api/columns/Audit final', json={'target_status': STATUS_NOT_CONTACTED})).status_code == 200)
        checked('CV save', (await a.post('/api/cv/approved', json={'content': 'Synthetic CV, Python engineer'})).status_code == 200)
        checked('CV isolation', (await b.get('/api/cv/approved')).json() is None)
        checked('API flag self-service', (await a.put('/api/auth/me/feature-flags', json={'feature_flags': ['api_access']})).status_code == 200)
        key = await a.post('/api/api-keys', json={'name': 'Audit key'})
        checked('API key creation', key.status_code == 200)
        key_data = key.json()
        public = await a.get('/api/v1/vacancies?tag=python&limit=1', headers={'X-API-Key': key_data['token']})
        checked('PostgreSQL tag filter before pagination', public.status_code == 200 and len(public.json()) == 1)
        checked('API key revocation', (await a.delete(f"/api/api-keys/{key_data['id']}")).status_code == 200)
        checked('revoked key rejected', (await a.get('/api/v1/vacancies', headers={'X-API-Key': key_data['token']})).status_code == 401)
        duplicates = await a.post('/api/vacancies/check-duplicates', json={'urls': [payload['url']] * 30})
        checked('batched duplicate lookup', duplicates.status_code == 200 and len(duplicates.json()['duplicates']) == 1)
        for path in ['/api/vacancies', '/api/tags', '/api/countries', '/api/cities', '/api/sources', '/api/settings', '/api/stats', '/api/queue/status']:
            response = await a.get(path)
            checked(path, response.status_code == 200)
            report['sql_queries'][path] = int(response.headers.get('x-sql-queries', -1))
        # Exercise real scrape -> extension -> AI workers with no external fetch.
        upwork = 'https://www.upwork.com/jobs/~022104418223352040840'
        worker_cards = []
        for client, label in [(a, 'Alice'), (b, 'Bob')]:
            batch = await client.post('/api/vacancies/batch', json={'urls': [upwork]})
            checked(f'{label} worker enqueue', batch.status_code == 200 and batch.json()['queued'] == 1)
            task_id = batch.json()['tasks'][0]['task_id']
            task_found = False
            for _ in range(30):
                pending = await client.get('/api/extension/tasks')
                if any(task['task_id'] == task_id for task in pending.json()):
                    task_found = True
                    break
                await asyncio.sleep(0.2)
            checked(f'{label} pending extension task', task_found)
            completed = await client.post(f'/api/extension/tasks/{task_id}/result', json={
                'title': f'{label} Worker Card', 'company': f'{label} Corp', 'description': 'Python PostgreSQL role',
                'source': 'Upwork', 'job_id': '~022104418223352040840', 'url': upwork})
            checked(f'{label} extension result accepted', completed.status_code == 200 and completed.json()['status'] == 'success')
            worker_id = completed.json()['vacancy_id']
            for _ in range(40):
                worker_card = (await client.get(f'/api/vacancies/{worker_id}')).json()
                if worker_card.get('ai_summary'):
                    break
                await asyncio.sleep(0.2)
            checked(f'{label} AI worker completed with configured fallback', bool(worker_card.get('ai_summary')))
            worker_cards.append(worker_card)
        checked('same URL stays isolated through real workers', worker_cards[0]['id'] != worker_cards[1]['id'] and
                (await a.get(f"/api/vacancies/{worker_cards[0]['id']}")).json()['title'] == 'Alice Worker Card')
        checked('cross-user worker card hidden', (await b.get(f"/api/vacancies/{worker_cards[0]['id']}")).status_code == 404)
        checked('card deletion', (await a.delete(f'/api/vacancies/{vid}')).status_code == 204)
        checked('deleted card gone', (await a.get(f'/api/vacancies/{vid}')).status_code == 404)
        checked('CV deletion', (await a.delete('/api/cv/approved')).status_code == 204)
        checked('logout', (await a.post('/api/auth/logout')).status_code == 200)
        checked('logout removes SSE cookie', a.cookies.get('mercureAuthorization') is None)
        checked('session ended', (await a.get('/api/auth/me')).status_code == 401)
    Path('docs/audit-e2e-results.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    asyncio.run(main())
