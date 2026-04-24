# Changelog

All notable changes to Loopy OSS are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] — 2026-04-24

### Added

**Invite accept flow**
- `GET /invites/:token` — public endpoint; returns org name, role, and expiry without requiring login
- `POST /invites/accept` — authenticated; validates token, creates org membership in an atomic transaction, marks invite as used
- Handles edge cases: already-member (idempotent), expired token (410), invalid token (404)
- Web: `InviteAccept` page at `/invites/accept/:token` — states: loading → ready → joining → done/expired/error
- If user is not authenticated, redirects to `/login?redirect=...` and returns automatically after login

**Settings page**
- New `GET /me` endpoint — returns user profile plus org memberships with roles
- New `PATCH /me` — update `display_name`
- New `GET /me/agents` — list agent registry entries without exposing `token_hash`
- New `DELETE /me/agents/:id` — revoke (deactivate) an agent token
- Web: `/settings` page with three sections: profile, agent tokens, organizations

**IPL weight configuration**
- IPL heuristic weights are now configurable via environment variables:
  `IPL_WEIGHT_PERCEPTION`, `IPL_WEIGHT_INTERPRETATION`, `IPL_WEIGHT_DECISION`,
  `IPL_WEIGHT_ACTION`, `IPL_WEIGHT_REFLECTION`
- Values outside 0–480 are silently ignored (defaults apply)
- `getActiveWeights()` exported from `lib/ipl.ts` for observability
- Documented in `.env.example`

**Database**
- Migration 008: formalises `org_invites` table with `invited_by` and `accepted_by` FK columns,
  proper indexes, and RLS; backwards-compatible with instances running the v0.2.1 lazy DDL

### Changed
- `App.tsx`: added `/invites/accept/:token` (public) and `/settings` (authenticated) routes
- `api.ts`: extended with `api.me.*` and `api.invites.*` namespaces

---

## [0.2.1] — 2026-04-24

### Added

**Multi-org model**
- Migration 007: `users`, `organizations`, `org_members` tables
- `org_id` FK (NOT NULL) added to `loops`, `work_signals`, `agent_registry` with compound indexes
- Idempotent upgrade block: creates a personal org for each existing user without data loss
- `orgMiddleware`: reads `X-Org-Id` header, validates membership, injects `orgId` + `orgRole` into Hono context
- `hasRole()` / `forbiddenRole()` helpers for role-gated routes

**Organizations API**
- `GET /orgs` — list orgs for authenticated user
- `POST /orgs` — create org (creator becomes owner)
- `GET /orgs/:id/members` — list members with email + display name
- `POST /orgs/:id/members` — add/update member (admin+)
- `POST /orgs/:id/invites` — generate invite token (admin+), no email transactional dependency
- `DELETE /orgs/:id/members/:userId` — remove member (admin+, cannot remove owner)

**Executive panel**
- `GET /admin/overview` — aggregate KPIs: active loops, closed 30d, average confidence, total IPL hours, agent count
- `GET /admin/loops` — paginated loop list with owner info and signal counts (admin+)
- `GET /admin/agents` — agent list with last activity and signal counts (admin+)
- `GET /admin/activity?window=7d|30d|90d` — signal time series for Recharts (admin+)
- Web: `/admin` page — 4 KPI cards, Recharts `AreaChart`, sortable loops table, agents table

**Navigation + UI**
- `Layout` component: sidebar with Lucide icons, org switcher, breadcrumbs, user menu (mobile overlay)
- Web: `/framework` page — 6 sections (ciclo cognitivo, Work Signals, Confidence Index, IPL, Scope, Q&A)
- Web deps: `recharts ^2.12.0`, `lucide-react ^0.441.0`

**`@loopy/skills` package** (`packages/skills/`)
- `registerCapabilities({ bridge, agentId })` — discovers SKILL.md files and MCP configs, registers everything in one idempotent batch call
- `parseSkillFile` / `parseSkillContent` — YAML frontmatter parser (no external deps)
- `parseMcpConfig` / `discoverMcpTools` — reads `mcpServers` from Claude Desktop config and `.mcp.json`
- `CLAUDE_CODE_BUILTIN_TOOLS` / `getBuiltinTools()` — built-in Claude Code tool list
- `discoverSkills()` — scans `~/.claude/skills/`, `.claude/skills/`, `.remote-plugins/`
- 24 Vitest tests, all passing

**Launch assets**
- `CHANGELOG.md`, `LAUNCH-POST.md`, `LAUNCH-ASSETS.md`
- `.github/ISSUE_TEMPLATE/` — `bug_report.yml`, `feature_request.yml`, `config.yml`
- `.github/good-first-issues.md` — 6 documented issues ready to paste into GitHub

### Changed
- `AuthVariables` extended with `orgId: string` and `orgRole: OrgRole`
- `Loop`, `WorkSignal`, `AgentRegistryEntry` types gain `org_id` field
- `api.ts` (web): org context via `X-Org-Id` header; `getCurrentOrgId` / `setCurrentOrgId`
- README: architecture diagram, full quickstart, OSS vs Cloud table, updated roadmap

---

## [0.2.0] — 2026-04-23

### Added

**Auto-registration of agent capabilities**
- Migration 005: `agent_skills` and `agent_tools` tables — UNIQUE per `(agent_id, skill_name/tool_name)` for idempotent upserts; `last_seen_at` for stale-capability tracking
- `POST /agents/:id/skills` — upsert a single skill (idempotent)
- `POST /agents/:id/skills/batch` — batch register up to 100 skills at session start
- `GET  /agents/:id/skills` — list active skills for an agent
- `POST /agents/:id/tools`, `POST /agents/:id/tools/batch`, `GET /agents/:id/tools` — equivalents for tools
- `resolveAgentOwnership()` — works with both agent tokens and user JWTs
- Validation: `description` ≤ 500 chars, `metadata` JSONB ≤ 8 KB, batch ≤ 100 items
- SDK: `registerSkill()`, `registerTool()`, `registerBatch()` methods on `LoopyBridge`
- Web: `CapabilitiesPanel` component in `LoopDetail`

**IPL — Índice de Productividad Liberada**
- Migration 006: `ipl_minutes` column on `loops`, `estimated_human_minutes` on `work_signals`
- `recalculateIpl()` in `lib/ipl.ts` — heuristic weights by signal type + per-signal override
- `IPL_WEIGHTS_AGENT`: perception=3, interpretation=8, decision=15, action=10, reflection=6
- `GET /loops/:id` now returns `ipl_minutes` and `ipl_hours`
- Web: `IPLBadge` component with tooltip linking to `/framework`
- Docker init mirrors for migrations 005 and 006

### Changed
- `WorkSignal` type gains optional `estimatedHumanMinutes` field
- `AgentRegistryEntry` type documented with all fields

---

## [0.1.0-beta] — 2026-04-16

### Added
- Turborepo monorepo scaffold
- `@loopy/sdk` — `LoopyBridge`, `LoopySignals`, `LoopyMapper`, full TypeScript types
- `packages/protocol/` — JSON Schema for Loop and WorkSignal + OpenAPI 3.1 spec
- `packages/db/migrations/` — 004 migrations (loops, work_signals, agent_registry, indexes + RLS)
- `apps/api/` — Hono REST API: 8 core endpoints, JWT + agent token auth middleware
- `apps/web/` — React + Vite + Tailwind: Login, Dashboard, LoopDetail, NewLoop pages
- `docker/docker-compose.yml` — full self-hosted stack (PostgreSQL + API + web)
- `.github/workflows/ci.yml` — build + test on push/PR
- `.github/workflows/publish.yml` — npm publish on `v*` tag
- AGPL v3 license, CONTRIBUTING.md, README.md

[0.3.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/loopy-thinking/loopy-oss/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.1.0-beta...v0.2.0
[0.1.0-beta]: https://github.com/loopy-thinking/loopy-oss/releases/tag/v0.1.0-beta
