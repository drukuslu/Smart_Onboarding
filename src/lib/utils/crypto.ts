import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET || 'default-key-change-in-production'
  return Buffer.from(secret.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH))
}

/**
 * Encrypt sensitive data (like API keys)
 */
export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH)
  const key = getEncryptionKey()

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const key = getEncryptionKey()
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate HMAC-SHA256 signature for webhook payloads
 */
export function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Verify HMAC-SHA256 signature
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateSignature(payload, secret)
  return signature === expectedSignature
}

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  return `fal_${randomBytes(32).toString('hex')}`
}
