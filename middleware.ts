import { NextRequest, NextResponse } from 'next/server'

const rateMap = new Map<string, { count: number; resetAt: number }>()

const blockedAgents = [
  'scrapy', 'python-requests', 'python-urllib', 'python-httpx',
  'go-http-client', 'curl/', 'wget/', 'libwww-perl', 'lwp-trivial',
  'httrack', 'webzip', 'teleport pro', 'offline explorer',
  'masscan', 'zgrab', 'nikto', 'sqlmap', 'nmap', 'dirbuster', 'gobuster',
  'phantomjs', 'headlesschrome', 'selenium', 'webdriver',
  'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot', 'blexbot',
  'petalbot', 'bytespider', 'claudebot', 'gptbot', 'ccbot',
  'anthropic-ai', 'perplexitybot', 'cohere-ai', 'omgili',
  'ia_archiver', 'archive.org_bot',
]

const allowedBots = [
  'googlebot', 'google-read-aloud', 'bingbot', 'slurp',
  'duckduckbot', 'baiduspider', 'yandexbot', 'applebot',
  'twitterbot', 'linkedinbot', 'facebookexternalhit',
]

const honeypotPaths = [
  '/admin', '/wp-admin', '/wp-login.php', '/.env', '/.env.local',
  '/config', '/config.php', '/phpmyadmin', '/.git', '/xmlrpc.php',
  '/api/debug', '/server-status', '/actuator',
  '/console', '/shell', '/backup', '/dump',
]

function getIP(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function isRateLimited(ip: string) {
  const now = Date.now()

  if (rateMap.size > 5000) {
    for (const [key, val] of rateMap) {
      if (now > val.resetAt) rateMap.delete(key)
    }
  }

  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }

  entry.count++
  return entry.count > 60
}

function isBadBot(ua: string) {
  if (!ua || ua.length < 10) return true
  const lower = ua.toLowerCase()
  if (allowedBots.some(b => lower.includes(b))) return false
  return blockedAgents.some(b => lower.includes(b))
}

function isHoneypot(path: string) {
  return honeypotPaths.some(p => path === p || path.startsWith(p + '/'))
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const ua = req.headers.get('user-agent') ?? ''
  const ip = getIP(req)

  if (isHoneypot(path)) return new NextResponse(null, { status: 403 })
  if (isBadBot(ua)) return new NextResponse(null, { status: 403 })
  if (isRateLimited(ip)) return new NextResponse(null, { status: 429 })

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
}
