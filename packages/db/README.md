# @loopy/db

PostgreSQL schema for the Loopy OSS core. Three tables — `loops`, `work_signals`, `agent_registry` — plus indexes and Row-Level Security policies.

## Tables

| Table | Purpose |
|-------|---------|
| `loops` | Operational containers that track a hypothesis toward a decision |
| `work_signals` | Discrete work events emitted by humans or agents into a loop |
| `agent_registry` | Registered agents and their hashed Bearer tokens |

## Applying migrations

Run the four migration files in order against your PostgreSQL database:

```bash
psql $DATABASE_URL -f migrations/001_create_loops.sql
psql $DATABASE_URL -f migrations/002_create_work_signals.sql
psql $DATABASE_URL -f migrations/003_create_agent_registry.sql
psql $DATABASE_URL -f migrations/004_indexes_and_rls.sql
```

With Docker Compose (migrations run automatically at startup via `docker-entrypoint-initdb.d`):

```bash
docker-compose up
```

## Loading demo data

```bash
psql $DATABASE_URL -f seeds/demo_data.sql
```

This creates 2 loops and 5 work signals for a demo user (UUID `00000000-0000-0000-0000-000000000001`). The seed is idempotent — safe to run multiple times.

## Row-Level Security

Migration 004 enables RLS on all three tables using `auth.uid()` — the Supabase pattern for JWT-authenticated users. Each user can only read and write their own rows.

**Self-hosted (plain PostgreSQL):** `auth.uid()` does not exist outside Supabase. Disable RLS and enforce user isolation in the API middleware instead:

```sql
ALTER TABLE loops          DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_signals   DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_registry DISABLE ROW LEVEL SECURITY;
```

The API middleware at `apps/api/src/middleware/auth.ts` sets the user context from the JWT, so isolation is still enforced — just at the application layer rather than the database layer.

## Schema reference

`schema.sql` contains the complete schema in one file for quick reference. **Do not apply it directly** — use the numbered migration files so changes remain tracked and reversible.

## Environment variables

```bash
DATABASE_URL=postgresql://loopy:password@localhost:5432/loopy
```
