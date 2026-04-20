import logging
import sys

# Use python-json-logger if available (install: pip install python-json-logger)
# Falls back to human-readable format for local dev without extra dependencies.
try:
    from pythonjsonlogger import jsonlogger
    _JSON_LOGGING = True
except ImportError:
    _JSON_LOGGING = False


class _SensitiveDataFilter(logging.Filter):
    """Strip passwords and tokens from log messages before they are written."""
    _REDACT_KEYS = {"password", "token", "secret", "authorization", "hms_secret_key"}

    def filter(self, record: logging.LogRecord) -> bool:
        msg = str(record.getMessage()).lower()
        for key in self._REDACT_KEYS:
            if key in msg:
                record.msg = "[REDACTED — message contained sensitive field]"
                record.args = ()
        return True


def setup_logging(level: int = logging.INFO) -> None:
    """
    Configure structured logging for the HMS backend.

    In production, logs emit as JSON lines compatible with Datadog, CloudWatch,
    Grafana Loki, and similar log aggregators.

    To enable JSON output install the extra dependency:
        pip install python-json-logger
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(_SensitiveDataFilter())

    if _JSON_LOGGING:
        fmt = jsonlogger.JsonFormatter(
            fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ",
        )
    else:
        fmt = logging.Formatter(
            fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ",
        )

    handler.setFormatter(fmt)
    root = logging.getLogger()
    root.setLevel(level)

    # Remove any default handlers before adding ours
    root.handlers.clear()
    root.addHandler(handler)

    # Reduce noise from high-volume internal loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger("hms")
    mode = "JSON" if _JSON_LOGGING else "text (install python-json-logger for JSON)"
    logger.info("Structured logging initialized in %s mode.", mode)
