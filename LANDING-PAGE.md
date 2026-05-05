# Loopy OSS — Landing Page Content

> Estructura para Lovable. Sin header ni footer. Secciones ordenadas de arriba hacia abajo.

---

## SECTION 1 — Hero

### Eyebrow label
`Open Source · AGPL v3 · TypeScript`

### Headline
**AI agents are doing real work. That work is invisible.**

### Subheadline
Loopy gives agents and humans a shared ledger for cognitive work — with an open protocol, a TypeScript SDK, and a self-hostable dashboard you can run in under 10 minutes.

### CTA buttons
- **Primary:** `npm install @loopythinking/sdk` *(copyable code snippet)*
- **Secondary:** View on GitHub → `github.com/loopy-thinking/loopy-oss`

### Supporting stat row
- `@loopythinking/sdk` on npm
- AGPL v3 license
- Self-host with Docker in < 10 min
- Built in production for 18 months

---

## SECTION 2 — Problem

### Section label
`The problem`

### Headline
Your task manager doesn't know what your agent did. Neither does your git log.

### Body
When an AI agent decides something, writes something, or executes a workflow — there's no shared record. No audit trail. No way to trace a decision back to the reasoning behind it. No metric for how much of the work the machine actually carried.

Loopy fixes that. It gives AI agents and humans **three shared primitives** to record, track, and govern cognitive work.

---

## SECTION 3 — Three Primitives

### Section label
`The model`

### Headline
Three primitives. One shared vocabulary.

### Primitive 1 — Work Signals
**Work Signals**
Atomic events from humans or agents. Every signal carries a cognitive type — `perception`, `interpretation`, `decision`, `action`, or `reflection` — and a source: `human` or `agent`. The full trace of who did what, and why.

### Primitive 2 — Loops
**Loops**
Hypothesis-driven containers for signals. A loop opens with a title and a hypothesis. Signals accumulate inside it. It closes when the hypothesis is resolved — with a written resolution. Not a task, not a ticket. A unit of cognitive work.

### Primitive 3 — Confidence Index
**Confidence Index**
A 0–100 governance score that measures how evidence-backed a loop is before you act on it. Updated automatically as signals arrive. Not a vanity metric — a real signal of readiness.

### Flow diagram (visual hint for Lovable)
```
Work Signal → Loop → Confidence Index → Close with resolution
```

---

## SECTION 4 — SDK Quick Start

### Section label
`Get started`

### Headline
From zero to running in under 10 minutes.

### Step 1 — Install
```bash
npm install @loopythinking/sdk
```

### Step 2 — Create a loop
```typescript
import { LoopyBridge, LoopySignals } from '@loopythinking/sdk'

const loopy = new LoopyBridge({ token: process.env.LOOPY_AGENT_TOKEN })

const loop = await loopy.createLoop({
  title:      'Investigate activation drop',
  hypothesis: 'Likely caused by the Tuesday deploy',
})
```

### Step 3 — Emit signals from your agent
```typescript
await LoopySignals.emit({
  loopId:  loop.id,
  type:    'decision',
  source:  'agent',
  content: 'Rolling back the matcher.ts change from deploy #412',
}, { token: process.env.LOOPY_AGENT_TOKEN })
```

### Step 4 — Close with resolution
```typescript
await loopy.closeLoop(loop.id, 'Confirmed: Tuesday deploy introduced regression. Rolled back.')
```

### Supporting note
Full self-hostable stack via Docker Compose. No cloud required. Your loop data stays yours.

---

## SECTION 5 — What's in the Repo

### Section label
`What's included`

### Headline
Everything you need to self-host.

### Package list

**`@loopythinking/sdk`**
TypeScript client for loops and signals. Works in Node.js and edge runtimes. ESM + CJS. LoopyBridge, LoopySignals, LoopyMapper — the full API surface.

**`@loopythinking/skills`**
Auto-registers your SKILL.md files and MCP tools at session start. One call: `registerCapabilities()`. Idempotent. Works with Claude Desktop, Cursor, and VS Code Copilot.

**`@loopythinking/mcp`**
MCP server for AI agent integrations. Six tools: `create_loop`, `emit_signal`, `close_loop`, `get_loop`, `list_active_loops`, `get_confidence`. Auth via agent registry token.

**REST API (Hono)**
TypeScript-native, edge-compatible API with 8 endpoints. JWT auth for users, Bearer token auth for agents. Clean routes, no framework magic.

**React Dashboard**
Loop timeline, signal explorer, Confidence Index visualization, and admin panel. Built with Vite + React + Tailwind + shadcn/ui.

**PostgreSQL Schema**
Clean declarative migrations. Three core tables: `loops`, `work_signals`, `agent_registry`. RLS-ready. No vendor-specific functions.

**Docker Compose**
One command: `docker compose up`. Runs the full stack — database, API, and dashboard — locally or on any VPS.

---

## SECTION 6 — OSS vs Cloud

### Section label
`Open core model`

### Headline
The protocol is open. The cloud adds collaboration.

### Table

| Feature | OSS (self-host) | Cloud (loopythinking.ai) |
|---|---|---|
| Loop lifecycle (create, signal, close) | ✅ | ✅ |
| Confidence Index | ✅ | ✅ |
| TypeScript SDK | ✅ | ✅ |
| MCP Server | ✅ | ✅ |
| Self-hosting with Docker | ✅ | — |
| Governance policies | — | ✅ |
| Team & org collaboration | — | ✅ |
| AI-powered IPL analytics | — | ✅ |
| Historical analytics | — | ✅ |
| SSO / SAML | — | ✅ |
| Priority support | — | ✅ |

### Supporting note
Licensed under AGPL v3 — the same model used by PostHog, n8n, and Supabase. Commercial licenses available for proprietary embedding.

---

## SECTION 7 — Self-Host in 10 Minutes

### Section label
`Deploy`

### Headline
Run the full stack anywhere.

### Steps

**1. Clone the repo**
```bash
git clone https://github.com/loopy-thinking/loopy-oss
cd loopy-oss
cp .env.example .env
```

**2. Start with Docker Compose**
```bash
cd docker
docker compose up -d
```

**3. Open the dashboard**
```
http://localhost:3000
```

### Deploy options
- **Local** — Docker Compose on your machine
- **Railway** — One-click deploy template *(coming soon)*
- **Render** — Free tier compatible *(coming soon)*
- **Any VPS** — Works on any Ubuntu server with Docker

---

## SECTION 8 — Why AGPL

### Section label
`License`

### Headline
Open source with a spine.

### Body
Loopy OSS is licensed under AGPL v3 — the same choice made by PostHog, n8n, and Supabase. It means: use it freely, self-host it, contribute back. If you build a SaaS product on top of Loopy and distribute it, the AGPL requires you to open-source your changes.

This protects the community that builds around the protocol, and funds continued development of the open core.

**Commercial license:** If you need to embed Loopy in a proprietary product, contact us at dev@loopy-thinking.com.

---

## SECTION 9 — Community

### Section label
`Community`

### Headline
Built with the community. For the community.

### Contributing cards

**⭐ Star the repo**
If the idea resonates, a star helps the project reach more builders.
→ `github.com/loopy-thinking/loopy-oss`

**🐛 Report issues**
Found something broken? Open an issue. We respond within 24 hours.
→ GitHub Issues

**🛠 Contribute**
Good-first-issues are labeled and ready. CONTRIBUTING.md explains the fork workflow, code of conduct, and how to propose changes.
→ See open issues

**💬 Join the conversation**
Discuss the protocol, share your integrations, and help shape the roadmap.
→ Discord *(coming soon)*

---

## SECTION 10 — Final CTA

### Headline
Your agents are already working. Start tracking it.

### Subheadline
Self-host in 10 minutes. No account required. Your data stays yours.

### CTA buttons
- **Primary:** `npm install @loopythinking/sdk`
- **Secondary:** Read the docs → `docs.loopythinking.dev`
- **Tertiary:** Star on GitHub → `github.com/loopy-thinking/loopy-oss`

### Footnote
Loopy OSS is the open core of [loopythinking.ai](https://loopythinking.ai) — built in production for 18 months before going open source.

---

## DESIGN NOTES FOR LOVABLE

- **Tone:** Technical but accessible. Confident, not hype-driven. The copy speaks to developers building real AI agent systems.
- **Color palette:** Use Loopy Thinking brand colors from loopythinking.ai. Dark mode default recommended.
- **Code blocks:** Syntax highlighted, copyable. Should feel premium.
- **Section rhythm:** Hero → Problem → Model → Code → Features → Comparison → Deploy → License → Community → CTA. Linear scroll, no sidebars.
- **Primitives section (Section 3):** Consider a three-column card layout or animated flow diagram: `Signal → Loop → Confidence → Close`.
- **OSS/Cloud table (Section 6):** Style with clear visual distinction between columns. Green checkmarks, muted dashes.
- **Final CTA (Section 10):** Full-width band. The npm install command should be the hero element — large, monospace, copyable.
