# 🏠 MortgageIQ — Full-Stack MERN with Role-Based Access Control

A production-ready mortgage calculator built with **Next.js 14**, **MongoDB/Mongoose**, **JWT authentication**, and a complete **RBAC permission system**.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit MONGODB_URI and JWT secrets

# 3. Seed database (creates roles, permissions, and admin user)
npm run seed

# 4. Start development server
npm run dev
# → http://localhost:3000
```

**Default admin credentials (after seed):**
```
Email:    admin@mortgageiq.com
Password: Admin@1234
```

---

## 👥 Roles & Permissions

| Role | Description | Key Permissions |
|---|---|---|
| **Super Admin** | Full system access | All permissions incl. role management |
| **Admin** | Manage users & config | All except role management |
| **Loan Officer** | Full calculator access | Calculate, history, compare, export PDF |
| **Viewer** | Read-only calculator | View & calculate only |
| **Guest** | Basic access | View calculator (no history/export) |

### Permission Groups

| Group | Permissions |
|---|---|
| Calculator | `calculator:view`, `calculator:calculate`, `calculator:export_pdf` |
| Loan Terms | `loan_terms:view/create/edit/delete` |
| Custom Fields | `fields:view/create/edit/delete` |
| History | `history:view_own`, `history:view_all`, `history:delete_own/all` |
| Pages | `compare:view`, `dashboard:view`, `analytics:view_own/all` |
| Users | `users:view/create/edit/delete/assign_roles` |
| Roles | `roles:view/create/edit/delete` |
| Audit | `audit:view` |

---

## 🏗️ Architecture

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js          POST — login, issue JWT cookies
│   │   │   ├── register/route.js       POST — register new user
│   │   │   ├── logout/route.js         POST — revoke session
│   │   │   ├── me/route.js             GET  — current user info
│   │   │   └── refresh/route.js        POST — refresh access token
│   │   ├── users/
│   │   │   ├── route.js                GET/POST/PUT/DELETE — users list & bulk ops
│   │   │   └── [id]/route.js           GET/PUT/DELETE — individual user
│   │   ├── roles/
│   │   │   ├── route.js                GET/POST/PUT/DELETE — roles CRUD
│   │   │   └── [id]/route.js           GET/PUT/DELETE — individual role
│   │   ├── audit-logs/route.js         GET — audit log with filters
│   │   ├── admin/route.js              GET — admin stats dashboard
│   │   ├── calculate/route.js          POST — mortgage calculation
│   │   ├── loan-terms/route.js         CRUD — loan term management
│   │   ├── fields/route.js             CRUD — custom field management
│   │   ├── history/route.js            CRUD — calculation history
│   │   └── reports/route.js            POST — PDF report data
│   ├── admin/
│   │   ├── layout.js                   Admin sidebar layout + auth guard
│   │   ├── page.js                     Overview with charts & stats
│   │   ├── users/page.js               User management (CRUD table)
│   │   ├── roles/page.js               Role & permission editor
│   │   └── audit-logs/page.js          Audit log viewer with filters
│   ├── login/page.js                   Login form
│   ├── register/page.js                Registration with password strength
│   ├── profile/page.js                 User profile & permission viewer
│   ├── unauthorized/page.js            403 page
│   ├── compare/page.js                 Multi-scenario comparison
│   └── dashboard/page.js              Analytics dashboard
│
├── components/
│   ├── auth/
│   │   ├── AuthContext.js              React context (user, can, hasRole, login, logout)
│   │   └── PermissionGate.js           <PermissionGate permission="x"> wrapper
│   ├── NavBar.js                       Top nav with role badge, permission-aware links
│   ├── LoanInputPanel.js               Calculator sidebar
│   ├── ResultsPanel.js                 Stat cards
│   ├── SummaryGrid.js                  All-terms grid
│   ├── ChartsSection.js                Recharts visualizations
│   ├── ComparisonTable.js              Data table
│   ├── AmortizationTable.js            Full schedule
│   ├── AffordabilityWidget.js          DTI analysis
│   ├── HistoryPanel.js                 Saved calculations
│   ├── ManageFieldsModal.js            Custom fields CRUD
│   ├── ManageLoanTermsModal.js         Loan terms CRUD
│   └── PDFExportButton.js              jsPDF export
│
├── lib/
│   ├── auth.js         JWT sign/verify, cookie builders (custom HS256, no dependency)
│   ├── rbac.js         requireAuth, requirePermission, requireRole, logAudit
│   ├── db.js           Mongoose connection with caching
│   ├── mortgage.js     Calculation engine
│   └── middleware.js   Input validation helpers
│
├── models/
│   ├── auth.js         Role, User, AuditLog, Session schemas
│   └── index.js        CustomField, LoanTerm, CalculationHistory, AppSettings
│
├── middleware.js        Next.js edge middleware (route protection + JWT headers)
├── scripts/seed.js     Database seeding
└── .env.local.example  Environment variable template
```

---

## 🔐 Security Features

- **HTTP-only cookies** for JWT tokens (XSS protection)
- **Access token**: 15-minute expiry
- **Refresh token**: 7-day expiry, stored hashed in DB
- **Custom HS256 JWT** implementation (no external JWT library)
- **PBKDF2 password hashing** (100,000 iterations, SHA-512)
- **Audit logging** for all auth and admin actions
- **Session management** with revocation support
- **Middleware guards** on both pages and API routes
- **Self-protection**: users cannot delete/deactivate themselves

---

## 🌐 API Reference

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT cookies |
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/logout` | User | Revoke session |
| GET | `/api/auth/me` | User | Current user info |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |

### Users (requires `users:*` permissions)
| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/users` | `users:view` | List users (paginated, searchable) |
| POST | `/api/users` | `users:create` | Create user |
| PUT | `/api/users/[id]` | `users:edit` | Update user |
| DELETE | `/api/users/[id]` | `users:delete` | Delete user |

### Roles (requires `roles:*` permissions)
| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/roles` | `roles:view` | List all roles with user counts |
| POST | `/api/roles` | `roles:create` | Create custom role |
| PUT | `/api/roles` | `roles:edit` | Update role permissions |
| DELETE | `/api/roles?id=` | `roles:delete` | Delete role (if no users) |

### Admin
| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/api/admin` | `users:view` | System stats, activity charts |
| GET | `/api/audit-logs` | `audit:view` | Audit log with filters |

---

## 🛠️ Production Checklist

- [ ] Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (64+ bytes)
- [ ] Use MongoDB Atlas or a secured MongoDB instance
- [ ] Change the seed admin password immediately after deployment
- [ ] Set `NODE_ENV=production` (enables Secure cookie flag)
- [ ] Configure CORS if using a separate frontend
- [ ] Set up MongoDB indexes (auto-created by Mongoose on first run)

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Database | MongoDB + Mongoose |
| Auth | Custom JWT (HS256) + HTTP-only cookies |
| Password | PBKDF2 (100k iterations, SHA-512) |
| Charts | Recharts |
| Styling | Tailwind CSS |
| PDF | jsPDF + autoTable |
| Fonts | Syne + DM Sans (Google Fonts) |
| Notifications | react-hot-toast |
| Date utilities | date-fns |
