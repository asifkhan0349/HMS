"""
Token blocklist for JWT revocation.

This is an in-memory set — sufficient for single-process development.
For multi-worker/multi-instance production, replace with a Redis SET:

    import redis
    _redis = redis.Redis.from_url(os.environ["REDIS_URL"])

    def revoke_token(jti: str, exp: int) -> None:
        ttl = exp - int(time.time())
        if ttl > 0:
            _redis.setex(f"blocklist:{jti}", ttl, "1")

    def is_token_revoked(jti: str) -> bool:
        return bool(_redis.exists(f"blocklist:{jti}"))
"""
import time
from threading import Lock

_revoked: dict[str, int] = {}   # jti -> expiry unix timestamp
_lock = Lock()


def revoke_token(jti: str, exp: int) -> None:
    """Add a token's JTI to the revocation list."""
    with _lock:
        _revoked[jti] = exp
        # Prune expired entries to prevent unbounded memory growth
        now = int(time.time())
        expired = [k for k, v in _revoked.items() if v < now]
        for k in expired:
            del _revoked[k]


def is_token_revoked(jti: str) -> bool:
    """Return True if this token has been explicitly revoked."""
    with _lock:
        return jti in _revoked
