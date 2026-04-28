import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, last4 } from '../services/crypto.js'

// Set up encryption key for tests
process.env.LOOPY_ENCRYPTION_KEY = 'dGVzdC1rZXktZm9yLXVuaXQtdGVzdHMtMTIzNDU2Nzg='

describe('crypto', () => {
  it('encrypts and decrypts a string', () => {
    const plaintext = 'sk-ant-test-key-12345'
    const cipher = encrypt(plaintext)
    expect(cipher).toBeTruthy()
    expect(cipher).not.toEqual(plaintext)
    expect(cipher).toMatch(/^[A-Za-z0-9+/=]+$/) // base64

    const decrypted = decrypt(cipher)
    expect(decrypted).toEqual(plaintext)
  })

  it('produces different ciphertexts for the same plaintext (different IV)', () => {
    const plaintext = 'same-key'
    const c1 = encrypt(plaintext)
    const c2 = encrypt(plaintext)
    expect(c1).not.toEqual(c2)
    expect(decrypt(c1)).toEqual(plaintext)
    expect(decrypt(c2)).toEqual(plaintext)
  })

  it('returns last 4 characters', () => {
    expect(last4('sk-ant-test-key-12345')).toEqual('2345')
    expect(last4('ab')).toEqual('ab')
    expect(last4('')).toEqual('')
  })

  it('throws on missing LOOPY_ENCRYPTION_KEY', () => {
    const key = process.env.LOOPY_ENCRYPTION_KEY
    delete process.env.LOOPY_ENCRYPTION_KEY
    expect(() => encrypt('test')).toThrow('LOOPY_ENCRYPTION_KEY')
    process.env.LOOPY_ENCRYPTION_KEY = key
  })

  it('throws on short LOOPY_ENCRYPTION_KEY', () => {
    const key = process.env.LOOPY_ENCRYPTION_KEY
    process.env.LOOPY_ENCRYPTION_KEY = Buffer.from('too-short').toString('base64')
    expect(() => encrypt('test')).toThrow('32-byte')
    process.env.LOOPY_ENCRYPTION_KEY = key
  })
})
