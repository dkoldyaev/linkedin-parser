"""
Parser registry: discovers and dispatches parsers by URL.

Usage:
    from backend.parsers import registry

    scraped = await registry.parse(url, html=html)
"""

import importlib
import logging
import pkgutil
from abc import ABC
from typing import Optional
from urllib.parse import urlparse

from .types import VacancyData

logger = logging.getLogger(__name__)


class BaseParser(ABC):
    """
    Base class for all site-specific job vacancy parsers.

    Subclass this and implement `matches` + `parse`.
    Register with @registry.register.

    Example::

        from backend.parsers.registry import registry, BaseParser

        @registry.register
        class MyParser(BaseParser):
            name = "mysite"
            source = "MySite"        # fixed label shown in the UI / DB
            priority = 10            # higher = tried first (default 0)
            needs_extension = False  # True → skip direct HTTP fetch

            def matches(self, url: str) -> bool:
                return "mysite.com" in url

            async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
                ...
    """

    # Human-readable name used in logs
    name: str = "unnamed"

    # Human-readable job board name written into the ``source`` field of
    # VacancyData.  Must be a fixed constant — do NOT compute it from the URL.
    # Only UniversalParser is allowed to derive source from the domain.
    source: str = "Unknown"

    # Higher priority parsers are tried before lower-priority ones.
    # LinkedIn / Upwork use 10; universal fallback uses -10.
    priority: int = 0

    # If True the parser signals that it cannot fetch the page by itself
    # and the browser extension must supply the HTML.
    needs_extension: bool = False

    def matches(self, url: str) -> bool:  # noqa: D401
        """Return True when this parser can handle *url*."""
        raise NotImplementedError

    def extract_job_id(self, url: str) -> Optional[str]:
        """Extract job ID from URL if parser knows the URL format."""
        if hasattr(self, "_extract_job_id"):
            try:
                return self._extract_job_id(url)
            except Exception:
                return None
        return None

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        """
        Fetch and parse *url* (with optional pre-fetched *html*).

        Must return a :class:`~backend.parsers.types.VacancyData` dict.

        Required keys: ``url``, ``source``.
        All data fields (title, company, description, …) are Optional —
        return None for anything you cannot extract (e.g. page blocked).
        """
        raise NotImplementedError


class _ParserRegistry:
    """Central registry: holds all parsers and picks the right one for a URL."""

    def __init__(self) -> None:
        self._parsers: list[BaseParser] = []
        self._loaded = False

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(self, cls: type) -> type:
        """Class decorator that registers a parser class in the registry."""
        instance = cls()
        self._parsers.append(instance)
        # Keep sorted: highest priority first
        self._parsers.sort(key=lambda p: p.priority, reverse=True)
        logger.debug("Registered parser: %s (priority=%s)", cls.__name__, instance.priority)
        return cls

    # ------------------------------------------------------------------
    # Discovery
    # ------------------------------------------------------------------

    def _auto_discover(self) -> None:
        """Import all sibling modules so their @registry.register decorators run."""
        if self._loaded:
            return
        self._loaded = True

        import backend.parsers as pkg  # noqa: PLC0415

        for _finder, module_name, _is_pkg in pkgutil.iter_modules(pkg.__path__, pkg.__name__ + "."):
            base_name = module_name.split(".")[-1]
            if base_name in ("registry", "types", "helpers") or base_name.startswith("_"):
                continue
            try:
                importlib.import_module(module_name)
                logger.debug("Loaded parser module: %s", module_name)
            except Exception as exc:  # pragma: no cover
                logger.warning("Could not load parser module %s: %s", module_name, exc)

    # ------------------------------------------------------------------
    # Dispatch
    # ------------------------------------------------------------------

    def find(self, url: str) -> Optional[BaseParser]:
        """Return the highest-priority parser that matches *url*, or None."""
        self._auto_discover()
        for parser in self._parsers:
            if parser.matches(url):
                return parser
        return None

    async def parse(self, url: str, html: Optional[str] = None) -> VacancyData:
        """
        Find the right parser and return the scraped vacancy dict.

        Falls back to a minimal error dict if no parser matches
        (should never happen as long as a universal fallback is registered).
        """
        self._auto_discover()
        parser = self.find(url)
        if parser is None:
            domain = urlparse(url).netloc.replace("www.", "")
            logger.error("No parser found for URL: %s", url)
            return VacancyData(url=url, source=domain)
        logger.info("Using parser '%s' for: %s", parser.name, url)
        return await parser.parse(url, html=html)

    @property
    def all_parsers(self) -> list[BaseParser]:
        """Return a copy of all registered parsers sorted by priority."""
        self._auto_discover()
        return list(self._parsers)

    def extract_job_id(self, url: str) -> Optional[str]:
        """Ask the matching parser to extract job_id from *url*."""
        self._auto_discover()
        parser = self.find(url)
        if parser:
            jid = parser.extract_job_id(url)
            if jid:
                return jid
        return None


# Singleton used across the application
registry = _ParserRegistry()
