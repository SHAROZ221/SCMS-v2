# Service Center Management System (SCMS)
### Samsung Customer Care Service Operations & Repair Lifecycle Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-REST_API-lightgrey.svg)](https://expressjs.com/)
[![Sequelize ORM](https://img.shields.io/badge/Sequelize-ORM-52B0E7.svg)](https://sequelize.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14%2B-336791.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

---

## 1. Executive Summary

The **Service Center Management System (SCMS)** is an enterprise-grade full-stack web application designed to digitize and streamline the day-to-day operations of an electronics service center. Inspired by real-world workflows observed during an internship at a **Samsung Customer Care Service Center**, SCMS manages the complete end-to-end lifecycle of device repairs — from walk-in intake and automated warranty validation to technician diagnosis, inventory consumption, automated billing with 18% GST, and customer email notifications.

---

## 2. Key User Personas & Role Permissions

| Feature / Module | 👤 Admin (Manager) | 👤 Receptionist (Front Desk) | 👤 Technician (Engineer) |
|---|:---:|:---:|:---:|
| **Executive Dashboard & Charts** | ✅ Full KPIs & Trends | ✅ Operations View | ✅ Assigned Tasks |
| **Customer Intake & Directory** | ✅ CRUD | ✅ CRUD | ❌ View Only |
| **Device Registration & Warranty** | ✅ Full Access | ✅ Full Access | 👁️ View Only |
| **Ticket Lifecycle Creation** | ✅ Create & Edit | ✅ Create & Edit | ❌ Assigned Only |
| **Status Updates & Transitions** | ✅ All Tickets | ✅ All Tickets | ✅ Assigned Tickets |
| **Diagnosis & Repair Notes** | ✅ Edit | 👁️ View Only | ✅ Edit Assigned |
| **Spare Parts Stock Consumption** | ✅ Full Control | 👁️ View Only | ✅ Deduct Assigned Parts |
| **Inventory Restocking & Alerts** | ✅ Full Control | 👁️ View Alerts | 👁️ View Only |
| **Invoicing & GST Calculation** | ✅ Generate & Settle | ✅ Generate & Settle | 👁️ View Breakdown |
| **Printable Samsung Care Receipt**| ✅ Printable | ✅ Printable | 👁️ View Only |
| **Staff & Account Security** | ✅ Admin Only | ❌ No Access | ❌ No Access |

---

## 3. Core System Modules

### 🎫 1. Repair Lifecycle State Machine
Sequential, audit-logged status transitions:
```
[RECEIVED] ──▶ [DIAGNOSING] ──▶ [WAITING FOR PARTS] ──▶ [REPAIRING] ──▶ [READY] ──▶ [DELIVERED]
    │                │                                         │            │
    ▼                ▼                                         ▼            ▼
[CANCELLED]      [CANCELLED]                               [CANCELLED]  [CANCELLED]
```
- **Automated Sequential Numbering:** `SVC-YYYYMMDD-NNN` (resets daily).
- **Audit Stepper Timeline:** Logs timestamp, previous status, technician notes, and actor ID for every transition.

### 📱 2. Device Registry & Real-Time Warranty Validation
- Auto-calculates warranty expiration from purchase date + warranty period (e.g. 12/24/36 months).
- Dynamically generates status badges: **Under Warranty** (green) vs **Out of Warranty** (slate).
- Enforces hardware serial number uniqueness across the entire system.

### ⚙️ 3. Spare Parts Inventory & Live Stock Deduction
- Tracks stock levels against defined reorder alert thresholds.
- Consuming a part on an active ticket automatically decrements stock in real-time.
- Guardrails prevent attaching parts with zero available inventory.
- Removing a part from a ticket automatically restores inventory count.
- One-click restock modal for administrators.

### 🧾 4. Automated Billing & Printable Receipts
- **Billing Formula:**
  $$\text{Total} = (\text{Parts Cost} + \text{Labor Cost}) + 18\% \text{ GST} - \text{Discount}$$
- **Sequential Invoices:** `INV-YYYYMMDD-NNN`.
- **Settlement Modes:** Record payments via UPI (PhonePe, GPay), POS Card swipe, Cash, or Online transfer.
- **Printable Receipt:** Official Samsung Care branded thermal/A4 printable invoice with itemized line items and customer contact block.

### 📊 5. Analytics & Business Intelligence
- Executive summary counters for intake, active workload, completed jobs, and total settled revenue.
- Recharts visualizations:
  - **Volume Trends:** Daily intake vs daily resolution area chart.
  - **Status Breakdown:** Live donut chart of active devices across the 7 repair stages.
  - **Payment Mode Distribution:** Pie chart breaking down UPI, Card, and Cash volume.
  - **Technician SLA Throughput Table:** Turnaround hours and resolution completion rates.
  - **CSV Export:** Download metrics directly for offline reporting.

---

## 4. Default Demo Login Credentials

For testing and demonstration, the database includes pre-seeded demo accounts:

| Role | Email Address | Password | Quick Access |
|---|---|---|:---:|
| **Admin** | `admin@scms.com` | `password123` | 1-Click Button on Login Page |
| **Receptionist** | `receptionist@scms.com` | `password123` | 1-Click Button on Login Page |
| **Technician** | `technician@scms.com` | `password123` | 1-Click Button on Login Page |

---

## 5. Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide React Icons, React Router v6, Axios, React Hot Toast.
- **Design System:** Samsung Corporate Palette (`#1428A0`, `#0D1B6F`, `#4285F4`, `#F8F9FA`), WCAG-compliant high-contrast typography, custom scrollbars.
- **Backend:** Node.js, Express.js (REST API, MVC Architecture, Helmet, CORS, express-validator).
- **ORM & Database:** Sequelize ORM with dual-engine support:
  - **SQLite:** Out-of-the-box zero-dependency database for instant local execution.
  - **PostgreSQL:** Production-ready via `DB_DIALECT=postgres` in `.env`.
- **Authentication:** JWT (JSON Web Tokens) with 24-hour expiry and bcrypt password hashing.
- **Communications:** Nodemailer email dispatch with fallback database audit logs.

---

## 6. Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- npm v9+
- [PostgreSQL](https://www.postgresql.org/) v14+ (or cloud instance via Supabase / Neon)
- [pgAdmin 4](https://www.pgadmin.org/) *(Optional, recommended visual GUI)*

### 1. Installation

Clone repository and install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database & Environment Configuration

1. **Create the PostgreSQL Database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE scms_db;"
   ```

2. **Configure Environment Variables (`backend/.env`):**
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=24h

   # Database Configuration (PostgreSQL)
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=scms_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   ```
   *(Note: SCMS also retains zero-dependency offline fallback to SQLite by setting `DB_DIALECT=sqlite`)*

### 3. Database Seeding (Demo Data)
Populate PostgreSQL with realistic demo data (4 staff users, 10 Indian customers, 15 Samsung devices, 30 inventory parts, 20 tickets across all statuses, timelines, and invoices):

```bash
cd backend
npm run seed
```

### 4. Running the Application

In **Terminal 1** (Start Backend API on port 5000):
```bash
cd backend
npm run dev
```

In **Terminal 2** (Start Frontend React App on port 3000):
```bash
cd frontend
npm run dev
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## 7. Automated Testing Suite

The backend includes automated integration test suites covering authentication, role guards, ticket lifecycles, and inventory calculations:

```bash
cd backend

# Run Authentication & RBAC Test Suite (14 tests)
npm run test:auth

# Run Core Business Logic & Invoicing Test Suite (19 tests)
npm run test:api
```

---

## 8. API Endpoints Reference

| Method | Endpoint | Description | Access Control |
|---|---|---|---|
| `POST` | `/api/auth/login` | Staff login, returns JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated staff profile | Authenticated |
| `POST` | `/api/auth/register` | Create staff account | Admin |
| `GET` | `/api/customers` | Search & list customers | Admin, Receptionist |
| `POST` | `/api/customers` | Register customer (duplicate phone check) | Admin, Receptionist |
| `GET` | `/api/devices` | Filter & list registered devices | All Roles |
| `POST` | `/api/devices` | Register device with auto-calculated warranty | Admin, Receptionist |
| `GET` | `/api/tickets` | Filter tickets by status, priority, or search | All Roles |
| `POST` | `/api/tickets` | Create walk-in ticket (`SVC-YYYYMMDD-NNN`) | Admin, Receptionist |
| `PATCH`| `/api/tickets/:id/status`| Transition ticket lifecycle & log timeline | All Roles |
| `POST` | `/api/tickets/:id/parts` | Consume spare part (decrements inventory) | Admin, Technician |
| `DELETE`| `/api/tickets/:id/parts/:partId` | Remove part (restores stock) | Admin, Technician |
| `GET` | `/api/inventory` | Catalog & real-time stock levels | All Roles |
| `PATCH`| `/api/inventory/:id/restock` | Restock spare part quantity | Admin |
| `GET` | `/api/billing` | List customer invoices | Admin, Receptionist |
| `POST` | `/api/billing/generate` | Auto-generate invoice from ticket | Admin, Receptionist |
| `PATCH`| `/api/billing/:id/pay` | Settle invoice payment (`PAID`) | Admin, Receptionist |
| `GET` | `/api/reports/dashboard-stats` | Real-time executive KPIs | Admin, Receptionist |

---

## 9. License & Credits

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

Developed by **Sharoz** for academic portfolio showcase, inspired by hands-on training at Samsung Customer Care Service Center.
