import json

with open("scratch/endpoints.json", "r") as f:
    endpoints = json.load(f)

print(f"Total endpoints: {len(endpoints)}")
for ep in endpoints:
    print(f"{ep['method']} {ep['path']} - {ep['summary']}")
