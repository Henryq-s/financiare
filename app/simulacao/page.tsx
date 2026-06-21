'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Shield,
} from 'lucide-react'
import { NavLogo } from '@/components/LogoMark'
import { SIMULATION_STEPS } from '@/lib/scoring/questions'
import { calculateScore } from '@/lib/scoring/algorithm'
import type { SimulationAnswers } from '@/types'
import { cn } from '@/lib/utils'

const defaultAnswers: Partial<SimulationAnswers> = {
  restriction_level: 'none',
  current_income_commitment: 0,
  has_proof_of_income: true,
  has_restrictions: false,
  has_paid_asset: false,
  has_down_payment: false,
  down_payment: 0,
}

export default function SimulacaoPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<SimulationAnswers>>(defaultAnswers)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const step = SIMULATION_STEPS[currentStep]
  const totalSteps = SIMULATION_STEPS.length

  const updateField = useCallback((id: string, value: unknown) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value }
      if (id === 'has_down_payment' && value === false) {
        next.down_payment = 0
      }
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    for (const q of step.questions) {
      if (!q.required) continue
      const val = answers[q.id as keyof SimulationAnswers]
      if (q.id === 'restriction_level' && !answers.has_restrictions) continue
      if (q.id === 'down_payment' && !answers.has_down_payment) continue
      if (val === undefined || val === null || val === '') {
        newErrors[q.id] = 'Este campo é obrigatório'
      }
      if (q.type === 'currency' && (typeof val !== 'number' || val <= 0)) {
        newErrors[q.id] = 'Informe um valor válido'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (!validate()) return
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit()
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    const fullAnswers = answers as SimulationAnswers
    const result = calculateScore(fullAnswers)
    sessionStorage.setItem('financiare_result', JSON.stringify({ answers: fullAnswers, result }))
    router.push('/resultado?local=1')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <NavLogo iconSize={22} />
            <span className="text-sm text-slate-400">
              Etapa {currentStep + 1} de {totalSteps}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Step header */}
        <div className="mb-8 animate-fade-in">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle className="h-3.5 w-3.5" />
            Etapa {currentStep + 1} – {step.title}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{step.title}</h1>
          <p className="mt-1 text-slate-500">{step.subtitle}</p>
          {step.note && (
            <div className="mt-3 flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 w-fit">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              {step.note}
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6 animate-slide-up">
          {step.questions.map((q) => {
            if (q.id === 'restriction_level' && !answers.has_restrictions) return null
            if (q.id === 'down_payment' && !answers.has_down_payment) return null

            return (
              <div key={q.id} className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
                <label className="mb-1 block text-sm font-semibold text-slate-800">
                  {q.label}
                  {q.required && <span className="ml-1 text-red-500">*</span>}
                </label>
                {q.sublabel && (
                  <p className="mb-3 text-xs text-slate-400">{q.sublabel}</p>
                )}
                <FieldRenderer
                  question={q}
                  value={answers[q.id as keyof SimulationAnswers]}
                  onChange={(val) => updateField(q.id, val)}
                  error={errors[q.id]}
                />
                {q.hint && (
                  <p className="mt-2 text-xs text-slate-400">{q.hint}</p>
                )}
                {errors[q.id] && (
                  <p className="mt-1.5 text-xs text-red-500">{errors[q.id]}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={submitting}
            className={cn(
              'flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-all shadow-md',
              submitting
                ? 'bg-emerald-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
            )}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting
              ? 'Calculando...'
              : currentStep === totalSteps - 1
              ? 'Ver meu resultado'
              : 'Continuar análise'}
            {!submitting && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Step dots */}
        <div className="mt-6 flex justify-center gap-2">
          {SIMULATION_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all',
                i === currentStep
                  ? 'w-6 bg-emerald-500'
                  : i < currentStep
                  ? 'w-2 bg-emerald-300'
                  : 'w-2 bg-slate-200',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Field Renderer Component
// ════════════════════════════════════════════════════════════
interface FieldProps {
  question: (typeof SIMULATION_STEPS)[0]['questions'][0]
  value: unknown
  onChange: (val: unknown) => void
  error?: string
}

function FieldRenderer({ question: q, value, onChange, error }: FieldProps) {
  const base =
    'w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/20'
  const borderClass = error
    ? 'border-red-300 focus:border-red-400'
    : 'border-slate-200 focus:border-emerald-500'

  if (q.type === 'text') {
    return (
      <input
        type="text"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={q.placeholder}
        className={cn(base, borderClass)}
      />
    )
  }

  if (q.type === 'currency') {
    const displayVal =
      value && (value as number) > 0
        ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value as number)
        : ''

    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={displayVal}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '')
            const num = parseFloat(raw) / 100
            onChange(isNaN(num) ? 0 : num)
          }}
          placeholder="0,00"
          className={cn(base, borderClass, 'pl-9')}
        />
      </div>
    )
  }

  if (q.type === 'select') {
    return (
      <select
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => {
          const raw = e.target.value
          const opt = q.options?.find((o) => String(o.value) === raw)
          onChange(opt ? opt.value : raw)
        }}
        className={cn(base, borderClass, 'cursor-pointer bg-white')}
      >
        <option value="">Selecione uma opção</option>
        {q.options?.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (q.type === 'radio') {
    return (
      <div className="space-y-2.5">
        {q.options?.map((opt) => {
          const isSelected = value === opt.value
          return (
            <label
              key={String(opt.value)}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all',
                isSelected
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300',
                )}
              >
                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <input
                type="radio"
                name={q.id}
                value={String(opt.value)}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <div>
                <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                {opt.sublabel && (
                  <div className="text-xs text-slate-400">{opt.sublabel}</div>
                )}
              </div>
            </label>
          )
        })}
      </div>
    )
  }

  if (q.type === 'boolean') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[
          { val: false, label: 'Não' },
          { val: true, label: 'Sim' },
        ].map(({ val, label }) => {
          const isSelected = value === val
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(val)}
              className={cn(
                'rounded-xl border-2 py-3.5 text-sm font-semibold transition-all',
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  return null
}
