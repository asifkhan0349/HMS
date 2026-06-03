import glob
import os
import yaml

base_dir = r"c:\Users\asifk\Documents\antigravity\HMS\postman\collections\HMS API"
yaml_files = glob.glob(os.path.join(base_dir, "**", "*.request.yaml"), recursive=True)

print(f"Total YAML request files found: {len(yaml_files)}")
for yf in yaml_files:
    rel_path = os.path.relpath(yf, base_dir)
    try:
        with open(yf, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            name = data.get("name", "Unknown")
            method = data.get("method", "Unknown")
            url = data.get("url", "Unknown")
            print(f"- {rel_path}: {method} {url} ({name})")
    except Exception as e:
        print(f"- {rel_path}: Failed to parse ({e})")
