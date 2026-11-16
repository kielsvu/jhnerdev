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
  '/admin', "/admin/api", '/administrator', '/admin.php', '/admin/login',
  '/login', '/login.php', '/signin', '/sign-in',
  '/dashboard', '/controlpanel', '/cpanel',
  '/user/login', '/users/login', '/auth',
  '/wp-admin', '/wp-login.php', '/wp-content',
  '/wp-includes', '/wp-json', '/wp-config.php',
  '/xmlrpc.php', '/wordpress', '/wp',
  '/drupal', '/joomla', '/magento',
  '/administrator/index.php', '/user/register',
  '/api/swagger', '/swagger', '/swagger-ui',
  '/graphql', '/graphiql', '/api/graphql',
  '/.env', '/.env.local', '/.env.production',
  '/.env.development', '/.env.backup',
  '/.git', '/.svn', '/.hg',
  '/config', '/config.php', '/configuration.php',
  '/settings.py', '/web.config', '/application.yml',
  '/application.properties', '/database.yml',
  '/.htaccess', '/.htpasswd',
  '/phpmyadmin', '/pma', '/adminer',
  '/adminer.php', '/mysql', '/mysqladmin',
  '/phpPgAdmin', '/pgadmin', '/mongo-express',
  '/redis', '/elasticsearch',
  '/debug', '/debug/default/view',
  '/api/debug', '/_debug', '/__debug__',
  '/trace', '/actuator', '/actuator/env',
  '/actuator/health', '/actuator/configprops',
  '/server-status', '/server-info',
  '/status', '/metrics', '/health',
  '/api-docs', '/api/docs', '/swagger.json',
  '/openapi.json', '/redoc',
  '/api/test', '/api/internal',
  '/api/private', '/api/v1/debug',
  '/backup', '/backups', '/dump',
  '/database.sql', '/db.sql',
  '/backup.sql', '/dump.sql',
  '/backup.zip', '/backup.tar',
  '/archive.zip', '/old',
  '/.DS_Store', '/Thumbs.db',
  '/console', '/shell', '/terminal',
  '/cgi-bin', '/cgi-bin/test-cgi',
  '/.well-known/security.txt',
  '/jenkins', '/hudson',
  '/.docker', '/docker-compose.yml',
  '/kubernetes', '/.kube',
  '/terraform.tfstate',
  '/info.php', '/phpinfo.php',
  '/test.php', '/install.php',
  '/setup.php', '/server.php',
  '/error_log', '/access.log',
  '/debug.log', '/logs',
]

function getIp(req: NextRequest) {
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

function isBadBot(userAgent: string) {
  if (!userAgent || userAgent.length < 10) return true
  const lower = userAgent.toLowerCase()
  if (allowedBots.some(b => lower.includes(b))) return false
  return blockedAgents.some(b => lower.includes(b))
}

function isHoneypot(path: string) {
  const normalized = path.toLowerCase().replace(/\/+$/, '') || '/'
  return honeypotPaths.some(p => normalized === p || normalized.startsWith(p + '/'))
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const userAgent = req.headers.get('user-agent') ?? ''
  const ip = getIp(req)

  if (isHoneypot(path)) return new NextResponse(null, { status: 403 })
  if (isBadBot(userAgent)) return new NextResponse(null, { status: 429 })
  if (isRateLimited(ip)) return new NextResponse(null, { status: 429 })

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)',
  ],
}
