# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci --workspace apps/web

# Copy source and build
COPY apps/web/ ./apps/web/
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace apps/web

# ── Runtime stage (Nginx) ─────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA routing: redirect all 404s to index.html so React Router handles them
RUN printf 'server {\n\
  listen 3000;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
