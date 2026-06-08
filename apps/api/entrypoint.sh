#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
./node_modules/.bin/typeorm migration:run -d dist/database/data-source.js

echo "[entrypoint] Starting NestJS API..."
exec node dist/main.js
