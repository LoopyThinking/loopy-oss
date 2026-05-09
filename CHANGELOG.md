# Changelog

All notable changes to Loopy OSS are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.0] — Unreleased

### Added

- **Brief Generator (analytics)** — Generate opinionated PDF briefs from analytics to channel high-impact loops to IT or external partners as evidenced project cases.
  - **Bimodal Project Brief** — Validated mode (loops with measured signals) and Hypothesis mode (loops with potential but pending integration).
  - **Bimodal IPL** — `ipl_minutes` (Realized, measured from agent signals) and `ipl_projected_minutes` (Projected, declared via sponsor attestation).
  - **Sponsor attestation** — Structured form for sponsors to declare the manual baseline (frequency, duration, people count, adoption rate) plus at least 3 critical assumptions. Substitutes automated signals as evidence in Hypothesis mode.
  - **Eligibility gates** — Independent criteria per mode; the "Generate Brief" button shows only the modes the loop qualifies for, with an explicit list of missing requirements.
  - **PDF output** — Static, dated snapshots with provenance badges on every figure (measured vs. estimated vs. attested). Includes a "Critical assumptions" section in Hypothesis mode.
  - New tables: `sponsor_attestations`, `brief_generations` (telemetry). New columns on `loops`: `ipl_projected_minutes`, `cognitive_layer`, `owner_id`, `sponsor_id`. See migration `014_brief_generator.sql`.
- **Artifacts page renamed labels** — Cognitive layers now display friendlier names: "Signals catalog (Perception)", "Hypothesis records (Interpretation)", "Decision log (Decision)", "Playbooks (Action)", "Learning Book (Reflection)".
- **Second Brain plugin (`packages/cowork-plugin-second-brain`)** — Optional Cowork plugin that connects Loopy loops with Obsidian or any Second Brain vault. Ships three OSS skills and one paid-only skill:
  - `loopy-kb-pull` — Pull active loops into the vault as structured notes (creates/updates per-loop Markdown files following vault conventions).
  - `loopy-kb-push` — Detect relevant activity in the vault and emit signals to the corresponding loops in Loopy. Always shows a preview before emitting.
  - `loopy-kb-enrich` — Enrich an active loop's analysis by injecting context from the vault; presents a combined synthesis of Loopy state + vault knowledge.
  - `loopy-org-kb` — *(loopythinking.ai paid only)* Distribute team loop insights across individual member vaults.
- Plugin lives in the monorepo at `packages/cowork-plugin-second-brain` following the same package layout as `packages/cowork-plugin`. Requires the `loopy-oss` plugin to be installed for auth and API communication.
- `LOOPY_VAULT_PATH` env var — optional path to the Obsidian vault or Second Brain folder. If not set, the skill asks for folder access on first use.

### Notes

- `loopy-org-kb` is spec'd but **not yet fully implemented** — requires API clarification with the loopythinking.ai team (see `packages/cowork-plugin-second-brain/SPEC.md` Section 9).
- `packages/cowork-plugin-second-brain` is versioned independently starting at `0.1.0`.

---

## [0.7.0] — 2026-05-01

### Added

- **Email invites (Block A)** — Send invite links via SMTP, Resend, or SendGrid via `LOOPY_EMAIL_PROVIDER` env var. Fallback to copy-link when email not configured.
- **Onboarding wizard (Block B)** — 5-step guided setup (welcome, profile, org, agent token, done) shown on first login. Tracks completion via `users.onboarded_at`.
- **Delete loops (Block C)** — Soft-delete for closed loops. Owner-only action with confirmation dialog.
- **Skills/tools deactivation (Block D)** — Org admins/owners see deactivated timestamp badges for inactive skills and tools. Regular users see generic "inactive" label.
- **Agent token generation (Block B)** — Generate `lpy_agent_` tokens from Settings page with one-time display. Idempotent: reuses existing active agent if available.
- **Create org from UI (Block E)** — Inline form in Settings to create new organizations with auto-generated slug from name.
- **Artifacts page (Block F)** — Browse loops grouped by cognitive layer (perception, interpretation, decision, action, reflection) with expandable signal timelines.
- **Dashboard artifact cards** — Per-layer artifact count summary with color-coded icons linking to the Artifacts page.

### Changed

- `apps/api/package.json`, `apps/web/package.json` bumped to `0.7.0`.
- Layout sidebar footer updated to `v0.7.0`.
- Layout navigation gains "Artifacts" link for all roles.
- `GET /me` now returns `onboarded_at` field.
- `PATCH /me` accepts `onboarded: boolean` to set `onboarded_at`.
- Agent detail: Skills and Tools tabs show "Deactivated {date}" badge for org admins.

### Fixed

- Analytics KPI cards no longer show "—" — backend endpoint returns proper `float8` values.
- Top Agent card shows agent name instead of UUID — corrected JOIN in SQL query.

### Database migration

- Migration `013_v070.sql` (additive, idempotent):
  - `org_invites.invited_email`, `org_invites.email_sent_at`
  - `users.onboarded_at` with partial index
  - `loops.deleted_at` with partial index
  - `agent_skills.deactivated_at`, `agent_tools.deactivated_at`

### New env vars

- `LOOPY_EMAIL_PROVIDER` — set to `smtp`, `resend`, or `sendgrid` to enable email invites.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP credentials.
- `RESEND_API_KEY` — Resend API key.
- `SENDGRID_API_KEY` — SendGrid API key.

---

## [0.6.0] — 2026-04-30

### Added

- **Linear-inspired design system** — token-first color architecture via CSS custom properties (`--bg-page`, `--text-primary`, `--border`, etc.), extended into Tailwind as semantic classes (`bg-card`, `text-muted`, `border-edge`). Inter Variable with `font-feature-settings: 'cv01', 'ss03'` globally. Dark mode uses Linear's near-black canvas (`#08090a` page, `#0f1011` panels, `#191a1b` surfaces) with semi-transparent white borders (`rgba(255,255,255,0.08)`). Light mode uses `#f7f8f8` page background. Brand accent `#5e6ad2` / `#7170ff` throughout both modes.
- **Dark mode** — persistent light/dark toggle in the sidebar footer. Defaults to system preference (`prefers-color-scheme`), then `localStorage`. Implemented via Tailwind `darkMode: 'class'` + `ThemeContext`.
- **Sidebar footer** — icon-only footer strip with Framework link and dark/light mode toggle.
- **Registry entry detail page** (`/registry/:agentKey`) — full detail view for any AI Registry entry: role, vibe, responsibilities, technical specialization, strategic priorities, subordinates list with navigation links, and parent "Reports to" link.
- **Registry flat listing** — Agents page now renders all registry entries as a flat clickable list regardless of type filter. Replaces the previous tree expand/collapse pattern.

### Changed

- **Full English UI** — all user-visible strings in `apps/web/` translated to English. No i18n library; English-only.
- **Sidebar nav order** — unified nav array with role-based visibility: Dashboard, Loops, Agents, Executive Panel *(admin+)*, Analytics *(admin+)*, Team *(admin+)*, Settings.
- **Role-gated nav items** — Executive Panel, Analytics, and Team links are hidden from the sidebar for users without `admin` or `owner` role (previously they appeared and redirected on click).
- `apps/web/package.json`, `apps/api/package.json`, `packages/sdk/package.json` bumped to `0.6.0`.

---

## [0.5.0] — 2026-04-28

### Added

**LLM Provider Configuration (BYOK)**
- New `org_llm_configs` table with AES-256-GCM encryption for API keys at rest via `LOOPY_ENCRYPTION_KEY`.
- Full CRUD API: list, create, update, rotate, test, and soft-delete LLM configs (admin+ only).
- Provider factory supporting Anthropic, OpenAI, Google, and OpenAI-compatible.
- Web UI at `/settings` → "Proveedores LLM" with password field, auto-test, set-default, and soft delete.
- `packages/db/migrations/010_v050_analytics.sql` — additive migration.

**Analytics Engine**
- 5 SQL-based analytics views: `v_roi_inputs`, `v_adoption_inputs`, `v_agent_optimization_inputs`, `v_stuck_loops_inputs`, `v_team_segmentation_inputs`.
- 5 analysis templates: ROI Snapshot, Adoption Curve, Agent Tool Optimization, Stuck Loops, Team IPL Segmentation.
- Template registry with custom prompt support per org.
- Async analysis execution: fire-and-forget LLM calls with structured JSON output (JSON Schema / tool_use per provider).
- Configurable hourly_rate_usd for ROI savings calculation (`PATCH /orgs/:id`).

**Analytics UI (`/analytics`)**
- 4-tab page: Resumen (KPI cards + upcoming schedules), Análisis (template grid + run modal with period/LLM/prompt override), Historial (analyses table), Configuración (hourly rate, LLM configs, prompt overrides, schedules).
- `AnalyticsResult.tsx` at `/analytics/runs/:id` — auto-polling result view with structured rendering per template type (narrative, tables, lists) and markdown download link.
- Dashboard banner linking to analytics for admin+ roles.
- Sidebar "Analítica" nav item added for admin/owner roles.

**Scheduled Weekly Digest**
- `analysis_schedules` table with cadence, hour, timezone support.
- `setInterval`-based cron worker (15-min poll) with `FOR UPDATE SKIP LOCKED` for safe concurrent execution.
- Guarded by `LOOPY_DISABLE_CRON=1` env var.

### Changed
- `apps/api/package.json`, `apps/web/package.json`, `packages/sdk/package.json` bumped to `0.5.0`.
- Sidebar footer bumped to `v0.5.0`.

### Database migration
- Migration 010 is additive and backwards-compatible:
  - `orgs.hourly_rate_usd` column (default 50, constraint 1–10000).
  - `loops.last_signal_at` column + trigger `trg_loops_last_signal_at`.
  - `org_llm_configs` table with encrypted API key storage.
  - `analysis_templates`, `analyses`, `analysis_schedules` tables.
  - 5 analytics views (`v_roi_inputs`, `v_adoption_inputs`, `v_agent_optimization_inputs`, `v_stuck_loops_inputs`, `v_team_segmentation_inputs`).

### New env vars
- `LOOPY_ENCRYPTION_KEY` (required) — 32-byte base64 AES-256-GCM key.
- `LOOPY_DISABLE_CRON` (optional) — disable scheduled analytics worker.

---

## [0.4.0] — 2026-04-27

### Added

**Block A — Loopy OSS Cowork plugin (`packages/cowork-plugin/`)**
- New `@loopythinking/cowork-plugin` package (v0.4.0) for self-hosted instances.
- Five skills: `loopy-oss-bridge`, `loopy-oss-loop-mapper`, `loopy-oss-signal-emit`, `loopy-oss-collab-bridge`, `loopy-oss-ipl-tracker`.
- Each skill targets `LOOPY_BASE_URL` / `LOOPY_AGENT_TOKEN` from env — no cloud endpoints, no Orion, no corporate fields.
- `plugin.json` manifest with env variable declarations.

**Block B — Team management UI (`/admin/team`)**
- New `Team.tsx` page with active member list, role change dropdown, remove member.
- Pending invites table with revoke and copy-link actions.
- Generate invite form (role + validity days) with success card showing the full accept URL.
- New API: `GET /orgs/:id/invites` (list pending), `DELETE /orgs/:id/invites/:inviteId` (revoke → sets `revoked_at`).
- Sidebar link "Equipo" added for admin/owner roles.

**Block C — Agent detail page (`/agents/:id`)**
- New `AgentDetail.tsx` with three tabs: Resumen, Skills, Tools.
- Skills tab: lists active skills with source badge, version, last_seen_at, deactivate button.
- Tools tab: lists active tools with type badge, deactivate button.
- Agents list now links to detail page with chevron indicator.
- New API: `DELETE /agents/:agentId/skills/:skillId` and `DELETE /agents/:agentId/tools/:toolId` (soft-delete, `is_active = false`).

**Block D — Team loops & navigation**
- New `Loops.tsx` full-width sortable table at `/loops` — fixes the dead sidebar link.
- `GET /loops?scope=team` — admin+ only; returns all org loops with owner info.
- `canSeeLoop()` helper in `loops.ts` — admins of the loop's org can read it.
- `GET /loops/:id` now uses `canSeeLoop` and returns `owner_name` / `owner_email`.
- Dashboard: segmented toggle "Mis loops / Del equipo" visible to admin+ roles.
- `LoopCard`: optional `showOwner` prop shows owner name below title in team view.
- `LoopDetail`: "Close loop" button hidden for non-owners.
- Admin panel: 5th KPI "Top owner", loops table grouped by owner, IPL por usuario bar list, Agentes más activos card (top 3).

**Migration 009 (`packages/db/migrations/009_v040_workflow.sql`)**
- `ALTER TABLE org_invites ADD COLUMN revoked_at TIMESTAMPTZ`.
- `idx_org_invites_pending` partial index.
- `CREATE OR REPLACE VIEW v_team_loops` with owner join.

### Changed

- `GET /invites/:token` now returns 410 Gone when `revoked_at IS NOT NULL`.
- Sidebar footer bumped to `v0.4.0`.
- `apps/api/package.json`, `apps/web/package.json`, `packages/sdk/package.json` bumped to `0.4.0`.
- `useLoops()` hook accepts `{ scope?, status? }` params.
- `api.loops.list()` accepts `{ scope?, status? }` params.
- `api.orgs.members()` now requires `orgId` param.

### SDK additions (`@loopythinking/sdk@0.4.0`)

- `LoopyBridge.deactivateSkill(agentId, skillId)` — soft-delete a skill.
- `LoopyBridge.deactivateTool(agentId, toolId)` — soft-delete a tool.
- `LoopyBridge.listOrgInvites(orgId)` — list pending invites.
- `LoopyBridge.revokeOrgInvite(orgId, inviteId)` — revoke an invite.
- `LoopyBridge.listLoops({ scope?, status? })` — supports `scope=team`.

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

**`@loopythinking/skills` package** (`packages/skills/`)
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
- `@loopythinking/sdk` — `LoopyBridge`, `LoopySignals`, `LoopyMapper`, full TypeScript types
- `packages/protocol/` — JSON Schema for Loop and WorkSignal + OpenAPI 3.1 spec
- `packages/db/migrations/` — 004 migrations (loops, work_signals, agent_registry, indexes + RLS)
- `apps/api/` — Hono REST API: 8 core endpoints, JWT + agent token auth middleware
- `apps/web/` — React + Vite + Tailwind: Login, Dashboard, LoopDetail, NewLoop pages
- `docker/docker-compose.yml` — full self-hosted stack (PostgreSQL + API + web)
- `.github/workflows/ci.yml` — build + test on push/PR
- `.github/workflows/publish.yml` — npm publish on `v*` tag
- AGPL v3 license, CONTRIBUTING.md, README.md

[0.7.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/loopy-thinking/loopy-oss/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/loopy-thinking/loopy-oss/compare/v0.1.0-beta...v0.2.0
[0.1.0-beta]: https://github.com/loopy-thinking/loopy-oss/releases/tag/v0.1.0-beta
