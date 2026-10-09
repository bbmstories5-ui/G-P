# Creative Request & Graphic Approval Management Portal

An enterprise-grade, workflow-driven **Creative Request & Graphic Approval Management Portal** with strict Role-Based Access Control (RBAC), private data isolation, version history, in-app notification dispatch, and customized dashboards for **12 Requesters**, **3 Graphic Makers**, **1 Lead Approver**, and **1 Super Admin**.

---

## 🚀 Key Highlights & Architecture

* **Framework & Frontend**: Next.js 14, React 18, Tailwind CSS, Lucide Icons.
* **Database & ORM**: SQLite / PostgreSQL with Prisma ORM.
* **Security & Auth**: JWT HTTP-only secure cookie authentication with strict backend-level data isolation guards.
* **Design Studio**: Built-in interactive vector/graphic generator & multi-format file uploader (PNG, JPG, SVG, PSD).
* **Strict Workflow Lifecycle**:
  `PENDING` &rarr; `ASSIGNED` &rarr; `IN_DESIGN` &rarr; `PENDING_APPROVAL` &rarr; `REVISION_REQUIRED` &rarr; `RESUBMITTED` &rarr; `FINAL_APPROVED` &rarr; `COMPLETED`.

---

## 👥 17 Pre-configured User Accounts

All accounts share default password: `password123`

### 1. Super Admin (1 Account)
* **Email**: `admin@company.com` | **Route**: `/login/admin` | **Dashboard**: `/admin/dashboard`

### 2. Lead Approver (1 Account)
* **Email**: `approver@company.com` (Elena Rostova) | **Route**: `/login/approver` | **Dashboard**: `/approver/dashboard`

### 3. Graphic Makers (3 Accounts)
* **Designer 01**: `designer01@company.com` (Alex Morgan)
* **Designer 02**: `designer02@company.com` (Sophia Chen)
* **Designer 03**: `designer03@company.com` (Marcus Vance)
* **Route**: `/login/designer` | **Dashboard**: `/designer/dashboard`

### 4. Requester Members (12 Accounts)
* **Member 01**: `member01@company.com` (Liam Davies - Digital Marketing)
* **Member 02**: `member02@company.com` (Emma Wilson - Brand Operations)
* **Member 03**: `member03@company.com` (Noah Miller - Product Marketing)
* **Member 04**: `member04@company.com` (Olivia Taylor - Performance Ads)
* **Member 05**: `member05@company.com` (Ethan Anderson - Social Media)
* **Member 06**: `member06@company.com` (Ava Thomas - Public Relations)
* **Member 07**: `member07@company.com` (Lucas Jackson - Regional Campaigns)
* **Member 08**: `member08@company.com` (Mia White - Content Strategy)
* **Member 09**: `member09@company.com` (Oliver Harris - Customer Retention)
* **Member 10**: `member10@company.com` (Isabella Martin - E-Commerce)
* **Member 11**: `member11@company.com` (James Garcia - Internal Comms)
* **Member 12**: `member12@company.com` (Charlotte Robinson - Executive Office)
* **Route**: `/login/requester` | **Dashboard**: `/requester/dashboard`

---

## 🔄 Closed-Loop Business Workflow

```
12 REQUESTER MEMBERS
        ↓  (Creates Graphic Requirement e.g. REQ-0001)
3 GRAPHIC MAKERS
        ↓  (One designer accepts request from open pool)
GRAPHIC CREATION & UPLOAD
        ↓  (Designer uploads Version 1 / 2)
1 LEAD APPROVER
        ↓  (Reviews design against specifications)
        ├── [REQUEST REVISION] ──→ Designer uploads Version 2 ──→ Re-review
        └── [APPROVE]
                ↓
    SAME ORIGINAL REQUESTER
(Member 04 sees REQ-0001 Approved & downloads final asset. Members 01-03 & 05-12 are blocked!)
```

---

## 🛠️ Running the Application

```bash
# 1. Install dependencies
npm install

# 2. Push schema and seed 17 accounts & 10 initial requirements
npx prisma db push
node prisma/seed.js

# 3. Start development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.
Use the **Role Switcher** in the top navigation bar to seamlessly hop between any of the 17 accounts during live demonstrations.
