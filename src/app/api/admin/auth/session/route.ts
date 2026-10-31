import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, validateSession } from '@/lib/session'

export async function GET(_req: NextRequest) {
  const sessionId = await getSessionFromCookie()
  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const { valid, admin_id, session } = await validateSession(sessionId)
  if (!valid) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    admin_id,
    created_at: (session as Record<string, unknown>)?.created_at,
    last_active: (session as Record<string, unknown>)?.last_active,
    expires_at: (session as Record<string, unknown>)?.expires_at,
  })
}
