import crypto from 'crypto'
import { cookies } from 'next/headers'
import { getAdminClient } from './supabase/admin'

const SESSION_COOKIE = 'admin_session'
const SESSION_MAX_AGE = 8 * 60 * 60        // 8h in seconds
const INACTIVITY_TIMEOUT = 10 * 60 * 1000  // 10min in ms

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createSession(payload: {
  admin_id: string
  device_hash: string
  ip_address: string
  user_agent: string
}): Promise<string> {
  const db = getAdminClient()
  const id = generateSessionId()
  const now = new Date()

  await db.from('admin_sessions').insert({
    id,
    ...payload,
    last_active: now.toISOString(),
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_MAX_AGE * 1000).toISOString(),
    revoked: false,
  })

  return id
}

export async function validateSession(sessionId: string): Promise<{
  valid: boolean
  admin_id?: string
  session?: Record<string, unknown>
}> {
  if (!sessionId) return { valid: false }
  const db = getAdminClient()
  const now = new Date()

  const { data, error } = await db
    .from('admin_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('revoked', false)
    .single()

  if (error || !data) return { valid: false }

  // Expired
  if (new Date(data.expires_at) < now) {
    await revokeSession(sessionId, 'expired')
    return { valid: false }
  }

  // Inactivity timeout
  if (now.getTime() - new Date(data.last_active).getTime() > INACTIVITY_TIMEOUT) {
    await revokeSession(sessionId, 'inactivity')
    return { valid: false }
  }

  // Refresh last_active
  await db
    .from('admin_sessions')
    .update({ last_active: now.toISOString() })
    .eq('id', sessionId)

  return { valid: true, admin_id: data.admin_id, session: data }
}

export async function revokeSession(sessionId: string, reason = 'logout'): Promise<void> {
  const db = getAdminClient()
  await db.from('admin_sessions').update({
    revoked: true,
    revoked_at: new Date().toISOString(),
    revoke_reason: reason,
  }).eq('id', sessionId)
}

export async function revokeAllSessions(adminId: string, reason = 'logout_all'): Promise<void> {
  const db = getAdminClient()
  await db.from('admin_sessions').update({
    revoked: true,
    revoked_at: new Date().toISOString(),
    revoke_reason: reason,
  }).eq('admin_id', adminId).eq('revoked', false)
}

export async function getSessionFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

export { SESSION_COOKIE }
