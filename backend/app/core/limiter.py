import os
import sys
from slowapi import Limiter
from slowapi.util import get_remote_address

# Global limiter instance
# Disable rate limiting during pytest test runs
is_testing = "pytest" in sys.modules or "PYTEST_CURRENT_TEST" in os.environ or os.environ.get("TESTING") == "1"
limiter = Limiter(key_func=get_remote_address, enabled=not is_testing)
