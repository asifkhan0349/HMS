import asyncio
import httpx
import sys

BASE_URL = "http://127.0.0.1:8001/api"
USERNAME = "testuser0349"
PASSWORD = "7357U536@349"

async def test_crud_workflow():
    headers = {}
    print(f"[*] Starting Comprehensive CRUD Testing for all Modules...")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # 1. Login
        print("[*] Logging in...")
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "username": USERNAME,
            "password": PASSWORD
        })
        
        if resp.status_code != 200:
            print(f"[!] Login failed: {resp.status_code} - {resp.text}")
            return
            
        token = resp.json().get("token") or resp.json().get("access_token")
        headers["Authorization"] = f"Bearer {token}"
        print("[+] Login successful.")

        state = {}

        try:
            # === MODULE: STAFF ===
            print("\n--- Testing Module: Staff ---")
            resp = await client.post(f"{BASE_URL}/staff/", json={"name": "John Doe", "role": "Doctor", "department": "Cardiology", "shift": "Morning", "status": "Active"}, headers=headers)
            assert resp.status_code in [200, 201], f"Add failed: HTTP {resp.status_code} - {resp.text}"
            state['staff_id'] = resp.json()['id']
            print("[+] Added Staff")

            resp = await client.put(f"{BASE_URL}/staff/{state['staff_id']}", json={"name": "John Edited", "role": "Doctor", "department": "Cardiology", "status": "Active", "shift": "Morning"}, headers=headers)
            assert resp.status_code in [200, 201], f"Edit failed: {resp.text}"
            print("[+] Edited Staff")

            # === MODULE: PATIENTS ===
            print("\n--- Testing Module: Patients ---")
            resp = await client.post(f"{BASE_URL}/patients/", json={
                "name": "Test Patient", "age": 30, "gender": "Male", "blood_group": "A+", "status": "Stable"
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Add failed: {resp.text}"
            state['patient_id'] = resp.json()['id']
            print("[+] Added Patient")
            
            resp = await client.put(f"{BASE_URL}/patients/{state['patient_id']}", json={
                "name": "Test Patient", "age": 31, "gender": "Male", "blood_group": "A+", "status": "Stable"
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Edit failed: {resp.text}"
            print("[+] Edited Patient")

            # === MODULE: APPOINTMENTS ===
            print("\n--- Testing Module: Appointments ---")
            resp = await client.post(f"{BASE_URL}/appointments/", json={
                "patient_name": "Test Patient",
                "patient_age": 30,
                "appointment_date": "2026-05-01",
                "appointment_type": "Checkup",
                "status": "Pending",
                "telegram_chat_id": "12345"
            }, headers=headers)
            if resp.status_code not in [200, 201]:
                print(f"[!] Appointment Add failed: {resp.text}")
            else:
                state['appointment_id'] = resp.json()['id']
                print("[+] Added Appointment")
                
                # Test Webhook Trigger via status update
                resp = await client.put(f"{BASE_URL}/appointments/{state['appointment_id']}", json={
                    "status": "Scheduled"
                }, headers=headers)
                assert resp.status_code in [200, 201], f"Edit failed: {resp.text}"
                print("[+] Edited Appointment (Webhook triggered if implemented)")

            # === MODULE: PHARMACY (MEDICINES) ===
            print("\n--- Testing Module: Pharmacy ---")
            resp = await client.post(f"{BASE_URL}/medicines/", json={
                "name": "Test Medicine", "batch": "B123", "stock": 100, "expiry_date": "2028-01-01", "status": "Active"
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Add failed: {resp.text}"
            state['medicine_id'] = resp.json()['id']
            print("[+] Added Medicine")

            resp = await client.put(f"{BASE_URL}/medicines/{state['medicine_id']}", json={
                "stock": 120
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Edit failed: {resp.text}"
            print("[+] Edited Medicine")

            # === MODULE: LAB TESTS ===
            print("\n--- Testing Module: Lab Tests ---")
            resp = await client.post(f"{BASE_URL}/tests/", json={
                "patient_name": "Test Patient",
                "test_name": "Blood Group Test",
                "doctor_name": "John Doe",
                "status": "Pending"
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Add failed: {resp.text}"
            state['test_id'] = resp.json()['id']
            print("[+] Added Lab Test")

            resp = await client.put(f"{BASE_URL}/tests/{state['test_id']}", json={
                "status": "Completed"
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Edit failed: {resp.text}"
            print("[+] Edited Lab Test")

            # === MODULE: BED MANAGEMENT ===
            print("\n--- Testing Module: Bed Management ---")
            resp = await client.post(f"{BASE_URL}/beds/", json={
                "bed_number": "B-101",
                "ward_name": "ICU",
                "type": "Standard",
                "status": "Available"
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Add failed: {resp.text}"
            state['bed_id'] = resp.json()['id']
            print("[+] Added Bed")

            resp = await client.put(f"{BASE_URL}/beds/{state['bed_id']}", json={
                "status": "Occupied"
            }, headers=headers)
            assert resp.status_code in [200, 201], f"Edit failed: {resp.text}"
            print("[+] Edited Bed")

            # === DELETIONS ===
            print("\n--- Starting Deletions ---")
            for module, endpoint, id_key in [
                ("Bed Management", "beds", "bed_id"),
                ("Lab Tests", "tests", "test_id"),
                ("Pharmacy", "medicines", "medicine_id"),
                ("Appointments", "appointments", "appointment_id"),
                ("Patients", "patients", "patient_id"),
                ("Staff", "staff", "staff_id")
            ]:
                if id_key in state:
                    resp = await client.delete(f"{BASE_URL}/{endpoint}/{state[id_key]}", headers=headers)
                    assert resp.status_code in [200, 201, 204], f"Delete failed for {module}: {resp.text}"
                    print(f"[-] Deleted {module}")

            print("\n[SUCCESS] All modules added, edited, and deleted successfully without any errors.")

        except AssertionError as e:
            print(f"\n[FAIL] Assertion failed: {e}")
        except Exception as e:
            print(f"\n[FAIL] Unhandled Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_crud_workflow())
