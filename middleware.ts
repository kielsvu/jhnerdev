import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMIT  = 60
const RATE_WINDOW = 60_000
const ALERT_COOLDOWN = 60 * 60 * 1000

const rateMap    = new Map<string, { count: number; resetAt: number }>()
const alertedIPs = new Map<string, number>()

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

type BlockType = 'honeypot' | 'blocked_ua' | 'rate_limit'

type AlertData = {
  type: BlockType
  ip: string
  path: string
  ua: string
  country: string
}

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

function shouldAlert(ip: string, type: BlockType): boolean {
  if (type === 'honeypot') return true
  const now = Date.now()
  const last = alertedIPs.get(ip)
  if (last && now - last < ALERT_COOLDOWN) return false
  alertedIPs.set(ip, now)
  return true
}

async function sendDiscordAlert(data: AlertData) {
  const webhook = process.env.DISCORD_ALERT_WEBHOOK
  if (!webhook) return

  const colors: Record<BlockType, number> = {
    honeypot:   0xe74c3c,
    blocked_ua: 0xe67e22,
    rate_limit: 0xf1c40f,
  }

  const labels: Record<BlockType, string> = {
    honeypot:   '🪤 Honeypot',
    blocked_ua: '🤖 Blocked Bot',
    rate_limit: '⚡ Rate Limited',
  }

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'jhner.dev Guard',
      embeds: [{
        title: labels[data.type],
        color: colors[data.type],
        fields: [
          { name: 'IP',      value: `\`${data.ip}\``,      inline: true  },
          { name: 'Country', value: data.country,           inline: true  },
          { name: 'Path',    value: `\`${data.path}\``,    inline: true  },
          { name: 'UA',      value: `\`${data.ua.slice(0, 120) || 'empty'}\``, inline: false },
        ],
        timestamp: new Date().toISOString(),
      }],
      allowed_mentions: { parse: [] },
    }),
  })
}

async function logToSupabase(data: AlertData) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return

  await fetch(`${url}/rest/v1/bot_alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      type:    data.type,
      ip:      data.ip,
      path:    data.path,
      ua:      data.ua,
      country: data.country,
    }),
  })
}

function alert(data: AlertData) {
  if (!shouldAlert(data.ip, data.type)) return
  void sendDiscordAlert(data).catch(() => {})
  void logToSupabase(data).catch(() => {})
}

function block(
  status: 403 | 429,
  data: AlertData,
): NextResponse {
  alert(data)
  return new NextResponse(null, { status })
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ua      = req.headers.get('user-agent') ?? ''
  const ip      = getIP(req)
  const country = req.headers.get('x-vercel-ip-country') ?? 'unknown'

  const base = { ip, path: pathname, ua, country }

  if (isHoneypot(pathname))
    return block(403, { ...base, type: 'honeypot' })

  if (isBlockedUA(ua))
    return block(403, { ...base, type: 'blocked_ua' })

  if (checkRateLimit(ip))
    return block(429, { ...base, type: 'rate_limit' })

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
      }
