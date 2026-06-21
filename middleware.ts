import { NextResponse, type NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Protect /admin routes (but not /admin-login itself)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    const session = request.cookies.get('admin_session')?.value
    const adminPin = process.env.ADMIN_PIN

    if (!session || !adminPin || session !== adminPin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
}
