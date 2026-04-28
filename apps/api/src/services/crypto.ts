// AES-256-GCM encryption for API keys at rest.
// Uses LOOPY_ENCRYPTION_KEY (32-byte base64) from env.

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const raw = process.env.LOOPY_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      'LOOPY_ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32'
    )
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error(
      `LOOPY_ENCRYPTION_KEY must be a 32-byte base64 string (got ${key.length} bytes). ` +
      'Generate one with: openssl rand -base64 32'
    )
  }
  return key
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = require('crypto').randomBytes(IV_LENGTH)
  const cipher = require('crypto').createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: base64(iv || ciphertext || tag)
  return Buffer.concat([iv, encrypted, tag]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(buf.length - TAG_LENGTH)
  const data = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH)
  const decipher = require('crypto').createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data) + decipher.final('utf8')
}

export function last4(plaintext: string): string {
  return plaintext.slice(-4)
}
