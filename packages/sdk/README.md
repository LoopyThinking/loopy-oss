# @loopythinking/sdk

TypeScript SDK for [Loopy Thinking](https://loopythinking.ai) — register work signals, manage loops, and connect agents to the Loopy protocol.

## Installation

```bash
npm install @loopythinking/sdk
```

## Quick Start

```typescript
import { LoopyBridge, LoopySignals, LoopyMapper } from '@loopythinking/sdk'

const loopy = new LoopyBridge({
  token: process.env.LOOPY_AGENT_REGISTRY_TOKEN,
  // baseUrl defaults to https://loopythinking.ai
  // set to http://localhost:3001 for self-hosted instances
})

// Create a loop
const loop = await loopy.createLoop({
  title: 'Migrate auth to new provider',
  hypothesis: 'The migration will take less than 2 days with zero downtime',
  scope: 'personal',
})

// Emit a signal manually
await LoopySignals.emit({
  loopId: loop.id,
  type: 'action',
  content: 'Updated auth middleware to use new JWT format',
  source: 'agent',
  metadata: { tool: 'claude-cowork' },
}, { token: process.env.LOOPY_AGENT_REGISTRY_TOKEN })

// Or let the mapper classify the activity automatically
await LoopyMapper.map(loop.id, {
  description: 'Analyzed the error logs and identified the root cause',
  source: 'agent',
}, { token: process.env.LOOPY_AGENT_REGISTRY_TOKEN })

// Close the loop
await loopy.closeLoop(loop.id, 'Migration complete. Zero downtime achieved.')
```

## API

### `LoopyBridge`

Main client for managing loops.

| Method | Description |
|--------|-------------|
| `new LoopyBridge({ token, baseUrl? })` | Create a client instance |
| `getLoop(id)` | Fetch a single loop by ID |
| `listActiveLoops()` | List all open loops for the authenticated user |
| `createLoop({ title, hypothesis, scope? })` | Create a new loop |
| `closeLoop(id, resolution?)` | Close a loop with an optional resolution |

### `LoopySignals`

Emit and query work signals on loops.

| Method | Description |
|--------|-------------|
| `LoopySignals.emit(signal, config)` | Emit a work signal to a loop |
| `LoopySignals.listByLoop(loopId, config)` | List all signals for a loop |

### `LoopyMapper`

Automatically classifies a work activity into a cognitive layer and emits it.

| Method | Description |
|--------|-------------|
| `LoopyMapper.map(loopId, activity, config)` | Classify and emit a work signal |

**Cognitive layers** (auto-detected from description keywords):

| Layer | Keywords |
|-------|----------|
| `perception` | analyze, observe, detect, scan, read |
| `interpretation` | interpret, evaluate, assess, review, understand |
| `decision` | decide, choose, select, prioritize, approve |
| `reflection` | reflect, learn, retrospect, conclusion |
| `action` | *(default — everything else)* |

## Self-hosting

To use the SDK against a self-hosted Loopy instance:

```typescript
const loopy = new LoopyBridge({
  token: 'your-agent-token',
  baseUrl: 'http://your-server:3001',
})
```

See the [Docker Compose setup](https://github.com/loopy-thinking/loopy-oss/tree/main/docker) for self-hosting instructions.

## License

[AGPL-3.0](https://github.com/loopy-thinking/loopy-oss/blob/main/LICENSE)
