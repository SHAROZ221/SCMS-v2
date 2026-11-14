# SCMS Tech Stack & Architecture Guide 🛠️⚡
*Service Center Management System (Samsung Customer Care Operations Platform)*

---

## 1. Executive Overview

The **Service Center Management System (SCMS)** is built on a modern, decoupled **Client-Server Architecture** designed for high responsiveness, zero-friction local development, and enterprise-grade reliability. 

Inspired by real-world service workflows at Samsung Customer Care, the system handles end-to-end device lifecycle management—from walk-in customer intake and automated warranty calculations to technician repair pipelines, inventory deduction, and GST-compliant invoicing.

```
┌────────────────────────────────────────────────────────┐
│                   Frontend Client                      │
│        React 19 • Vite • Tailwind CSS • Recharts       │
└───────────────────────────▲────────────────────────────┘
                            │ REST APIs / JSON (Axios + JWT)
┌───────────────────────────▼────────────────────────────┐
│                  Backend Application                   │
│        Node.js • Express.js • Sequelize ORM • JWT      │
└───────────────────────────▲────────────────────────────┘
                            │ ORM Abstraction Layer
┌───────────────────────────▼────────────────────────────┐
│                    Database Layer                      │
│      SQLite (Zero-Config Dev) / PostgreSQL (Production)│
└────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack at a Glance

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | [React](https://react.dev/) | `^19.2.8` | Component-based interactive UI |
| **Build Tool & Bundler** | [Vite](https://vitejs.dev/) | `^8.2.2` | Lightning-fast development & optimized bundling |
| **Routing** | [React Router DOM](https://reactrouter.com/) | `^7.18.3` | Client-side routing with role-based route guards |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^3.4.19` | Utility-first responsive design & Samsung Care design system |
| **Icons** | [Lucide React](https://lucide.dev/) | `^1.40.0` | Consistent enterprise icon suite |
| **Charts & Analytics** | [Recharts](https://recharts.org/) | `^3.10.1` | Declarative KPI & operations data visualization |
| **Notifications** | [React Hot Toast](https://react-hot-toast.com/) | `^2.6.0` | Non-blocking user feedback & toast alerts |
| **HTTP Client** | [Axios](https://axios-http.com/) | `^1.20.0` | Promise-based HTTP client with request/response interceptors |
| **Linter** | [Oxlint](https://oxc.rs/) | `^1.79.0` | High-performance JavaScript/JSX linter |
| **Backend Runtime** | [Node.js](https://nodejs.org/) | `>= 18.x` | High-throughput asynchronous event-driven I/O |
| **Web Server Framework**| [Express.js](https://expressjs.com/) | `^4.19.2` | RESTful API routing, middleware, and request handling |
| **ORM / Data Layer** | [Sequelize](https://sequelize.org/) | `^6.37.3` | Object-Relational Mapping, migrations, and model associations |
| **Development Database**| [SQLite3](https://sqlite.org/) | `^5.1.7` | Zero-configuration single-file database for instant setup |
| **Production Database** | [PostgreSQL](https://www.postgresql.org/) | `^8.11.5` (`pg`) | Relational ACID database for concurrent enterprise workloads |
| **Authentication** | [JSON Web Tokens](https://jwt.io/) | `^9.0.2` | Stateless bearer token authorization with RBAC |
| **Password Security** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | `^2.4.3` | Cryptographic salted hashing (10 salt rounds) |
| **API Security** | [Helmet](https://helmetjs.github.io/) & [CORS](https://expressjs.com/en/resources/middleware/cors.html) | `^7.1.0` / `^2.8.5` | HTTP security header hardening & cross-origin protection |
| **Email Service** | [Nodemailer](https://nodemailer.com/) | `^6.9.13` | Automated transactional status emails for customers |

---

## 3. Frontend Architecture: What We Use & Why

### ⚛️ React 19
- **What it is:** The premier declarative, component-driven UI library.
- **Why we chose it:**
  - **Predictable State Management:** Modern React hooks (`useState`, `useEffect`, `useContext`, `useMemo`) make it easy to manage intricate UI state across multi-step repair workflows and customer intake forms.
  - **Component Reusability:** Core enterprise UI components (such as `DataTable`, `StatusBadge`, `PriorityBadge`, `Modal`, and `StatsCard`) are written once and reused across Receptionist, Technician, and Admin views.
  - **Ecosystem Maturity:** Unmatched library compatibility for enterprise dashboards, charts, and table interactions.

### ⚡ Vite 8
- **What it is:** Next-generation frontend tooling powered by native ES modules.
- **Why we chose it:**
  - **Sub-Second HMR (Hot Module Replacement):** Near-instant browser feedback during frontend code edits, replacing slower legacy bundlers like Webpack.
  - **Optimized Production Builds:** Rolldown/Rollup-driven tree-shaking and asset minification that produces compact static assets.

### 🎨 Tailwind CSS
- **What it is:** A utility-first CSS framework.
- **Why we chose it:**
  - **Samsung Care Design Language:** Easily implements Samsung's signature deep cobalt blue palette (`#1428A0`), subtle slate borders, clean status indicators, and professional typography.
  - **Zero Unused CSS in Production:** Purges unreferenced classes at build time, keeping the final bundle small.
  - **Responsive Layouts:** Built-in breakpoint utilities make it effortless to ensure receptionists on tablets or managers on wide desktop monitors get an optimized experience.

### 🛣️ React Router DOM v7
- **What it is:** Standard client-side routing library for React applications.
- **Why we chose it:**
  - **Declarative Route Guards (`ProtectedRoute`):** Enforces Role-Based Access Control (RBAC) on the client side. Technicians cannot stumble into administrative user management, and unauthorized users are instantly redirected to `/login`.
  - **Nested Layouts:** Employs an `AppLayout` wrapper containing the persistent sidebar, top navbar, and dynamic content viewports.

### 📊 Recharts & Lucide React
- **What they are:** Composable SVG charting library and crisp, tree-shakeable icon set.
- **Why we chose them:**
  - **Recharts:** Powers the Manager Dashboard with visual metrics (daily intake vs. delivery velocity, revenue breakdowns across UPI/Card/Cash, and parts usage distributions).
  - **Lucide Icons:** Provides clean, intuitive visual indicators across status badges, timeline steppers, and navigation menus.

### 🌐 Axios & React Hot Toast
- **What they are:** Feature-packed HTTP client and toast notification library.
- **Why we chose them:**
  - **Axios Interceptors:** Automatically attaches JWT tokens (`Authorization: Bearer <token>`) to all outgoing requests and catches 401 Unauthorized errors globally.
  - **React Hot Toast:** Delivers sleek, non-intrusive alerts for operations like ticket updates, parts stock-outs, and invoice generations without interrupting user workflow.

---

## 4. Backend Architecture: What We Use & Why

### 🟢 Node.js & Express.js
- **What they are:** Asynchronous JavaScript runtime paired with a minimalist web application framework.
- **Why we chose them:**
  - **Single Language Full-Stack:** Sharing JavaScript between frontend and backend simplifies JSON data contract modeling and developer context switching.
  - **Non-Blocking I/O:** Well-suited for handling concurrent API traffic from front-desk staff, active technicians, and automated background notifications simultaneously.
  - **Modular Middleware Pipeline:** Request processing flows cleanly through dedicated layers:
    `CORS` ➔ `Helmet` ➔ `JSON Body Parser` ➔ `JWT Authentication` ➔ `Role Authorization` ➔ `Validation` ➔ `Controller Action`.

### 🗄️ Sequelize ORM (Object-Relational Mapping)
- **What it is:** Feature-rich Node.js ORM supporting multiple SQL dialects.
- **Why we chose it:**
  - **Database Agnosticism:** Abstract models (`Customer`, `Device`, `ServiceTicket`, `SparePart`, `Invoice`, `User`, `TicketTimeline`) run seamlessly on SQLite during local development and PostgreSQL in staging/production without changing business logic.
  - **Relational Integrity & Associations:** Strictly defines relationships (`Customer hasMany Devices`, `Device hasMany ServiceTickets`, `ServiceTicket belongsToMany SparePart through TicketPart`).
  - **Built-in Seeding & Migrations:** Features an automated seeder (`npm run seed`) that pre-populates sample Samsung devices, inventory items, and test accounts.

### 💾 Dual Database Strategy: SQLite + PostgreSQL
- **What it is:** Hybrid persistence strategy combining SQLite for developer velocity with PostgreSQL for production scale.
- **Why we chose this strategy:**
  1. **SQLite (Development / Evaluation):**
     - Stored locally in a single file (`database.sqlite`).
     - Zero configuration required: developers or evaluators can run `npm run backend:dev` immediately without installing PostgreSQL, Docker, or managing database credentials.
  2. **PostgreSQL (Production Deployment):**
     - Production-ready ACID compliance, row-level locking, concurrent write operations, and robust connection pooling via the `pg` driver.
     - Switchable with a single environment variable (`DB_DIALECT=postgres`).

---

## 5. Security & Authentication Architecture

### 🔑 Stateless JWT Authentication
- **How it works:** Upon authentication via `/api/auth/login`, the server returns a signed JSON Web Token containing the user's ID, username, and role (`admin`, `receptionist`, `technician`).
- **Why we use it:**
  - **Stateless Scalability:** The server does not maintain server-side session stores or memory caches.
  - **Granular RBAC:** Middleware (`verifyToken`, `requireRole(['admin'])`) gates sensitive endpoints (e.g., inventory restocking, user provisioning, revenue reports).

### 🔒 Password Hashing with Bcrypt.js
- **How it works:** All stored passwords pass through an adaptive, one-way cryptographic hashing algorithm with 10 salt rounds.
- **Why we use it:**
  - Protects user credentials against rainbow table lookups and brute-force attacks even if the underlying database is compromised.

### 🛡️ Helmet & Express-Validator
- **Helmet:** Automatically sets HTTP security headers (prevents clickjacking via `X-Frame-Options`, disables MIME sniffing, enforces XSS filtering).
- **Express-Validator:** Validates and sanitizes incoming HTTP payloads before reaching database queries, preventing SQL injection and invalid state transitions.

---

## 6. Business Logic & Automation Features

| Module | Technical Implementation | Purpose |
|---|---|---|
| **Sequential Numbering** | `numberGenerator.js` | Formats standardized daily job identifiers (`SVC-YYYYMMDD-NNN`) and invoice numbers (`INV-YYYYMMDD-NNN`). |
| **Warranty Engine** | Date delta computation (`purchaseDate + warrantyMonths`) | Dynamically identifies whether repairs fall under Samsung factory warranty or require out-of-pocket customer billing. |
| **Inventory Guardrails** | Atomic Sequelize transaction | Decrements stock upon part allocation; rejects assignment if stock is 0; restores stock on part removal. |
| **Billing & GST Engine** | Strict financial formula | Automates `(Labor + Parts) + 18% GST - Discount` and outputs thermal/A4 printable receipts. |
| **Customer Notifications** | `Nodemailer` service | Dispatches automated transactional emails on status changes (`READY_FOR_PICKUP`, `DELIVERED`). |

---

## 7. Developer Tooling & Quality Assurance

- **Nodemon:** Monitors backend files and automatically restarts the server on file changes.
- **Oxlint:** Ultra-fast, Rust-powered linter that enforces clean React syntax and catches anti-patterns instantly.
- **Integrated Test Harness:** Lightweight Node.js test scripts (`test_auth.js`, `test_core_api.js`) to verify authentication barriers, token issuance, and ticket state transitions without heavy test framework overhead.

---

## 8. Summary: Why This Stack Fits SCMS

1. **Practical & Fast to Run:** Anyone can clone this repository, run `npm run seed`, and have a fully functional service center portal running in under 2 minutes.
2. **True Enterprise Flow:** Accurately mimics authorized service operations (role isolation, state machine transitions, GST invoicing, live inventory tracking).
3. **Production-Ready Modularity:** Clean separation between React frontend, Express API routes, Sequelize business models, and swappable SQL backends.
