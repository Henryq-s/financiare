'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/LogoMark'

type Step = 'email' | 'sent'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/magic?next=/dashboard`,
        shouldCreateUser: false,
      },
    })

    if (otpError) {
      if (otpError.status === 422 || otpError.message.toLowerCase().includes('not found')) {
        setError('E-mail não encontrado. Faça uma análise primeiro para criar sua conta.')
      } else {
        setError('Erro ao enviar link. Tente novamente.')
      }
      setLoading(false)
      return
    }

    setStep('sent')
    setLoading(false)
  }

  if (step === 'sent') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F2830] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Verifique seu e-mail</h2>
          <p className="mb-6 text-slate-500">
            Enviamos um link de acesso para{' '}
            <strong className="text-slate-800">{email}</strong>.
            <br />
            Clique no link para entrar — sem precisar de senha.
          </p>
          <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle className="mb-1 inline h-4 w-4" />{' '}
            O link expira em 1 hora. Verifique também o spam.
          </div>
          <button
            onClick={() => { setStep('email'); setError('') }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Usar outro e-mail
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F2830] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoMark size={48} />
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Acessar minha conta</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sem senha — enviamos um link direto para seu e-mail
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Seu e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition',
                loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700',
              )}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando link...</>
              ) : (
                <>Enviar link de acesso <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Não tem conta ainda?{' '}
            <Link href="/simulacao" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Fazer análise grátis
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
