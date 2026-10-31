import { getAdminClient } from './supabase/admin'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

interface LimitResult {
  allowed: boolean
  blocked_until?: Date
  reason?: string
  delay_ms?: number
  risk: RiskLevel
}

// Delay thresholds by attempt count
function getDelay(attempts: number): number {
  if (attempts <= 2) return 0
  if (attempts <= 5) return 3000 * (attempts - 2)  // 3s, 6s, 9s
  return 0  // blocked instead
}

function getRisk(attempts: number): RiskLevel {
  if (attempts <= 2) return 'low'
  if (attempts <= 5) return 'medium'
  if (attempts <= 8) return 'high'
  return 'critical'
}

function getBlockDuration(attempts: number): number {
  // Returns minutes
  if (attempts <= 5) return 0
  if (attempts <= 8) return 15
  if (attempts <= 12) return 60
  if (attempts <= 20) return 360  // 6h
  if (attempts <= 30) return 1440  // 24h
  return 1800  // 30h
}

export async function checkRateLimit(key: string): Promise<LimitResult> {
  const db = getAdminClient()
  const now = new Date()

  const { data, error } = await db
    .from('rate_limit_store')
    .select('*')
    .eq('key', key)
    .single()

  if (error && error.code !== 'PGRST116') {
    // DB error — fail open (don't block legit users on DB issues)
    return { allowed: true, risk: 'low' }
  }

  if (!data) {
    // First attempt
    await db.from('rate_limit_store').upsert({
      key,
      attempts: 1,
      updated_at: now.toISOString(),
    })
    return { allowed: true, risk: 'low' }
  }

  // Check if currently blocked
  if (data.blocked_until && new Date(data.blocked_until) > now) {
    return {
      allowed: false,
      blocked_until: new Date(data.blocked_until),
      reason: data.block_reason ?? 'Too many failed attempts',
      risk: getRisk(data.attempts),
    }
  }

  const newAttempts = data.attempts + 1
  const blockMins = getBlockDuration(newAttempts)
  const blockedUntil = blockMins > 0
    ? new Date(now.getTime() + blockMins * 60 * 1000)
    : null

  await db.from('rate_limit_store').upsert({
    key,
    attempts: newAttempts,
    blocked_until: blockedUntil?.toISOString() ?? null,
    block_reason: blockMins > 0 ? `Blocked after ${newAttempts} failed attempts (${blockMins}m)` : null,
    updated_at: now.toISOString(),
  })

  if (blockMins > 0) {
    return {
      allowed: false,
      blocked_until: blockedUntil!,
      reason: `Blocked for ${blockMins} minutes after ${newAttempts} failed attempts.`,
      risk: getRisk(newAttempts),
    }
  }

  const delay = getDelay(newAttempts)
  if (delay > 0) {
    return { allowed: true, delay_ms: delay, risk: getRisk(newAttempts) }
  }

  return { allowed: true, risk: getRisk(newAttempts) }
}

export async function resetRateLimit(key: string): Promise<void> {
  const db = getAdminClient()
  await db.from('rate_limit_store').delete().eq('key', key)
}

// Contact form rate limit: 5 submissions per hour per IP
const contactRateMap = new Map<string, { count: number; resetAt: number }>()

export function checkContactRate(ip: string): boolean {
  const now = Date.now()
  const entry = contactRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    contactRateMap.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}
