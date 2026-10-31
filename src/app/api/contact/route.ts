import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { checkContactRate } from '@/lib/rate-limit'
import { isDisposableEmail } from '@/lib/disposable-emails'
import { hasMxRecords } from '@/lib/mx-check'
import { logSecurityEvent, SEC } from '@/lib/security-events'

const MAX_NAME    = 100
const MAX_EMAIL   = 254
const MAX_SUBJECT = 200
const MAX_MESSAGE = 3000

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (!checkContactRate(ip)) {
    await logSecurityEvent({
      event_type: SEC.CONTACT_SPAM,
      severity: 'medium',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') ?? undefined,
      description: 'Contact form rate limit exceeded',
    })
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 })
  }

  let body: Record<string, string>
  try {
    const ct = req.headers.get('content-type') ?? ''
    if (!ct.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { name, email, subject, message, _hp } = body

  if (_hp) return NextResponse.json({ ok: true })

  const t = {
    name:    (name    ?? '').trim().slice(0, MAX_NAME),
    email:   (email   ?? '').trim().toLowerCase().slice(0, MAX_EMAIL),
    subject: (subject ?? '').trim().slice(0, MAX_SUBJECT),
    message: (message ?? '').trim().slice(0, MAX_MESSAGE),
  }

  if (!t.name || !t.email || !t.subject || !t.message) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  if (t.name.length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  if (isDisposableEmail(t.email)) {
    return NextResponse.json({ error: 'Disposable email addresses are not accepted.' }, { status: 400 })
  }

  const mxOk = await hasMxRecords(t.email).catch(() => true)
  if (!mxOk) {
    return NextResponse.json({ error: 'Email domain does not appear to accept mail.' }, { status: 400 })
  }

  const db = getAdminClient()
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data: dupe } = await db
    .from('contact_messages')
    .select('id')
    .eq('sender_email', t.email)
    .eq('subject', t.subject)
    .gte('created_at', tenMinAgo)
    .limit(1)
    .maybeSingle()

  if (dupe) return NextResponse.json({ ok: true })

  const { error } = await db.from('contact_messages').insert({
    sender_name:  t.name,
    sender_email: t.email,
    subject:      t.subject,
    message:      t.message,
    status:       'unread',
    ip_address:   ip,
    user_agent:   req.headers.get('user-agent')?.slice(0, 500) ?? null,
  })

  if (error) {
    console.error('contact insert error:', error.message)
    return NextResponse.json({ error: 'Failed to send. Try again later.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
