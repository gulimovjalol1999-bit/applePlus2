# Apple Plus — Deployment Architecture

## 1. Infrastructure Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Production Server (VPS/Cloud VM)               │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Docker Compose Network                      │  │
│  │                                                                   │  │
│  │  ┌───────────────┐   ┌───────────────┐   ┌───────────────────┐  │  │
│  │  │    Nginx      │   │  Next.js Web  │   │   NestJS API      │  │  │
│  │  │  :80 / :443   │──▶│   :3000       │   │   :4000           │  │  │
│  │  │  (SSL term.)  │   │   (SSR/ISR)   │──▶│   (REST/Swagger)  │  │  │
│  │  └───────────────┘   └───────────────┘   └────────┬──────────┘  │  │
│  │                                                    │              │  │
│  │                               ┌───────────────────┴──────────┐  │  │
│  │                               │        PostgreSQL :5432        │  │  │
│  │                               │        (persistent volume)     │  │  │
│  │                               └──────────────────────────────┘  │  │
│  │                                                                   │  │
│  │                               ┌──────────────────────────────┐  │  │
│  │                               │         Redis :6379            │  │  │
│  │                               │   (cache, queues, sessions)    │  │  │
│  │                               └──────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Certbot (Let's Encrypt SSL renewal)               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Docker Compose Architecture

### Services

| Service | Image | Exposed Port (internal) | External Port | Restart Policy |
|---|---|---|---|---|
| `nginx` | `nginx:1.27-alpine` | 80, 443 | 80, 443 | `always` |
| `web` | `apple-plus/web:latest` | 3000 | — (internal only) | `always` |
| `api` | `apple-plus/api:latest` | 4000 | — (internal only) | `always` |
| `db` | `postgres:16-alpine` | 5432 | — (internal only) | `always` |
| `redis` | `redis:7-alpine` | 6379 | — (internal only) | `always` |
| `certbot` | `certbot/certbot` | — | — | `no` (cron-triggered) |

### Networks

| Network | Purpose |
|---|---|
| `proxy_net` | Nginx ↔ web, nginx ↔ api |
| `app_net` | api ↔ db, api ↔ redis |

Nginx is the only container with external port bindings. All application containers communicate over internal Docker networks only.

### Volumes

| Volume | Mount Path | Purpose |
|---|---|---|
| `postgres_data` | `/var/lib/postgresql/data` | Database persistence |
| `redis_data` | `/data` | Redis persistence (AOF) |
| `certbot_certs` | `/etc/letsencrypt` | SSL certificates |
| `certbot_webroot` | `/var/www/certbot` | ACME challenge files |
| `nginx_logs` | `/var/log/nginx` | Access and error logs |

---

## 3. Nginx Configuration

### Routing Rules

```
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name appleplus.com www.appleplus.com;
    return 301 https://$host$request_uri;
}

# HTTPS — Main server block
server {
    listen 443 ssl http2;
    server_name appleplus.com www.appleplus.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/appleplus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appleplus.com/privkey.pem;

    # API routes → NestJS backend
    location /api/ {
        proxy_pass http://api:4000;
    }

    # Swagger UI (staging only — disabled in prod or basic-auth protected)
    location /api/docs {
        proxy_pass http://api:4000/api/docs;
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://api:4000/health;
    }

    # Everything else → Next.js frontend
    location / {
        proxy_pass http://web:3000;
    }

    # ACME challenge for certbot renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
```

### SSL/TLS Settings

- Protocol: TLS 1.2 minimum, TLS 1.3 preferred
- Ciphers: Mozilla Intermediate configuration
- HSTS: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- OCSP Stapling: enabled
- Session cache: `shared:SSL:10m`

### Security Headers (applied globally)

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

# Applied to /api/ location
limit_req zone=api burst=20 nodelay;

# Applied to /api/v1/auth/ location
limit_req zone=auth burst=5 nodelay;
```

---

## 4. Dockerfile Strategy

### Multi-stage Build — NestJS API

```
Stage 1: deps         — pnpm install (production deps only)
Stage 2: builder      — TypeScript compile → /dist
Stage 3: production   — node:20-alpine, copy /dist + node_modules, non-root user
```

- Final image: ~180 MB
- Runs as non-root user `node` (UID 1001)
- Health check: `curl -f http://localhost:4000/health/live`

### Multi-stage Build — Next.js Web

```
Stage 1: deps         — pnpm install
Stage 2: builder      — next build (standalone output)
Stage 3: production   — node:20-alpine, copy .next/standalone, non-root user
```

- Standalone output mode: self-contained, no `node_modules` copy needed
- Final image: ~120 MB
- Health check: `curl -f http://localhost:3000/api/health`

---

## 5. CI/CD Pipeline (GitHub Actions)

### Workflow: `ci.yml` — Triggered on every PR and push to `develop`

```
Jobs (run in parallel where possible):
├── lint-api         → ESLint + Prettier check (NestJS)
├── lint-web         → ESLint + Prettier check (Next.js)
├── test-api         → Jest unit tests + integration tests (test DB via service container)
├── test-web         → Vitest unit tests
└── build            → docker build --no-push (verify images build cleanly)
    ├── Depends on: lint-api, lint-web, test-api, test-web
    └── Runs only if all lint/test jobs pass
```

### Workflow: `deploy-staging.yml` — Triggered on merge to `develop`

```
Steps:
1. checkout
2. Set up Docker Buildx + QEMU
3. Login to Container Registry (GHCR)
4. Build & push api image → ghcr.io/org/apple-plus-api:develop
5. Build & push web image → ghcr.io/org/apple-plus-web:develop
6. SSH to staging server
7. docker compose pull
8. docker compose up -d --remove-orphans
9. Run DB migrations (docker compose exec api npm run migration:run)
10. Smoke test (curl /health/ready)
11. Notify Slack on success/failure
```

### Workflow: `deploy-production.yml` — Triggered on push of release tag `v*.*.*`

```
Steps:
1. checkout
2. Extract version from tag (e.g., v1.2.3)
3. Login to GHCR
4. Build & push api image → ghcr.io/org/apple-plus-api:1.2.3 + :latest
5. Build & push web image → ghcr.io/org/apple-plus-web:1.2.3 + :latest
6. SSH to production server
7. Set IMAGE_TAG=1.2.3 in .env
8. docker compose -f docker-compose.prod.yml pull
9. docker compose -f docker-compose.prod.yml up -d --remove-orphans
10. Run DB migrations
11. Smoke test suite (critical endpoints)
12. Create GitHub Release with changelog
13. Notify Slack
```

### Required Secrets (GitHub repository secrets)

| Secret | Description |
|---|---|
| `STAGING_SSH_HOST` | Staging server IP/hostname |
| `STAGING_SSH_USER` | SSH user |
| `STAGING_SSH_KEY` | Private SSH key |
| `PROD_SSH_HOST` | Production server IP/hostname |
| `PROD_SSH_USER` | SSH user |
| `PROD_SSH_KEY` | Private SSH key |
| `GHCR_TOKEN` | GitHub Container Registry token |
| `SLACK_WEBHOOK_URL` | Slack notifications |
| `DATABASE_URL` | Production DB connection string |

---

## 6. Environment Configuration

### Environment Files

| File | Purpose | Committed? |
|---|---|---|
| `.env.example` | Template with all keys, no values | Yes |
| `.env.development` | Local dev values | No |
| `.env.staging` | Staging values | No (server only) |
| `.env.production` | Production values | No (server only) |

### Key Environment Variables

```bash
# App
NODE_ENV=production
APP_PORT=4000
APP_URL=https://appleplus.com
FRONTEND_URL=https://appleplus.com

# Database
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=appleplus_prod
DATABASE_USER=appleplus
DATABASE_PASSWORD=<strong-random-password>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=<256-bit-random>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<256-bit-random>
JWT_REFRESH_EXPIRES_IN=7d

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@appleplus.com
SMTP_PASS=<password>

# Storage (media uploads)
AWS_S3_BUCKET=apple-plus-media
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## 7. Database Operations

### Migrations

- TypeORM migration files stored in `apps/api/src/database/migrations/`
- Naming convention: `YYYYMMDDHHMMSS-DescriptiveName.ts`
- Run automatically on container startup in production via entrypoint script:
  ```bash
  node dist/database/migrations/run-migrations.js && node dist/main.js
  ```
- Never use `synchronize: true` in production — migrations only

### Backups

| Schedule | Retention | Method |
|---|---|---|
| Daily 02:00 UTC | 30 days | `pg_dump` → gzipped → S3 |
| Weekly Sunday 02:00 UTC | 12 weeks | `pg_dump` → S3 Glacier |
| Pre-deployment | 7 days | Automatic snapshot before each prod deploy |

Backup script runs as a Docker cron job or external cron on the host:
```bash
pg_dump -h localhost -U appleplus appleplus_prod | gzip | \
  aws s3 cp - s3://apple-plus-backups/$(date +%Y-%m-%d)/db.sql.gz
```

---

## 8. SSL Certificate Management

### Initial Issuance

```bash
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d appleplus.com \
  -d www.appleplus.com \
  --email admin@appleplus.com \
  --agree-tos \
  --no-eff-email
```

### Auto-renewal

Cron job on the host (runs daily at 03:00 UTC):
```bash
0 3 * * * docker compose run --rm certbot renew --quiet && \
           docker compose exec nginx nginx -s reload
```

Certificates auto-renew when < 30 days from expiry (Let's Encrypt 90-day certs).

---

## 9. Health Checks & Monitoring

### Health Endpoints

| Endpoint | Purpose | Response |
|---|---|---|
| `GET /health/live` | Kubernetes-style liveness probe | 200 OK if process up |
| `GET /health/ready` | Readiness probe — checks DB + Redis | 200 OK if all dependencies healthy |
| `GET /health` | Full health report (internal only, restricted) | JSON with component statuses |

### Monitoring Stack (Recommended External Services)

| Concern | Tool |
|---|---|
| Uptime monitoring | UptimeRobot or Better Uptime (ping `/health/ready` every 60 s) |
| Error tracking | Sentry (NestJS + Next.js SDK) |
| Application metrics | Prometheus + Grafana (optional, via `nestjs-prometheus`) |
| Log aggregation | Papertrail or Logtail (forward Docker logs) |

---

## 10. Scaling Considerations

The current architecture is a single-server Docker Compose deployment — appropriate for launch and early growth. The following migration path is available as traffic grows:

| Phase | Trigger | Action |
|---|---|---|
| Phase 1 (now) | < 10k daily users | Single VPS, Docker Compose |
| Phase 2 | > 10k daily users | Vertical scale (larger VM), add read replica |
| Phase 3 | > 50k daily users | Move to Docker Swarm or Kubernetes; RDS for DB; ElastiCache for Redis |
| Phase 4 | > 500k daily users | Microservices extraction, CDN for media, Elasticsearch for search |

The modular monolith backend design (clearly separated modules, no cross-repository access) makes Phase 4 microservices extraction straightforward without a full rewrite.

---

## 11. Disaster Recovery

| Scenario | RTO | RPO | Recovery Procedure |
|---|---|---|---|
| Container crash | < 1 min | 0 | Docker `restart: always` auto-restarts |
| Bad deployment | < 5 min | 0 | Re-deploy previous image tag from GHCR |
| Database corruption | < 30 min | 24 h | Restore latest daily backup from S3 |
| Full server loss | < 2 h | 24 h | Provision new server, restore from S3, redeploy images |
| SSL certificate expiry | < 15 min | N/A | Manual `certbot renew`, monitor expiry via UptimeRobot |

---

## 12. Security Checklist

- [ ] All containers run as non-root users
- [ ] No application containers bind to external ports (Nginx only)
- [ ] Database password is a cryptographically random 32+ character string
- [ ] JWT secrets are 256-bit random values
- [ ] `.env` files are never committed to git (`.gitignore` enforced)
- [ ] GitHub secrets are used for all sensitive CI/CD values
- [ ] Nginx rate limiting active on `/api/` and `/api/v1/auth/`
- [ ] Security headers configured in Nginx (HSTS, CSP, X-Frame-Options)
- [ ] Swagger UI disabled or Basic-Auth protected in production
- [ ] DB not exposed to the internet (internal Docker network only)
- [ ] Redis not exposed to the internet (internal Docker network only)
- [ ] SSH access to production via key only (password auth disabled)
- [ ] Firewall: only ports 22, 80, 443 open externally
- [ ] Automated daily backups verified monthly via restore drill
