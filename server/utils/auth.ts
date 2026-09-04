import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { getCookie, setCookie } from 'h3'
import { assertJwtSecret } from '../../shared/auth/secrets'
import { AUTH_COOKIE_NAME } from '../../shared/constants/roles'

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function getJwtSecretBytes(): Uint8Array {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret
  assertJwtSecret(secret, process.env.NODE_ENV === 'production')
  return new TextEncoder().encode(secret)
}

export async function signAuthToken(userId: string): Promise<string> {
  const secret = getJwtSecretBytes()
  return new SignJWT({})
    .setSubject(userId)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyAuthToken(token: string): Promise<string | null> {
  try {
    const secret = getJwtSecretBytes()
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export function readAuthCookie(event: H3Event): string | null {
  return getCookie(event, AUTH_COOKIE_NAME) ?? null
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_MAX_AGE_SECONDS,
  })
}

export function clearAuthCookie(event: H3Event) {
  setCookie(event, AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function getUserIdFromEvent(event: H3Event): Promise<string | null> {
  const token = readAuthCookie(event)
  if (!token) return null
  return verifyAuthToken(token)
}

export async function requireUserId(event: H3Event): Promise<string> {
  const uid = await getUserIdFromEvent(event)
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return uid
}
