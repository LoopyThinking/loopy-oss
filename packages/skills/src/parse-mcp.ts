import { readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { homedir, platform } from 'os'
import type { RegisterToolPayload } from '@loopythinking/sdk'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedTool extends RegisterToolPayload {
  /** Path to the config file this tool was discovered in */
  configFile: string
}

/** Shape of an entry in Claude Desktop's `mcpServers` map */
interface McpServerEntry {
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string          // for HTTP-based MCP servers
  [key: string]: unknown
}

/** Minimal shape of a Claude Desktop / .mcp.json config file */
interface McpConfigFile {
  mcpServers?: Record<string, McpServerEntry>
  /** Alternative key used in some tools */
  mcp_servers?: Record<string, McpServerEntry>
  [key: string]: unknown
}

// ── Default candidate paths ───────────────────────────────────────────────────
//
// Search order (first match wins):
//   1. Explicit path passed by the caller
//   2. .mcp.json in the current working directory
//   3. mcp.json in the current working directory
//   4. ~/.claude/claude_desktop_config.json  (macOS / Linux)
//   5. %APPDATA%\Claude\claude_desktop_config.json  (Windows)

export function defaultMcpConfigPaths(cwd = process.cwd()): string[] {
  const candidates: string[] = [
    join(cwd, '.mcp.json'),
    join(cwd, 'mcp.json'),
  ]

  if (platform() === 'win32') {
    const appdata = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming')
    candidates.push(join(appdata, 'Claude', 'claude_desktop_config.json'))
  } else {
    // macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
    // Linux: ~/.config/claude/claude_desktop_config.json
    // Both platforms also support the generic ~/.claude location used by Claude Code
    candidates.push(
      join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      join(homedir(), '.config', 'claude', 'claude_desktop_config.json'),
      join(homedir(), '.claude', 'claude_desktop_config.json'),
    )
  }

  return candidates
}

// ── Provider inference ────────────────────────────────────────────────────────
//
// Try to infer a human-readable provider name from the server command / URL.

function inferProvider(name: string, entry: McpServerEntry): string {
  if (entry.url) {
    try {
      return new URL(entry.url).hostname
    } catch {
      return name
    }
  }

  const cmd  = entry.command ?? ''
  const args = Array.isArray(entry.args) ? entry.args : []

  // Case 1: command = "npx", args = ["-y", "@scope/package", ...]
  if (/^npx$/i.test(cmd.trim())) {
    const pkgArg = args.find(a => !a.startsWith('-') && a.length > 0)
    if (pkgArg) return pkgArg
  }

  // Case 2: command = "npx -y @scope/package ..." (all in one string)
  const npxMatch = cmd.match(/npx\s+(?:[-\w]+\s+)*(@?[a-z0-9][@a-z0-9_/.-]*)/i)
  if (npxMatch) return npxMatch[1]

  // Case 3: node server.js → parent dir name (from command or first arg)
  const jsPath = args.find(a => a.endsWith('.js') || a.endsWith('.mjs')) ?? ''
  if (jsPath) {
    const parts = jsPath.replace(/\\/g, '/').split('/')
    return parts[parts.length - 2] ?? parts[parts.length - 1]
  }

  return name
}

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse a single MCP config file and return one `RegisterToolPayload` per server.
 *
 * @param configPath  Absolute path to the JSON config file.
 *
 * @example
 * const tools = parseMcpConfig('/home/user/.claude/claude_desktop_config.json')
 * // → [{ toolName: 'loopy-mcp', toolType: 'mcp', provider: 'loopythinking', ... }]
 */
export function parseMcpConfig(configPath: string): ParsedTool[] {
  let raw: string
  try {
    raw = readFileSync(configPath, 'utf8')
  } catch {
    return []
  }

  let config: McpConfigFile
  try {
    config = JSON.parse(raw) as McpConfigFile
  } catch {
    // Silently skip malformed JSON — the file may not be a valid config
    return []
  }

  const servers = config.mcpServers ?? config.mcp_servers ?? {}
  const tools: ParsedTool[] = []

  for (const [name, entry] of Object.entries(servers)) {
    if (typeof entry !== 'object' || entry === null) continue

    tools.push({
      configFile: configPath,
      toolName: name,
      toolType: 'mcp',
      provider: inferProvider(name, entry),
      description: undefined,   // MCP configs rarely have descriptions
      metadata: {
        parsedFrom: 'mcpConfig',
        configFile: configPath,
        command: entry.command,
        // Omit env entirely to avoid leaking secrets into Loopy's DB
      },
    })
  }

  return tools
}

/**
 * Auto-discover MCP tools by scanning candidate config file paths.
 * Returns unique tools (deduplicated by toolName — first occurrence wins).
 *
 * @param options.extraPaths   Additional config paths to check before defaults.
 * @param options.cwd          Working directory for relative candidate paths (default: process.cwd()).
 * @param options.silent       Suppress console warnings on parse errors (default: false).
 */
export function discoverMcpTools(options: {
  extraPaths?: string[]
  cwd?: string
  silent?: boolean
} = {}): ParsedTool[] {
  const { extraPaths = [], cwd, silent = false } = options

  const candidatePaths = [
    ...extraPaths.map(p => resolve(p)),
    ...defaultMcpConfigPaths(cwd),
  ]

  const seen = new Set<string>()
  const tools: ParsedTool[] = []

  for (const p of candidatePaths) {
    if (!existsSync(p)) continue

    try {
      const discovered = parseMcpConfig(p)
      for (const tool of discovered) {
        if (!seen.has(tool.toolName)) {
          seen.add(tool.toolName)
          tools.push(tool)
        }
      }
    } catch (err) {
      if (!silent) {
        console.warn(`[@loopythinking/skills] Warning: could not parse MCP config at ${p}:`, err)
      }
    }
  }

  return tools
}

// ── Built-in Claude Code tools ────────────────────────────────────────────────
//
// These tools are always available in a Claude Code / Cowork session.
// They don't appear in any config file — we register them explicitly.

export const CLAUDE_CODE_BUILTIN_TOOLS: ReadonlyArray<RegisterToolPayload> = [
  { toolName: 'Read',           toolType: 'function', provider: 'claude-code', description: 'Read file contents' },
  { toolName: 'Write',          toolType: 'function', provider: 'claude-code', description: 'Write file contents' },
  { toolName: 'Edit',           toolType: 'function', provider: 'claude-code', description: 'Edit file with string replacement' },
  { toolName: 'Bash',           toolType: 'function', provider: 'claude-code', description: 'Execute shell commands' },
  { toolName: 'Glob',           toolType: 'function', provider: 'claude-code', description: 'Find files by glob pattern' },
  { toolName: 'Grep',           toolType: 'function', provider: 'claude-code', description: 'Search file contents with regex' },
  { toolName: 'Agent',          toolType: 'function', provider: 'claude-code', description: 'Spawn sub-agents for parallel work' },
  { toolName: 'WebSearch',      toolType: 'function', provider: 'claude-code', description: 'Search the web' },
  { toolName: 'WebFetch',       toolType: 'function', provider: 'claude-code', description: 'Fetch web page content' },
  { toolName: 'NotebookEdit',   toolType: 'function', provider: 'claude-code', description: 'Edit Jupyter notebook cells' },
  { toolName: 'TodoWrite',      toolType: 'function', provider: 'claude-code', description: 'Create and manage task lists' },
]

/**
 * Return the subset of built-in tools matching the given names.
 * Pass `'all'` to return every built-in tool.
 *
 * @example
 * getBuiltinTools(['Read', 'Write', 'Bash'])
 * getBuiltinTools('all')
 */
export function getBuiltinTools(
  filter: string[] | 'all' = 'all'
): RegisterToolPayload[] {
  if (filter === 'all') return [...CLAUDE_CODE_BUILTIN_TOOLS]
  const nameSet = new Set(filter)
  return CLAUDE_CODE_BUILTIN_TOOLS.filter(t => nameSet.has(t.toolName))
}
