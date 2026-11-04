import asyncio
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from backend.safe_http import validate_web_url, public_address, PublicTransport


@pytest.mark.parametrize('url', ['file:///etc/passwd', 'ftp://example.com', 'http://user:pass@example.com', 'http://example.com:5432'])
def test_unsafe_url_shape(url):
    with pytest.raises(ValueError):
        validate_web_url(url)


@pytest.mark.parametrize('address', ['127.0.0.1', '10.1.2.3', '169.254.169.254', '::1', '::ffff:127.0.0.1', '192.168.1.1', '0.0.0.0'])
def test_private_dns_rejected(address):
    async def scenario():
        with patch.object(asyncio.get_running_loop(), 'getaddrinfo', AsyncMock(return_value=[(None, None, None, None, (address, 80))])):
            with pytest.raises(ValueError):
                await public_address('example.com', 80)
    asyncio.run(scenario())


def test_destination_ip_is_pinned_with_original_host_and_sni():
    async def scenario():
        transport = PublicTransport()
        with patch('backend.safe_http.public_address', AsyncMock(return_value='8.8.8.8')), \
             patch.object(transport.transport, 'handle_async_request', AsyncMock(return_value=httpx.Response(200))) as send:
            await transport.handle_async_request(httpx.Request('GET', 'https://jobs.example.com/job'))
            request = send.call_args.args[0]
            assert request.url.host == '8.8.8.8'
            assert request.headers['host'] == 'jobs.example.com'
            assert request.extensions['sni_hostname'] == b'jobs.example.com'
        await transport.aclose()
    asyncio.run(scenario())


def test_redirect_to_private_address_is_blocked_before_connecting():
    from backend.safe_http import PublicWebClient
    async def scenario():
        client = PublicWebClient(follow_redirects=True)
        async def resolve(host, port):
            if host == '127.0.0.1':
                raise ValueError('Private destination')
            return '8.8.8.8'
        async def response(request):
            return httpx.Response(302, headers={'location': 'http://127.0.0.1/private'}, content=b'')
        client._transport.transport = httpx.MockTransport(response)
        with patch('backend.safe_http.public_address', resolve):
            with pytest.raises(ValueError, match='Private destination'):
                await client.get('https://example.com/job')
        await client.aclose()
    asyncio.run(scenario())


def test_html_body_limit():
    from backend.safe_http import PublicWebClient
    async def scenario():
        client = PublicWebClient()
        async def response(request):
            return httpx.Response(200, content=b'x' * 20)
        client._transport.transport = httpx.MockTransport(response)
        with patch('backend.safe_http.public_address', AsyncMock(return_value='8.8.8.8')), \
             patch('backend.safe_http.MAX_HTML_BYTES', 10):
            with pytest.raises(ValueError, match='limit'):
                await client.get('https://example.com/job')
        await client.aclose()
    asyncio.run(scenario())
