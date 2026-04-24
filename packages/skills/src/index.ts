/**
 * @loopy/skills — auto-register agent skills and tools with a Loopy instance.
 *
 * Main entry point: `registerCapabilities()`
 *
 * @example
 * import { LoopyBridge } from '@loopy/sdk'
 * import { registerCapabilities } from '@loopy/skills'
 *
 * const loopy = new LoopyBridge({ token: process.env.LOOPY_AGENT_REGISTRY_TOKEN })
 * await registerCapabilities({ bridge: loopy, agentId: process.env.LOOPY_AGENT_ID })
 */

// ── Primary API ───────────────────────────────────────────────────────────────

export { registerCapabilities } from './register.js'
export type {
  RegisterCapabilitiesOptions,
  RegisterCapabilitiesResult,
} from './register.js'

// ── Low-level utilities (exported for advanced use / testing) ─────────────────

export { parseSkillFile, parseSkillContent } from './parse-skill.js'
export type { ParsedSkill } from './parse-skill.js'

export {
  parseMcpConfig,
  discoverMcpTools,
  getBuiltinTools,
  defaultMcpConfigPaths,
  CLAUDE_CODE_BUILTIN_TOOLS,
} from './parse-mcp.js'
export type { ParsedTool } from './parse-mcp.js'

export { discoverSkills, defaultSkillDirs } from './discover.js'
export type { DiscoverOptions } from './discover.js'
