# Launch Assets — Loopy OSS

Reference sheet for Product Hunt, Hacker News, Discord, and Reddit launches.

---

## Product Hunt

### Tagline (≤ 60 chars)

```
Open-source protocol for structured work with AI agents
```

*(58 chars)*

### Short description (≤ 260 chars for PH subtitle)

```
Loopy gives AI agents and humans a shared ledger for cognitive work.
Track what your agents did, why, and how much of the work they carried —
with an open-source protocol, TypeScript SDK, and self-hostable dashboard.
```

### Topics / categories

- Open Source
- Developer Tools
- Artificial Intelligence
- Productivity

### First comment (founder comment — post within 5 min of launch)

```
Hey PH 👋 — Jaime here, founder of Loopy Thinking.

We've been building this for 18 months in production for our own team,
and today we're opening the core under AGPL v3.

The short version: AI agents are doing real work now, but that work is invisible.
Loopy gives agents and humans three shared primitives — Work Signals, Loops,
and a Confidence Index — so you can track what was done, why, and how much
of it was actually done by the machine.

What's in the repo:
· @loopythinking/sdk — TypeScript client (npm install @loopythinking/sdk)
· @loopythinking/skills — auto-registers your SKILL.md + MCP tools at session start
· REST API (Hono), React dashboard, PostgreSQL schema + migrations
· docker compose up → running in < 10 min

Happy to answer any questions about the design decisions (why AGPL not MIT,
why a Confidence Index instead of just a task status, how IPL is calculated).

GitHub: https://github.com/loopy-thinking/loopy-oss
```

### Gallery screenshot captions (5 screenshots recommended)

1. **Dashboard** — "Active loops with Confidence Index and IPL badges"
2. **Loop detail** — "Signal timeline: every agent action traceable to a cognitive layer"
3. **Executive panel** — "Cross-org view: KPIs, activity chart, sortable loop table"
4. **Framework page** — "Built-in conceptual reference — no external docs needed"
5. **Code snippet** — "`registerCapabilities()` — one call to register all skills + tools"

---

## Hacker News — Show HN

### Title

```
Show HN: Loopy OSS – open-source protocol for tracking AI agent work (AGPL, TypeScript SDK)
```

### Comment (post with the submission or as first reply)

```
Hi HN — I'm Jaime, the founder of Loopy Thinking.

We've been quietly using this internally for 18 months and decided the
protocol + SDK are more valuable as a community standard than as a
proprietary moat.

The core idea: AI agents need a "shared ledger" with humans. Loopy
models cognitive work as Signals (atomic events) inside Loops
(hypothesis-driven containers). A Confidence Index (0–100) measures
how evidence-backed a loop is before you act on it.

Technical contents:
- @loopythinking/sdk on npm (LoopyBridge, LoopySignals, LoopyMapper)
- @loopythinking/skills helper (reads SKILL.md + MCP config, registers capabilities)
- Hono API, React dashboard with /admin panel and /framework reference
- PostgreSQL with 7 migrations incl. multi-org model
- docker compose up → full stack in < 10 min
- AGPL v3 (commercial license available)

One design decision I'd love feedback on: the IPL (Índice de Productividad
Liberada) — we measure how many human-equivalent hours the agent executed
per loop using a heuristic (signal type × weight). Agents can override per
signal via estimatedHumanMinutes. Is there a better approach?

Repo: https://github.com/loopy-thinking/loopy-oss
```

---

## Discord (Anthropic Claude Builders / Supabase / AI/ML servers)

```
🔓 We just open-sourced the core of Loopy Thinking — a protocol for structured work with AI agents.

The problem: when agents do real work, that work is invisible. No audit trail, no governance, no way to know how much was actually done by the machine.

The solution: 3 primitives — Work Signals, Loops, and a Confidence Index — that give agents and humans a shared vocabulary.

What's open:
→ @loopythinking/sdk (npm) — TypeScript client for loops + signals
→ @loopythinking/skills — auto-register your skills + MCP tools at session start
→ Full self-hostable stack: API + React dashboard + Postgres
→ docker compose up in < 10 min
→ AGPL v3

GitHub: https://github.com/loopy-thinking/loopy-oss

Would love feedback from people building with Claude, especially on the IPL metric and the @loopythinking/skills auto-registration pattern.
```

---

## Reddit (r/opensource / r/ClaudeAI / r/MachineLearning)

### Title
```
Loopy Thinking is now open source — protocol + SDK for tracking AI agent work (AGPL v3, TypeScript)
```

### Body
```
We've been building Loopy Thinking as a commercial product for 18 months
and decided the core protocol should be a community standard, not a moat.

**What problem it solves:**
AI agents do real work now. But that work is invisible — no audit trail,
no way to trace a decision back to the reasoning behind it, no metric
for how much of the work the machine actually did.

**Three primitives:**
- **Work Signals** — atomic events with a cognitive type (perception /
  interpretation / decision / action / reflection) and a source (human / agent)
- **Loops** — hypothesis-driven containers that close when resolved
- **Confidence Index** — 0-100 governance score, not a vanity metric

**What's in the repo:**
- `@loopythinking/sdk` on npm
- `@loopythinking/skills` — one-call registration of SKILL.md + MCP tools
- REST API (Hono), React dashboard, PostgreSQL migrations
- `docker compose up` → running in < 10 minutes
- AGPL v3

**Repo:** https://github.com/loopy-thinking/loopy-oss

Happy to discuss the design decisions in the comments.
```

---

## Twitter / X thread (7 tweets)

**Tweet 1 (hook):**
```
AI agents are doing real work. But that work is invisible.

Today we're opening the core of Loopy Thinking — a protocol that gives
agents and humans a shared ledger for cognitive work.

AGPL v3. TypeScript SDK on npm. Self-host in < 10 min. 🧵
```

**Tweet 2 (the problem):**
```
When your agent decides something, writes something, or executes a workflow —
how do you know what it decided and why?

Your task manager doesn't know. Your git log doesn't know.

Loopy does.
```

**Tweet 3 (primitives):**
```
Three primitives:

→ Work Signals — atomic events (perception / decision / action / reflection)
   from humans and agents
→ Loops — hypothesis-driven containers for signals
→ Confidence Index — governance score, not vanity

Simple model. Surprisingly powerful in practice.
```

**Tweet 4 (SDK):**
```
npm install @loopythinking/sdk

const loop = await loopy.createLoop({
  title:      'Investigate activation drop',
  hypothesis: 'Likely the Tuesday deploy',
})

await LoopySignals.emit({
  loopId: loop.id,
  type:   'decision',
  source: 'agent',
  content: 'Rolling back matcher.ts change',
})
```

**Tweet 5 (skills):**
```
npm install @loopythinking/skills

await registerCapabilities({ bridge: loopy, agentId })

One call. Discovers your SKILL.md files + MCP servers + Claude Code tools.
Registers everything with Loopy. Idempotent. Works at session start.
```

**Tweet 6 (self-host):**
```
Full self-hostable stack:
→ Hono API
→ React dashboard (/admin with Recharts, /framework with the conceptual model)
→ PostgreSQL (7 migrations, RLS, multi-org)
→ docker compose up in < 10 min

No vendor lock-in. Your loop data stays yours.
```

**Tweet 7 (CTA):**
```
Repo: github.com/loopy-thinking/loopy-oss

We'd love:
⭐ A star if the idea resonates
🐛 Issues if you try it and hit something broken
🛠 PRs — good-first-issues are labeled and ready

AGPL v3. Commercial license available for proprietary embedding.
```
