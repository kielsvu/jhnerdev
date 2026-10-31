import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'
import { resetRateLimit } from '@/lib/rate-limit'
import { labelDevice } from '@/lib/device'
import { logSecurityEvent, SEC } from '@/lib/security-events'

const PIN_MAX_ATTEMPTS = 5
// In-memory PIN attempt counter — resets on cold start, fine for single-instance
const pinAttempts = new Map<string, { count: number; resetAt: number }>()

function checkPinAttempts(adminId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = pinAttempts.get(adminId)
  if (!entry || now > entry.resetAt) {
    pinAttempts.set(adminId, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return { allowed: true, remaining: PIN_MAX_ATTEMPTS - 1 }
  }
  if (entry.count >= PIN_MAX_ATTEMPTS) return { allowed: false, remaining: 0 }
  entry.count++
  return { allowed: true, remaining: PIN_MAX_ATTEMPTS - entry.count }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // Read pending auth token
  const pendingRaw = req.cookies.get('admin_pending')?.value
  if (!pendingRaw) {
    return NextResponse.json({ error: 'No pending authentication' }, { status: 401 })
  }

  let pending: { adminId: string; deviceHash: string; ip: string; ua: string; step: string; exp: number }
  try {
    pending = JSON.parse(Buffer.from(pendingRaw, 'base64').toString())
  } catch {
    return NextResponse.json({ error: 'Invalid auth state' }, { status: 401 })
  }

  if (Date.now() > pending.exp) {
    return NextResponse.json({ error: 'Authentication expired. Please log in again.' }, { status: 401 })
  }

  let body: { pin?: string; trust?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { pin, trust = false } = body
  if (!pin || !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 })
  }

  const attempt = checkPinAttempts(pending.adminId)
  if (!attempt.allowed) {
    await logSecurityEvent({
      event_type: SEC.PIN_FAILED,
      severity: 'high',
      admin_id: pending.adminId,
      ip_address: ip,
      user_agent: pending.ua,
      description: 'PIN attempt limit reached',
    })
    return NextResponse.json({ error: 'Too many PIN attempts. Start over.' }, { status: 429 })
  }

  const expectedPin = process.env.ADMIN_PIN
  if (!expectedPin) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (pin !== expectedPin) {
    await logSecurityEvent({
      event_type: SEC.PIN_FAILED,
      severity: 'medium',
      admin_id: pending.adminId,
      ip_address: ip,
      user_agent: pending.ua,
      description: 'Incorrect PIN entered',
      metadata: { remaining: attempt.remaining },
    })
    return NextResponse.json(
      { error: 'Incorrect PIN', remaining: attempt.remaining },
      { status: 401 }
    )
  }

  // PIN correct — clear attempts, reset login rate limit
  pinAttempts.delete(pending.adminId)
  await resetRateLimit(`login:${ip}:`)

  // Optionally trust this device
  if (trust) {
    const db = getAdminClient()
    const label = labelDevice(pending.ua)
    await db.from('trusted_devices').upsert({
      admin_id: pending.adminId,
      device_hash: pending.deviceHash,
      label,
      trusted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }, { onConflict: 'admin_id,device_hash' })

    await logSecurityEvent({
      event_type: SEC.DEVICE_TRUSTED,
      severity: 'low',
      admin_id: pending.adminId,
      ip_address: ip,
      user_agent: pending.ua,
      description: `Device trusted: ${label}`,
    })
  }

  // Create full session
  const sessionId = await createSession({
    admin_id: pending.adminId,
    device_hash: pending.deviceHash,
    ip_address: ip,
    user_agent: pending.ua,
  })

  await logSecurityEvent({
    event_type: SEC.LOGIN_SUCCESS,
    severity: 'low',
    admin_id: pending.adminId,
    ip_address: ip,
    user_agent: pending.ua,
    description: 'Successful login',
    metadata: { device_trusted: trust },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, sessionId, sessionCookieOptions())
  res.cookies.delete('admin_pending')
  return res
}
