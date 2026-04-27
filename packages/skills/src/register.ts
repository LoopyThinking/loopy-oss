import type { LoopyBridge, RegisterSkillPayload, RegisterToolPayload } from '@loopythinking/sdk'
import { discoverSkills, type DiscoverOptions } from './discover.js'
import { discoverMcpTools, getBuiltinTools } from './parse-mcp.js'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterCapabilitiesOptions {
  /**
   * An initialised `LoopyBridge` instance authenticated as the agent.
   */
  bridge: LoopyBridge

  /**
   * The UUID of the agent in `agent_registry`.
   * Available from the Loopy admin UI or from `POST /agents` response.
   */
  agentId: string

  // ── Skill discovery ──────────────────────────────────────────────────────

  /**
   * Extra directories to scan for SKILL.md files (in addition to defaults).
   * Paths can be absolute or relative to `cwd`.
   */
  skillDirs?: string[]

  /**
   * Set to `false` to skip default skill directory scanning
   * (~/.claude/skills/, ./.claude/skills/, etc.).
   * Defaults to `true`.
   */
  autoDiscoverSkills?: boolean

  // ── Tool discovery ───────────────────────────────────────────────────────

  /**
   * Explicit paths to MCP config files (JSON) to parse.
   * If provided, these are checked first before the default auto-detected paths.
   */
  mcpConfigPaths?: string[]

  /**
   * Set to `false` to skip auto-detecting MCP config files.
   * Defaults to `true`.
   */
  autoDiscoverMcp?: boolean

  /**
   * Register Claude Code built-in tools.
   * - `'all'`        — register all known built-in tools (default)
   * - `string[]`     — register only the named built-in tools
   * - `false`        — do not register built-in tools
   */
  builtinTools?: 'all' | string[] | false

  // ── Explicit lists ───────────────────────────────────────────────────────

  /**
   * Additional skills to register on top of (or instead of) auto-discovered ones.
   * These are merged after discovery — explicit entries override discovered ones
   * with the same `skillName`.
   */
  additionalSkills?: RegisterSkillPayload[]

  /**
   * Additional tools to register on top of (or instead of) auto-discovered ones.
   * Deduplicated by `toolName`.
   */
  additionalTools?: RegisterToolPayload[]

  // ── Behaviour ────────────────────────────────────────────────────────────

  /**
   * Working directory for resolving relative paths and default scan dirs.
   * Defaults to `process.cwd()`.
   */
  cwd?: string

  /**
   * Suppress all console output (warnings, progress).
   * Defaults to `false`.
   */
  silent?: boolean

  /**
   * Dry-run mode: discover and parse everything but do NOT call the API.
   * The result will contain the discovered data but `registeredSkills` and
   * `registeredTools` will be 0.
   * Useful for debugging what would be registered.
   */
  dryRun?: boolean
}

export interface RegisterCapabilitiesResult {
  /** Skills discovered (before deduplication / API call) */
  discoveredSkills: RegisterSkillPayload[]
  /** Tools discovered (before deduplication / API call) */
  discoveredTools: RegisterToolPayload[]
  /** Number of skills successfully registered with Loopy */
  registeredSkills: number
  /** Number of tools successfully registered with Loopy */
  registeredTools: number
  /** Whether this was a dry run (no API calls made) */
  dryRun: boolean
}

// ── registerCapabilities ──────────────────────────────────────────────────────

/**
 * Discover and register all agent capabilities (skills + tools) with a Loopy instance.
 *
 * Call this once at session start from your skill's init code. The operation is
 * idempotent — repeated calls update `last_seen_at` without creating duplicates.
 *
 * @example
 * // In your loopy-bridge SKILL.md init or equivalent:
 * import { LoopyBridge } from '@loopythinking/sdk'
 * import { registerCapabilities } from '@loopythinking/skills'
 *
 * const loopy = new LoopyBridge({ token: process.env.LOOPY_AGENT_REGISTRY_TOKEN })
 * const result = await registerCapabilities({
 *   bridge: loopy,
 *   agentId: process.env.LOOPY_AGENT_ID,
 * })
 * console.log(`Registered ${result.registeredSkills} skills, ${result.registeredTools} tools`)
 */
export async function registerCapabilities(
  options: RegisterCapabilitiesOptions
): Promise<RegisterCapabilitiesResult> {
  const {
    bridge,
    agentId,
    skillDirs = [],
    autoDiscoverSkills = true,
    mcpConfigPaths = [],
    autoDiscoverMcp = true,
    builtinTools = 'all',
    additionalSkills = [],
    additionalTools = [],
    cwd = process.cwd(),
    silent = false,
    dryRun = false,
  } = options

  // ── 1. Discover skills ────────────────────────────────────────────────────

  const discoverOpts: DiscoverOptions = {
    extraDirs: skillDirs,
    scanDefaults: autoDiscoverSkills,
    cwd,
    silent,
  }

  const discovered = autoDiscoverSkills || skillDirs.length > 0
    ? discoverSkills(discoverOpts)
    : []

  // Merge explicit additional skills (override by skillName)
  const skillMap = new Map<string, RegisterSkillPayload>()
  for (const s of discovered)           skillMap.set(s.skillName, s)
  for (const s of additionalSkills)     skillMap.set(s.skillName, s)
  const finalSkills = Array.from(skillMap.values())

  // ── 2. Discover tools ─────────────────────────────────────────────────────

  const mcpTools = autoDiscoverMcp || mcpConfigPaths.length > 0
    ? discoverMcpTools({ extraPaths: mcpConfigPaths, cwd, silent })
    : []

  const builtinList: RegisterToolPayload[] = builtinTools === false
    ? []
    : getBuiltinTools(builtinTools)

  // Merge (MCP tools take precedence over built-ins; additional tools override all)
  const toolMap = new Map<string, RegisterToolPayload>()
  for (const t of builtinList)       toolMap.set(t.toolName, t)
  for (const t of mcpTools)          toolMap.set(t.toolName, t)
  for (const t of additionalTools)   toolMap.set(t.toolName, t)
  const finalTools = Array.from(toolMap.values())

  if (!silent) {
    console.log(
      `[@loopythinking/skills] ${dryRun ? '[DRY RUN] ' : ''}Registering ` +
      `${finalSkills.length} skill(s) + ${finalTools.length} tool(s) ` +
      `for agent ${agentId.slice(0, 8)}…`
    )
  }

  // ── 3. Register via SDK ───────────────────────────────────────────────────

  if (dryRun) {
    return {
      discoveredSkills: finalSkills,
      discoveredTools:  finalTools,
      registeredSkills: 0,
      registeredTools:  0,
      dryRun: true,
    }
  }

  const { registeredSkills, registeredTools } = await bridge.registerBatch(agentId, {
    skills: finalSkills,
    tools:  finalTools,
  })

  if (!silent) {
    console.log(
      `[@loopythinking/skills] Done — ${registeredSkills} skill(s), ${registeredTools} tool(s) registered.`
    )
  }

  return {
    discoveredSkills: finalSkills,
    discoveredTools:  finalTools,
    registeredSkills,
    registeredTools,
    dryRun: false,
  }
}
