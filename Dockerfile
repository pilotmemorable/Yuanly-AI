# Yuanly — single image: Express/Prisma API + admin web panel
FROM node:22-slim AS admin
WORKDIR /app/admin-web
COPY src/admin-web/package*.json ./
RUN npm ci --no-audit --no-fund
COPY src/admin-web ./
RUN npm run build

FROM node:22-slim AS backend-build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY src/backend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY src/backend ./
RUN npx prisma generate && npx tsc
RUN npm prune --omit=dev

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    ADMIN_WEB_DIR=/app/admin-web \
    LEGAL_DIR=/app/legal
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/legal ./legal
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=admin /app/admin-web/dist ./admin-web
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
