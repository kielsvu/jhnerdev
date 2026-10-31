import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'admin_session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect /dev.email/* — skip login page and API auth routes
  if (!pathname.startsWith('/dev.email')) return NextResponse.next()
  if (pathname === '/dev.email/login') return NextResponse.next()
  if (pathname.startsWith('/api/admin/auth')) return NextResponse.next()

  const sessionId = req.cookies.get(SESSION_COOKIE)?.value
  if (!sessionId) {
    return NextResponse.redirect(new URL('/dev.email/login', req.url))
  }

  // Validate session via the API route (keeps validation logic in one place)
  const validationUrl = new URL('/api/admin/auth/session', req.url)
  const res = await fetch(validationUrl, {
    headers: { cookie: `${SESSION_COOKIE}=${sessionId}` },
  })

  if (!res.ok) {
    const response = NextResponse.redirect(new URL('/dev.email/login', req.url))
    response.cookies.delete(SESSION_COOKIE)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dev.email/:path*'],
}
