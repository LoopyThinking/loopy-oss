import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { LoopyClientConfig } from '../client.js'

// Each tool module exports:
//   definition: Tool          — the MCP tool descriptor (name, description, inputSchema)
//   handler: (args, cfg) => Promise<string>  — returns a human-readable result string

export { definition as createLoopDef,     handler as createLoopHandler     } from './create-loop.js'
export { definition as emitSignalDef,     handler as emitSignalHandler     } from './emit-signal.js'
export { definition as mapSignalDef,      handler as mapSignalHandler      } from './map-signal.js'
export { definition as closeLoopDef,      handler as closeLoopHandler      } from './close-loop.js'
export { definition as getLoopDef,        handler as getLoopHandler        } from './get-loop.js'
export { definition as listLoopsDef,      handler as listLoopsHandler      } from './list-loops.js'
export { definition as getConfidenceDef,  handler as getConfidenceHandler  } from './get-confidence.js'

export type ToolHandler = (args: Record<string, unknown>, cfg: LoopyClientConfig) => Promise<string>

export interface LoopyTool {
  definition: Tool
  handler: ToolHandler
}
