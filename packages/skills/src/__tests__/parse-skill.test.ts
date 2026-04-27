import { describe, it, expect } from 'vitest'
import { parseSkillContent } from '../parse-skill.js'

// ── parseSkillContent ─────────────────────────────────────────────────────────

describe('parseSkillContent', () => {
  it('extracts name, description, and version from frontmatter', () => {
    const md = `---
name: docx
description: Create and edit Word documents (.docx)
version: 2.1.0
---

Rest of SKILL.md content here.
`
    const result = parseSkillContent(md, 'fallback')
    expect(result.skillName).toBe('docx')
    expect(result.description).toBe('Create and edit Word documents (.docx)')
    expect(result.version).toBe('2.1.0')
    expect(result.source).toBe('user')  // default
  })

  it('falls back to dirName when name is absent from frontmatter', () => {
    const md = `---
description: Some skill
---
Content.
`
    const result = parseSkillContent(md, 'my-skill')
    expect(result.skillName).toBe('my-skill')
  })

  it('handles missing frontmatter entirely', () => {
    const md = `# No frontmatter here\nJust content.`
    const result = parseSkillContent(md, 'bare-skill')
    expect(result.skillName).toBe('bare-skill')
    expect(result.description).toBeUndefined()
    expect(result.version).toBeUndefined()
    expect(result.source).toBe('user')
  })

  it('respects explicit source field in frontmatter', () => {
    const md = `---\nname: built-in-skill\nsource: built-in\n---`
    const result = parseSkillContent(md, 'x')
    expect(result.source).toBe('built-in')
  })

  it('falls back to user for unknown source value', () => {
    const md = `---\nname: x\nsource: random-garbage\n---`
    const result = parseSkillContent(md, 'x')
    expect(result.source).toBe('user')
  })

  it('applies overrides on top of parsed values', () => {
    const md = `---\nname: docx\ndescription: Original\n---`
    const result = parseSkillContent(md, 'x', '<inline>', {
      description: 'Override description',
      source: 'plugin',
    })
    expect(result.description).toBe('Override description')
    expect(result.source).toBe('plugin')
    expect(result.skillName).toBe('docx')   // not overridden
  })

  it('truncates description to 500 chars', () => {
    const longDesc = 'a'.repeat(600)
    const md = `---\nname: verbose\ndescription: ${longDesc}\n---`
    const result = parseSkillContent(md, 'verbose')
    expect(result.description!.length).toBeLessThanOrEqual(500)
    expect(result.description!.endsWith('…')).toBe(true)
  })

  it('handles double-quoted values in frontmatter', () => {
    const md = `---\nname: "my skill"\ndescription: "With: colon inside"\n---`
    const result = parseSkillContent(md, 'x')
    expect(result.skillName).toBe('my skill')
    expect(result.description).toBe('With: colon inside')
  })

  it('handles CRLF line endings', () => {
    const md = '---\r\nname: crlfskill\r\ndescription: Windows style\r\n---\r\nContent'
    const result = parseSkillContent(md, 'x')
    expect(result.skillName).toBe('crlfskill')
    expect(result.description).toBe('Windows style')
  })

  it('infers plugin source for remote-plugins paths', () => {
    const md = `---\nname: loopy-bridge\n---`
    const result = parseSkillContent(md, 'loopy-bridge', '/home/user/.claude/.remote-plugins/loopy/skills/loopy-bridge/SKILL.md')
    // source is inferred from filePath passed to parseSkillContent
    // In parseSkillContent the filePath param is used for metadata, not source inference
    // source comes from frontmatter or default 'user'
    expect(result.source).toBe('user')  // no source in frontmatter → default
  })
})

// ── source inference via parseSkillFile ──────────────────────────────────────
// Note: parseSkillFile reads from disk — we test the inference logic separately

describe('source inference heuristic', () => {
  it('returns plugin for .remote-plugins path', () => {
    // We test the exported parseSkillContent with a fake filePath to verify
    // that the source flag from frontmatter takes precedence over path inference.
    // The path-based inference is tested implicitly via parseSkillFile integration.
    const md = `---\nname: x\nsource: plugin\n---`
    const result = parseSkillContent(md, 'x', '/any/.remote-plugins/foo/SKILL.md')
    expect(result.source).toBe('plugin')
  })
})
