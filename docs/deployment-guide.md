# Deployment & Operations Guide

- **Project:** Mekong Mobile CRM — Warranty Receipt & Triage Subsystem (Workflow L2)
- **Student:** Nguyen Ba Anh Khoi | **Student ID:** 2374802010247
- **Track:** Software Engineering (SE) | **Course:** Specialized Graduation Topic 1 (CDTN1)
- **Version:** v1.0 (Assignment 3 Deliverable)

---

## 1. Environment Requirements

Ensure the host machine satisfies the following prerequisites before initiating deployment:

| Component | Minimum Requirement | Recommended Specification |
|---|---|---|
| **Operating System** | Windows 10/11 64-bit, Ubuntu 22.04 LTS, or macOS 13+ | Ubuntu 22.04 LTS / Windows 11 with WSL2 |
| **Container Engine** | Docker Engine 24.0+ & Docker Compose v2.20+ | Docker Desktop 4.25+ with Compose v2.23+ |
| **Runtime (without Docker)** | Node.js 20.x LTS, npm 10.x+ | Node.js 20.18 LTS, npm 10.8+ |
| **Database (without Docker)** | PostgreSQL 16.x | PostgreSQL 16.2 Alpine |
| **Hardware** | 2 vCPU, 4 GB RAM, 10 GB free disk space | 4 vCPU, 8 GB RAM, 20 GB SSD |
| **Required Free Ports** | Port `3000` (Node.js API/Frontend), Port `5432` (PostgreSQL) | Ports `3000` and `5432` unoccupied |

---

## 2. System Setup Steps (≤ 2 Commands from Clean Machine)

The entire subsystem can be booted up from a clean repository clone using at most two commands:

```bash
# Step 1: Copy environment template to active configuration
cp .env.example .env

# Step 2: Build and start containers in detached mode
docker compose up -d --build
```

*(Alternative manual execution for local Node.js environment without Docker):*
```bash
npm ci
npm run db:migrate
npm start
```

---

## 3. Environment Variables Configuration

The system is configured via environment variables defined in `.env`. A complete, secure template is provided in `.env.example`:

| Variable Name | Description | Default / Example Value | Required? |
|---|---|---|:---:|
| `PORT` | Listening TCP port for the Express application | `3000` | Optional (default: 3000) |
| `NODE_ENV` | Application runtime environment (`development`, `production`, `test`) | `development` | Yes |
| `DB_HOST` | Hostname or container IP of PostgreSQL server | `postgres` (Docker) / `localhost` (Local) | Yes |
| `DB_PORT` | PostgreSQL TCP communication port | `5432` | Yes |
| `DB_NAME` | Primary database name for CRM data storage | `mekong_l2_db` | Yes |
| `DB_USER` | PostgreSQL authentication user | `mekong_admin` | Yes |
| `DB_PASSWORD` | PostgreSQL authentication password | `mekong_secure_pass_2026` | Yes |
| `JWT_SECRET` | Secret key used for signing session tokens (min 32 bytes) | `mekong_jwt_super_secret_key_prod_2026_min_32_bytes!` | Yes |
| `LOG_LEVEL` | Logging verbosity level (`info`, `debug`, `warn`, `error`) | `info` | Optional (default: info) |

> **Security Notice:** The `.env` file contains runtime secrets and is strictly ignored by version control (`.gitignore`). Never commit live production secrets into git history.

---

## 4. Sample Data & Seeding

The application comes pre-packaged with historical datasets and master data located in the `dataset/` directory.

### Automated Seeding Process:
- When starting via Docker Compose or executing `npm run db:migrate`, the automated data loader (`src/backend/db/dataLoader.js`) automatically validates and imports reference datasets.
- The migration uses idempotent operations (`ON CONFLICT DO NOTHING`) so subsequent boots or migrations never duplicate records or raise primary key constraint violations.

### Expected Record Counts for Verification:
Upon successful initialization, verify database row counts using standard queries or container health endpoints:

| Entity / Table | Dataset Source File | Expected Record Count | Verification Query |
|---|---|:---:|---|
| Warranty Centers (`centers`) | `dataset/centers.json` | **6** | `SELECT COUNT(*) FROM centers;` |
| Issue Categories (`issue_categories`) | `dataset/categories.json` | **6** | `SELECT COUNT(*) FROM issue_categories;` |
| Products Master (`products`) | `dataset/products.json` | **320** | `SELECT COUNT(*) FROM products;` |
| Seed Customers (`customers`) | `dataset/customers.json` | **67,037** | `SELECT COUNT(*) FROM customers;` |
| Historical Tickets (`tickets`) | `dataset/tickets.json` | **7,800** | `SELECT COUNT(*) FROM tickets;` |

---

## 5. Verification & Health Check (How to Confirm System is Healthy)

After deployment, perform the following verification commands to guarantee all services are operating nominally:

### 5.1. Container Status & Health Check
Run Docker Compose inspection:
```bash
docker compose ps
```
**Expected Output:** Both `api` and `postgres` services report `Up (healthy)`.

### 5.2. HTTP Health Probes
Execute curl requests to internal health probes:
```bash
# 1. Check API Server Availability
curl -s -i http://localhost:3000/health

# Expected response: HTTP/1.1 200 OK
# Body: {"success":true,"status":"ok","timestamp":"..."}

# 2. Check Database Connectivity
curl -s -i http://localhost:3000/health/db

# Expected response: HTTP/1.1 200 OK
# Body: {"success":true,"database":"connected","pool":{"total":10,"idle":9}}
```

### 5.3. Automated Test Suite Execution
Execute the full automated test suite to confirm end-to-end integrity:
```bash
npm test
```
**Expected Output:**
```text
ℹ tests 44
ℹ pass 44
ℹ fail 0
ℹ duration_ms ~3500ms
```
All 44 tests pass with zero failures.

### 5.4. Default Test Accounts for Demonstration
For manual web GUI inspection via browser at `http://localhost:3000`:

| Role | Username | Password | Permitted Scope |
|---|---|---|---|
| **System Admin** | `system.admin` | `admin123` | Full system-wide access across all branches |
| **Branch Manager** | `manager.hcm` | `123456` | Branch-level ticket approval & dispatch |
| **Service Staff** | `staff.hcm` | `123456` | Front-desk receipt & intake triage |
