# HMS: Elite Hospital Management System
## Technical Documentation & User Manual — v1.0.0

[[TOC]]

## 1. Executive Summary
The HMS Elite (Hospital Management System) is a production-grade, full-stack application designed to streamline healthcare operations. Built with a React 19 frontend and a FastAPI (Python) backend secured with JWT authentication, it provides a seamless, data-persistent experience for hospital administrators, doctors, and clinical staff across 13 specialised modules.

## 2. Technology Stack
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 7, Bootstrap 5 | Responsive single-page application |
| **Backend** | FastAPI (Python), Uvicorn | High-performance async REST API |
| **Database** | SQLite 3, SQLAlchemy ORM | Persistent relational data storage |
| **Authentication** | JWT (HS256, python-jose) | Signed tokens, 24-hour expiry |
| **Password Security** | PBKDF2-HMAC-SHA256 | Salted hash, 100,000 iterations |
| **Styling** | CSS Variables, Glassmorphism | Light/Dark theme support |

## 3. System Architecture
The system follows a classic **client-server architecture** with a clear separation of concerns:

- **Client Layer**: React SPA — handles routing, state management, and UI rendering. All API calls use `Authorization: Bearer <JWT>` headers.
- **API Layer**: FastAPI RESTful backend — validates JWT on every protected route, enforces per-user data isolation via `owner_user_id`.
- **Data Layer**: SQLite managed via SQLAlchemy ORM — full CRUD for all 13 entities across 12 modules.

## 4. Security Model
| Dimension | Implementation |
| :--- | :--- |
| **Authentication** | HS256 JWT issued at login/signup; validated on every API request |
| **Authorization** | Every record scoped to `owner_user_id`; no cross-user data leakage |
| **Password Storage** | PBKDF2-HMAC-SHA256 with random 32-byte salt; timing-safe comparison |
| **CORS** | Configurable via `ALLOWED_ORIGINS` environment variable |
| **Token Expiry** | 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`) |

## 5. How to Run the Project

### Start Backend
```
cd HMS/backend
npm run dev
```

### Start Frontend
```
cd HMS
npm run dev
```

## 6. API Reference
| Module | Endpoint Prefix | Operations |
| :--- | :--- | :--- |
| Authentication | `/api/auth` | POST /login, /signup |
| Patients | `/api/patients` | GET, POST, PUT, DELETE |
| Appointments | `/api/appointments` | GET, POST, PUT, DELETE |
| Dashboard | `/api/dashboard` | GET (Live Metrics) |

## 7. Core Modules — Visual Gallery
Each module presents a dual interface: a high-level **Table View** for monitoring and a task-focused **Form View** for data entry and administrative actions.

### 7.1 Clinical Operations Dashboard
Real-time hospital metrics: active admissions, critical alerts, total patients, and monthly revenue. 
**Table View:**
![Dashboard Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/01_Dashboard.png)

### 7.2 Patient Registry
Full patient lifecycle management — registration through discharge.
**Table View:**
![Patients Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/02_Patients.png)
**Form View (Registration):**
![Patients Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/02_Patients_Form.png)
**Form Details:**
| Field Label | Input Type | Description |
| :--- | :--- | :--- |
| Full Name | Text | Legal name of the patient |
| Age | Number | Current age in years |
| Gender | Select | Male, Female, Other |
| Blood Group | Select | A+, B+, O+, AB+, etc. |
| Admission Status | Select | Admitted, Outpatient, Discharged |

### 7.3 Appointment Scheduling
**Table View:**
![Appointments Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/03_Appointments.png)
**Form View (Booking):**
![Appointments Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/03_Appointments_Form.png)
**Form Details:**
| Field Label | Input Type | Description |
| :--- | :--- | :--- |
| Patient Name | Select | Registered patient reference |
| Department | Select | Hospital department |
| Doctor Name | Select | Assigned clinician |
| Date | Date | Scheduled date |

### 7.4 Electronic Medical Records (EMR)
**Table View:**
![EMR Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/04_EMR.png)
**Form View (New Entry):**
![EMR Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/04_EMR_Form.png)
**Form Details:**
| Field Label | Input Type | Description |
| :--- | :--- | :--- |
| Patient ID | Select | Clinical record link |
| Diagnosis | Text | Findings |
| Prescription | Textarea | Medication list |

### 7.5 Billing & Finance
**Table View:**
![Billing Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/05_Billing.png)
**Form View (Invoice):**
![Billing Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/05_Billing_Form.png)
**Form Details:**
| Field Label | Input Type | Description |
| :--- | :--- | :--- |
| Patient Name | Select | Billing recipient |
| Total Amount | Number | Total cost |
| Payment Method | Select | Cash, Card, Insurance |

### 7.6 Pharmacy Inventory
**Table View:**
![Pharmacy Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/06_Pharmacy.png)
**Form View (Stock):**
![Pharmacy Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/06_Pharmacy_Form.png)
**Form Details:**
| Field Label | Input Type | Description |
| :--- | :--- | :--- |
| Medicine Name | Text | Medication name |
| Stock Count | Number | Current inventory |
| Expiration Date | Date | Shelf life |

### 7.7 Laboratory Management
**Table View:**
![Lab Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/07_Lab.png)
**Form View (Order):**
![Lab Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/07_Lab_Form.png)
**Form Details:**
| Field Label | Input Type | Description |
| :--- | :--- | :--- |
| Patient ID | Select | Test subject |
| Test Name | Text | Procedure name |

### 7.8 Bed Management
**Table View:**
![Beds Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/08_Beds.png)
**Form View (Add Bed):**
![Beds Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/08_Beds_Form.png)

### 7.9 Human Resources
**Table View:**
![Staff Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/09_Staff.png)
**Form View (Onboard):**
![Staff Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/09_Staff_Form.png)

### 7.10 Reports & Analytics
**Table View:**
![Reports Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/10_Reports.png)

### 7.11 Inventory
**Table View:**
![Inventory Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/11_Inventory.png)
**Form View (Supply):**
![Inventory Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/11_Inventory_Form.png)

### 7.12 Blood Bank
**Table View:**
![BloodBank Table](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/12_BloodBank.png)
**Form View (Log):**
![BloodBank Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/12_BloodBank_Form.png)

### 7.13 Authentication
**Form View (Login):**
![Login Form](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/13_Login.png)

## 10. System Interconnectivity & Data Flow
The HMS Elite is a highly integrated ecosystem where data flows seamlessly between specialised modules to provide a 360-degree view of hospital operations.

### 10.1 Visual Architecture Map
The following diagram illustrates the primary data flows and relational links between the 13 core modules.
![Interconnectivity Map](file:///c:/Users/asifk/Documents/antigravity/HMS/docs/screenshots/14_Interconnectivity.png)

### 10.2 Primary Data Relationships
- **Patient ID** is the primary key linking Patients, Appointments, EMR, Billing, Lab, and Beds.
- **Staff (Doctors)** provide clinical attribution to Appointments, EMR, and Laboratory orders.
- **Financial Telemetry** from Billing flows into the Dashboard for real-time oversight.
- **Resource Alerts** from Pharmacy and Inventory flow into the Reports module.

### 10.3 Relational Mapping Table
| Module A | Module B | Relationship Type | Data Flow |
| :--- | :--- | :--- | :--- |
| Patients | All Clinical Mod. | One-to-Many | Patient ID reference |
| Staff (Doctors) | Medical | Many-to-Many | Clinician assignment |
| Finance (Billing) | Dashboard | Financial | Revenue summation |

> [!NOTE]
> This documentation reflects HMS Elite v1.0.0 — production-ready with JWT authentication, full CRUD persistence, and comprehensive architectural mapping.
