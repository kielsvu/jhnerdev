import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, validateSession } from '@/lib/session'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const sessionId = await getSessionFromCookie()
  if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { valid } = await validateSession(sessionId)
  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const status = searchParams.get('status') // unread | read | archived | null (all)
  const search = searchParams.get('q')?.trim()
  const offset = (page - 1) * limit

  const db = getAdminClient()
  let query = db
    .from('contact_messages')
    .select('id, name, email, subject, message, status, risk_level, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('messages list error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json({
    messages: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  })
}
