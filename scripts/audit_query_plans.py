"""Synthetic PostgreSQL plans, ONLY for the isolated audit database."""
import datetime
import json
from sqlalchemy import text, insert
from backend.database import engine
from backend.models import User, Vacancy, VacancyStatusHistory, STATUS_NOT_CONTACTED, STATUS_CONTACTED

assert engine.url.database == 'audit_e2e', 'Refusing to seed a non-test database'
now = datetime.datetime.utcnow()
with engine.begin() as conn:
    assert conn.execute(text("SELECT count(*) FROM users WHERE email LIKE 'complexity-%@audit.local'")).scalar() == 0
    users = [{'google_id': f'dev_complexity-{i}@audit.local', 'email': f'complexity-{i}@audit.local', 'name': 'Synthetic'} for i in range(80)]
    conn.execute(insert(User), users)
    ids = conn.execute(text("SELECT id FROM users WHERE email LIKE 'complexity-%@audit.local' ORDER BY id")).scalars().all()
    for owner in ids:
        cards = [{'user_id': owner, 'url': f'https://example.com/perf/{owner}/{i}', 'job_id': f'{owner}-{i}',
                  'title': 'Synthetic Engineer', 'company': 'Synthetic Corp', 'description': 'x' * 1000,
                  'tags': ['Python'], 'status': 'Написал', 'created_at': now - datetime.timedelta(days=i % 100),
                  'updated_at': now, 'is_closed': False} for i in range(400)]
        conn.execute(insert(Vacancy), cards)
    owner = ids[0]
    conn.execute(text('INSERT INTO vacancy_status_history (vacancy_id, from_status, to_status, created_at, updated_at) SELECT id, :old, :new, created_at, created_at FROM vacancies WHERE user_id IN (SELECT id FROM users WHERE email LIKE :email)'),
                 {'old': STATUS_NOT_CONTACTED, 'new': STATUS_CONTACTED, 'email': 'complexity-%@audit.local'})
    conn.execute(text('ANALYZE vacancies'))
    conn.execute(text('ANALYZE vacancy_status_history'))
    queries = {
      'user_sorted_page': ('SELECT id FROM vacancies WHERE user_id=:owner ORDER BY updated_at DESC, id DESC LIMIT 50', {'owner': owner}),
      'user_job_dedup': ('SELECT id FROM vacancies WHERE user_id=:owner AND job_id=:job LIMIT 1', {'owner': owner, 'job': f'{owner}-30'}),
      'user_url_dedup': ('SELECT id FROM vacancies WHERE user_id=:owner AND url=:url LIMIT 1', {'owner': owner, 'url': f'https://example.com/perf/{owner}/30'}),
      'user_recent_created': ('SELECT created_at FROM vacancies WHERE user_id=:owner AND created_at>=:cutoff', {'owner': owner, 'cutoff': now - datetime.timedelta(days=7)}),
      'history_order': ('SELECT created_at FROM vacancy_status_history WHERE vacancy_id=:card ORDER BY created_at', {'card': conn.execute(text('SELECT min(id) FROM vacancies WHERE user_id=:owner'), {'owner':owner}).scalar()}),
      'substring_search_residual': ('SELECT id FROM vacancies WHERE user_id=:owner AND description ILIKE :term', {'owner': owner, 'term': '%python%'}),
    }
    plans = {}
    for name, (sql, params) in queries.items():
        plans[name] = conn.execute(text('EXPLAIN (FORMAT JSON) ' + sql), params).scalar()[0]['Plan']
    print(json.dumps({'synthetic_users': len(ids), 'synthetic_cards': len(ids)*400, 'synthetic_history': len(ids)*400,
                      'explain_analyze': False, 'plans': plans}, ensure_ascii=False, indent=2))
