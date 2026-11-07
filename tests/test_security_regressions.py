import asyncio
from unittest.mock import AsyncMock, patch
import jwt
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.mercure import generate_subscriber_jwt, get_mercure_secret, publish_mercure_event
from backend.security_config import require_secret


def test_missing_or_mismatched_oauth_state_never_exchanges_code():
    with patch('backend.main.exchange_google_code', new_callable=AsyncMock) as exchange:
        for cookie, state in [(None, None), ('expected', None), (None, 'expected'), ('expected', 'wrong')]:
            client = TestClient(app)
            if cookie:
                client.cookies.set('oauth_state', cookie)
            params = {'code': 'secret-code'}
            if state:
                params['state'] = state
            assert client.get('/api/auth/google/callback', params=params).status_code == 400
        exchange.assert_not_awaited()


def test_valid_oauth_registration_and_logout():
    client = TestClient(app)
    client.cookies.set('oauth_state', 'expected')
    with patch('backend.main.exchange_google_code', new_callable=AsyncMock, return_value={'access_token': 'mock'}), \
         patch('backend.main.get_google_user_info', new_callable=AsyncMock, return_value={
             'sub': 'google-test', 'email': 'oauth@test.local', 'email_verified': True, 'name': 'OAuth User'}):
        response = client.get('/api/auth/google/callback?code=test&state=expected', follow_redirects=False)
    assert response.status_code == 302
    user = client.get('/api/auth/me').json()
    config = client.get('/api/config')
    assert config.headers['cache-control'] == 'no-store'
    token = client.cookies.get('mercureAuthorization')
    claims = jwt.decode(token, get_mercure_secret(), algorithms=['HS256'])
    assert claims['mercure'] == {'subscribe': [f"vacancies:{user['id']}"]}
    assert 'HttpOnly' in config.headers['set-cookie']
    assert client.post('/api/auth/logout').status_code == 200
    assert client.cookies.get('mercureAuthorization') is None
    assert client.get('/api/auth/me').status_code == 401


def test_subscriber_cannot_publish_or_subscribe_to_other_user():
    claims = jwt.decode(generate_subscriber_jwt(42), get_mercure_secret(), algorithms=['HS256'])
    assert claims['mercure'] == {'subscribe': ['vacancies:42']}
    assert claims['exp'] > 0


def test_weak_or_missing_signing_key_fails_closed(monkeypatch):
    for value in ['', 'short', '!ChangeThisAppJWTSecretKeyForUserSessions!']:
        monkeypatch.setenv('TEST_SIGNING_KEY', value)
        with pytest.raises(RuntimeError):
            require_secret('TEST_SIGNING_KEY')


def test_dev_login_disabled_when_unconfigured(monkeypatch):
    monkeypatch.delenv('DEV_AUTH', raising=False)
    client = TestClient(app)
    assert client.post('/api/auth/dev-login', json={'email': 'test@local'}).status_code == 403


def test_disallowed_cors_origin():
    response = TestClient(app).options('/api/settings', headers={
        'Origin': 'https://attacker.invalid', 'Access-Control-Request-Method': 'POST'})
    assert response.status_code == 400
    assert 'access-control-allow-origin' not in response.headers


def test_private_publish_and_hub_failure():
    import httpx
    from backend import mercure
    for status, expected in [(201, True), (401, False)]:
        with patch('backend.mercure.httpx.AsyncClient') as factory:
            client = factory.return_value.__aenter__.return_value
            client.post = AsyncMock(return_value=httpx.Response(status))
            result = asyncio.run(mercure.publish_mercure_event('vacancy_created', {'vacancy_id': 1}, topic='vacancies:42'))
            assert result is expected
            assert client.post.call_args.kwargs['data']['private'] == 'on'
