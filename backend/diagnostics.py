"""SQL shape logging without bind values, credentials, request bodies or timings."""
import hashlib
import logging
import re
from contextvars import ContextVar
from sqlalchemy import event

logger = logging.getLogger('linkedin_tracker.sql')
request_metrics = ContextVar('request_metrics', default=None)


def sql_shape(statement):
    # Avoid leaking literals even for raw SQL; ORM parameters are never logged.
    statement = re.sub(r"'(?:''|[^'])*'", "'?'", statement)
    statement = re.sub(r'/\*.*?\*/|--[^\n]*', '', statement, flags=re.S)
    return ' '.join(statement.split())[:8000]


def install_sql_diagnostics(engine):
    @event.listens_for(engine, 'before_cursor_execute')
    def started(conn, cursor, statement, parameters, context, executemany):
        metrics = request_metrics.get()
        if metrics is not None:
            metrics['sql_count'] += 1
        shape = sql_shape(statement)
        logger.info('SQL request_id=%s fingerprint=%s executemany=%s statement=%s',
                    metrics['request_id'] if metrics else 'background',
                    hashlib.sha256(shape.encode()).hexdigest()[:12], executemany, shape)

    @event.listens_for(engine, 'handle_error')
    def failed(context):
        logger.warning('SQL failed error_type=%s', type(context.original_exception).__name__)
