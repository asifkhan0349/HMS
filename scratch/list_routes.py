import sys
import os

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from app.main import app

print("--- REGISTERED ROUTE DETAILS ---")
for route in app.routes:
    # Get HTTP methods
    methods = getattr(route, "methods", None)
    if methods:
        methods_str = ", ".join(list(methods))
        print(f"{methods_str:<15} {route.path}")
    else:
        print(f"{'WS/OTHER':<15} {route.path}")
