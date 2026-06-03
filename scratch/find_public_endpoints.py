import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.append(str(backend_path))

from fastapi.routing import APIRoute
from fastapi.params import Depends
from app.main import app
from app.auth_context import (
    get_current_user_id,
    get_current_user,
    get_raw_token_data,
    require_admin,
)

auth_dependencies = {
    get_current_user_id,
    get_current_user,
    get_raw_token_data,
    require_admin,
}

def is_auth_dependency(dep):
    if dep in auth_dependencies:
        return True
    
    # Check if the name matches or if it's require_roles / exclude_roles / etc.
    func_name = getattr(dep, "__name__", "")
    if func_name in ("_check", "get_current_user_id", "get_current_user", "get_raw_token_data", "require_admin"):
        return True
        
    # Recurse into dependencies declared on the function itself
    if callable(dep):
        try:
            import inspect
            sig = inspect.signature(dep)
            for param in sig.parameters.values():
                if isinstance(param.default, Depends):
                    if is_auth_dependency(param.default.dependency):
                        return True
        except Exception:
            pass
            
    # Also inspect the function closure if it is require_roles / exclude_roles
    if hasattr(dep, "__closure__") and dep.__closure__:
        for cell in dep.__closure__:
            try:
                val = cell.cell_contents
                if callable(val) and is_auth_dependency(val):
                    return True
            except Exception:
                pass
                
    return False

def route_requires_auth(route: APIRoute) -> bool:
    # Check router-level dependencies
    for dep in route.dependencies:
        if is_auth_dependency(dep.dependency):
            return True
            
    # Check endpoint parameter dependencies
    import inspect
    try:
        sig = inspect.signature(route.endpoint)
        for param in sig.parameters.values():
            if isinstance(param.default, Depends):
                if is_auth_dependency(param.default.dependency):
                    return True
    except Exception:
        pass
                
    return False

public_routes = []
for route in app.routes:
    if isinstance(route, APIRoute):
        if route.path in ("/docs", "/redoc", "/openapi.json"):
            continue
        requires_auth = route_requires_auth(route)
        public_routes.append({
            "path": route.path,
            "methods": list(route.methods),
            "name": route.name,
            "requires_auth": requires_auth,
            "summary": route.summary or ""
        })

print("PUBLIC ENDPOINTS (No Authentication Required):")
print("=" * 60)
for r in public_routes:
    if not r["requires_auth"]:
        methods_str = ", ".join(r["methods"])
        print(f"{methods_str:<8} {r['path']:<40} | {r['name']:<25} | {r['summary']}")

print("\nPROTECTED ENDPOINTS (Authentication Required):")
print("=" * 60)
for r in public_routes:
    if r["requires_auth"]:
        methods_str = ", ".join(r["methods"])
        print(f"{methods_str:<8} {r['path']:<40} | {r['name']:<25} | {r['summary']}")
