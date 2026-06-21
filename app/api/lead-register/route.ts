import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { full_name, phone, email, tempPassword, answers, result } = await req.json()

  if (!email || !full_name || !phone || !tempPassword) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Try to create a new pre-confirmed user with the temp password
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name, phone },
  })

  if (createErr) {
    // User already exists — tell the client to redirect to login
    if (
      createErr.message.toLowerCase().includes('already') ||
      createErr.message.toLowerCase().includes('exists') ||
      createErr.status === 422
    ) {
      return NextResponse.json({ isExistingUser: true })
    }
    return NextResponse.json({ error: 'Erro ao processar usuário.' }, { status: 500 })
  }

  const userId = created.user.id

  // Upsert profile with name + phone
  await admin.from('profiles').upsert({ id: userId, email, full_name, phone })

  // Enrich answers so admin dashboard can search by name/phone
  const enrichedAnswers = { ...answers, full_name, phone }

  await admin
    .from('simulations')
    .insert({ user_id: userId, answers: enrichedAnswers, result })

  return NextResponse.json({ ok: true })
}
