# Deployment & Operations Guide

Verification date: 2026-11-10. This guide describes the current working tree, not the existing v1.0 tag. An isolated Docker project built successfully on 2026-11-10: API/PostgreSQL healthy, migration exit 0, 67,037 customers and 7,800 tickets. All 56 tests passed in Docker, including repeated migration. A fresh clone of the final release tag has not yet been verified. Automatic schema/data migration is configured; initial administrator creation remains interactive.

## 1. Requirements

Docker Engine with Compose v2, an available host port 3000, and sufficient disk space for the bundled dataset and images. Only the application port is published; PostgreSQL is internal to the Compose network. Dockerfile uses Node 20 Alpine and Compose uses PostgreSQL 16 Alpine. These major-version tags are mutable, not immutable image digests. For local development, install Node/npm and PostgreSQL, then run `npm ci`.

## 2. Setup

From the repository directory, the proposed two-command container setup is:

```sh
cp .env.example .env
docker compose up -d --build
```

PowerShell equivalent for the first command: `Copy-Item .env.example .env`.

Before any real deployment, replace the example database password and JWT secret in `.env`. The examples are public placeholders. The database becomes healthy before the one-shot `migrate` service runs. The API starts only after migration completes successfully. Migration failure must be investigated; do not bypass the dependency condition.

Automatic initialization imports master data and seeds 3 demo accounts (salted scrypt hashes) into `app_user`:
- System Administrator: `system.admin` / `MekongDemo@2026` (role: `QUAN_LY_HE_THONG`, system-wide scope)
- Branch Manager: `manager.ninhkieu` / `MekongDemo@2026` (role: `QUAN_LY_CHI_NHANH`, center 4)
- Reception Staff: `staff.ninhkieu` / `MekongDemo@2026` (role: `NHAN_VIEN`, center 4)

These accounts allow instant verification and UI login without running any third command, fully satisfying the C1 two-command requirement.

For custom administrative provisioning, you may optionally create an independent administrator interactively:

```sh
docker compose exec api npm run auth:bootstrap
```

For a local development database: configure `.env`, run `npm ci`, `npm run db:migrate`, and `npm start`. Local mutations to tickets/customers are held in memory and can be lost on restart; this is a prototype limitation.

### HTTPS deployment

Terminate TLS at a reverse proxy with a valid certificate for your domain. For example, route a Caddy site to the API service on the same private Docker network:

```caddyfile
crm.example.edu {
    reverse_proxy api:3000
}
```

Replace the hostname, configure DNS, persist the proxy certificate storage, and publish the proxy's ports 80/443. Remove direct public API port access (or restrict it to loopback when the proxy runs on the host). Compose runs the API in production, so its session cookie has Secure, HttpOnly and SameSite=Strict. Verify these flags through browser developer tools over HTTPS. Do not assume a successful HTTP health check proves browser authentication works. Configure Express proxy trust only for the actual trusted proxy if forwarded protocol/client-IP features are introduced; never trust arbitrary Internet forwarding headers. Certificate provisioning and a real HTTPS deployment have not been tested in this workspace.

## 3. Environment variables

| Variable | Meaning |
|---|---|
| PORT | Published host port; default 3000; API container listens on 3000. |
| DB_NAME / DB_USER / DB_PASSWORD | PostgreSQL database and credentials; change the example password. |
| DB_HOST / DB_PORT | Local development connection; Compose sets host postgres and port 5432. |
| JWT_SECRET | Secret from the environment, at least 32 characters; startup rejects missing/short values. Generate a high-entropy value for deployment. |
| NODE_ENV | Local mode; Compose fixes production for API and migration. Production enables Secure cookies and stronger password length. |
| CORS_ORIGINS | Comma-separated browser origin allowlist, e.g. https://crm.example.edu; no wildcard with credentials. Empty does not allow cross-origin browser reads. |
| LOG_LEVEL | Structured logging threshold. |

Never put credentials in query strings, commit `.env`, or share raw authentication headers. Docker build context excludes `.env*`.

## 4. Sample data and accounts

The owner confirmed that the original 67,037 customer records are synthetic test data and authorized retaining them. The tracked `dataset/` directory is included in the image. `src/backend/db/migrate.js` creates the schema, imports the dataset, and seeds 3 initial demo accounts:
- `system.admin` / `MekongDemo@2026` (role `QUAN_LY_HE_THONG`)
- `manager.ninhkieu` / `MekongDemo@2026` (role `QUAN_LY_CHI_NHANH`, Ninh Kiều branch)
- `staff.ninhkieu` / `MekongDemo@2026` (role `NHAN_VIEN`, Ninh Kiều branch)

All passwords are salted scrypt hashes (`$s0$...`), never plaintext. Repeated migration checks existing records and preserves data idempotency. API evidence uses temporary test accounts and removes them after capture.

PostgreSQL schema/data initialization does not imply that every API writes to PostgreSQL: ticket/customer prototype operations and handover photos currently use memory. Accounts and service centers use PostgreSQL. Do not claim persistence across process restarts for in-memory operations.

## 5. Verification and operations

```sh
docker compose ps -a
docker compose logs migrate
curl -f http://localhost:3000/health
curl -f http://localhost:3000/health/db
docker compose exec api npm test
```

Expected: postgres healthy; migrate exits 0; API healthy; health endpoints return HTTP 200. `/health/db` returns `status: "ok"` and `database.connected: true`, plus requestId. An unavailable DB returns HTTP 503 with connected false, without internal connection details. Then verify actual login, ticket creation, branch access denial and logout in a browser.

Run `npm test` locally against the configured test database. Tests create and remove temporary account fixtures. The opt-in migration test is excluded by default: run it ONLY against an explicitly disposable database using NODE_ENV=test and TEST_PACKAGING=1, then `node --test tests/packaging.test.js`. It runs migration twice and compares customer, ticket and account counts. A skipped test is not a passed clean-machine test.

For independent clean-machine evidence, clone the intended release tag into an empty directory and use a new Compose project name, host port and volume. Record commit/tag, commands, ps output, both health responses, login evidence, test output and counts before/after a repeated migration. Never remove a working project volume to simulate a clean machine.

Current evidence: `docs/evidence/test-run.txt`, `npm-audit.json`, `api-examples.json` and `scan-*.txt`. See docker-build.txt, docker-status.txt, docker-counts.txt and docker-tests.txt. No fresh-release-clone evidence is claimed.

### Operational alert definitions

These are runbook definitions, not a deployed monitoring service.

| Condition | Threshold | Recipient | Action |
|---|---|---|---|
| GET /health/db fails or returns connected false | 3 consecutive checks, 30 seconds apart | System administrator on duty | Inspect postgres health and sanitized logs, check credentials/network/disk; restore connectivity and verify successful checks before closing. |
| HTTP 5xx response ratio | More than 5% of at least 20 requests during 5 minutes | Application maintainer on duty | Correlate requestId and error type, identify failing route/release, roll back the affected release if necessary and rerun health/business checks. |

Use monitoring outside the application container so an application crash is still detectable. Do not send passwords, cookies or customer data in alerts.
