# Loopy Thinking — Open Source

> The open-source core of Loopy Thinking: agent work signals, loops, and productivity metrics.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![npm version](https://img.shields.io/npm/v/@loopy/sdk)](https://www.npmjs.com/package/@loopy/sdk)
[![GitHub stars](https://img.shields.io/github/stars/loopy-thinking/loopy-oss)](https://github.com/loopy-thinking/loopy-oss/stargazers)

---

## What is Loopy?

Loopy Thinking is a framework for **structured work in the age of AI agents**. It gives humans and agents a shared language to track what is being done, why, and how much of it was done by the machine.

At its core, Loopy is built around three primitives:

**Work Signals** capture any meaningful unit of activity — a decision made, a task completed, a pattern observed. Both humans and AI agents emit signals. Signals are the raw material from which Loopy builds a picture of how work actually flows.

**Loops** are the operational containers that organize signals over time. A loop holds a hypothesis, tracks evidence, accumulates signals, and closes when a decision is reached or a goal is met. Loops map directly to how cognitive work unfolds: perceive → interpret → decide → act → reflect.

**The Confidence Index** is Loopy's way of measuring whether a loop is grounded in enough evidence to act on. It is not a vanity score — it is a governance tool. High-stakes decisions require high confidence. Low-confidence loops surface as blockers, not as invisible risks.

Together, these three primitives let organizations answer a question that most AI tooling ignores: *how much of this work did the agent actually do, and how do we know it was the right work?*

---

## Why Open Source?

AI agents are becoming infrastructure. When your team's decisions — its loops — run through a closed system, you are trusting a vendor with the operating system of your organization's cognition. That is too important a dependency to leave opaque.

We are opening the core of Loopy so that:

- Teams can self-host their loop data and never lose it to a platform change
- Developers can build integrations without waiting for us to ship them
- The community can audit how confidence is calculated and propose improvements
- Enterprises can satisfy data residency requirements without a custom contract

The commercial Loopy cloud product will continue to exist. But the protocol, the SDK, and the schema will be open forever under AGPL v3.

---

## What's in This Repository

```
loopy-oss/
├── packages/
│   ├── sdk/          — @loopy/sdk: TypeScript SDK for emitting signals and managing loops
│   ├── skills/       — Prebuilt agent skills (loopy-bridge, loop-mapper, signal-emit)
│   ├── db/           — PostgreSQL schema and migrations
│   └── docs/         — Mintlify documentation source
├── apps/
│   ├── web/          — React frontend (self-hostable dashboard)
│   └── api/          — Edge API (Node.js)
├── docker/           — docker-compose.yml for local and self-hosted deployments
├── .github/
│   └── workflows/    — CI/CD: tests, npm publish, Docker build
├── turbo.json
├── package.json
├── LICENSE
└── README.md
```

---

## Getting Started

### Cloud (Fastest)

Create a free account at [loopythinking.ai](https://loopythinking.ai). No setup required.

### Self-Hosted

```bash
git clone https://github.com/loopy-thinking/loopy-oss.git
cd loopy-oss
cp .env.example .env   # fill in your database credentials
docker-compose up
```

Open `http://localhost:3000`.

### SDK

```bash
npm install @loopy/sdk
```

```typescript
import { LoopyBridge, LoopySignals } from '@loopy/sdk'

const loopy = new LoopyBridge({ token: process.env.LOOPY_AGENT_REGISTRY_TOKEN })

await LoopySignals.emit({
  loopId: 'your-loop-id',
  type: 'action',
  content: 'Draft sent to stakeholders',
  source: 'agent'
})
```

Full documentation: [docs.loopythinking.ai](https://docs.loopythinking.ai)

---

## Roadmap

The roadmap is public and community-driven. See [GitHub Projects →](https://github.com/loopy-thinking/loopy-oss/projects)

High-level phases:

1. **SDK v0.1** — Extract and publish `@loopy/sdk` to npm (May 2026)
2. **Self-Hosting** — Stable `docker-compose` + public PostgreSQL schema (June 2026)
3. **Public Launch** — GitHub public + Hacker News + Discord community (June 2026)
4. **MCP Server** — `loopy-mcp` for Claude Desktop, Cursor, and VS Code (July 2026)

---

## Contributing

We welcome contributions of all sizes — documentation fixes, new SDK features, self-hosting guides, and integrations.

See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

---

## License

Loopy OSS is licensed under the [GNU Affero General Public License v3.0](./LICENSE).

This means you can use, modify, and distribute this software freely — including for commercial purposes — as long as you make your changes available under the same license. If you run a modified version as a network service, you must provide access to the source code.

For a commercial license that removes the AGPL requirements (e.g., for embedding Loopy in a proprietary product), contact [dev@loopy-thinking.com](mailto:dev@loopy-thinking.com).

---

## Community

- **GitHub Discussions:** [github.com/loopy-thinking/loopy-oss/discussions](https://github.com/loopy-thinking/loopy-oss/discussions)
- **Discord:** Coming in Phase 3 (June 2026)
- **Email:** [dev@loopy-thinking.com](mailto:dev@loopy-thinking.com)
