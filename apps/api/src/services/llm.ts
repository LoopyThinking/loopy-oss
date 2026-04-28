// LLM provider abstraction for analytics.
// Supports: anthropic, openai, google, openai_compatible
// Each provider implements the LLMProvider interface.
// The factory selects the right provider based on the stored config.

import { encrypt, decrypt, last4 as computeLast4 } from './crypto.js'
import type { OrgLlmConfig } from '../types.js'

// ── Interfaces ──────────────────────────────────────────────────────────────────

export interface LLMResult {
  content: string
  structured?: Record<string, unknown>
  usage: { input_tokens: number; output_tokens: number }
}

export interface LLMCompleteOpts {
  systemPrompt: string
  userPrompt: string
  schema?: Record<string, unknown>  // JSON Schema for structured output
  temperature?: number
}

export interface LLMProvider {
  readonly provider: string
  complete(opts: LLMCompleteOpts): Promise<LLMResult>
}

// ── Provider implementations ─────────────────────────────────────────────────────

class AnthropicProvider implements LLMProvider {
  readonly provider = 'anthropic'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async complete(opts: LLMCompleteOpts): Promise<LLMResult> {
    const messages: Array<{ role: string; content: string }> = []
    if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt })
    messages.push({ role: 'user', content: opts.userPrompt })

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      messages,
    }

    if (opts.schema) {
      body.tools = [{
        name: 'structured_output',
        description: 'Respond with structured output matching the schema',
        input_schema: opts.schema,
      }]
      body.tool_choice = { type: 'tool', name: 'structured_output' }
    }

    if (opts.temperature !== undefined) body.temperature = opts.temperature

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown')
      throw new Error(`Anthropic API error ${res.status}: ${err}`)
    }

    const json = await res.json() as {
      content: Array<{ type: string; text?: string; input?: Record<string, unknown> }>
      usage: { input_tokens: number; output_tokens: number }
    }

    let content = ''
    let structured: Record<string, unknown> | undefined
    for (const block of json.content) {
      if (block.type === 'text') content += block.text
      if (block.type === 'tool_use' && block.input) structured = block.input
    }

    return { content, structured, usage: json.usage }
  }
}

class OpenAIProvider implements LLMProvider {
  readonly provider = 'openai'
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(apiKey: string, model: string, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.model = model
    this.baseUrl = baseUrl
  }

  async complete(opts: LLMCompleteOpts): Promise<LLMResult> {
    const messages: Array<{ role: string; content: string }> = []
    if (opts.systemPrompt) messages.push({ role: 'system', content: opts.systemPrompt })
    messages.push({ role: 'user', content: opts.userPrompt })

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      messages,
    }

    if (opts.schema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'structured_output',
          strict: true,
          schema: opts.schema,
        },
      }
    }

    if (opts.temperature !== undefined) body.temperature = opts.temperature

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown')
      throw new Error(`OpenAI API error ${res.status}: ${err}`)
    }

    const json = await res.json() as {
      choices: Array<{ message: { content: string | null } }>
      usage: { prompt_tokens: number; completion_tokens: number }
    }

    const raw = json.choices[0]?.message?.content ?? ''
    let structured: Record<string, unknown> | undefined
    if (opts.schema) {
      try { structured = JSON.parse(raw) as Record<string, unknown> } catch { /* use as plain text */ }
    }

    return {
      content: raw,
      structured,
      usage: { input_tokens: json.usage.prompt_tokens, output_tokens: json.usage.completion_tokens },
    }
  }
}

// OpenAI-compatible provider (Ollama, Together, Groq, vLLM)
class OpenAICompatibleProvider extends OpenAIProvider {
  readonly provider = 'openai_compatible'
}

// Google Gemini provider
class GoogleProvider implements LLMProvider {
  readonly provider = 'google'
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async complete(opts: LLMCompleteOpts): Promise<LLMResult> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
    if (opts.systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: opts.systemPrompt + '\n\n' + opts.userPrompt }] })
    } else {
      contents.push({ role: 'user', parts: [{ text: opts.userPrompt }] })
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: 4096,
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      },
    }

    if (opts.schema) {
      body.generationConfig.responseMimeType = 'application/json'
      body.generationConfig.responseSchema = opts.schema
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown')
      throw new Error(`Google AI error ${res.status}: ${err}`)
    }

    const json = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number }
    }

    const raw = json.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? ''
    let structured: Record<string, unknown> | undefined
    if (opts.schema) {
      try { structured = JSON.parse(raw) as Record<string, unknown> } catch { /* use as plain text */ }
    }

    return {
      content: raw,
      structured,
      usage: {
        input_tokens: json.usageMetadata?.promptTokenCount ?? 0,
        output_tokens: json.usageMetadata?.candidatesTokenCount ?? 0,
      },
    }
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────────

export function getProvider(config: OrgLlmConfig): LLMProvider {
  const apiKey = decrypt(config.api_key_cipher)

  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(apiKey, config.model)
    case 'openai':
      return new OpenAIProvider(apiKey, config.model)
    case 'google':
      return new GoogleProvider(apiKey, config.model)
    case 'openai_compatible':
      return new OpenAICompatibleProvider(apiKey, config.model, config.base_url ?? undefined)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

export { encrypt, decrypt, computeLast4 }

/** Send a 1-token test ping to verify the provider connection */
export async function testConnection(config: OrgLlmConfig): Promise<{
  ok: boolean; error?: string
}> {
  try {
    const provider = getProvider(config)
    await provider.complete({
      systemPrompt: 'Reply with a single word: ok',
      userPrompt: 'Say ok',
      temperature: 0,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
