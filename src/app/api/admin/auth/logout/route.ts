import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, revokeSession, revokeAllSessions, validateSession, SESSION_COOKIE } from '@/lib/session'
import { logSecurityEvent, SEC } from '@/lib/security-events'

export async function POST(req: NextRequest) {
  const sessionId = await getSessionFromCookie()
  if (!sessionId) {
    return NextResponse.json({ ok: true })
  }

  const { valid, admin_id, session } = await validateSession(sessionId)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? ''

  let all = false
  try {
    const body = await req.json()
    all = !!body.all
  } catch { /* no body = single logout */ }

  if (valid && admin_id) {
    if (all) {
      await revokeAllSessions(admin_id, 'logout_all')
      await logSecurityEvent({
        event_type: SEC.LOGOUT_ALL,
        severity: 'low',
        admin_id,
        ip_address: ip,
        user_agent: ua,
        description: 'Logged out all sessions',
      })
    } else {
      await revokeSession(sessionId, 'logout')
      await logSecurityEvent({
        event_type: SEC.LOGOUT,
        severity: 'low',
        admin_id,
        ip_address: ip,
        user_agent: ua,
        description: 'Logged out',
      })
    }
  } else if (sessionId) {
    // Expired/invalid session — revoke anyway
    await revokeSession(sessionId, 'logout')
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
