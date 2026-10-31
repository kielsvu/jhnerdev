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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getAdminClient()
  const { data, error } = await db
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auto-mark as read on first open
  if (data.status === 'unread') {
    await db.from('contact_messages').update({ status: 'read' }).eq('id', id)
    data.status = 'read'
  }

  return NextResponse.json({ message: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const allowed = ['unread', 'read', 'archived']
  if (!body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const db = getAdminClient()
  const { data, error } = await db
    .from('contact_messages')
    .update({ status: body.status })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ message: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { id } = await params
  const db = getAdminClient()

  const { error } = await db.from('contact_messages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  await logSecurityEvent({
    event_type: SEC.MESSAGE_DELETED,
    severity: 'low',
    admin_id: auth.admin_id,
    ip_address: ip,
    description: `Deleted message ${id}`,
  })

  return NextResponse.json({ ok: true })
}
