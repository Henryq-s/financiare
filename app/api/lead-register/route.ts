import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { full_name, phone, email, answers, result } = await req.json()

  if (!email || !full_name || !phone) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Enrich answers so admin CRM can search by name/phone/email
  const enrichedAnswers = { ...answers, full_name, phone, email }

  const { error } = await admin
    .from('simulations')
    .insert({ answers: enrichedAnswers, result })

  if (error) {
    console.error('[lead-register] insert error:', error.message)
    return NextResponse.json({ error: 'Erro ao salvar. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
