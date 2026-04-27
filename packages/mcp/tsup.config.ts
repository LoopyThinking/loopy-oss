import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
  // Mark the shebang so the output is directly executable
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['@modelcontextprotocol/sdk'],
})
