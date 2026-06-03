import sys
from pathlib import Path
import json

# Add backend to path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.append(str(backend_path))

from app.main import app

openapi = app.openapi()
paths = openapi.get("paths", {})

endpoints_summary = []
for path, methods in paths.items():
    for method, info in methods.items():
        summary = {
            "path": path,
            "method": method.upper(),
            "summary": info.get("summary", ""),
            "description": info.get("description", ""),
            "parameters": info.get("parameters", []),
            "requestBody": info.get("requestBody", {}),
            "responses": info.get("responses", {})
        }
        endpoints_summary.append(summary)

output_file = Path(__file__).resolve().parent / "endpoints.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(endpoints_summary, f, indent=2, ensure_ascii=False)

print(f"Successfully wrote {len(endpoints_summary)} endpoints to {output_file}")
