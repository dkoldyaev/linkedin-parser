"""
Parser registry for job vacancy sites.

Each parser is a separate module in this directory.
To add a custom parser:
  1. Create a new .py file here (e.g. hh_ru.py)
  2. Define a class that inherits from BaseParser
  3. Register it via @registry.register decorator

The registry is loaded automatically at startup.
"""

from .registry import registry, BaseParser
from .types import VacancyData

__all__ = ["registry", "BaseParser", "VacancyData"]
