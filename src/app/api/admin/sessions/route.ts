import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, validateSession, revokeSession, SESSION_COOKIE } from '@/lib/session'
import { getAdminClient } from '@/lib/supabase/admin'
import { logSecurityEvent, SEC } from '@/lib/security-events'

async function authenticate() {
  const sessionId = await getSessionFromCookie()
  if (!sessionId) return { auth: null, sessionId: null }
  const result = await validateSession(sessionId)
  return { auth: result.valid ? result : null, sessionId }
}

export async function GET(_req: NextRequest) {
  const { auth } = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminClient()
  const { data, error } = await db
    .from('admin_sessions')
    .select('id, ip_address, user_agent, created_at, last_active, expires_at')
    .eq('admin_id', auth.admin_id!)
    .eq('revoked', false)
    .gt('expires_at', new Date().toISOString())
    .order('last_active', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const { auth, sessionId: currentSessionId } = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetId = searchParams.get('id')
  if (!targetId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? ''

  await revokeSession(targetId, 'revoked_by_admin')

  await logSecurityEvent({
    event_type: SEC.SESSION_REVOKED,
    severity: 'medium',
    admin_id: auth.admin_id,
    ip_address: ip,
    user_agent: ua,
    description: `Revoked session ${targetId}`,
  })

  const res = NextResponse.json({ ok: true })

  // If admin revoked their own current session, clear the cookie
  if (targetId === currentSessionId) {
    res.cookies.delete(SESSION_COOKIE)
  }

  return res
}
