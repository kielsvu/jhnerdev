import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, validateSession } from '@/lib/session'
import { getAdminClient } from '@/lib/supabase/admin'
import { logSecurityEvent, SEC } from '@/lib/security-events'

async function authenticate() {
  const sessionId = await getSessionFromCookie()
  if (!sessionId) return null
  const result = await validateSession(sessionId)
  return result.valid ? result : null
}

export async function GET(_req: NextRequest) {
  const auth = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminClient()
  const { data, error } = await db
    .from('trusted_devices')
    .select('id, label, trusted_at, expires_at, device_hash')
    .eq('admin_id', auth.admin_id!)
    .order('trusted_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  return NextResponse.json({ devices: data ?? [] })
}

export async function DELETE(req: NextRequest) {
  const auth = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? ''

  const db = getAdminClient()
  const { error } = await db
    .from('trusted_devices')
    .delete()
    .eq('id', id)
    .eq('admin_id', auth.admin_id!)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  await logSecurityEvent({
    event_type: SEC.DEVICE_REVOKED,
    severity: 'medium',
    admin_id: auth.admin_id,
    ip_address: ip,
    user_agent: ua,
    description: `Revoked trusted device ${id}`,
  })

  return NextResponse.json({ ok: true })
}
