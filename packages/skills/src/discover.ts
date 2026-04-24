import { readdirSync, existsSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { homedir } from 'os'
import { parseSkillFile, type ParsedSkill } from './parse-skill.js'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiscoverOptions {
  /**
   * Additional directories to scan for SKILL.md files.
   * Each entry can be an absolute path or relative to process.cwd().
   */
  extraDirs?: string[]

  /**
   * Whether to scan the default system-level directories:
   *   · ~/.claude/skills/         (user skills)
   *   · <cwd>/.claude/skills/     (project-local skills)
   *   · ~/.claude/skills/../.remote-plugins/ (plugins, if present)
   *
   * Defaults to true.
   */
  scanDefaults?: boolean

  /**
   * Working directory used to resolve relative paths and default scan dirs.
   * Defaults to process.cwd().
   */
  cwd?: string

  /** Suppress console warnings (default: false) */
  silent?: boolean
}

// ── Default skill directories ─────────────────────────────────────────────────

export function defaultSkillDirs(cwd = process.cwd()): string[] {
  return [
    join(homedir(), '.claude', 'skills'),
    join(cwd, '.claude', 'skills'),
    join(homedir(), '.claude', '.remote-plugins'),
    join(cwd, '.claude', '.remote-plugins'),
  ]
}

// ── Recursive SKILL.md finder ─────────────────────────────────────────────────
//
// Walk a directory tree looking for files named exactly "SKILL.md".
// We deliberately don't go deeper than 3 levels to avoid scanning
// node_modules or other large trees inadvertently included in the path.

const MAX_DEPTH = 3

function findSkillFiles(
  dir: string,
  depth = 0,
  results: string[] = []
): string[] {
  if (depth > MAX_DEPTH) return results

  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return results
  }

  for (const entry of entries) {
    // Skip hidden dirs (except .remote-plugins which is expected)
    if (entry.startsWith('.') && entry !== '.remote-plugins') continue
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue

    const full = join(dir, entry)

    let stat
    try { stat = statSync(full) } catch { continue }

    if (stat.isDirectory()) {
      findSkillFiles(full, depth + 1, results)
    } else if (entry === 'SKILL.md') {
      results.push(full)
    }
  }

  return results
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Discover all SKILL.md files in the default and/or extra directories and
 * parse each into a `ParsedSkill` object.
 *
 * Deduplicated by `skillName` — first occurrence (in discovery order) wins.
 *
 * @example
 * const skills = discoverSkills()
 * // → [{ skillName: 'docx', source: 'plugin', ... }, ...]
 */
export function discoverSkills(options: DiscoverOptions = {}): ParsedSkill[] {
  const {
    extraDirs = [],
    scanDefaults = true,
    cwd = process.cwd(),
    silent = false,
  } = options

  const dirsToScan: string[] = [
    ...extraDirs.map(d => resolve(cwd, d)),
    ...(scanDefaults ? defaultSkillDirs(cwd) : []),
  ]

  const skillFiles: string[] = []

  for (const dir of dirsToScan) {
    if (!existsSync(dir)) continue
    try {
      findSkillFiles(dir, 0, skillFiles)
    } catch (err) {
      if (!silent) {
        console.warn(`[@loopy/skills] Warning: error scanning ${dir}:`, err)
      }
    }
  }

  const seen = new Set<string>()
  const skills: ParsedSkill[] = []

  for (const filePath of skillFiles) {
    try {
      const parsed = parseSkillFile(filePath)
      if (seen.has(parsed.skillName)) continue
      seen.add(parsed.skillName)
      skills.push(parsed)
    } catch (err) {
      if (!silent) {
        console.warn(`[@loopy/skills] Warning: could not parse ${filePath}:`, err)
      }
    }
  }

  return skills
}
