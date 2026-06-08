# ─── Stage 1: Install all workspace dependencies ─────────────────────────────
FROM node:20-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Compile TypeScript ─────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm --filter @apple-plus/api build

# ─── Stage 3: Prune to production dependencies ───────────────────────────────
FROM builder AS deployer
RUN pnpm deploy --filter @apple-plus/api --prod /app/api-deploy

# ─── Stage 4: Lean runtime image ─────────────────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nestjs \
 && apk add --no-cache wget

WORKDIR /app

COPY --from=deployer --chown=nestjs:nodejs /app/api-deploy/node_modules ./node_modules
COPY --from=builder  --chown=nestjs:nodejs /app/apps/api/dist            ./dist
COPY --chown=nestjs:nodejs apps/api/package.json  ./package.json
COPY --chown=nestjs:nodejs apps/api/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER nestjs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:4000/health/live || exit 1

ENTRYPOINT ["./entrypoint.sh"]
