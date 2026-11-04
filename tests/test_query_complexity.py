from contextlib import contextmanager
from fastapi.testclient import TestClient
from sqlalchemy import event, inspect
from backend.main import app
from backend.database import engine, ensure_query_indexes
from backend.diagnostics import sql_shape


@contextmanager
def statements():
    captured = []
    def record(conn, cursor, statement, parameters, context, executemany):
        captured.append(statement.lower())
    event.listen(engine, 'before_cursor_execute', record)
    try:
        yield captured
    finally:
        event.remove(engine, 'before_cursor_execute', record)


def test_tags_stats_and_duplicates_do_not_load_history_objects():
    client = TestClient(app)
    client.post('/api/auth/dev-login', json={'email': 'queries@test.local'})
    urls = []
    for i in range(12):
        url = f'https://example.com/jobs/{i}'
        urls.append(url)
        assert client.post('/api/vacancies', json={'url': url, 'title': 'Engineer', 'company': 'Test', 'tags': ['Python']}).status_code == 200
    with statements() as tags_sql:
        assert client.get('/api/tags').json() == ['Python']
    assert not any('vacancy_status_history' in query for query in tags_sql)
    assert not any('vacancies.description' in query for query in tags_sql)
    with statements() as duplicate_sql:
        response = client.post('/api/vacancies/check-duplicates', json={'urls': urls}).json()
    assert len(response['duplicates']) == 12
    vacancy_lookups = [q for q in duplicate_sql if 'from vacancies' in q]
    assert len(vacancy_lookups) == 1
    with statements() as batch_sql:
        batch = client.post('/api/vacancies/batch', json={'urls': urls}).json()
    assert batch['queued'] == 12
    assert len([q for q in batch_sql if 'from vacancies' in q]) == 1
    with statements() as stats_sql:
        stats = client.get('/api/stats').json()
    assert stats['total'] == 12
    assert not any('vacancies.description' in query for query in stats_sql)
    assert sum('from vacancy_status_history' in q for q in stats_sql) <= 1
    with statements() as filtered_sql:
        assert len(client.get('/api/vacancies?tag=python').json()) == 12
    assert any('json_each' in q and 'exists' in q for q in filtered_sql)


def test_indexes_are_created_idempotently():
    ensure_query_indexes()
    ensure_query_indexes()
    names = {index['name'] for index in inspect(engine).get_indexes('vacancies')}
    assert {'ix_vacancies_user_updated', 'ix_vacancies_user_created', 'ix_vacancies_user_job', 'ix_vacancies_user_url'} <= names


def test_sql_shape_hides_literals():
    assert 'private@example.com' not in sql_shape("SELECT * FROM users WHERE email = 'private@example.com'")
