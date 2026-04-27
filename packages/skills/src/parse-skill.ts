import { readFileSync } from 'fs'
import { basename, dirname } from 'path'
import type { RegisterSkillPayload, SkillSource } from '@loopythinking/sdk'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedSkill extends RegisterSkillPayload {
  /** Absolute path to the SKILL.md file */
  filePath: string
  /** Directory name (used as fallback skill name) */
  dirName: string
}

/** Raw frontmatter extracted from a SKILL.md file */
interface SkillFrontmatter {
  name?: string
  description?: string
  version?: string
  source?: string
  [key: string]: unknown
}

// ── YAML frontmatter parser ───────────────────────────────────────────────────
//
// SKILL.md files use a minimal YAML frontmatter block between --- delimiters.
// We parse only the fields we care about without pulling in a full YAML library,
// keeping @loopythinking/skills dependency-free at runtime.
//
// Supported value types: plain strings and quoted strings.
// Multiline values and complex YAML are not needed for skill metadata.

function parseFrontmatter(content: string): SkillFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const block = match[1]
  const result: SkillFrontmatter = {}

  for (const line of block.split(/\r?\n/)) {
    // Skip blank lines and comments
    if (!line.trim() || line.trim().startsWith('#')) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const key   = line.slice(0, colonIdx).trim()
    let   value = line.slice(colonIdx + 1).trim()

    // Strip surrounding quotes (single or double)
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (key && value) {
      result[key] = value
    }
  }

  return result
}

// ── Source inference ──────────────────────────────────────────────────────────
//
// Heuristic: infer the skill's source from its file path.
// ·  ~/.claude/skills/*/SKILL.md         → 'user'
// ·  .claude/skills/*/SKILL.md           → 'user'  (local project skill)
// ·  .remote-plugins/*/skills/*/SKILL.md → 'plugin'
// ·  (anything else)                     → 'user'  (safe default)

function inferSource(filePath: string): SkillSource {
  const normalised = filePath.replace(/\\/g, '/')
  if (normalised.includes('.remote-plugins') || normalised.includes('remote-plugins')) {
    return 'plugin'
  }
  return 'user'
}

// ── Description truncation ────────────────────────────────────────────────────
// The API enforces ≤ 500 chars; truncate gracefully if the SKILL.md is verbose.

const MAX_DESCRIPTION = 500

function truncate(text: string, max = MAX_DESCRIPTION): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '…'
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Parse a SKILL.md file and return a `RegisterSkillPayload` ready for the API.
 *
 * @param filePath  Absolute (or cwd-relative) path to the SKILL.md file.
 * @param overrides Optional overrides for any parsed field.
 *
 * @example
 * const skill = parseSkillFile('/home/user/.claude/skills/docx/SKILL.md')
 * // → { skillName: 'docx', description: '…', source: 'user' }
 */
export function parseSkillFile(
  filePath: string,
  overrides: Partial<RegisterSkillPayload> = {}
): ParsedSkill {
  const content  = readFileSync(filePath, 'utf8')
  const fm       = parseFrontmatter(content)
  const dirName  = basename(dirname(filePath))

  const skillName = (overrides.skillName
    ?? (typeof fm.name === 'string' ? fm.name.trim() : ''))
    || dirName

  const description = overrides.description
    ?? (typeof fm.description === 'string' ? truncate(fm.description.trim()) : undefined)

  const version = overrides.version
    ?? (typeof fm.version === 'string' ? fm.version.trim() : undefined)

  const rawSource = overrides.source
    ?? (typeof fm.source === 'string' ? fm.source.trim() as SkillSource : undefined)
    ?? inferSource(filePath)

  // Validate source value — fall back to 'user' for unknown strings
  const validSources: SkillSource[] = ['built-in', 'user', 'plugin']
  const source: SkillSource = validSources.includes(rawSource as SkillSource)
    ? rawSource as SkillSource
    : 'user'

  return {
    filePath,
    dirName,
    skillName,
    description,
    version,
    source,
    metadata: {
      parsedFrom: 'SKILL.md',
      frontmatterKeys: Object.keys(fm),
      ...overrides.metadata,
    },
  }
}

/**
 * Parse raw SKILL.md content directly (useful for testing without filesystem).
 */
export function parseSkillContent(
  content: string,
  fallbackName: string,
  filePath = '<inline>',
  overrides: Partial<RegisterSkillPayload> = {}
): ParsedSkill {
  const fm = parseFrontmatter(content)

  const skillName = (overrides.skillName
    ?? (typeof fm.name === 'string' ? fm.name.trim() : ''))
    || fallbackName

  const description = overrides.description
    ?? (typeof fm.description === 'string' ? truncate(fm.description.trim()) : undefined)

  const version = overrides.version
    ?? (typeof fm.version === 'string' ? fm.version.trim() : undefined)

  const rawSource = overrides.source
    ?? (typeof fm.source === 'string' ? fm.source.trim() as SkillSource : undefined)
    ?? 'user'

  const validSources: SkillSource[] = ['built-in', 'user', 'plugin']
  const source: SkillSource = validSources.includes(rawSource as SkillSource)
    ? rawSource as SkillSource
    : 'user'

  return {
    filePath,
    dirName: fallbackName,
    skillName,
    description,
    version,
    source,
    metadata: {
      parsedFrom: 'content',
      frontmatterKeys: Object.keys(fm),
      ...overrides.metadata,
    },
  }
}
