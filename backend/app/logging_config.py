import logging
import sys
from typing import Any, Dict

def setup_logging():
    """
    Setup structured logging for production.
    In a real-world scenario, you might use 'python-json-logger' or similar.
    Here we setup a clean standard formatting that is easy for log aggregators to parse.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Silence some noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger = logging.getLogger("hms")
    logger.info("Structured logging initialized.")
