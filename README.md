# Loopy OSS

> **The open-source protocol for structured work with AI agents.**
> Track what your agents did, why, and how much of the work they actually carried.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![npm](https://img.shields.io/npm/v/@loopythinking/sdk?label=%40loopy%2Fsdk)](https://www.npmjs.com/package/@loopythinking/sdk)
[![CI](https://github.com/loopy-thinking/loopy-oss/actions/workflows/ci.yml/badge.svg)](https://github.com/loopy-thinking/loopy-oss/actions/workflows/ci.yml)

---

## The problem

AI agents are doing real work now. But when you look at your task manager, your git log, or your company dashboard, that work is invisible. You can't tell what the agent decided, why it decided it, or how much human judgment was actually involved.

Loopy gives agents and humans a **shared ledger** for cognitive work.

---

## Three primitives

**Work Signals** — the atomic unit. Every time something meaningful happens in a workflow — a decision taken, a file written, a pattern observed — someone (human or agent) emits a signal. Signals have a type (`perception`, `interpretation`, `decision`, `action`, `reflection`) and a source (`human` or `agent`).

**Loops** — the operational container. A loop holds a hypothesis, accumulates signals as evidence, and closes when the hypothesis is resolved. Loops map to how actual thinking unfolds, not to how tasks are assigned.

**Confidence Index** — governance, not vanity. A 0–100 score that rises as signals accumulate. High-stakes loops require high confidence before they close. Loops with low confidence surface as blockers, not silent risks.

---

## Architecture

```
  Your agent / skill                  Loopy OSS instance
  ─────────────────────               ──────────────────────────────────────
                                       ┌─────────────────────────────────┐
  ┌──────────────────┐   REST / SDK    │  apps/api  (Hono, Node 20)      │
  │  @loopythinking/sdk      │ ──────────────► │  /loops  /signals  /agents      │
  │  LoopyBridge     │                 │  /admin  /orgs  /agents/:id/    │
  │  LoopySignals    │                 │          skills + tools          │
  │  LoopyMapper     │                 └──────────────┬──────────────────┘
  └──────────────────┘                                │
                                                      │ SQL
  ┌──────────────────┐   auto-register               ▼
  │  @loopythinking/skills   │ ──────────────► ┌─────────────────────────────────┐
  │  registerCap()   │   skills+tools  │  PostgreSQL                     │
  └──────────────────┘                 │  loops · work_signals           │
                                       │  agent_registry · capabilities  │
  ┌──────────────────┐   browser       │  users · organizations          │
  │  apps/web        │ ──────────────► └─────────────────────────────────┘
  │  React dashboard │
  │  /dashboard      │   routes:       Docker Compose bundles all three.
  │  /admin (KPIs)   │   /loops/:id    Self-host in < 10 minutes.
  │  /framework      │   /admin
  └──────────────────┘   /framework
```

---

## Quick start

### Self-hosted (< 10 minutes)

```bash
git clone https://github.com/loopy-thinking/loopy-oss.git
cd loopy-oss
cp .env.example .env        # fill in POSTGRES_PASSWORD and JWT_SECRET
docker compose up
```

Open `http://localhost:3000`. The API runs at `http://localhost:3001`.

### Updating an existing installation

Docker only auto-applies SQL files in `docker/init/` on the **first** creation of the database volume. If you already have Loopy running and pull a newer version with new migrations, the new SQL files won't run automatically — you need to apply them manually:

```bash
docker exec -i $(docker ps -qf "name=db") psql -U loopy -d loopy < packages/db/migrations/<new-migration>.sql
```

To verify a migration was applied, check that its tables/columns exist:

```bash
docker exec $(docker ps -qf "name=db") psql -U loopy -d loopy -c "\d <table_name>"
```

If you want a clean slate, you can also stop containers, remove the volume, and start fresh — but you'll lose your data.

### SDK

```bash
npm install @loopythinking/sdk
```

```typescript
import { LoopyBridge, LoopySignals, LoopyMapper } from '@loopythinking/sdk'

const loopy = new LoopyBridge({
  token:   process.env.LOOPY_AGENT_REGISTRY_TOKEN!,
  baseUrl: process.env.LOOPY_BASE_URL, // default: https://loopythinking.ai
})

// 1. Create a loop with a hypothesis
const loop = await loopy.createLoop({
  title:      'Investigate drop in skill activation rate',
  hypothesis: 'Likely a regex change in last Tuesday deploy',
  scope:      'team',
})

// 2. Emit signals as the agent works
await LoopySignals.emit({
  loopId:  loop.id,
  type:    'perception',
  content: 'Activation rate dropped 30% starting Tuesday 22 Apr',
  source:  'agent',
}, { token: process.env.LOOPY_AGENT_REGISTRY_TOKEN! })

// 3. Let LoopyMapper classify activity automatically
await LoopyMapper.map(loop.id, {
  description: 'Reviewed 47 commits, found breaking change in matcher.ts',
  source:      'agent',
  metadata:    { estimatedHumanMinutes: 25 },
}, { token: process.env.LOOPY_AGENT_REGISTRY_TOKEN! })

// 4. Close when resolved
await loopy.closeLoop(loop.id, 'Regex fix deployed. Hypothesis confirmed.')
```

### Auto-register agent capabilities

Call this once at session start. It discovers your `SKILL.md` files and MCP servers, then registers everything with Loopy in one idempotent batch:

```bash
npm install @loopythinking/skills
```

```typescript
import { LoopyBridge } from '@loopythinking/sdk'
import { registerCapabilities } from '@loopythinking/skills'

const loopy = new LoopyBridge({ token: process.env.LOOPY_AGENT_REGISTRY_TOKEN! })

await registerCapabilities({
  bridge:  loopy,
  agentId: process.env.LOOPY_AGENT_ID!,
  // Automatically discovers:
  //   · SKILL.md files in ~/.claude/skills/ and .claude/skills/
  //   · MCP servers from ~/.claude/claude_desktop_config.json
  //   · Claude Code built-in tools (Read, Write, Bash, etc.)
})
```

### MCP server (Claude Desktop, Cursor, VS Code)

Connect any MCP-compatible client to Loopy without writing code. Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "loopy": {
      "command": "npx",
      "args": ["-y", "@loopythinking/mcp"],
      "env": { "LOOPY_AGENT_REGISTRY_TOKEN": "your_token" }
    }
  }
}
```

7 tools available: `create_loop`, `emit_signal`, `map_signal`, `close_loop`, `get_loop`, `list_active_loops`, `get_confidence`. See [`packages/mcp/README.md`](./packages/mcp/README.md) for Cursor and VS Code setup.

---

## What's in this repository

```
loopy-oss/
├── packages/
│   ├── sdk/       @loopythinking/sdk        — TypeScript client (loops, signals, mapper, capabilities)
│   ├── skills/    @loopythinking/skills     — registerCapabilities() helper for agent session start
│   ├── db/                          — PostgreSQL migrations (007 migrations, seeds, RLS policies)
│   ├── protocol/                    — JSON Schema + OpenAPI 3.1 spec
│   └── docs/                        — Mintlify documentation source
├── apps/
│   ├── api/       Hono + Node 20    — REST API (loops, signals, agents, orgs, admin)
│   └── web/       React + Vite      — Dashboard (/dashboard, /loops/:id, /admin, /framework)
├── docker/                          — docker-compose.yml + Dockerfiles + init SQL
└── .github/workflows/               — CI (test + lint), npm publish on tag, docs sync
```

---

## The `/framework` page

Every self-hosted Loopy instance ships with a built-in reference page at `/framework` that explains the cognitive model behind loops: the five-layer cycle, what a Work Signal is, how Confidence is calculated, and what IPL measures. It's the conceptual documentation that makes Loopy more than just another task tracker.

---

## IPL — Índice de Productividad Liberada

Loopy measures how many **human-equivalent hours** your agents executed per loop. The OSS version uses a deterministic heuristic (signal type × weight for agent-sourced signals). The Cloud version uses an AI classifier. You can override per-signal via `estimatedHumanMinutes` in signal metadata.

This metric answers: *how much of this work did the machine do?* — not as a replacement for human judgment, but as an honest accounting of delegation.

---

## Roadmap

| Version | Status | What it includes |
|---------|--------|-----------------|
| **v0.1.0-beta** | ✅ shipped | `@loopythinking/sdk` on npm, monorepo scaffold, protocol spec |
| **v0.2.0** | ✅ shipped | Auto-registro de skills/tools, IPL por loop |
| **v0.2.1** | ✅ shipped | Multi-org, panel ejecutivo, sidebar, `/framework`, `@loopythinking/skills` |
| **v0.3.0** | ✅ shipped | Invite accept flow, Settings page, IPL env var config |
| **v1.0 — `@loopythinking/mcp`** | ✅ shipped | MCP server — 7 tools for Claude Desktop, Cursor, VS Code |
| **v0.8.0** | ✅ shipped | Brief Generator (bimodal Project Brief, sponsor attestation, bimodal IPL); Second Brain plugin (Obsidian/vault integration); Artifacts page label refresh |
| **v1.1** | 🔜 next | IPL weight calibration with real data, email invite flow, onboarding wizard |

The full roadmap lives in [GitHub Projects →](https://github.com/loopy-thinking/loopy-oss/projects).

---

## Contributing

We welcome contributions of all sizes. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and the PR process.

Looking for a first issue? Check the [`good-first-issue`](https://github.com/loopy-thinking/loopy-oss/issues?q=label%3Agood-first-issue) label — they're scoped, documented, and ready to pick up.

---

## Self-hosting vs. Cloud

| Capability | OSS (self-hosted) | Cloud ([loopythinking.ai](https://loopythinking.ai)) |
|------------|:-----------------:|:----------------------------------------------------:|
| Loop lifecycle | ✅ | ✅ |
| Work Signals | ✅ | ✅ |
| Confidence Index | ✅ | ✅ |
| IPL (heuristic) | ✅ | ✅ (AI-powered) |
| `@loopythinking/sdk` | ✅ | ✅ |
| `@loopythinking/skills` | ✅ | ✅ |
| Docker self-host | ✅ | — |
| Multi-org | ✅ | ✅ |
| Executive panel | ✅ | ✅ |
| Advanced governance | — | ✅ |
| SSO / SAML | — | ✅ |
| Email invite flow | — | ✅ |
| Billing / limits | — | ✅ |

---

## License

Loopy OSS is licensed under the [GNU Affero General Public License v3.0](./LICENSE).

You can use, modify, and distribute this software freely — including for commercial purposes — as long as derivative works remain under AGPL. If you run a modified version as a network service, you must provide access to the source.

For a commercial license (embedding Loopy in a proprietary product), contact [dev@loopy-thinking.com](mailto:dev@loopy-thinking.com).

---

## Community

- **GitHub Discussions:** [loopy-thinking/loopy-oss/discussions](https://github.com/loopy-thinking/loopy-oss/discussions)
- **Discord:** Coming with the public launch (June 2026)
- **Email:** [dev@loopy-thinking.com](mailto:dev@loopy-thinking.com)
