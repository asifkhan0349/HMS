import sys
import traceback
try:
    from app import main
    print('Backend sanity check passed')
except Exception:
    traceback.print_exc()
    sys.exit(1)
