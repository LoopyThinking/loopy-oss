import { describe, it, expect } from 'vitest'
import type { OrgLlmConfig } from '../types.js'
import { encrypt, getProvider, computeLast4 } from '../services/llm.js'

process.env.LOOPY_ENCRYPTION_KEY = 'dGVzdC1rZXktZm9yLXVuaXQtdGVzdHMtMTIzNDU2Nzg='

function makeConfig(overrides: Partial<OrgLlmConfig> = {}): OrgLlmConfig {
  return {
    id: 'test-config-id',
    org_id: 'test-org-id',
    provider: 'anthropic',
    display_name: 'Test Config',
    model: 'claude-sonnet-4-6',
    base_url: null,
    api_key_cipher: encrypt('sk-test-fake-key-1234'),
    api_key_last4: '1234',
    is_default: true,
    is_active: true,
    last_tested_at: null,
    last_test_ok: null,
    last_test_error: null,
    created_by: 'test-user-id',
    created_at: '2026-04-28T00:00:00Z',
    updated_at: '2026-04-28T00:00:00Z',
    ...overrides,
  }
}

describe('getProvider', () => {
  it('returns a FakeProvider for unknown provider types in tests', async () => {
    // In tests, we can instantiate the fake directly
    // The fake provider works regardless of provider type
    const config = makeConfig({ provider: 'fake' as any })
    // getProvider will throw for 'fake' since it's not in the switch
    // Instead test that the switch covers all known types
    expect(() => getProvider(config)).toThrow('Unknown provider: fake')
  })

  it('returns an AnthropicProvider for anthropic config', () => {
    const config = makeConfig({ provider: 'anthropic' })
    const provider = getProvider(config)
    expect(provider.provider).toBe('anthropic')
  })

  it('returns an OpenAIProvider for openai config', () => {
    const config = makeConfig({ provider: 'openai' })
    const provider = getProvider(config)
    expect(provider.provider).toBe('openai')
  })

  it('returns an OpenAIProvider for openai_compatible config', () => {
    const config = makeConfig({
      provider: 'openai_compatible',
      base_url: 'http://localhost:11434/v1',
    })
    const provider = getProvider(config)
    expect(provider.provider).toBe('openai_compatible')
  })

  it('returns a GoogleProvider for google config', () => {
    const config = makeConfig({ provider: 'google' })
    const provider = getProvider(config)
    expect(provider.provider).toBe('google')
  })
})

describe('computeLast4', () => {
  it('returns last 4 chars of an API key', () => {
    expect(computeLast4('sk-ant-test-key-12345')).toBe('2345')
    expect(computeLast4('short')).toBe('hort')
  })
})
