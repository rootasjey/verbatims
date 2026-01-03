import { scrypt } from '@noble/hashes/scrypt.js'

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  dkLen: 64,
}

const SALT_LENGTH = 16

function getSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH)
  crypto.getRandomValues(salt)
  return salt
}

function toBase64(data: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(data).toString('base64')
  }
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'))
  }
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    diff |= ai ^ bi
  }
  return diff === 0
}

function parsePhc(value: string) {
  const parts = value.split('$')
  const [, algorithm, paramStr = '', saltPart = '', hashPart = ''] = parts
  if (parts.length !== 5 || algorithm !== 'scrypt') {
    throw new Error('Invalid scrypt hash format')
  }

  const params = paramStr.split(',').reduce<Record<string, number>>((acc, entry) => {
    const [k, v] = entry.split('=')
    if (!k || v === undefined) return acc
    acc[k] = Number(v)
    return acc
  }, {})

  return {
    params,
    salt: fromBase64(saltPart),
    hash: fromBase64(hashPart),
  }
}

export async function hashPasswordWorker(plain: string): Promise<string> {
  const salt = getSalt()
  const encoded = typeof plain === 'string' ? new TextEncoder().encode(plain) : new Uint8Array()
  const derived = await scrypt(encoded, salt, SCRYPT_PARAMS)
  return `$scrypt$n=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}$${toBase64(salt)}$${toBase64(derived)}`
}

export async function verifyPasswordWorker(hashedPassword: string, plain: string): Promise<boolean> {
  try {
    const { params, salt, hash } = parsePhc(hashedPassword)
    const encoded = typeof plain === 'string' ? new TextEncoder().encode(plain) : new Uint8Array()
    const derived = await scrypt(encoded, salt, {
      N: Number(params.n) || SCRYPT_PARAMS.N,
      r: Number(params.r) || SCRYPT_PARAMS.r,
      p: Number(params.p) || SCRYPT_PARAMS.p,
      dkLen: hash.length || SCRYPT_PARAMS.dkLen,
    })
    return timingSafeEqual(hash, derived)
  } catch {
    return false
  }
}