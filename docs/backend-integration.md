# HMS Backend Integration

## Recommended folder structure

```text
HMS/
|-- backend/
|   |-- app/
|   |   |-- routers/
|   |   |   |-- appointments.py
|   |   |   |-- dashboard.py
|   |   |   |-- invoices.py
|   |   |   |-- medicines.py
|   |   |   |-- patients.py
|   |   |   |-- records.py
|   |   |   |-- staff.py
|   |   |   `-- tests.py
|   |   |-- config.py
|   |   |-- crud.py
|   |   |-- database.py
|   |   |-- main.py
|   |   |-- models.py
|   |   |-- schemas.py
|   |   `-- seed.py
|   |-- hms.db
|   `-- requirements.txt
|-- docs/
|   `-- backend-integration.md
|-- src/
|   `-- lib/
|       `-- api.js
`-- vite.config.js
```

## SQLite schema

- `patients`: patient master data and admission status
- `appointments`: doctor bookings and visit schedule
- `medical_records`: diagnosis and prescription history
- `invoices`: billing data with amount and payment method
- `medicines`: pharmacy stock and expiry tracking
- `lab_tests`: laboratory requests and status
- `staff`: employee role, department, and shift details

Each table uses an integer primary key plus a business code like `P-101` or `APP-01` for display in the UI.

## API routes

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/dashboard/stats`
- `GET|POST /api/patients`
- `GET|PUT|DELETE /api/patients/{id}`
- `GET|POST /api/appointments`
- `GET|PUT|DELETE /api/appointments/{id}`
- `GET|POST /api/records`
- `GET|PUT|DELETE /api/records/{id}`
- `GET|POST /api/invoices`
- `GET|PUT|DELETE /api/invoices/{id}`
- `GET|POST /api/medicines`
- `GET|PUT|DELETE /api/medicines/{id}`
- `GET|POST /api/tests`
- `GET|PUT|DELETE /api/tests/{id}`
- `GET|POST /api/staff`
- `GET|PUT|DELETE /api/staff/{id}`

## Connecting the existing frontend

Your current frontend stores HMS data inside `src/context/AppContext.jsx`. The clean migration path is:

1. Replace each local state bootstrap with an API fetch inside `useEffect`.
2. Replace each `add*` helper with an API `create` call.
3. After create, update, or delete, either re-fetch the list or update React state using the response body.
4. Keep UI formatting in the frontend, because the API now returns real `date`, `datetime`, and numeric values.

Example for patients:

```jsx
import { useEffect, useState } from 'react';
import { patientsApi } from '../lib/api';

function PatientsDataExample() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    patientsApi.list().then(setPatients).catch(console.error);
  }, []);

  async function handleCreatePatient(formData) {
    const created = await patientsApi.create({
      patient_code: `P-${Date.now()}`,
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender,
      blood_group: formData.bloodGroup,
      last_visit: new Date().toISOString().slice(0, 10),
      status: formData.status,
    });

    setPatients((current) => [created, ...current]);
  }

  return null;
}
```

## Vite and API URL setup

`vite.config.js` now proxies `/api` to `http://127.0.0.1:8000`, so in local development your frontend can call `/api/patients` directly.

For deployment, set:

```env
VITE_API_URL=https://your-api-domain.com
```

Then the same helper in `src/lib/api.js` will call the deployed backend instead of the local proxy.

## Auth integration

The frontend auth page now uses `authApi.login()` and `authApi.signup()` from `src/lib/api.js`.

Signup payload:

```json
{
  "full_name": "Jane Admin",
  "username": "janeadmin",
  "email": "janeadmin@hospital.com",
  "password": "replace-with-a-secure-password",
  "role": "Admin"
}
```

Login payload:

```json
{
  "username": "janeadmin",
  "password": "replace-with-a-secure-password"
}
```
