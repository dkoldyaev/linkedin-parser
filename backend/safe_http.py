"""Public web fetches: validate and pin DNS per hop, cap decompressed bodies."""
import asyncio
import ipaddress
import socket
import httpx

MAX_HTML_BYTES = 10 * 1024 * 1024


def validate_web_url(url: str) -> httpx.URL:
    parsed = httpx.URL(url)
    if parsed.scheme not in ('http', 'https') or not parsed.host or parsed.username or parsed.password:
        raise ValueError('Only public HTTP(S) job URLs without credentials are allowed')
    if parsed.port not in (None, 80, 443):
        raise ValueError('Only standard HTTP(S) ports are allowed')
    return parsed


async def public_address(host: str, port: int) -> str:
    records = await asyncio.get_running_loop().getaddrinfo(host, port, type=socket.SOCK_STREAM)
    addresses = [record[4][0] for record in records]
    if not addresses or any(not ipaddress.ip_address(value).is_global for value in addresses):
        raise ValueError('Private, loopback and reserved network destinations are forbidden')
    return addresses[0]


class PublicTransport(httpx.AsyncBaseTransport):
    def __init__(self):
        self.transport = httpx.AsyncHTTPTransport()

    async def handle_async_request(self, request):
        original = validate_web_url(str(request.url))
        address = await public_address(original.host, original.port or (443 if original.scheme == 'https' else 80))
        # Pin the vetted IP at connect time; preserve Host and TLS SNI.
        pinned = httpx.Request(request.method, original.copy_with(host=address),
                               headers=request.headers, stream=request.stream,
                               extensions={**request.extensions, 'sni_hostname': original.host.encode()})
        return await self.transport.handle_async_request(pinned)

    async def aclose(self):
        await self.transport.aclose()


class PublicWebClient(httpx.AsyncClient):
    def __init__(self, **kwargs):
        super().__init__(transport=PublicTransport(), trust_env=False, max_redirects=5, **kwargs)

    async def send(self, request, **kwargs):
        kwargs['stream'] = True
        response = await super().send(request, **kwargs)
        try:
            body = bytearray()
            async for chunk in response.aiter_bytes():
                body.extend(chunk)
                if len(body) > MAX_HTML_BYTES:
                    raise ValueError('Job HTML exceeds the 10 MiB limit')
            response._content = bytes(body)
            return response
        finally:
            await response.aclose()
