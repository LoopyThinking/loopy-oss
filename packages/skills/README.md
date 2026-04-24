# @loopy/skills

Auto-register agent skills and tools with a Loopy OSS instance.

Call `registerCapabilities()` once at session start from your skill's init code. It discovers every `SKILL.md` in your skill directories and every MCP server in your Claude Desktop / Cowork config, then registers them all with Loopy in a single idempotent batch call.

## Installation

```bash
npm install @loopy/skills @loopy/sdk
```

## Quick start

```typescript
import { LoopyBridge } from '@loopy/sdk'
import { registerCapabilities } from '@loopy/skills'

const loopy = new LoopyBridge({
  token:   process.env.LOOPY_AGENT_REGISTRY_TOKEN!,
  baseUrl: process.env.LOOPY_BASE_URL, // defaults to https://loopythinking.ai
})

await registerCapabilities({
  bridge:  loopy,
  agentId: process.env.LOOPY_AGENT_ID!,
})
// [@loopy/skills] Registering 8 skill(s) + 12 tool(s) for agent 3f9a1c2b…
// [@loopy/skills] Done — 8 skill(s), 12 tool(s) registered.
```

That's it. The call is idempotent — running it on every session start only updates `last_seen_at` on existing records.

---

## What gets discovered

### Skills — SKILL.md files

`@loopy/skills` scans these directories by default:

| Directory | Source tag |
|-----------|-----------|
| `~/.claude/skills/*/SKILL.md` | `user` |
| `./.claude/skills/*/SKILL.md` | `user` |
| `~/.claude/.remote-plugins/*/skills/*/SKILL.md` | `plugin` |

Each `SKILL.md` must have a YAML frontmatter block at the top:

```markdown
---
name: docx
description: Create and edit Word documents (.docx files)
version: 2.1.0
---

Skill documentation here…
```

Only `name` is required; `description` and `version` are optional. If `name` is absent, the parent directory name is used as the skill name.

### Tools — MCP config files

MCP servers are read from (first match wins per tool name):

1. Any paths you pass via `mcpConfigPaths`
2. `.mcp.json` in the current directory
3. `mcp.json` in the current directory
4. `~/.claude/claude_desktop_config.json`
5. `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
6. `~/.config/claude/claude_desktop_config.json` (Linux)
7. `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

Each `mcpServers` entry becomes one `RegisterToolPayload` with `toolType: 'mcp'`. The server's `env` block is **never** stored — only the tool name, inferred provider, and command are recorded.

### Built-in Claude Code tools

By default, all standard Claude Code built-in tools are registered (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Agent`, `WebSearch`, `WebFetch`, `NotebookEdit`, `TodoWrite`).

---

## Options

```typescript
await registerCapabilities({
  bridge:  loopy,
  agentId: 'your-agent-uuid',

  // ── Skill discovery ──────────────────────────────────────────────────────
  skillDirs:           ['/extra/skills/dir'],   // additional dirs to scan
  autoDiscoverSkills:  true,                    // scan default dirs (default: true)

  // ── Tool discovery ───────────────────────────────────────────────────────
  mcpConfigPaths:      ['/path/to/mcp.json'],  // extra MCP config files
  autoDiscoverMcp:     true,                   // auto-detect config files (default: true)
  builtinTools:        'all',                  // 'all' | string[] | false

  // ── Explicit additions ───────────────────────────────────────────────────
  additionalSkills: [
    { skillName: 'my-custom-skill', source: 'user', description: '…' },
  ],
  additionalTools: [
    { toolName: 'MyInternalTool', toolType: 'connector', provider: 'internal' },
  ],

  // ── Behaviour ────────────────────────────────────────────────────────────
  cwd:     process.cwd(),  // base for relative paths
  silent:  false,          // suppress console output
  dryRun:  false,          // discover but don't call the API
})
```

### Dry-run mode

Useful for debugging what would be registered:

```typescript
const result = await registerCapabilities({
  bridge, agentId, dryRun: true,
})
console.log('Would register:', result.discoveredSkills.map(s => s.skillName))
console.log('Would register tools:', result.discoveredTools.map(t => t.toolName))
```

---

## Using from a SKILL.md / loopy-bridge skill

In your `SKILL.md`-driven skill, call `registerCapabilities` inside the session-start hook or the first tool invocation. Typically this lives in the loopy-bridge skill itself:

```typescript
// Inside your loopy-bridge or custom skill's session init
import { LoopyBridge } from '@loopy/sdk'
import { registerCapabilities } from '@loopy/skills'

const AGENT_ID = process.env.LOOPY_AGENT_ID
const TOKEN    = process.env.LOOPY_AGENT_REGISTRY_TOKEN

if (AGENT_ID && TOKEN) {
  const bridge = new LoopyBridge({ token: TOKEN })
  registerCapabilities({ bridge, agentId: AGENT_ID, silent: true })
    .catch(err => console.warn('[@loopy/skills] Registration failed:', err.message))
  // Fire-and-forget is fine — registration failure should not block the skill
}
```

---

## Low-level API

For advanced use cases, all parsers are exported individually:

```typescript
import {
  parseSkillFile,      // parse a single SKILL.md → RegisterSkillPayload
  parseSkillContent,   // same, but from a string (testing / inline use)
  parseMcpConfig,      // parse a single MCP config JSON file
  discoverMcpTools,    // auto-discover across candidate config paths
  discoverSkills,      // scan directories for SKILL.md files
  getBuiltinTools,     // get subset of Claude Code built-in tools
} from '@loopy/skills'
```

---

## License

AGPL-3.0 — see [LICENSE](../../LICENSE) at the repo root.
