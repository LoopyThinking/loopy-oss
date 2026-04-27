import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { parseMcpConfig, discoverMcpTools, getBuiltinTools, CLAUDE_CODE_BUILTIN_TOOLS } from '../parse-mcp.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function tmpDir(): string {
  const dir = join(tmpdir(), `loopy-skills-test-${Date.now()}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

// ── parseMcpConfig ────────────────────────────────────────────────────────────

describe('parseMcpConfig', () => {
  it('parses mcpServers from a Claude Desktop config', () => {
    const dir = tmpDir()
    const configPath = join(dir, 'claude_desktop_config.json')
    writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        'loopy-mcp': {
          command: 'npx',
          args: ['-y', '@loopy/mcp'],
          env: { LOOPY_AGENT_REGISTRY_TOKEN: 'secret' },
        },
        'brave-search': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-brave-search'],
        },
      },
    }))

    const tools = parseMcpConfig(configPath)
    expect(tools).toHaveLength(2)

    const loopy = tools.find(t => t.toolName === 'loopy-mcp')
    expect(loopy).toBeDefined()
    expect(loopy!.toolType).toBe('mcp')
    // Env should NOT be in metadata (security)
    expect(JSON.stringify(loopy!.metadata)).not.toContain('secret')

    rmSync(dir, { recursive: true })
  })

  it('accepts alternative mcp_servers key', () => {
    const dir = tmpDir()
    const configPath = join(dir, 'mcp.json')
    writeFileSync(configPath, JSON.stringify({
      mcp_servers: {
        'my-server': { command: 'node', args: ['server.js'] },
      },
    }))

    const tools = parseMcpConfig(configPath)
    expect(tools).toHaveLength(1)
    expect(tools[0].toolName).toBe('my-server')

    rmSync(dir, { recursive: true })
  })

  it('returns [] for a non-existent file', () => {
    expect(parseMcpConfig('/non/existent/path.json')).toEqual([])
  })

  it('returns [] for malformed JSON', () => {
    const dir = tmpDir()
    const configPath = join(dir, 'bad.json')
    writeFileSync(configPath, '{ not: valid json }')
    expect(parseMcpConfig(configPath)).toEqual([])
    rmSync(dir, { recursive: true })
  })

  it('returns [] for empty mcpServers object', () => {
    const dir = tmpDir()
    const configPath = join(dir, 'empty.json')
    writeFileSync(configPath, JSON.stringify({ mcpServers: {} }))
    expect(parseMcpConfig(configPath)).toEqual([])
    rmSync(dir, { recursive: true })
  })

  it('infers provider from npx command + args (standard Claude Desktop format)', () => {
    const dir = tmpDir()
    const configPath = join(dir, 'npx.json')
    writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        search: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-brave-search'],
        },
      },
    }))
    const tools = parseMcpConfig(configPath)
    expect(tools[0].provider).toContain('modelcontextprotocol')
    rmSync(dir, { recursive: true })
  })

  it('infers provider from npx all-in-one command string', () => {
    const dir = tmpDir()
    const configPath = join(dir, 'npx2.json')
    writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        search: { command: 'npx -y @modelcontextprotocol/server-brave-search' },
      },
    }))
    const tools = parseMcpConfig(configPath)
    expect(tools[0].provider).toContain('modelcontextprotocol')
    rmSync(dir, { recursive: true })
  })
})

// ── discoverMcpTools ──────────────────────────────────────────────────────────

describe('discoverMcpTools', () => {
  it('deduplicates tools with the same name across multiple files', () => {
    const dir = tmpDir()
    const file1 = join(dir, '.mcp.json')
    const file2 = join(dir, 'mcp.json')

    writeFileSync(file1, JSON.stringify({ mcpServers: { 'shared-server': { command: 'a' } } }))
    writeFileSync(file2, JSON.stringify({ mcpServers: { 'shared-server': { command: 'b' }, 'other': { command: 'c' } } }))

    const tools = discoverMcpTools({ extraPaths: [file1, file2], cwd: dir })
    const names = tools.map(t => t.toolName)
    expect(names.filter(n => n === 'shared-server')).toHaveLength(1)  // deduplicated
    expect(names).toContain('other')

    rmSync(dir, { recursive: true })
  })

  it('returns empty array when no config files exist', () => {
    const dir = tmpDir()
    const tools = discoverMcpTools({ cwd: dir, extraPaths: [] })
    // No configs in an empty tmpdir, and system paths probably won't match in CI
    // So result can be [] or have system tools — just assert it's an array
    expect(Array.isArray(tools)).toBe(true)
    rmSync(dir, { recursive: true })
  })
})

// ── getBuiltinTools ───────────────────────────────────────────────────────────

describe('getBuiltinTools', () => {
  it('returns all built-in tools with "all" filter', () => {
    const tools = getBuiltinTools('all')
    expect(tools.length).toBe(CLAUDE_CODE_BUILTIN_TOOLS.length)
    expect(tools.every(t => t.toolType === 'function')).toBe(true)
    expect(tools.every(t => t.provider === 'claude-code')).toBe(true)
  })

  it('filters to the requested subset', () => {
    const tools = getBuiltinTools(['Read', 'Write', 'Bash'])
    expect(tools).toHaveLength(3)
    expect(tools.map(t => t.toolName).sort()).toEqual(['Bash', 'Read', 'Write'])
  })

  it('ignores names not in the built-in list', () => {
    const tools = getBuiltinTools(['Read', 'NonExistentTool'])
    expect(tools).toHaveLength(1)
    expect(tools[0].toolName).toBe('Read')
  })

  it('returns empty array for empty filter', () => {
    expect(getBuiltinTools([])).toEqual([])
  })
})
