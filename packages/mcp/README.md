# loopy-mcp

MCP (Model Context Protocol) server for [Loopy Thinking](https://loopythinking.ai).

Connect Claude Desktop, Cursor, VS Code, or any MCP-compatible client to your Loopy instance. Create loops, emit work signals, and track agent productivity — without writing any SDK code.

## Tools

| Tool | Description |
|------|-------------|
| `create_loop` | Create a loop with a title, hypothesis, and scope |
| `emit_signal` | Emit a Work Signal of a specific cognitive type |
| `map_signal` | Auto-classify a description → cognitive layer → emit signal |
| `close_loop` | Close a loop with a resolution statement |
| `get_loop` | Get full loop details including signal timeline |
| `list_active_loops` | List all open loops for the authenticated user |
| `get_confidence` | Get Confidence Index + IPL with plain-language interpretation |

## Requirements

- Node.js 18+
- A Loopy agent registry token (`LOOPY_AGENT_REGISTRY_TOKEN`)

Get your token: **Loopy dashboard → Admin → Connections → New agent token**

## Quick start

```bash
# Run directly with npx (no install required)
LOOPY_AGENT_REGISTRY_TOKEN=your_token npx loopy-mcp
```

Or install globally:

```bash
npm install -g loopy-mcp
LOOPY_AGENT_REGISTRY_TOKEN=your_token loopy-mcp
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOOPY_AGENT_REGISTRY_TOKEN` | ✅ | — | Agent registry token from your Loopy instance |
| `LOOPY_BASE_URL` | — | `https://loopythinking.ai` | API base URL for self-hosted instances |
| `LOOPY_ORG_ID` | — | — | Organization UUID (sent as `X-Org-Id`). Required if your instance uses multi-org and you want to scope requests to a specific org. |

---

## Integration guides

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "loopy": {
      "command": "npx",
      "args": ["-y", "loopy-mcp"],
      "env": {
        "LOOPY_AGENT_REGISTRY_TOKEN": "your_token_here",
        "LOOPY_BASE_URL": "https://loopythinking.ai"
      }
    }
  }
}
```

For self-hosted instances, set `LOOPY_BASE_URL` to your instance URL (e.g. `http://localhost:3001`).

Restart Claude Desktop after editing the config.

---

### Cursor

Create or edit `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "loopy": {
      "command": "npx",
      "args": ["-y", "loopy-mcp"],
      "env": {
        "LOOPY_AGENT_REGISTRY_TOKEN": "your_token_here"
      }
    }
  }
}
```

Reload Cursor after saving.

---

### VS Code (GitHub Copilot / Continue)

Add to `.vscode/settings.json` in your workspace, or to your global `settings.json`:

```json
{
  "mcp.servers": {
    "loopy": {
      "command": "npx",
      "args": ["-y", "loopy-mcp"],
      "env": {
        "LOOPY_AGENT_REGISTRY_TOKEN": "your_token_here"
      }
    }
  }
}
```

---

### Self-hosted Loopy instance

Set `LOOPY_BASE_URL` to your instance's API URL:

```json
{
  "mcpServers": {
    "loopy": {
      "command": "npx",
      "args": ["-y", "loopy-mcp"],
      "env": {
        "LOOPY_AGENT_REGISTRY_TOKEN": "lpy_agent_your_token",
        "LOOPY_BASE_URL": "http://localhost:3001",
        "LOOPY_ORG_ID": "your-org-uuid-here"
      }
    }
  }
}
```

---

## Example usage

Once connected, ask your AI assistant:

```
Create a loop to investigate the 30% drop in skill activation rate.
Hypothesis: probably the regex change from Tuesday's deploy.
```

```
List my active loops
```

```
Emit a signal to loop [id]: I reviewed 47 commits and found the breaking change in matcher.ts
```

```
Close loop [id] — hypothesis confirmed, regex fix deployed.
```

```
What's the confidence index on loop [id]?
```

---

## Tool reference

### `create_loop`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | ✅ | Short descriptive title (max 200 chars) |
| `hypothesis` | string | — | Working hypothesis to test (max 1000 chars) |
| `scope` | `personal` \| `team` \| `organizational` | — | Visibility. Default: `personal` |

### `emit_signal`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loop_id` | string | ✅ | Target loop UUID |
| `type` | cognitive layer | ✅ | `perception` \| `interpretation` \| `decision` \| `action` \| `reflection` |
| `content` | string | ✅ | What happened (max 2000 chars) |
| `source` | `agent` \| `human` | — | Default: `agent` |
| `estimated_human_minutes` | number | — | IPL override (0–480) |

### `map_signal`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loop_id` | string | ✅ | Target loop UUID |
| `description` | string | ✅ | Free-text description — type is auto-classified |
| `source` | `agent` \| `human` | — | Default: `agent` |
| `estimated_human_minutes` | number | — | IPL override (0–480) |

### `close_loop`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loop_id` | string | ✅ | Loop UUID to close |
| `resolution` | string | — | What was decided or learned (max 2000 chars) |

### `get_loop`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loop_id` | string | ✅ | Loop UUID |

Returns full details including the complete signal timeline.

### `list_active_loops`

No parameters. Returns all open loops for the authenticated user.

### `get_confidence`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loop_id` | string | ✅ | Loop UUID |

Returns Confidence Index, IPL, and a plain-language interpretation.

---

## License

AGPL-3.0 — see [LICENSE](../../LICENSE) at the repo root.

For commercial licensing (embedding in proprietary products), contact [dev@loopy-thinking.com](mailto:dev@loopy-thinking.com).
