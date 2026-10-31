import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { buildDeviceHash, labelDevice } from '@/lib/device'
import { logSecurityEvent, SEC } from '@/lib/security-events'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? ''
  const lang = req.headers.get('accept-language') ?? ''

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  // Brute force check (keyed per IP + email combo)
  const rlKey = `login:${ip}:${email}`
  const rl = await checkRateLimit(rlKey)

  if (!rl.allowed) {
    await logSecurityEvent({
      event_type: SEC.LOGIN_BLOCKED,
      severity: 'high',
      ip_address: ip,
      user_agent: ua,
      description: `Login blocked until ${rl.blocked_until?.toISOString()}`,
      metadata: { email, blocked_until: rl.blocked_until },
    })
    const retryAfter = rl.blocked_until
      ? Math.ceil((rl.blocked_until.getTime() - Date.now()) / 1000)
      : 3600
    return NextResponse.json(
      { error: rl.reason ?? 'Too many failed attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  if (rl.delay_ms && rl.delay_ms > 0) {
    await new Promise(r => setTimeout(r, rl.delay_ms))
  }

  // Authenticate with Supabase Auth
  const supabase = await createSupabaseServerClient()
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError || !authData.user) {
    await logSecurityEvent({
      event_type: SEC.LOGIN_FAILED,
      severity: rl.risk === 'critical' ? 'critical' : 'medium',
      ip_address: ip,
      user_agent: ua,
      description: `Failed login attempt for ${email}`,
      metadata: { email, risk: rl.risk },
    })
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const adminId = authData.user.id
  const deviceHash = buildDeviceHash(ua, lang)
  const db = getAdminClient()

  // Check trusted devices
  const { data: trustedDevice } = await db
    .from('trusted_devices')
    .select('id, label')
    .eq('admin_id', adminId)
    .eq('device_hash', deviceHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  const step = trustedDevice ? 'pin' : 'verify'

  if (!trustedDevice) {
    await logSecurityEvent({
      event_type: SEC.NEW_DEVICE,
      severity: 'medium',
      admin_id: adminId,
      ip_address: ip,
      user_agent: ua,
      description: `New device detected: ${labelDevice(ua)}`,
      metadata: { device_hash: deviceHash, label: labelDevice(ua) },
    })
  }

  // Store pending auth state in a short-lived cookie (no session yet)
  const pendingToken = Buffer.from(JSON.stringify({
    adminId,
    deviceHash,
    ip,
    ua,
    step,
    exp: Date.now() + 5 * 60 * 1000, // 5min to complete MFA
  })).toString('base64')

  const res = NextResponse.json({ step })
  res.cookies.set('admin_pending', pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  })
  return res
}
