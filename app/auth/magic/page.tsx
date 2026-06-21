'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function MagicHandler() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  useEffect(() => {
    // If Supabase redirected here with an error (e.g. expired confirmation link), go to login
    const error = params.get('error') ?? new URLSearchParams(window.location.hash.slice(1)).get('error')
    if (error) {
      router.replace('/auth/login?msg=ja_tem_conta')
      return
    }

    const supabase = createClient()

    // Handle PKCE code (query param)
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchErr }) => {
        if (!exchErr) router.replace(next)
        else router.replace('/auth/login?msg=ja_tem_conta')
      })
      return
    }

    // Handle implicit flow (hash fragment)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe()
        router.replace(next)
      }
    })

    supabase.auth.getSession()

    return () => subscription.unsubscribe()
  }, [router, next, params])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <p className="font-medium text-slate-700">Entrando na sua conta...</p>
        <p className="mt-1 text-sm text-slate-400">Aguarde um momento</p>
      </div>
    </div>
  )
}

export default function MagicPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    }>
      <MagicHandler />
    </Suspense>
  )
}
