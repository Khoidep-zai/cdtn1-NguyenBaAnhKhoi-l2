# Deployment & Operations Guide

- **Project:** Graduation Capstone 1 (CDTN1 - Semester 1 2026–2027) | Faculty of IT – Van Lang University
- **Subsystem:** L2 – Warranty Request Intake & Classification (Mekong Mobile CRM)
- **Student:** Nguyen Ba Anh Khoi | **Student ID:** 2374802010247 | **Track:** Software Engineering (SE)
- **Target Repository:** `https://github.com/Khoidep-zai/cdtn1-NguyenBaAnhKhoi-l2` (Tag: `v1.0`)
- **Verification Date:** 2026-11-12. Verified on isolated clean-box container environment: API and PostgreSQL healthy, schema migration exit 0, master dataset loaded (6 centers, 6 categories, 320 products, 67,037 customers, 7,800 tickets), and 3 seeded demo accounts. Automated test suite executes 57 tests: 55 passed, 2 skipped, 0 failed.

---

## 1. Requirements

- **Operating System:** Linux (Ubuntu 20.04/22.04 LTS), macOS, or Windows 10/11 with WSL2.
- **Container Runtime:** Docker Engine 24.0+ with Docker Compose v2 (or Docker Desktop 4.25+).
- **Hardware Requirements:** Minimum 2 CPU cores, 4 GB available RAM, and 5 GB free disk space for container images, persistent volumes, and bundled dataset.
- **Network Ports:** Port `3000` available on the host (configurable via `PORT` variable in `.env`). PostgreSQL runs strictly on the internal Docker network (`postgres:5432`) and does not expose ports to the public host.
- **Base Images:** Application container uses `node:20-alpine`; database container uses `postgres:16-alpine`.

---

## 2. Setup

From an empty directory or cloned workspace, initialize and launch the entire subsystem using **exactly two commands**:

```sh
cp .env.example .env
docker compose up -d --build
```

*(On Windows PowerShell, the first command is `Copy-Item .env.example .env`)*.

### Execution Flow:
1. **Container Build & Network Setup:** Docker Compose creates a private bridge network and builds the Node.js application image.
2. **PostgreSQL Service Initialization:** The `postgres` container starts, initializes health checks, and listens on port 5432 internally.
3. **Automated Migration (`migrate` service):** Waits until PostgreSQL reports `healthy`, executes `src/backend/db/migrate.js` to create 3NF relational schemas, indexes, and imports initial master data.
4. **Automated Seed of Demo Accounts:** Creates 3 initial administrative and staff accounts with salted scrypt password hashes (`$s0$...`):
   - **System Administrator:** `system.admin` / `MekongDemo@2026` (Role: `QUAN_LY_HE_THONG`, system-wide scope)
   - **Branch Manager:** `manager.ninhkieu` / `MekongDemo@2026` (Role: `QUAN_LY_CHI_NHANH`, Ninh Kiều branch - Center ID 4)
   - **Reception Staff:** `staff.ninhkieu` / `MekongDemo@2026` (Role: `NHAN_VIEN`, Ninh Kiều branch - Center ID 4)
5. **API Service Startup:** The `api` container launches Express 5 after migration finishes successfully (exit code 0), preventing race conditions.

---

## 3. Environment Variables

All runtime variables are documented in `.env.example` and automatically loaded on startup:

| Variable | Required | Default / Example | Purpose |
|---|:---:|---|---|
| `PORT` | Optional | `3000` | Host port where the web application and REST API are exposed. |
| `NODE_ENV` | Required | `production` | Runtime mode. Enables HTTP-only Secure session cookies and strict scrypt password hashing. |
| `DB_HOST` | Required | `postgres` | Database hostname. Set to `postgres` in Docker Compose; `localhost` for local dev. |
| `DB_PORT` | Required | `5432` | PostgreSQL internal communication port. |
| `DB_NAME` | Required | `mekong_l2` | Relational database catalog name. |
| `DB_USER` | Required | `mekong_user` | PostgreSQL connection user. |
| `DB_PASSWORD` | Required | `MekongSecure2026!` | Database user password. Replace with high-entropy secret in production. |
| `JWT_SECRET` | Required | `MekongMobileCRM_JWT_SecretKey_Production_2026` | Cryptographic secret for signing auth session tokens (≥ 32 chars). |
| `CORS_ORIGINS` | Optional | `http://localhost:3000,https://cdtn1.netlify.app` | Comma-separated list of allowed browser origins for cross-origin API calls. |
| `LOG_LEVEL` | Optional | `info` | Logging verbosity (`error`, `warn`, `info`, `debug`). |

---

## 4. Sample Data & Persistence Architecture

- **Master Datasets:** Bundled in `dataset/` and automatically imported into PostgreSQL:
  - 6 Authorized Service Centers across the Mekong Delta (`dataset/centers.csv`).
  - 6 Issue Classification Categories (`dataset/categories.csv`).
  - 320 Mobile Devices and Component Products (`dataset/products.csv`).
  - 67,037 Anonymized Customer Profiles (`dataset/customers.csv`).
  - 7,800 Historical Warranty Records (`dataset/tickets.csv`).
- **Full Database Persistence:**
  Unlike early prototypes, all ticket intake operations, status transitions, customer records, and handover photos are persisted durably into PostgreSQL tables (`tickets`, `customers`, `handover_photos`, `ticket_status_history`) through connection pools managed by `pgTicketRepository.js`. Data survives all container restarts.
- **Idempotency Guarantee:**
  Running migration multiple times utilizes `ON CONFLICT DO NOTHING` statements, guaranteeing zero duplicate records or primary key collision errors upon subsequent runs.

---

## 5. Verification & Health Monitoring

### 5.1. Verification Commands
Verify the running services directly from the terminal without student intervention:

```sh
# 1. Check container operational status
docker compose ps -a

# 2. Verify API and Database connectivity health checks
curl -f http://localhost:3000/health
curl -f http://localhost:3000/health/db

# 3. Execute the automated test suite inside the application container
docker compose exec api npm test
```

### 5.2. Expected Outputs
- `docker compose ps -a`: `api` container is `Up (healthy)`, `postgres` container is `Up (healthy)`, `migrate` service is `Exited (0)`.
- `GET /health`: Returns HTTP 200 with `{"status":"ok","timestamp":"...","uptime":...}`.
- `GET /health/db`: Returns HTTP 200 with `{"status":"ok","database":{"connected":true,"pool":{"total":...,"idle":...}}}`.
- `npm test`: Executes 16 test suites, reporting **55 passed, 2 skipped, 0 failed** in ~84 seconds.

### 5.3. Operational Alert Matrix

| Trigger Condition | Evaluation Threshold | Designated Role | Mitigation Action |
|---|---|---|---|
| `GET /health/db` failure | 3 consecutive failures over 30s | System Administrator | Check PostgreSQL health, container resource limits, and database pool status. |
| HTTP 5xx error rate > 5% | Sampled over 5-minute window | Lead Developer | Inspect structured error logs using `requestId`, isolate failing endpoint, roll back release if necessary. |
