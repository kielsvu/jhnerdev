import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT    = 60
const RATE_WINDOW   = 60_000

const rateMap = new Map<string, { count: number; resetAt: number }>()

const BLOCKED_UA = [
  'scrapy', 'python-requests', 'python-urllib', 'python-httpx',
  'go-http-client', 'curl/', 'wget/', 'libwww-perl', 'lwp-trivial',
  'httrack', 'webzip', 'teleport pro', 'offline explorer',
  'masscan', 'zgrab', 'nikto', 'sqlmap', 'nmap', 'dirbuster', 'gobuster',
  'phantomjs', 'headlesschrome', 'selenium', 'webdriver',
  'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot', 'blexbot',
  'petalbot', 'bytespider', 'claudebot', 'gptbot', 'ccbot',
  'anthropic-ai', 'perplexitybot', 'cohere-ai', 'omgili', 'omgilibot',
  'ia_archiver', 'archive.org_bot', 'pocketparser', 'netcraft',
]

const ALLOWED_BOTS = [
  'googlebot', 'google-read-aloud', 'bingbot', 'slurp',
  'duckduckbot', 'baiduspider', 'yandexbot', 'sogou', 'applebot',
  'twitterbot', 'linkedinbot', 'facebookexternalhit',
]

const HONEYPOT = [
  '/admin', '/wp-admin', '/wp-login.php', '/.env', '/.env.local',
  '/config', '/config.php', '/phpmyadmin', '/.git', '/xmlrpc.php',
  '/api/debug', '/api/admin', '/server-status', '/actuator',
  '/console', '/shell', '/backup', '/dump',
]

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()

  if (rateMap.size > 5000) {
    for (const [key, val] of rateMap) {
      if (now > val.resetAt) rateMap.delete(key)
    }
  }

  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

function isBlockedUA(ua: string): boolean {
  if (!ua || ua.length < 10) return true
  const lower = ua.toLowerCase()
  if (ALLOWED_BOTS.some(b => lower.includes(b))) return false
  return BLOCKED_UA.some(b => lower.includes(b))
}

function isHoneypot(pathname: string): boolean {
  return HONEYPOT.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function block(status: 403 | 429): NextResponse {
  return new NextResponse(null, { status })
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ua = req.headers.get('user-agent') ?? ''
  const ip = getIP(req)

  if (isHoneypot(pathname))  return block(403)
  if (isBlockedUA(ua))       return block(403)
  if (checkRateLimit(ip))    return block(429)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
}
