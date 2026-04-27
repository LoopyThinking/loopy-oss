import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js'
import { resolveConfig } from './client.js'
import {
  createLoopDef,    createLoopHandler,
  emitSignalDef,    emitSignalHandler,
  mapSignalDef,     mapSignalHandler,
  closeLoopDef,     closeLoopHandler,
  getLoopDef,       getLoopHandler,
  listLoopsDef,     listLoopsHandler,
  getConfidenceDef, getConfidenceHandler,
} from './tools/index.js'
import type { ToolHandler } from './tools/index.js'

// ── Tool registry ─────────────────────────────────────────────────────────────

const TOOLS = [
  { definition: createLoopDef,    handler: createLoopHandler    },
  { definition: emitSignalDef,    handler: emitSignalHandler    },
  { definition: mapSignalDef,     handler: mapSignalHandler     },
  { definition: closeLoopDef,     handler: closeLoopHandler     },
  { definition: getLoopDef,       handler: getLoopHandler       },
  { definition: listLoopsDef,     handler: listLoopsHandler     },
  { definition: getConfidenceDef, handler: getConfidenceHandler },
]

const HANDLER_MAP = new Map<string, ToolHandler>(
  TOOLS.map(t => [t.definition.name, t.handler])
)

// ── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'loopy-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

// ── ListTools ─────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(t => t.definition),
}))

// ── CallTool ──────────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: rawArgs } = request.params
  const args = (rawArgs ?? {}) as Record<string, unknown>

  const handler = HANDLER_MAP.get(name)
  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    }
  }

  // Resolve config on every call so env var changes (e.g. in tests) are picked up.
  let cfg
  try {
    cfg = resolveConfig()
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `Configuration error: ${err instanceof Error ? err.message : String(err)}`,
      }],
      isError: true,
    }
  }

  try {
    const result = await handler(args, cfg)
    return { content: [{ type: 'text', text: result }] }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text', text: `Error calling ${name}: ${message}` }],
      isError: true,
    }
  }
})

// ── Error handling ────────────────────────────────────────────────────────────

server.onerror = (err) => {
  console.error('[loopy-mcp] Server error:', err)
}

process.on('SIGINT', async () => {
  await server.close()
  process.exit(0)
})

// ── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate config at startup for a clear error message
  try {
    resolveConfig()
  } catch (err) {
    console.error(
      '[loopy-mcp] Startup error:',
      err instanceof Error ? err.message : String(err)
    )
    console.error(
      '\nSet LOOPY_AGENT_REGISTRY_TOKEN to your agent token from your Loopy instance.'
    )
    process.exit(1)
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Note: do NOT write to stdout after this point — it's reserved for MCP protocol.
  console.error('[loopy-mcp] Running on stdio. Press Ctrl+C to stop.')
}

main().catch((err) => {
  console.error('[loopy-mcp] Fatal error:', err)
  process.exit(1)
})
