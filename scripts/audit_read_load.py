"""Bounded read stress; evaluate query counts, errors and payload size, never latency."""
import asyncio
import json
from pathlib import Path
import httpx

async def main():
    async with httpx.AsyncClient(base_url='http://localhost:18000', timeout=30) as client:
        assert (await client.post('/api/auth/dev-login', json={'email':'complexity-0@audit.local'})).status_code == 200
        semaphore = asyncio.Semaphore(4)
        async def read(path):
            async with semaphore:
                r = await client.get(path)
                return {'route':path, 'status':r.status_code, 'sql_count':int(r.headers.get('x-sql-queries',-1)), 'response_bytes':len(r.content)}
        paths = ['/api/vacancies', '/api/tags', '/api/stats', '/api/settings', '/api/queue/status']
        rounds = []
        for _ in range(3):
            results = await asyncio.gather(*(read(path) for _ in range(8) for path in paths))
            assert all(r['status']==200 and r['sql_count']>=0 for r in results)
            rounds.append({path: {'requests':sum(r['route']==path for r in results),
                                  'sql_counts': sorted({r['sql_count'] for r in results if r['route']==path}),
                                  'max_response_bytes':max(r['response_bytes'] for r in results if r['route']==path)} for path in paths})
        result = {'requests':120, 'concurrency':4, 'errors':0, 'rounds':rounds}
        Path('docs/audit-read-load-results.json').write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps(result,indent=2))

asyncio.run(main())
