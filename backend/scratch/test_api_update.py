import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def get_auth_token():
    # Login as admin using correct hrmsadmin123 credentials and json payload
    payload = {"username": "admin_hms", "password": "ham33dSh@ika7m1n4m5"}
    r = requests.post(f"{BASE_URL}/auth/login", json=payload)
    r.raise_for_status()
    token = r.json()["token"]
    return {"Authorization": f"Bearer {token}"}

def run_test():
    try:
        headers = get_auth_token()
        print("1. Booking a new appointment (status: Pending)...")
        create_payload = {
            "patient_name": "API Test Patient",
            "patient_age": 29,
            "patient_gender": "Male",
            "appointment_date": "2026-06-01",
            "appointment_type": "New Consultation",
            "phone_number": "555-0199",
            "emergency_contact": "555-0100",
            "status": "Pending",
            "time_slot": "10:30 AM",
            "department": "General Medicine"
        }
        r = requests.post(f"{BASE_URL}/appointments", json=create_payload, headers=headers)
        r.raise_for_status()
        appt = r.json()
        
        appt_id = appt["id"]
        booking_id = appt["booking_id"]
        code = appt["appointment_code"]
        print(f"   Created Appt ID: {appt_id}")
        print(f"   Booking ID: {booking_id}")
        print(f"   Appointment Code: {code}")
        
        assert booking_id is not None
        assert booking_id.startswith("BK")
        assert code is None, "Appointment Code should be null on creation if Pending"
        
        print("\n2. Scheduling the appointment...")
        update_payload = {
            "status": "Scheduled",
            "doctor_name": "Dr. House",
            "doctor_id": "STF-01"
        }
        r = requests.put(f"{BASE_URL}/appointments/{appt_id}", json=update_payload, headers=headers)
        r.raise_for_status()
        updated_appt = r.json()
        
        updated_booking_id = updated_appt["booking_id"]
        updated_code = updated_appt["appointment_code"]
        print(f"   Updated Booking ID: {updated_booking_id}")
        print(f"   Updated Appointment Code: {updated_code}")
        
        assert updated_booking_id == booking_id
        assert updated_code is not None, "Appointment Code should be generated when status is Scheduled"
        assert updated_code.startswith("AP-")
        print("   SUCCESS: API update test passed!")
        
        print("\n3. Cleaning up test appointment...")
        r = requests.delete(f"{BASE_URL}/appointments/{appt_id}", headers=headers)
        r.raise_for_status()
        print("   SUCCESS: Cleanup completed!")
        
    except Exception as e:
        print(f"   FAILURE: Test failed with error: {e}")
        if 'r' in locals() and hasattr(r, 'text'):
            print(f"   Response text: {r.text}")

if __name__ == "__main__":
    run_test()
