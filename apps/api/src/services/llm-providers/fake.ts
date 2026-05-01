// Fake LLM provider for tests — returns canned responses.
import type { LLMProvider, LLMCompleteOpts, LLMResult } from '../llm.js'

export class FakeProvider implements LLMProvider {
  readonly provider = 'fake'

  async complete(opts: LLMCompleteOpts): Promise<LLMResult> {
    // If a JSON schema is provided, return a minimal valid response
    if (opts.schema) {
      return {
        content: '# Fake analysis\n\nThis is a fake provider response for testing.',
        structured: buildMockResult(opts.schema),
        usage: { input_tokens: 100, output_tokens: 50 },
      }
    }
    return {
      content: 'Fake response',
      usage: { input_tokens: 10, output_tokens: 5 },
    }
  }
}

function buildMockResult(schema: Record<string, unknown>): Record<string, unknown> {
  // Return a minimal conformant response based on the schema type
  if (schema.type === 'object' && schema.properties) {
    const result: Record<string, unknown> = {}
    for (const [key, prop] of Object.entries(schema.properties as Record<string, unknown>)) {
      const p = prop as { type?: string }
      if (p.type === 'string') result[key] = 'mock ' + key
      else if (p.type === 'number') result[key] = 42
      else if (p.type === 'boolean') result[key] = true
      else if (p.type === 'array') result[key] = []
      else if (p.type === 'object') result[key] = {}
    }
    return result
  }
  return {}
}
