import crypto from 'crypto'

const DEVICE_SECRET = process.env.DEVICE_SIGNING_SECRET ?? 'dev-device-secret-change-me'

// Build a stable device fingerprint from request headers (hashed)
export function buildDeviceHash(userAgent: string, acceptLanguage: string): string {
  const raw = `${userAgent}|${acceptLanguage}`
  return crypto
    .createHmac('sha256', DEVICE_SECRET)
    .update(raw)
    .digest('hex')
    .slice(0, 32)
}

export function labelDevice(userAgent: string): string {
  if (!userAgent) return 'Unknown device'
  if (/iphone/i.test(userAgent)) return 'iPhone'
  if (/ipad/i.test(userAgent)) return 'iPad'
  if (/android/i.test(userAgent)) return 'Android'
  if (/macintosh/i.test(userAgent)) return 'Mac'
  if (/windows/i.test(userAgent)) return 'Windows PC'
  if (/linux/i.test(userAgent)) return 'Linux'
  return 'Unknown device'
}
