'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, Phone, Mail, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  answers: unknown
  result: unknown
}

function formatPhone(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function LeadCaptureForm({ answers, result }: Props) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('Informe seu nome completo.'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Informe um WhatsApp válido.'); return }
    if (!email.includes('@')) { setError('Informe um e-mail válido.'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/lead-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone, email, answers, result }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar. Tente novamente.')
        setLoading(false)
        return
      }

      // Redirect to magic link → auto-login → dashboard
      window.location.href = data.redirectUrl
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-5 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle className="h-3.5 w-3.5" />
          Análise concluída
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Salve sua análise e receba orientação
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Gratuito · Sem senha · Acesso imediato ao seu resultado completo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Nome completo <span className="text-red-500">*</span>
          </label>
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
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            WhatsApp <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              required
              maxLength={15}
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            E-mail <span className="text-red-500">*</span>
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

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
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
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Salvando análise...' : 'Salvar minha análise →'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Seus dados são protegidos e nunca compartilhados sem sua permissão.
      </p>
    </div>
  )
}
