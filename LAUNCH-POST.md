# We're Opening Loopy Thinking — Here's Why

*Show HN / Blog post — June 2026*

---

For the past eighteen months, my team has been building Loopy Thinking: a tool that gives AI agents and humans a shared language to track what is being done, why, and how much of the work the machine actually carried.

Today we're opening the core of it under AGPL v3: the protocol, the SDK, the database schema, and the web dashboard. You can self-host the full stack in under ten minutes.

Here's what we built, why we opened it, and what we learned along the way.

---

## The problem we kept running into

When you work with AI agents seriously — not as a toy, but as something that runs your actual workflows — you hit a wall that no task manager or git log can solve.

The agent did something. You don't know exactly what. You don't know whether it made the right call. You don't know how much human judgment was actually involved. And when something breaks, you can't trace the reasoning back to the decision that caused it.

This isn't a model capability problem. It's a **legibility problem**. The outputs of agent work are legible (files, emails, decisions). The *process* is opaque.

Loopy is an attempt to make agent work as legible as human work.

---

## Three primitives

We spent a long time trying to figure out the right level of abstraction. Too low and you're just logging. Too high and you're imposing a workflow nobody will follow. We landed on three things:

**Work Signals** are the atomic unit. Every time something meaningful happens — a decision is made, a task is completed, a pattern is observed — someone emits a signal. Each signal has a cognitive type (`perception`, `interpretation`, `decision`, `action`, `reflection`) and a source (`human` or `agent`). That's it.

**Loops** are the operational containers. A loop holds a hypothesis and accumulates signals as evidence. It maps to how actual thinking unfolds: you notice something, you interpret it, you decide, you act, you reflect. The loop closes when the hypothesis is resolved — not when a timer expires or a manager approves it.

**The Confidence Index** is a 0–100 score that rises as signals accumulate. It is not a quality score. It is a governance tool. A loop with a confidence index below 40 is one that hasn't accumulated enough evidence to act on confidently. A loop at 90 is ready to close. Surfacing this number makes invisible risk visible.

Together these three primitives let you answer a question most AI tooling ignores: *how much of this work did the machine actually do, and how do we know it was the right work?*

---

## What's in the OSS release

Everything you need to run a Loopy instance and connect agents to it:

**`@loopythinking/sdk`** — a TypeScript client for creating loops, emitting signals, and querying the state of your agent's work. Published on npm.

**`@loopythinking/skills`** — a helper that auto-discovers your `SKILL.md` files and MCP server configs, then registers everything with Loopy at session start. One function call: `registerCapabilities({ bridge, agentId })`.

**`apps/api`** — a Hono-based REST API that handles the full lifecycle: loops, signals, agents, organizations, and an executive panel with aggregate metrics.

**`apps/web`** — a React dashboard with a loop timeline, a confidence/IPL tracker, an admin panel with Recharts activity graphs, and a `/framework` page that explains the cognitive model behind loops (so your team doesn't need to read a book to understand what the agent is doing).

**`packages/db`** — seven PostgreSQL migrations with full RLS policies, an upgrade path for existing data, and seeds for local development.

**`docker/`** — a `docker-compose.yml` that bundles the API, web app, and PostgreSQL. `cp .env.example .env && docker compose up` and you're running.

Everything is under AGPL v3. The protocol and schema will be open forever.

---

## What we kept in the Cloud

The commercial Loopy product will continue to exist and evolve. We kept a few things there intentionally:

- **IPL with AI classification.** The OSS version uses a deterministic heuristic (signal type × weight). The Cloud version uses a classifier trained on real loop data. We didn't want to ship a model in an AGPL package where it would immediately be extracted and fine-tuned into a competitor.
- **Advanced governance policies.** Rules that automatically block loops, escalate low-confidence decisions, and enforce review requirements. These are deeply tied to the Cloud data model.
- **Email transactional flows.** Invitations, notifications, digests. In the OSS version, the invite endpoint returns a token — the operator chooses how to deliver it.
- **Billing.** Obviously.

Everything else — the loop protocol, the SDK, the schema, the dashboard — is open.

---

## Why AGPL, not MIT

We looked at MIT, Apache 2.0, and BSL. We chose AGPL for the same reason n8n, Supabase, and PostHog did: **it lets SaaS use the code freely, but requires them to open their modifications**.

If someone takes Loopy OSS, wraps it in a SaaS, and competes with us — that's fine. We just ask that they contribute their changes back. The network-service clause of AGPL is the enforcement mechanism.

For companies that can't ship AGPL code internally (common with legal/compliance requirements), we offer a commercial license. Contact us.

---

## What we learned building this

A few things surprised us:

**The cognitive layer taxonomy is more useful than we expected.** We thought `perception / interpretation / decision / action / reflection` was an academic concept. It turned out to be something agents can classify automatically with high accuracy, and something humans find intuitive when reviewing a loop. The five layers create a shared vocabulary between machine and human.

**The Confidence Index changes how people close loops.** Before Loopy, loops (or tickets, or issues) accumulated indefinitely because there was no clear signal that they were "done enough." The confidence index creates a natural threshold: you close when you're confident, not when you're tired.

**Self-hosting is harder than it looks.** Not technically — the Docker setup is fine. The hard part is the upgrade path. When you add a new column to a table that production instances are running, you need idempotent migrations and a well-tested rollback story. Migration 007 (multi-org) was the hardest to get right because it needed to create a personal organization for every existing user without breaking their data. We spent more time on the upgrade block than on the feature itself.

---

## What's in the release

Everything from the protocol to the dashboard to a working MCP server:

**`@loopythinking/sdk`** — TypeScript client for loops, signals, and capabilities. `npm install @loopythinking/sdk`.

**`@loopythinking/skills`** — one-call auto-registration of your SKILL.md files and MCP tools at session start. `npm install @loopythinking/skills`.

**`@loopythinking/mcp`** — MCP server with 7 tools (`create_loop`, `emit_signal`, `map_signal`, `close_loop`, `get_loop`, `list_active_loops`, `get_confidence`). Drop it into Claude Desktop, Cursor, or VS Code with `npx @loopythinking/mcp`. No code required.

**`apps/api`** — Hono REST API: loops, signals, agents, multi-org, executive panel.

**`apps/web`** — React dashboard: loop timeline, confidence/IPL badges, admin panel with Recharts, `/framework` reference page.

**`packages/db`** — 8 PostgreSQL migrations with RLS, upgrade paths, and seeds.

**`docker/`** — `cp .env.example .env && docker compose up`. Running in under 10 minutes.

## What's next

The immediate roadmap: IPL weight calibration with real loop data (the defaults are conservative starting points), email transactional flow for org invites (the endpoint returns a token — we'll add the email layer), and a better onboarding wizard for first-time self-hosters.

Longer term: a real-time collaboration layer for team loops, and governance policies that can automatically escalate low-confidence decisions.

---

## Try it

```bash
git clone https://github.com/loopy-thinking/loopy-oss.git
cd loopy-oss
cp .env.example .env
docker compose up
```

Or just install the SDK:

```bash
npm install @loopythinking/sdk
```

The repository is at [github.com/loopy-thinking/loopy-oss](https://github.com/loopy-thinking/loopy-oss).

If you build something with it, open a Discussion or send an email to [dev@loopy-thinking.com](mailto:dev@loopy-thinking.com). We want to know what you're doing with it.

— Jaime

---

*Loopy Thinking is built in Guatemala. The commercial product is at [loopythinking.ai](https://loopythinking.ai).*
