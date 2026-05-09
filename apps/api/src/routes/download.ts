import { Hono } from 'hono'

// GET /download/plugin — serve the .plugin file with LOOPY_BASE_URL injected.
//
// The .plugin file is expected at apps/api/dist/loopy-oss.plugin or
// apps/api/loopy-oss.plugin. If missing, returns 404 with instructions.

const download = new Hono()

download.get('/plugin', async (c) => {
  const baseUrl = process.env.LOOPY_BASE_URL ?? `${c.req.header('X-Forwarded-Proto') ?? 'http'}://${c.req.header('host') ?? 'localhost:3001'}`

  // Try multiple locations for the plugin file
  const paths = [
    new URL('../loopy-oss.plugin', import.meta.url),
    new URL('../../loopy-oss.plugin', import.meta.url),
  ]

  let content: Buffer | null = null
  for (const p of paths) {
    try {
      const fs = await import('fs')
      content = fs.readFileSync(p)
      break
    } catch { /* try next */ }
  }

  if (!content) {
    return c.json({
      error: 'Not Found',
      message: 'Plugin file not available. Build the plugin with LOOPY_BASE_URL and place loopy-oss.plugin in the API dist directory.',
    }, 404)
  }

  // Inject LOOPY_BASE_URL into the plugin JSON
  let plugin: Record<string, unknown>
  try {
    plugin = JSON.parse(content.toString('utf8'))
  } catch {
    return c.json({ error: 'Internal Server Error', message: 'Invalid plugin file format' }, 500)
  }
  plugin.LOOPY_BASE_URL = baseUrl
  const patched = Buffer.from(JSON.stringify(plugin, null, 2), 'utf8')

  return c.newResponse(patched, 200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename="loopy-oss.plugin"',
  })
})

export default download
