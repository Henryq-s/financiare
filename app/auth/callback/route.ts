import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorCode = searchParams.get('error_code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Supabase redirects here with error params when OTP expires
  if (errorCode === 'otp_expired' || searchParams.get('error') === 'access_denied') {
    return NextResponse.redirect(`${origin}/auth/confirmar?expired=1`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If `next` was set explicitly (e.g., magic-link auto-login flow), use it.
      // Otherwise fall back to /resultado/salvar for legacy email-confirmation flow.
      const destination = searchParams.has('next') ? next : '/resultado/salvar'
      return NextResponse.redirect(`${origin}${destination}`)
    }
    return NextResponse.redirect(`${origin}/auth/confirmar?expired=1`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback`)
}
