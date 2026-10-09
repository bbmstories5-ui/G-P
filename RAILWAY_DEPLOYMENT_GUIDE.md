# 🚀 Railway Deployment Guide

This guide walks you through deploying the **Creative Request, Graphic Production & Approval Portal** to [Railway](https://railway.app) in under 2 minutes.

---

## ⚡ Option 1: Deploy via GitHub (Recommended & Easiest)

### Step 1: Push Your Code to GitHub
Ensure all your files are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: configure Railway deployment & real-time portal"
git push origin main
```

### Step 2: Create a New Project on Railway
1. Go to [Railway Dashboard](https://railway.app/dashboard).
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"**.
4. Choose this repository.

### Step 3: Add Environment Variables
In your Railway Service dashboard, navigate to the **"Variables"** tab and add:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `file:./dev.db` | Local SQLite database file path |
| `JWT_SECRET` | `creative-portal-super-secure-jwt-secret-key-2026` | Secret key for auth tokens |
| `NEXT_PUBLIC_APP_NAME` | `Creative Flow Enterprise` | Brand Portal Title |
| `NODE_ENV` | `production` | Production environment |

> 💡 *Note: Railway automatically provides and manages the `PORT` variable. Do not hardcode port 3000.*

### Step 4: Generate Public Domain
1. In your Railway Service, go to **"Settings"** -> **"Networking"**.
2. Click **"Generate Domain"** (e.g. `your-project.up.railway.app`).
3. Your live application is now online! 🎉

---

## 💾 Persistent Storage for SQLite (Optional)
If you are using SQLite and want your uploaded data and database records to persist across restarts:
1. In your Railway Service, go to the **"Volumes"** tab.
2. Click **"+ Add Volume"**.
3. Set the Mount Path to `/app/prisma`.

---

## 🐘 Option 2: Using Railway PostgreSQL Database
If you prefer PostgreSQL instead of SQLite:
1. In your Railway project, click **"+ New"** -> **"Database"** -> **"Add PostgreSQL"**.
2. In `prisma/schema.prisma`, change the provider from `sqlite` to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set the `DATABASE_URL` variable in your Next.js service to reference `${{Postgres.DATABASE_URL}}`.

---

## 🛠️ Pre-configured Railway Files in this Project

- **`railway.json`**: Specifies the Nixpacks builder, database push, and start command.
- **`nixpacks.toml`**: Custom Nix packages (`nodejs_20`, `openssl`) and build pipeline.
- **`Procfile`**: Declares the web start command.
- **`Dockerfile`**: Containerized multi-stage Docker build alternative.
- **`package.json`**: Includes `"postinstall": "prisma generate"` and dynamic `$PORT` handling.

---

## 👥 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Requester (Member 01)** | `member01@company.com` | `password123` |
| **Requester (Member 02)** | `member02@company.com` | `password123` |
| **Graphic Designer 01** | `designer01@company.com` | `password123` |
| **Lead Approver** | `approver@company.com` | `password123` |
| **Super Admin** | `admin@company.com` | `password123` |
