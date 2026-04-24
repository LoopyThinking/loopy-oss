# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests for dependency caching
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install only api dependencies
RUN npm ci --workspace apps/api

# Copy source and compile
COPY apps/api/ ./apps/api/
RUN npm run build --workspace apps/api

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
RUN npm ci --workspace apps/api --omit=dev

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
