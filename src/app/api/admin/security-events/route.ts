import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, validateSession } from '@/lib/session'
import { getAdminClient } from '@/lib/supabase/admin'

async function authenticate() {
  const sessionId = await getSessionFromCookie()
  if (!sessionId) return null
  const result = await validateSession(sessionId)
  return result.valid ? result : null
}

export async function GET(req: NextRequest) {
  const auth = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const severity = searchParams.get('severity')
  const offset = (page - 1) * limit

  const db = getAdminClient()
  let query = db
    .from('security_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (severity) query = query.eq('severity', severity)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })

  return NextResponse.json({
    events: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticate()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = getAdminClient()
  await db
    .from('security_events')
    .update({ reviewed: true, reviewed_at: new Date().toISOString() })
    .eq('id', body.id)

  return NextResponse.json({ ok: true })
}
