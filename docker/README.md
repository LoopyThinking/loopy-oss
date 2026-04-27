# Self-hosting Loopy OSS with Docker

Deploy the full Loopy stack (PostgreSQL + API) on any machine that runs Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+

## Deploy in 10 minutes

### 1. Clone the repo

```bash
git clone https://github.com/loopy-thinking/loopy-oss.git
cd loopy-oss
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and set two required values:

```bash
# A random password for PostgreSQL
POSTGRES_PASSWORD=your_secure_db_password

# A 32-byte hex secret for signing JWTs
# Generate one with: openssl rand -hex 32
JWT_SECRET=your_64_char_hex_secret
```

### 3. Start the stack

```bash
cd docker
docker compose up -d
```

This will:
- Pull `postgres:16-alpine`
- Build the Hono API from source
- Run all 4 migrations automatically on first startup
- Expose the API on `http://localhost:3001`

### 4. Verify it's running

```bash
curl http://localhost:3001/health
# → {"status":"ok","version":"0.1.0-beta","timestamp":"..."}
```

### 5. Create your first agent token

You need a user JWT to call the protected endpoints. For self-hosted deployments,
generate one using your `JWT_SECRET`:

```bash
# Using Node.js (one-liner to generate a test JWT)
node -e "
const { SignJWT } = require('jose');
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
new SignJWT({ sub: '00000000-0000-0000-0000-000000000001' })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('30d')
  .sign(secret)
  .then(token => console.log('JWT:', token));
" 
```

Then register an agent:

```bash
curl -X POST http://localhost:3001/agents \
  -H "Authorization: Bearer <your_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"agentName": "my-first-agent", "description": "Test agent"}'

# Response includes the agent token (shown only once):
# { "token": "lpy_agent_abc123...", ... }
```

### 6. Create a loop and emit a signal

```bash
# Create a loop
curl -X POST http://localhost:3001/loops \
  -H "Authorization: Bearer <your_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title": "My first loop", "hypothesis": "This will work"}'

# Emit a signal (using the agent token)
curl -X POST http://localhost:3001/signals \
  -H "Authorization: Bearer lpy_agent_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "loopId": "<loop_id_from_above>",
    "type": "action",
    "content": "Set up self-hosted Loopy instance",
    "source": "agent"
  }'
```

Done. Your Loopy instance is running.

---

## Load demo data

To populate the database with 2 example loops and 5 signals:

```bash
docker compose exec db psql -U loopy -d loopy \
  -f /docker-entrypoint-initdb.d/../seeds/demo_data.sql
```

Or run it from the host:

```bash
DATABASE_URL=postgresql://loopy:${POSTGRES_PASSWORD}@localhost:5432/loopy \
  psql $DATABASE_URL -f ../packages/db/seeds/demo_data.sql
```

---

## Configuration reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `JWT_SECRET` | ✅ | 32-byte hex secret for JWT signing |
| `PORT` | — | API port (default: `3001`) |
| `CORS_ORIGIN` | — | Allowed CORS origin (default: `*`) |
| `SUPABASE_URL` | — | Set to use Supabase JWT verification instead of `JWT_SECRET` |
| `VITE_API_URL` | — | Frontend API URL (used when web service is enabled) |

---

## Stopping and resetting

```bash
# Stop containers (data is preserved)
docker compose down

# Stop and delete all data
docker compose down -v
```

---

## Production tips

- Set `CORS_ORIGIN` to your exact frontend URL (not `*`)
- Remove the `ports` mapping from the `db` service so PostgreSQL is not exposed
- Put the API behind a reverse proxy (nginx, Caddy) with HTTPS
- Use Docker secrets or a vault for `POSTGRES_PASSWORD` and `JWT_SECRET`
