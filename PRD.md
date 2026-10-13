# Product Requirements Document (PRD)
# Service Center Management System (SCMS)

| Field              | Details                                      |
|--------------------|----------------------------------------------|
| **Project Name**   | Service Center Management System (SCMS)      |
| **Author**         | Sharoz                                       |
| **Date**           | September 3, 2026                            |
| **Version**        | 1.0                                          |
| **Status**         | Draft                                        |
| **Purpose**        | College Project / Portfolio Showcase          |
| **Inspired By**    | Samsung Customer Care Service Center (Internship) |

---

## 1. Executive Summary

The **Service Center Management System (SCMS)** is a full-stack web application designed to digitize and streamline the day-to-day operations of an electronics service center. Inspired by real-world workflows observed during an internship at a Samsung customer care service center, this system manages the complete lifecycle of device repairs — from customer walk-in and complaint registration to technician assignment, repair tracking, billing, and customer notification.

The system replaces manual, paper-based processes with a modern, role-based web application that improves efficiency, reduces errors, and provides actionable insights through analytics dashboards.

---

## 2. Problem Statement

Service centers today face several operational challenges:

| Problem | Impact |
|---------|--------|
| **Manual record-keeping** (registers, paper forms) | Data loss, difficulty searching old records, no backups |
| **No real-time repair tracking** | Customers call repeatedly for status updates |
| **Untracked inventory** | Parts run out unexpectedly, delays in repairs |
| **No technician workload visibility** | Uneven distribution of work, some technicians overloaded |
| **Manual billing** | Calculation errors, no standardized invoice format |
| **No performance analytics** | Management can't identify trends or bottlenecks |
| **No automated customer communication** | Staff must manually call/SMS customers for updates |

---

## 3. Objectives & Goals

### 3.1 Primary Objectives
1. **Digitize complaint management** — Replace paper-based ticket registers with a searchable digital system
2. **Enable real-time repair tracking** — Track device status through every stage of the repair lifecycle
3. **Automate customer notifications** — Send email updates when repair status changes
4. **Manage spare parts inventory** — Track stock levels, usage, and reorder alerts
5. **Generate professional invoices** — Automated billing with parts cost + labor charges
6. **Provide analytics & insights** — Dashboard with KPIs, trends, and technician performance

### 3.2 Success Metrics
| Metric | Target |
|--------|--------|
| Time to register a new complaint | < 2 minutes |
| Ticket search (by number, customer, phone) | < 3 seconds |
| Customer notification delivery | Automated on status change |
| Low-stock parts visibility | Real-time alerts on dashboard |
| Invoice generation from ticket | 1-click process |

---

## 4. Target Users & Roles

### 4.1 User Personas

#### 👤 Admin (Service Center Manager)
- **Responsibilities:** Oversee all operations, manage staff, view reports, manage system settings
- **Needs:** Bird's-eye view of service center performance, revenue tracking, user management
- **Access Level:** Full system access

#### 👤 Receptionist (Front Desk Staff)
- **Responsibilities:** Receive customers, register complaints, create tickets, handle billing
- **Needs:** Fast customer lookup, quick ticket creation, invoice generation
- **Access Level:** Customers, tickets (create/edit), devices, billing, inventory (view only)

#### 👤 Technician (Repair Engineer)
- **Responsibilities:** Diagnose and repair devices, update repair notes, use spare parts
- **Needs:** View assigned tickets, update status, log diagnosis and repair notes, mark parts used
- **Access Level:** Assigned tickets only, inventory (consume parts)

### 4.2 Role Permission Matrix

| Feature | Admin | Receptionist | Technician |
|---------|:-----:|:------------:|:----------:|
| Dashboard | ✅ Full | ✅ Limited | ✅ Own tasks |
| Customer Management | ✅ CRUD | ✅ CRUD | ❌ View only |
| Ticket Creation | ✅ | ✅ | ❌ |
| Ticket Status Update | ✅ All | ✅ All | ✅ Assigned only |
| Technician Assignment | ✅ | ✅ | ❌ |
| Diagnosis & Repair Notes | ✅ | ❌ View only | ✅ Edit |
| Inventory Management | ✅ CRUD | ❌ View only | ✅ Consume parts |
| Billing & Invoices | ✅ | ✅ | ❌ View only |
| Reports & Analytics | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |

---

## 5. Functional Requirements

### FR-01: User Authentication & Authorization
| ID | Requirement | Priority |
|----|------------|----------|
| FR-01.1 | Users can log in with email and password | P0 |
| FR-01.2 | Passwords are hashed using bcrypt | P0 |
| FR-01.3 | JWT tokens are issued on successful login | P0 |
| FR-01.4 | Role-based access control enforced on all routes | P0 |
| FR-01.5 | Admin can create, edit, activate/deactivate user accounts | P0 |
| FR-01.6 | Users can change their own password | P1 |
| FR-01.7 | Session expires after 24 hours of inactivity | P1 |

### FR-02: Customer Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-02.1 | Register new customers with name, phone, email, address | P0 |
| FR-02.2 | Search customers by name, phone number, or email | P0 |
| FR-02.3 | View customer profile with all devices and service history | P0 |
| FR-02.4 | Edit customer details | P0 |
| FR-02.5 | Prevent duplicate customers (unique phone number) | P0 |
| FR-02.6 | Soft-delete customers (preserve historical records) | P2 |

### FR-03: Device / Product Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-03.1 | Register devices with brand, model, serial number, purchase date | P0 |
| FR-03.2 | Link devices to customer profiles | P0 |
| FR-03.3 | Track warranty status (auto-calculate from purchase date + warranty period) | P0 |
| FR-03.4 | Display warranty badge (Under Warranty / Out of Warranty) | P1 |
| FR-03.5 | Prevent duplicate serial numbers | P0 |
| FR-03.6 | Support multiple device categories (phones, tablets, TVs, appliances) | P1 |

### FR-04: Service Ticket Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-04.1 | Create service tickets linked to a customer and device | P0 |
| FR-04.2 | Auto-generate unique ticket numbers (format: `SVC-YYYYMMDD-NNN`) | P0 |
| FR-04.3 | Record complaint description and priority (low/medium/high/urgent) | P0 |
| FR-04.4 | Track ticket status through lifecycle stages | P0 |
| FR-04.5 | Assign/reassign technicians to tickets | P0 |
| FR-04.6 | Add diagnosis notes (by technician) | P0 |
| FR-04.7 | Add repair notes (by technician) | P0 |
| FR-04.8 | Record estimated repair cost | P1 |
| FR-04.9 | Filter tickets by status, priority, date range, technician | P0 |
| FR-04.10 | Search tickets by ticket number, customer name, or phone | P0 |
| FR-04.11 | View full ticket timeline (status change history) | P1 |

#### Ticket Status Lifecycle

```
┌──────────┐    ┌────────────┐    ┌───────────────────┐    ┌───────────┐    ┌───────┐    ┌───────────┐
│ RECEIVED │───▶│ DIAGNOSING │───▶│ WAITING FOR PARTS │───▶│ REPAIRING │───▶│ READY │───▶│ DELIVERED │
└──────────┘    └────────────┘    └───────────────────┘    └───────────┘    └───────┘    └───────────┘
     │                │                                          │              │
     │                │                                          │              │
     ▼                ▼                                          ▼              ▼
┌───────────┐   ┌───────────┐                              ┌───────────┐  ┌───────────┐
│ CANCELLED │   │ CANCELLED │                              │ CANCELLED │  │ CANCELLED │
└───────────┘   └───────────┘                              └───────────┘  └───────────┘
```

| Status | Color Code | Description |
|--------|-----------|-------------|
| Received | 🔴 Red | Device received at service center, awaiting diagnosis |
| Diagnosing | 🟠 Orange | Technician is examining the device |
| Waiting for Parts | 🟡 Yellow | Required spare parts not in stock |
| Repairing | 🔵 Blue | Active repair in progress |
| Ready | 🟢 Green | Repair complete, awaiting customer pickup |
| Delivered | ✅ Gray | Device returned to customer |
| Cancelled | ⚫ Black | Service request cancelled |

### FR-05: Technician Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-05.1 | View list of all technicians with current workload | P0 |
| FR-05.2 | View technician's assigned tickets | P0 |
| FR-05.3 | Show technician availability (based on active ticket count) | P1 |
| FR-05.4 | Track technician performance (tickets resolved, avg resolution time) | P1 |

### FR-06: Spare Parts Inventory Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-06.1 | Add spare parts with name, part number, category, quantity, unit price | P0 |
| FR-06.2 | Track current stock quantity | P0 |
| FR-06.3 | Record parts used per service ticket | P0 |
| FR-06.4 | Auto-decrement stock when parts are consumed | P0 |
| FR-06.5 | Set reorder level per part and display low-stock alerts | P0 |
| FR-06.6 | Restock parts (increase quantity) | P0 |
| FR-06.7 | Prevent using parts with zero stock | P1 |
| FR-06.8 | View parts usage history across tickets | P2 |

### FR-07: Billing & Invoice Generation
| ID | Requirement | Priority |
|----|------------|----------|
| FR-07.1 | Generate invoice from a completed service ticket | P0 |
| FR-07.2 | Auto-calculate parts cost from consumed spare parts | P0 |
| FR-07.3 | Add labor charges manually | P0 |
| FR-07.4 | Apply tax (GST) and optional discount | P1 |
| FR-07.5 | Auto-generate invoice number (format: `INV-YYYYMMDD-NNN`) | P0 |
| FR-07.6 | Track payment status (pending / paid / refunded) | P0 |
| FR-07.7 | Record payment method (cash / card / UPI / online) | P1 |
| FR-07.8 | View/print invoice details | P0 |

#### Invoice Calculation Formula
```
Parts Cost     = Σ (quantity_used × price_charged) for each part
Labor Cost     = manually entered by receptionist/admin
Subtotal       = Parts Cost + Labor Cost
Tax (GST 18%)  = Subtotal × 0.18
Discount       = manually entered (optional)
Total Amount   = Subtotal + Tax - Discount
```

### FR-08: Reports & Analytics Dashboard
| ID | Requirement | Priority |
|----|------------|----------|
| FR-08.1 | Dashboard summary cards: today's tickets, pending, ready, revenue | P0 |
| FR-08.2 | Ticket status distribution (pie/donut chart) | P0 |
| FR-08.3 | Daily/weekly/monthly ticket trends (line chart) | P1 |
| FR-08.4 | Revenue breakdown by period (bar chart) | P1 |
| FR-08.5 | Technician performance table (resolved count, avg time) | P1 |
| FR-08.6 | Top complaint categories | P2 |
| FR-08.7 | Date range filter for all reports | P1 |
| FR-08.8 | Export report data as CSV | P2 |

### FR-09: Notifications
| ID | Requirement | Priority |
|----|------------|----------|
| FR-09.1 | Send email notification on ticket status change | P0 |
| FR-09.2 | Send email with invoice details when generated | P1 |
| FR-09.3 | Log all sent notifications with delivery status | P0 |
| FR-09.4 | SMS notification support (stub/ready for Twilio) | P2 |

### FR-10: Low-Stock Alerts
| ID | Requirement | Priority |
|----|------------|----------|
| FR-10.1 | Display low-stock parts on dashboard | P0 |
| FR-10.2 | Highlight parts where quantity ≤ reorder level | P0 |
| FR-10.3 | Show count of low-stock items in sidebar badge | P2 |

---

## 6. Non-Functional Requirements

### NFR-01: Performance
| ID | Requirement |
|----|------------|
| NFR-01.1 | Page load time < 2 seconds on standard broadband |
| NFR-01.2 | API response time < 500ms for standard CRUD operations |
| NFR-01.3 | Dashboard data loads within 3 seconds |
| NFR-01.4 | Support up to 10 concurrent users (college project scope) |

### NFR-02: Security
| ID | Requirement |
|----|------------|
| NFR-02.1 | All passwords hashed with bcrypt (min 10 salt rounds) |
| NFR-02.2 | JWT tokens with 24-hour expiry |
| NFR-02.3 | Role-based access control on all API routes |
| NFR-02.4 | CORS restricted to frontend origin |
| NFR-02.5 | HTTP security headers via Helmet.js |
| NFR-02.6 | Input validation on all API endpoints |
| NFR-02.7 | SQL injection protection via Sequelize ORM (parameterized queries) |

### NFR-03: Usability
| ID | Requirement |
|----|------------|
| NFR-03.1 | Samsung-inspired UI theme (blue #1428A0 & white color scheme) |
| NFR-03.2 | Responsive design — works on desktop and tablet |
| NFR-03.3 | Intuitive navigation via sidebar |
| NFR-03.4 | Toast notifications for user actions (success/error) |
| NFR-03.5 | Form validation with clear error messages |
| NFR-03.6 | Loading states and empty states for all data views |

### NFR-04: Reliability
| ID | Requirement |
|----|------------|
| NFR-04.1 | Global error handler prevents server crashes |
| NFR-04.2 | Database transaction support for multi-step operations |
| NFR-04.3 | Graceful handling of network failures on frontend |

### NFR-05: Maintainability
| ID | Requirement |
|----|------------|
| NFR-05.1 | Modular project structure (MVC pattern on backend) |
| NFR-05.2 | Reusable UI components (DataTable, Modal, StatusBadge) |
| NFR-05.3 | Environment-based configuration via .env files |
| NFR-05.4 | Comprehensive README with setup instructions |

---

## 7. Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React 18 | Component-based, large ecosystem, industry standard |
| **Styling** | Tailwind CSS | Utility-first, fast development, highly customizable |
| **Charts** | Recharts | React-native charting, simple API, good looking defaults |
| **Icons** | React Icons | Comprehensive icon library (includes Samsung-style icons) |
| **Routing** | React Router v6 | Standard React routing solution |
| **HTTP Client** | Axios | Promise-based, interceptors for auth tokens |
| **Toasts** | React Hot Toast | Lightweight, customizable notifications |
| **Backend** | Node.js + Express | JavaScript full-stack, fast development, large ecosystem |
| **ORM** | Sequelize | Mature ORM, supports PostgreSQL, model associations |
| **Database** | PostgreSQL | Relational, ACID-compliant, complex query support |
| **Auth** | JWT + bcrypt | Stateless authentication, industry standard |
| **Email** | Nodemailer | Simple email sending, supports SMTP providers |
| **Validation** | express-validator | Request validation middleware |
| **Security** | Helmet + CORS | HTTP security headers + cross-origin control |
| **Dev Tools** | Nodemon | Auto-restart on code changes |

---

## 8. Database Schema Summary

| Table | Key Fields | Relationships |
|-------|-----------|---------------|
| `users` | id, name, email, password_hash, role, is_active | → has many service_tickets (as technician) |
| `customers` | id, name, phone, email, address | → has many devices, tickets, invoices, notifications |
| `devices` | id, customer_id, brand, model, serial_number, warranty_expiry | → belongs to customer, has many tickets |
| `service_tickets` | id, ticket_number, customer_id, device_id, technician_id, status, priority | → belongs to customer, device, user; has many ticket_parts, notifications; has one invoice |
| `spare_parts` | id, part_name, part_number, quantity_in_stock, unit_price, reorder_level | → has many ticket_parts |
| `ticket_parts` | id, ticket_id, part_id, quantity_used, price_charged | → belongs to ticket and spare_part (junction table) |
| `invoices` | id, invoice_number, ticket_id, customer_id, total_amount, payment_status | → belongs to ticket and customer |
| `notifications` | id, ticket_id, customer_id, type, status, sent_at | → belongs to ticket and customer |

---

## 9. API Endpoints Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/login` | Login with email & password | Public |
| POST | `/register` | Create new user account | Admin |
| GET | `/me` | Get current user profile | Authenticated |
| PUT | `/change-password` | Change own password | Authenticated |

### Customers (`/api/customers`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all customers (with search & pagination) | Admin, Receptionist |
| GET | `/:id` | Get customer details with devices & history | Admin, Receptionist |
| POST | `/` | Create new customer | Admin, Receptionist |
| PUT | `/:id` | Update customer details | Admin, Receptionist |
| DELETE | `/:id` | Soft-delete customer | Admin |

### Service Tickets (`/api/tickets`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List tickets (filterable by status, priority, technician, date) | All roles |
| GET | `/:id` | Get ticket details with parts, notes, timeline | All roles |
| POST | `/` | Create new service ticket | Admin, Receptionist |
| PUT | `/:id` | Update ticket details | Admin, Receptionist |
| PATCH | `/:id/status` | Change ticket status | All roles (technician: assigned only) |
| PATCH | `/:id/assign` | Assign technician to ticket | Admin, Receptionist |
| POST | `/:id/parts` | Add spare part to ticket | Admin, Technician |
| DELETE | `/:id/parts/:partId` | Remove spare part from ticket | Admin, Technician |
| GET | `/stats` | Get ticket statistics | Admin |

### Technicians (`/api/technicians`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all technicians with workload | Admin, Receptionist |
| GET | `/:id/workload` | Get technician's active tickets | Admin, Receptionist |
| GET | `/available` | Get available technicians | Admin, Receptionist |

### Inventory (`/api/inventory`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all spare parts (with search) | All roles |
| POST | `/` | Add new spare part | Admin |
| PUT | `/:id` | Update spare part details | Admin |
| GET | `/low-stock` | Get parts below reorder level | Admin, Receptionist |
| PATCH | `/:id/restock` | Restock a spare part | Admin |

### Billing (`/api/billing`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all invoices | Admin, Receptionist |
| POST | `/generate` | Generate invoice from ticket | Admin, Receptionist |
| PATCH | `/:id/pay` | Mark invoice as paid | Admin, Receptionist |
| GET | `/:id` | Get invoice details | All roles |

### Reports (`/api/reports`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard-stats` | Get dashboard summary stats | Admin |
| GET | `/ticket-trends` | Get ticket trend data by period | Admin |
| GET | `/revenue` | Get revenue data by period | Admin |
| GET | `/technician-performance` | Get technician performance metrics | Admin |

---

## 10. UI/UX Design Guidelines

### 10.1 Color Palette (Samsung-Inspired)

| Color | Hex Code | Usage |
|-------|---------|-------|
| Samsung Blue (Primary) | `#1428A0` | Sidebar, buttons, headers, links |
| Blue Light | `#4285F4` | Hover states, secondary actions |
| Blue Dark | `#0D1B6F` | Sidebar dark shade, active states |
| White | `#FFFFFF` | Background, cards, text on dark |
| Gray 50 | `#F8F9FA` | Page background |
| Gray 100 | `#E9ECEF` | Card borders, dividers |
| Gray 600 | `#6C757D` | Secondary text |
| Gray 900 | `#212529` | Primary text |
| Success Green | `#28A745` | Ready status, success messages |
| Warning Yellow | `#FFC107` | Waiting status, warnings |
| Danger Red | `#DC3545` | Errors, urgent priority |
| Info Blue | `#17A2B8` | Information badges |

### 10.2 Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header (Logo, Search, Notifications, User Profile)         │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│  Sidebar │            Main Content Area                      │
│          │                                                   │
│  • Dash  │   ┌─────────────────────────────────────────┐    │
│  • Cust  │   │  Page Title + Breadcrumb + Actions      │    │
│  • Tick  │   ├─────────────────────────────────────────┤    │
│  • Tech  │   │                                         │    │
│  • Inv   │   │         Content / Tables / Forms        │    │
│  • Bill  │   │                                         │    │
│  • Rep   │   │                                         │    │
│  • Set   │   └─────────────────────────────────────────┘    │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### 10.3 Key UI Components
- **DataTable** — Sortable, searchable, paginated table for all list views
- **StatusBadge** — Color-coded pill for ticket status
- **StatsCard** — Dashboard summary card with icon, value, label, and trend
- **Modal** — Reusable modal for forms and confirmations
- **Toast** — Success/error notifications (top-right)
- **LoadingSpinner** — Consistent loading indicator
- **EmptyState** — Friendly message when no data exists

---

## 11. Sample User Workflows

### 11.1 New Customer Walk-in (Receptionist)
```
1. Customer arrives with a faulty Samsung Galaxy S24
2. Receptionist searches by phone number → customer not found
3. Receptionist clicks "New Customer" → fills name, phone, email, address
4. Receptionist clicks "Add Device" → selects brand (Samsung), model (Galaxy S24),
   enters serial number, purchase date
5. System auto-calculates warranty status (1 year from purchase date)
6. Receptionist clicks "Create Ticket" → enters complaint: "Screen flickering"
7. System generates ticket number: SVC-20260903-001
8. Receptionist assigns available technician from dropdown
9. Customer receives email: "Your device has been received at service center"
10. Receptionist provides ticket number to customer for tracking
```

### 11.2 Device Repair (Technician)
```
1. Technician logs in → sees dashboard with assigned tickets
2. Clicks on ticket SVC-20260903-001
3. Changes status to "Diagnosing"
4. Customer receives email: "Our technician is diagnosing your device"
5. Technician adds diagnosis notes: "Display connector loose, AMOLED panel damaged"
6. Technician checks inventory → AMOLED panel in stock
7. Changes status to "Repairing"
8. Adds parts used: AMOLED Panel (1x ₹8,500)
9. Adds repair notes: "Replaced AMOLED panel, reconnected display connector"
10. Changes status to "Ready"
11. Customer receives email: "Your device is ready for pickup!"
```

### 11.3 Billing & Delivery (Receptionist)
```
1. Customer arrives for pickup
2. Receptionist searches ticket SVC-20260903-001
3. Clicks "Generate Invoice"
4. System auto-fills: Parts (₹8,500) + Labor (₹500) + GST (₹1,620) = ₹10,620
5. Receptionist applies warranty discount if applicable
6. Customer pays via UPI → Receptionist marks "Paid"
7. Invoice generated: INV-20260903-001
8. Receptionist changes ticket status to "Delivered"
9. Customer receives email with invoice and thank-you message
```

---

## 12. Data Seeding (Demo Data)

For portfolio demonstration, the system will include a seed script with:

| Entity | Sample Count | Examples |
|--------|-------------|----------|
| Users | 3 | Admin, Technician (Rahul), Receptionist (Priya) |
| Customers | 10 | Mix of names with realistic Indian phone numbers |
| Devices | 15 | Samsung Galaxy S24, Galaxy Tab S9, 55" QLED TV, Front-Load Washer |
| Service Tickets | 20 | Spread across all 7 statuses |
| Spare Parts | 30 | AMOLED Screen, Battery, Charging Port, Motherboard, etc. |
| Invoices | 5 | Mix of paid and pending |
| Notifications | 15 | Email logs with sent/pending status |

**Default Login Credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@scms.com` | `password123` |
| Technician | `technician@scms.com` | `password123` |
| Receptionist | `receptionist@scms.com` | `password123` |

---

## 13. Out of Scope (v1.0)

The following features are intentionally excluded from v1.0 but can be added in future versions:

| Feature | Reason |
|---------|--------|
| Customer self-service portal | Not needed for college project |
| Real SMS notifications (Twilio) | Requires paid account; email is sufficient |
| Multi-branch support | Single service center is sufficient |
| Barcode/QR scanning | Requires hardware integration |
| File uploads (photos of damaged devices) | Adds complexity; can be added later |
| Multi-language support (i18n) | English only for v1.0 |
| Audit trail / change log | Nice-to-have for v2.0 |
| Mobile app (React Native) | Web app is responsive enough |
| Payment gateway integration | Manual payment recording is sufficient |
| Advanced reporting (PDF export) | CSV export is sufficient for v1.0 |

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PostgreSQL installation issues | Medium | High | Provide SQLite fallback option |
| Email delivery failures | Low | Medium | Use reliable SMTP (Gmail/Mailtrap), log all attempts |
| Large dataset performance | Low | Low | Pagination on all list APIs, database indexing |
| JWT token stolen | Low | High | Short expiry (24h), HTTPS in production |
| CORS misconfiguration | Medium | Medium | Strict origin whitelist in production |

---

## 15. Implementation Phases

| Phase | Description | Deliverables |
|-------|-------------|-------------|
| **Phase 1** | Project setup + database | Initialized repos, DB schema, Sequelize models, associations |
| **Phase 2** | Authentication | Login/register API, JWT middleware, role guards |
| **Phase 3** | Core backend APIs | All 7 controllers with CRUD routes, validation, error handling |
| **Phase 4** | Frontend foundation | React app, routing, layout, auth context, login page |
| **Phase 5** | Frontend pages | Dashboard, customers, tickets, technicians, inventory, billing |
| **Phase 6** | Reports + Notifications | Charts, analytics, email service, seed data |
| **Phase 7** | Testing + Polish | End-to-end testing, bug fixes, README, demo prep |

---

## 16. Appendix

### A. Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scms_db
DB_USER=postgres
DB_PASSWORD=your-db-password

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
FROM_EMAIL=noreply@scms.com

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

### B. Ticket Number Format
```
SVC-YYYYMMDD-NNN
│    │         │
│    │         └── Sequential number (resets daily), zero-padded to 3 digits
│    └──────────── Date of ticket creation
└────────────────── Prefix indicating "Service"

Example: SVC-20260903-001, SVC-20260903-002
```

### C. Invoice Number Format
```
INV-YYYYMMDD-NNN
│    │         │
│    │         └── Sequential number (resets daily), zero-padded to 3 digits
│    └──────────── Date of invoice generation
└────────────────── Prefix indicating "Invoice"

Example: INV-20260903-001
```

---

> **Document Version History**
>
> | Version | Date | Author | Changes |
> |---------|------|--------|---------|
> | 1.0 | 2026-09-03 | Sharoz | Initial PRD created |
