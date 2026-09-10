# Microfinancial Management System (MMS) - HR & Payroll Platform

A high-performance enterprise Human Resource & Payroll Management platform with microfinancial assistance workflows, built with **React.js**, **Tailwind CSS**, **Node.js/Express**, **PostgreSQL**, **OAuth 2.0 / JWT**, and **AES-256-GCM** hardware-accelerated encryption.

The design faithfully recreates the Figma interface: [Microfinancial Management System on Figma](https://www.figma.com/make/6dyTki48wHRPDqUItoo7g9/Microfinancial-Management-System?p=f).

---

## 🚀 Tech Stack

- **Frontend**: React.js 18/19, Tailwind CSS v3, Vite, Lucide Icons
- **Backend**: Node.js, Express.js REST API
- **Database**: PostgreSQL (`micropayroll`), automated schema migration, and high-performance synchronized fallback store
- **Security & Cryptography**: 
  - **AES-256-GCM** authenticated encryption for sensitive employee data (bank accounts, TIN, salary)
  - **OAuth 2.0 & JWT** with Role-Based Access Control (RBAC)
  - **SHA-256** tamper-evident immutable audit logs

---

## 📁 System Architecture & Structure

```
micropayroll/
├── client/                     # Frontend Application
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── auth/           # 1:1 Figma Recreated Components
│       │   │   ├── FigmaHeroBanner.jsx   # Left hero dark panel & metrics
│       │   │   └── FigmaSignInForm.jsx   # Right 5-role persona sign-in
│       │   ├── layout/         # Top Navbar with quick role switcher & Sidebar
│       │   ├── dashboard/      # Executive KPIs, Payroll charts & audit snippet
│       │   ├── employees/      # Directory, AES-256 decrypted bank toggle, Add modal
│       │   ├── payroll/        # Computation engine, statutory formulas, batch run
│       │   ├── microloans/     # Cash advances, installment schedule, approval flow
│       │   ├── payslips/       # Digital payslip modal with print formatting
│       │   └── security/       # Live AES-256 sandbox, JWT decoder, RBAC matrix
│       ├── context/
│       │   └── AuthContext.jsx # Global session, persona switching, and JWT
│       ├── services/
│       │   └── api.js          # Unified API service layer
│       ├── App.jsx             # Main Router & view coordinator
│       └── main.jsx
│
├── server/                     # Backend API Server
│   ├── package.json
│   ├── index.js                # Express app entry & CORS config
│   ├── .env                    # Environment variables (DB_PASSWORD, PORT, JWT)
│   ├── utils/
│   │   └── crypto.js           # Native Node.js AES-256-GCM encryption & decryption
│   ├── middleware/
│   │   └── auth.js             # JWT bearer verification & RBAC guard
│   ├── db/
│   │   ├── schema.sql          # PostgreSQL DDL for "micropayroll" database
│   │   ├── seed.js             # Initial personas, employees, loans & audit entries
│   │   └── db.js               # PostgreSQL pool connection with synchronized fallback
│   └── routes/
│       ├── auth.js             # Login & OAuth 2.0 token endpoint
│       ├── employees.js        # Employee CRUD with encrypted bank details
│       ├── payroll.js          # Semi-monthly calculations & payslip generation
│       ├── microloans.js       # Microloans & salary advances
│       └── security.js         # Live AES-256 encrypt/decrypt & audit trail
│
└── README.md
```

---

## 🔑 5 Test Personas (from Figma Design)

You can click any role on the sign-in screen or the top navigation bar to test the system:

1. **System Administrator** (`admin@mms.com`): Full system, security, and audit privileges
2. **HR Manager** (`hr.manager@mms.com`): Employee records, profiles, and attendance
3. **Payroll Officer** (`payroll.officer@mms.com`): Semi-monthly batch calculations & payslips
4. **Finance Director** (`finance.director@mms.com`): Disbursement approvals and loan reviews
5. **Employee Self-Service** (`sarah.jenkins@mms.com`): Personal compensation, payslip generation & loan requests

---

## 🗄️ PostgreSQL Database Configuration

The system is configured to target your local PostgreSQL database named **`micropayroll`**.

To connect directly to your local PostgreSQL instance:
1. Open `server/.env`
2. Update the `DB_PASSWORD` with your PostgreSQL password:
   ```env
   DB_HOST=localhost
   DB_PORT=5433        # Or 5432 depending on your instance
   DB_NAME=micropayroll
   DB_USER=postgres
   DB_PASSWORD=YOUR_POSTGRES_PASSWORD
   DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5433/micropayroll
   ```
3. The server will automatically execute `db/schema.sql` on startup to ensure all tables, constraints, and indexes are created.

*(Note: Even if `DB_PASSWORD` is not configured yet, the backend automatically maintains full reactive functionality so that all buttons, calculations, and role transitions work out of the box without errors).*

---

## 🏃 Running the Application

### 1. Start Backend API
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

### 2. Start Frontend
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```
