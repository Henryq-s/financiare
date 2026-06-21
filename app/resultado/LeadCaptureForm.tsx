'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, Phone, Mail, User, Lock, BarChart2, TrendingUp, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { ScoringResult } from '@/types'

interface Props {
  answers: unknown
  result: ScoringResult
}

function formatPhone(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function LeadCaptureModal({ answers, result }: Props) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const score = result.approval_percentage

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Informe seu nome completo.'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Informe um WhatsApp válido.'); return }
    if (!email.includes('@')) { setError('Informe um e-mail válido.'); return }

    setLoading(true)

    // Senha aleatória — usuário nunca precisa saber, login é automático
    const tempPassword = crypto.randomUUID()

    try {
      const res = await fetch('/api/lead-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          tempPassword,
          answers,
          result,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar. Tente novamente.')
        setLoading(false)
        return
      }

      if (data.isExistingUser) {
        // Usuário já existe — redireciona para login por link de e-mail
        window.location.href = '/auth/login?msg=ja_tem_conta'
        return
      }

      // Novo usuário — login direto com a senha temporária (sem e-mail)
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      })

      if (signInError) {
        setError('Erro ao acessar sua conta. Tente novamente.')
        setLoading(false)
        return
      }

      window.location.href = '/dashboard'
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-0 sm:px-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Score teaser header */}
        <div
          className="px-6 pt-6 pb-5 text-center"
          style={{ background: 'linear-gradient(135deg, #0F2830 0%, #1A4D58 100%)' }}
        >
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Análise concluída
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">
            Seu resultado está pronto!
          </h2>
          {/* Blurred score teaser */}
          <div className="mt-3 flex items-center justify-center">
            <div className="relative">
              <span
                className="text-5xl font-extrabold text-emerald-400 select-none"
                style={{ filter: 'blur(10px)' }}
              >
                {score}%
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="h-5 w-5 text-white/70" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Preencha seus dados para visualizar gratuitamente
          </p>
        </div>

        {/* Benefits */}
        <div className="flex justify-around border-b border-slate-100 px-4 py-3">
          {[
            { icon: BarChart2, text: 'Score detalhado' },
            { icon: TrendingUp, text: 'Plano de ação' },
            { icon: Shield, text: 'Dados protegidos' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-emerald-600" />
              <span className="text-center text-[11px] font-medium text-slate-500">{text}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="WhatsApp (00) 00000-0000"
                required
                maxLength={15}
                autoComplete="tel"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-md',
                loading
                  ? 'bg-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
              )}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Acessando resultado...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Ver meu resultado completo</>
              )}
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-slate-400">
            Gratuito · Sem senha · Sem confirmação de e-mail
          </p>
        </div>
      </div>
    </div>
  )
}
