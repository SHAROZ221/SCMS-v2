# What’s This Whole Project About? 🛠️📱
*(A casual, no-BS guide to the Service Center Management System)*

---

Hey! If you’ve ever wondered what this repository actually does without wanting to dig through 600 lines of formal PRDs or corporate tech architecture docs, you're in the right place. 

Here is the quick breakdown of **what it does**, **how it pulls it off**, and **why it had to exist in the first place**.

---

## 1. What does this thing actually do? 🤔

In short: **It’s an all-in-one digital operating system for electronics repair shops (specifically styled around a Samsung Customer Care center).**

Think about what happens when your phone screen cracks and you walk into an authorized service center:
1. You hand your phone over to the receptionist.
2. They give you a paper job sheet.
3. The technician in the back opens the phone, scratches their head, replaces the screen.
4. You call them 5 times asking, *"Is my phone ready yet?"*
5. You pay, get a bill, and leave.

**SCMS takes that entire messy, real-world lifecycle and digitizes it from start to finish:**

- 📝 **Intake & Warranty Check:** The front desk receptionist types in the device model and serial/IMEI number. The system instantly figures out: *"Is this still under Samsung warranty or is the customer paying out of pocket?"*
- 🎫 **Smart Service Tickets:** Automatically gives the job a clean tracking ID (like `SVC-20261110-001`) and sends it to the technician queue.
- 🔄 **Repair Pipeline (Step-by-Step):** Tickets move smoothly through real statuses:
  `Received` ➔ `Diagnosing` ➔ `Waiting for Parts` ➔ `Repairing` ➔ `Ready for Pickup` ➔ `Delivered` *(no skipping steps or losing track!)*.
- 📦 **Live Spare Parts Inventory:** When a technician adds a replacement screen or battery to a ticket, the system automatically subtracts 1 from the stock room inventory. If there are 0 left, it won't let them assign it.
- 🧾 **One-Click Billing & Invoicing:** It tallies up:
  $$\text{Parts} + \text{Labor} + \text{18% GST} - \text{Discounts}$$
  Then it spits out a legit, printable Samsung-branded invoice/receipt.
- 📊 **Boss Dashboard:** The service center manager gets live analytics—how many phones were fixed today, revenue collected (UPI vs Cash vs Card), and which technician is crushing it.

---

## 2. How does it do it? (Under the Hood) ⚙️💻

We built it as a clean, snappy full-stack web app. No over-engineered fluff, just battle-tested tech that works together seamlessly:

### The Front-End (What you see & click)
- **React 18 + Vite:** Fast, modern single-page application.
- **Tailwind CSS:** Styled with Samsung's official blue-and-white enterprise theme (`#1428A0`). Clean, readable, and feels like real corporate software.
- **Lucide Icons & Recharts:** Sleek interactive graphs, status badges, and slick UI components.
- **Role-Based UI:** What you see depends on who you are:
  - *Front Desk Receptionist* sees intake forms & billing.
  - *Service Technician* sees their assigned repair queue, diagnostic note inputs, and spare parts picker.
  - *Admin / Manager* sees the whole kingdom: revenue charts, staff accounts, inventory reorder alerts, and audit logs.

### The Back-End (The brain)
- **Node.js & Express:** REST API handling authentication, ticket transitions, parts calculations, and receipt generation.
- **Sequelize ORM:** Talks to the database with clean models (`Customer`, `Device`, `Ticket`, `Part`, `Invoice`, `User`).
- **SQLite (Zero Setup) / PostgreSQL ready:** Out of the box, it runs off a local SQLite database file (`database.sqlite`). You don't even need to install or configure a database server to test it. Want to scale up? Just flip an `.env` switch to PostgreSQL.
- **JWT Authentication:** Secure role-based access tokens with pre-seeded demo accounts for 1-click testing.

---

## 3. Why did we need to make this? 💡🔥

### The Real Backstory:
This project wasn't dreamed up out of thin air for a generic school assignment. It was inspired by real, hands-on experience during an internship at a **Samsung Customer Care Service Center**. 

Working there revealed how chaotic daily repair operations can get when people rely on outdated tools:

| The Real-World Nightmare 😫 | How SCMS Solves It 😎 |
|---|---|
| **Piles of paper registers & sticky notes:** Coffee gets spilled, physical papers rip, and searching for an old repair from last week takes 15 minutes of flipping pages. | **Everything is in one searchable database:** Search by customer phone number, IMEI, or ticket number in 2 seconds. |
| **"Bhaiya, phone kab milega?" (Endless calls):** Customers constantly call asking for updates because nobody knows what stage the phone is at without yelling across the room to the technician. | **Real-time status tracking:** Front desk can see immediately if a phone is waiting on parts, on the workbench, or tested and ready. |
| **Parts phantom stock:** A technician takes a customer's phone apart assuming there's an AMOLED display in the drawer, only to discover the drawer is empty. | **Live stock guardrails:** Inventory counts drop the second a part is claimed, with automatic low-stock warnings for managers. |
| **Billing math mistakes:** Manual hand-written receipts where someone forgot the 18% GST or miscalculated labor discounts. | **Automated bulletproof math:** Instant GST computation and standardized, printable thermal/A4 invoices. |
| **No visibility for owners:** Store managers had no clue which devices took the longest to repair or which tech handled the most volume. | **Analytics dashboard:** Turnaround times (TAT), daily intake vs resolution curves, and payment breakdown charts. |

---

## TL;DR 🚀

We made this because running an electronics service center on paper registers, memory, and WhatsApp messages is stressful and messy. 

**SCMS turns that chaos into a smooth, professional, 3-role web platform** where phones come in, get tracked, get fixed with the right parts, get billed properly, and get handed back to happy customers.
