import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { full_name, phone, email, answers, result } = await req.json()

  if (!email || !full_name || !phone) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Create user (pre-confirmed — no email verification needed)
  let userId: string | null = null

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name, phone },
  })

  if (created?.user) {
    userId = created.user.id
  } else if (createErr) {
    // User already exists — find via profiles table
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (profile?.id) {
      userId = profile.id
    } else {
      return NextResponse.json({ error: 'Erro ao processar usuário.' }, { status: 500 })
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }

  // Upsert profile with name + phone
  await admin.from('profiles').upsert({ id: userId, email, full_name, phone })

  // Enrich answers so admin dashboard can search by name/phone
  const enrichedAnswers = { ...answers, full_name, phone }

  const { data: sim } = await admin
    .from('simulations')
    .insert({ user_id: userId, answers: enrichedAnswers, result })
    .select('id')
    .single()

  // Generate magic link → user auto-logged in without password
  const redirectTo = `${origin}/auth/callback?next=/dashboard`
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (linkErr || !linkData?.properties?.action_link) {
    console.error('[lead-register] generateLink error:', linkErr?.message)
    return NextResponse.json({ error: 'Erro ao gerar acesso automático.' }, { status: 500 })
  }

  return NextResponse.json({
    redirectUrl: linkData.properties.action_link,
    simId: sim?.id ?? null,
  })
}
