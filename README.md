# Smart Campus Canteen

A production-grade, full-stack web application for smart campus canteen management, real-time food ordering, scheduled lunch pickup slot booking, digital QR food tokens, room delivery tracking, multi-branch stock transfers, food waste recording, and admin analytics.

Built with a crisp **White & Blue** design system.

---

## 🌟 Key Features

- **7 Role-Based User Access Levels**:
  - **Student**: Browse menu, search & filter food, scheduled lunch pickup booking, room delivery, digital QR tokens, order tracking, order again, review completed orders.
  - **Master's Student**: Master degree program student profile and ordering.
  - **Canteen Operator**: Counter token verification (QR scan/manual token entry), queue management, daily food waste logging.
  - **Kitchen Staff**: Real-time Kanban board (`NEW`, `PREPARING`, `READY`, `COMPLETED`) with 1-click status transitions.
  - **Delivery Staff**: Hostel room delivery task list, live delivery status progression (`Order received` -> `Preparing` -> `Out for delivery` -> `Delivered`).
  - **Branch Manager**: Inter-branch stock transfer requests, approvals, receiving, and inventory replenishment.
  - **Admin**: System-wide control center, Chart.js sales analytics, user role updates, emergency branch closure toggle.

- **Core Innovations**:
  1. **Scheduled Lunch Pickup Slots**: Atomic capacity reservation (`$expr: { $lt: ["$currentOrders", "$maxOrders"] }`) to prevent counter overbooking during lunch rush. Shows live slot capacity and "SLOT FULL" warnings.
  2. **Unique Digital Food Token**: Generates unique `CAN-2026-A7F92` token number and server-verified QR code upon checkout. Prevents duplicate verification.
  3. **Campus Room Delivery**: Delivery to specific buildings, floors, and rooms (e.g. Hostel A Room 203) with live status tracking.
  4. **Multi-Branch Inventory & Stock Transfers**: Stock transfer workflow between branches (`Requested` -> `Approved` -> `Dispatched` -> `Received`) with source & destination inventory synchronization.
  5. **Food Waste Management**: Daily logging of prepared, sold, remaining, and wasted food quantities with "Transfer Before Waste" suggestions.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (White & Blue modern theme), Vanilla JavaScript (Modular scripts), Chart.js.
- **Backend**: Node.js, Express.js, RESTful API architecture, JWT authentication, Bcryptjs password hashing, Helmet, CORS, Rate limiting.
- **Database**: MongoDB & Mongoose schemas with validation, indexes, and automatic `mongodb-memory-server` fallback.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- NPM

### 2. Installation
```bash
npm install
```

### 3. Seed Database
Populates 4 canteen branches, academic hierarchy, menu items, pickup slots, delivery locations, coupons, and demo accounts for all 7 roles:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open your browser and visit: **[http://localhost:3000](http://localhost:3000)**

### 5. Run Automated Test Suite
```bash
npm test
```

---

## 🔑 Demo Login Accounts (Password for all: `password123`)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@canteen.edu` | `password123` |
| **Kitchen Staff** | `kitchen@canteen.edu` | `password123` |
| **Canteen Operator** | `operator@canteen.edu` | `password123` |
| **Delivery Staff** | `delivery@canteen.edu` | `password123` |
| **Branch Manager** | `manager@canteen.edu` | `password123` |
| **Student** | `student@canteen.edu` | `password123` |
| **Master's Student** | `mstudent@canteen.edu` | `password123` |

*Note: The login page includes 1-click quick login buttons for all 7 roles.*

---

## 📁 Project Structure

```
smart-campus-canteen/
│
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── app.js
│   │   ├── menu.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── token.js
│   │   ├── orders.js
│   │   ├── admin.js
│   │   ├── kitchen.js
│   │   ├── operator.js
│   │   ├── delivery.js
│   │   └── manager.js
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── menu.html
│   ├── cart.html
│   ├── checkout.html
│   ├── orders.html
│   ├── token.html
│   ├── profile.html
│   ├── offers.html
│   ├── admin/index.html
│   ├── kitchen/index.html
│   ├── operator/index.html
│   ├── delivery/index.html
│   └── manager/index.html
│
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── scripts/
│   └── seed.js
│
├── tests/
│   └── api.test.js
│
├── .env.example
├── .env
├── package.json
└── README.md
```
