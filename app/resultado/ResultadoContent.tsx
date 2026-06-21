'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle, AlertCircle, XCircle,
  Shield, CreditCard, TrendingUp, Briefcase, DollarSign,
  LayoutDashboard, Clock, AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ScoringResult, ScoringFactor, FactorStatus } from '@/types'
import { cn, scoreColor, scoreLabel, statusBarColor } from '@/lib/utils'
import ScoreGauge from '@/components/ScoreGauge'
import ContactCTA from './ContactCTA'
import LeadCaptureForm from './LeadCaptureForm'
import { NavLogo } from '@/components/LogoMark'

// ── Types ──────────────────────────────────────────────────────
type ModuleId = 'overview' | 'restrictions' | 'credit_score' | 'income_commitment' | 'employment' | 'down_payment'

interface ActionStep {
  title: string
  description: string
  priority: 'urgent' | 'important' | 'recommended'
  time: string
}

interface ModuleData {
  weight: string
  bankCriteria: string[]
  situationText: (factor: ScoringFactor) => string
  actionSteps: (factor: ScoringFactor) => ActionStep[]
  tips: string[]
}

// ── Module content definitions ─────────────────────────────────
const MODULE_CONTENT: Record<string, ModuleData> = {
  restrictions: {
    weight: '30% da sua aprovação',
    bankCriteria: [
      'Registros negativados no Serasa e SPC',
      'Protestos em cartório e execuções fiscais',
      'Histórico de inadimplência nos últimos 5 anos',
    ],
    situationText: (f) => {
      if (f.status === 'excellent') return 'Seu CPF está regular e sem restrições. Esse é o fator de maior peso na aprovação e você já está no máximo — parabéns. Mantenha todas as contas em dia para preservar essa situação.'
      if (f.status === 'poor') return 'Seu CPF possui restrições leves. Isso está impactando diretamente sua aprovação e pode ser o principal motivo de uma reprovação. A boa notícia é que dívidas leves são mais rápidas de resolver.'
      return 'Seu CPF possui restrições graves. A maioria dos bancos reprova automaticamente nessa situação. Resolver isso é o primeiro passo obrigatório antes de qualquer tentativa de aprovação.'
    },
    actionSteps: (f) => {
      if (f.status === 'excellent') return [
        { title: 'Continue pagando tudo em dia', description: 'Qualquer atraso pode gerar restrição em até 30 dias. Configure débito automático para contas fixas.', priority: 'recommended', time: 'Contínuo' },
        { title: 'Evite consultas desnecessárias ao CPF', description: 'Muitas consultas de crédito em pouco tempo podem sinalizar risco para os bancos. Só consulte quando realmente necessário.', priority: 'recommended', time: 'Sempre' },
        { title: 'Monitore seu CPF gratuitamente', description: 'Acesse serasa.com.br ou registrato.bcb.gov.br mensalmente para garantir que nenhuma dívida indevida apareça no seu nome.', priority: 'recommended', time: 'Mensal' },
      ]
      return [
        { title: 'Consulte todas as dívidas no Serasa', description: 'Acesse serasa.com.br gratuitamente e liste todas as pendências com valores e credores. Isso é o ponto de partida.', priority: 'urgent', time: 'Hoje' },
        { title: 'Priorize dívidas com bancos e financeiras', description: 'Dívidas bancárias ficam no histórico por mais tempo e têm maior peso na análise de crédito. Resolva-as primeiro.', priority: 'urgent', time: '1–3 dias' },
        { title: 'Negocie pelo Serasa Limpa Nome', description: 'Acesse serasalimanome.com.br — muitos credores oferecem até 99% de desconto. Simule sem compromisso antes de pagar.', priority: 'urgent', time: '2–5 dias' },
        { title: 'Efetue o pagamento e guarde o comprovante', description: 'Após negociar, pague na data acordada e salve todos os comprovantes. Isso é sua proteção caso haja qualquer problema.', priority: 'important', time: 'Na data combinada' },
        { title: 'Confirme a baixa no Serasa', description: 'Após o pagamento, o nome sai dos órgãos de proteção em até 5 dias úteis. Confira no serasa.com.br se a restrição foi removida.', priority: 'important', time: 'Até 5 dias úteis após pagamento' },
      ]
    },
    tips: [
      'Dívidas com bancos e financeiras ficam no histórico por mais tempo que dívidas com lojas — priorize-as',
      'Após 5 anos, dívidas prescrevem legalmente, mas alguns bancos ainda as consideram na análise',
      'Limpar o CPF costuma ser a mudança de maior impacto no score de aprovação',
    ],
  },

  credit_score: {
    weight: '25% da sua aprovação',
    bankCriteria: [
      'Score Serasa/BoaVista (pontuação de 0 a 1.000)',
      'Histórico de pagamentos dos últimos 12 meses',
      'Percentual do limite de crédito utilizado',
    ],
    situationText: (f) => {
      if (f.status === 'excellent') return 'Seu score de crédito é excelente. Isso demonstra um histórico consistente de pagamentos em dia e uso responsável do crédito — exatamente o que os bancos querem ver.'
      if (f.status === 'good') return 'Seu score está bom, mas ainda há margem de melhoria. Com alguns ajustes nos próximos meses você pode alcançar a faixa excelente e garantir condições ainda melhores.'
      if (f.status === 'fair') return 'Seu score está na faixa regular. Os bancos aprovam nessa faixa, mas com taxas de juros mais altas e exigência de garantias maiores. Vale a pena trabalhar para melhorá-lo.'
      return 'Seu score está baixo, o que sinaliza risco para os bancos e dificulta a aprovação. A boa notícia é que o score responde relativamente rápido a mudanças de comportamento financeiro.'
    },
    actionSteps: (f) => {
      if (f.status === 'excellent') return [
        { title: 'Mantenha o pagamento em dia de todos os compromissos', description: 'Um único atraso pode reduzir significativamente um score alto. Continue com débito automático ou alertas.', priority: 'important', time: 'Contínuo' },
        { title: 'Mantenha suas contas de crédito ativas', description: 'Contas antigas com bom histórico contribuem positivamente para o score. Não cancele cartões que você usa raramente.', priority: 'recommended', time: 'Sempre' },
      ]
      return [
        { title: 'Consulte seu score gratuitamente', description: 'Acesse serasa.com.br ou BoaVistaSCPC.com.br e veja exatamente o que está impactando sua pontuação. A consulta não afeta seu score.', priority: 'urgent', time: 'Hoje' },
        { title: 'Pague tudo em dia — sem exceções', description: 'Pagamentos em dia são o fator que mais pesa no score. Cada mês sem atrasos aumenta sua pontuação progressivamente.', priority: 'urgent', time: 'Contínuo — efeito em 30–90 dias' },
        { title: 'Use no máximo 30% do limite do cartão', description: 'O percentual de uso do crédito disponível tem grande peso no score. Acima de 50% do limite o impacto é negativo. Reduza o uso ou solicite aumento de limite.', priority: 'important', time: 'Imediato — melhora em 1 ciclo' },
        { title: 'Não cancele cartões antigos', description: 'O tempo médio das suas contas de crédito contribui para o score. Manter contas antigas ativas (mesmo sem usar) é vantajoso.', priority: 'important', time: 'Não faça o cancelamento' },
        { title: 'Cadastre-se no Cadastro Positivo', description: 'Permite que pagamentos em dia (como luz, água, aluguel) sejam computados no score. Acesse serasa.com.br para ativar gratuitamente.', priority: 'recommended', time: 'Efeito em 30–60 dias' },
      ]
    },
    tips: [
      'O score melhora cerca de 15–20 pontos por mês de pagamentos em dia — consistência é tudo',
      'Consultas ao próprio CPF não afetam o score — só consultas de terceiros (bancos, lojas) podem impactar',
      'Ter um cartão de crédito pago em dia é uma das formas mais rápidas de construir histórico positivo',
    ],
  },

  income_commitment: {
    weight: '20% da sua aprovação',
    bankCriteria: [
      'Somatório de todas as parcelas ÷ renda bruta mensal',
      'Parcela do novo financiamento não pode superar 30% da renda',
      'Renda líquida residual após todos os compromissos',
    ],
    situationText: (f) => {
      if (f.status === 'excellent') return 'Seu nível de comprometimento de renda está excelente. Isso significa que você tem boa margem para assumir a parcela do financiamento sem comprometer sua saúde financeira — um sinal verde importante para os bancos.'
      if (f.status === 'good') return 'Seu comprometimento de renda está dentro de um patamar aceitável. A maioria dos bancos aprova até 30% de comprometimento. Você está próximo desse limite, então qualquer redução ajuda.'
      if (f.status === 'fair') return 'Seu comprometimento de renda está na faixa de atenção. Os bancos podem aprovar, mas com condições mais restritivas. Reduzir outras dívidas antes de solicitar o financiamento pode ser decisivo.'
      return 'Seu comprometimento de renda está alto para a análise bancária. Isso tende a ser um motivo direto de reprovação. Algumas estratégias podem ajudar a reverter essa situação antes da solicitação.'
    },
    actionSteps: (f) => {
      if (f.status === 'excellent') return [
        { title: 'Mantenha outras dívidas sob controle', description: 'Seu comprometimento atual é saudável. Evite contrair novas dívidas antes de formalizar o financiamento.', priority: 'important', time: 'Antes da solicitação' },
        { title: 'Organize seus comprovantes de renda', description: 'Tenha em mãos os últimos 3 meses de extrato bancário e holerites para comprovar sua renda estável.', priority: 'recommended', time: '1–2 dias' },
      ]
      return [
        { title: 'Identifique e quite dívidas menores primeiro', description: 'Dívidas pequenas quites liberam margem de renda rapidamente. Liste todas suas parcelas e elimine as menores — cada ponto percentual conta.', priority: 'urgent', time: '30–90 dias' },
        { title: 'Considere aumentar o valor da entrada', description: 'Uma entrada maior reduz o valor financiado e, consequentemente, a parcela mensal. Isso pode ser o fator que destravam a aprovação.', priority: 'urgent', time: 'Antes de solicitar' },
        { title: 'Adicione um co-participante à renda', description: 'Somar a renda com cônjuge ou outra pessoa aumenta a capacidade de aprovação. O co-participante pode ter renda menor, mas já ajuda a compor.', priority: 'important', time: 'Na hora da solicitação' },
        { title: 'Negocie portabilidade de empréstimos existentes', description: 'Se você tem empréstimos, pode portá-los para outro banco com taxas menores, reduzindo o valor da parcela atual e liberando margem.', priority: 'recommended', time: '15–30 dias' },
      ]
    },
    tips: [
      'A maioria dos bancos aprova comprometimento máximo de 30% da renda bruta — esse é o limite-alvo',
      'Quitar um financiamento de carro, por exemplo, pode liberar margem suficiente para aprovar o imobiliário',
      'Ao somar renda com cônjuge, ambos os históricos são analisados — certifique-se que o co-participante também tem CPF limpo',
    ],
  },

  employment: {
    weight: '15% da sua aprovação',
    bankCriteria: [
      'Tipo de vínculo empregatício (CLT, autônomo, empresário)',
      'Tempo de permanência na atividade atual',
      'Capacidade de comprovação de renda com documentos',
    ],
    situationText: (f) => {
      if (f.status === 'excellent') return 'Sua estabilidade de renda é um ponto muito forte. Perfis com alto tempo de atividade e comprovação sólida têm vantagem clara na análise bancária e costumam conseguir condições melhores de financiamento.'
      if (f.status === 'good') return 'Sua estabilidade de renda é boa. Você está em uma posição favorável, mas organizar melhor sua documentação pode fortalecer ainda mais o pedido.'
      if (f.status === 'fair') return 'Sua situação de renda é regular. Os bancos aprovam, mas pode haver exigência de mais documentos ou garantias adicionais. Fortalecer sua comprovação de renda é o caminho.'
      return 'Sua estabilidade de renda precisa de atenção. Isso pode dificultar a aprovação, especialmente em bancos mais conservadores. Algumas ações podem melhorar como o banco enxerga seu perfil.'
    },
    actionSteps: (f) => [
      { title: 'Organize os documentos de comprovação de renda', description: 'Reúna os últimos 3 holerites (CLT) ou 6 meses de extratos bancários mostrando entradas regulares (autônomo/empresário). Quanto mais organizado, melhor.', priority: f.status === 'poor' || f.status === 'critical' ? 'urgent' : 'important', time: '1–3 dias' },
      { title: 'Mantenha renda caindo na mesma conta bancária', description: 'Extratos bancários com entradas regulares e constantes são o principal comprovante para autônomos e empresários. Centralize sua renda em uma conta.', priority: 'important', time: 'A partir de agora' },
      { title: 'Para autônomos: formalização ajuda muito', description: 'Abrir um MEI ou empresa formaliza sua renda e melhora como os bancos enxergam seu perfil. Um contador pode ajudar nesse processo rapidamente.', priority: f.percentage < 60 ? 'important' : 'recommended', time: '1–2 semanas' },
      { title: 'Declaração de IR completa e atualizada', description: 'A declaração de imposto de renda é o documento mais valorizado pelos bancos para comprovar renda de autônomos e empresários. Mantenha sempre atualizada.', priority: 'important', time: 'Anual — mantenha em dia' },
      { title: 'Aguarde mais tempo na atividade atual se possível', description: 'A maioria dos bancos exige mínimo de 6 meses a 1 ano de atividade. Se você está próximo, pode valer a pena aguardar para ter condições melhores.', priority: f.percentage < 50 ? 'urgent' : 'recommended', time: 'Conforme seu momento atual' },
    ],
    tips: [
      'CLT com 2+ anos de empresa tem as melhores condições — bancos enxergam como risco mínimo',
      'Servidor público e aposentado têm aprovação facilitada por conta da estabilidade da renda garantida',
      'Autônomo consegue aprovação, mas precisa de documentação mais robusta — quanto mais organizado, melhor',
    ],
  },

  down_payment: {
    weight: '10% da sua aprovação',
    bankCriteria: [
      'Percentual do valor do imóvel disponível como entrada',
      'Origem dos recursos (FGTS, poupança, doação, venda de bem)',
      'Capacidade de arcar com custos de cartório e documentação',
    ],
    situationText: (f) => {
      if (f.status === 'excellent') return 'Você tem uma excelente capacidade de entrada. Isso reduz significativamente o risco para o banco, garante acesso às melhores taxas de juros e aumenta muito as suas chances de aprovação.'
      if (f.status === 'good') return 'Sua entrada está em um patamar bom. Você já está acima do mínimo exigido pela maioria dos bancos. Aumentar um pouco mais pode garantir taxas de juros ainda melhores.'
      if (f.status === 'fair') return 'Sua entrada está no mínimo aceitável. Os bancos aprovam, mas você provavelmente não terá acesso às melhores taxas. Vale explorar opções para aumentá-la um pouco.'
      return 'Sua entrada está abaixo do ideal para a maioria dos bancos. Isso pode ser um fator de reprovação ou resultar em condições desfavoráveis. Existem alternativas que podem ajudar a superar esse desafio.'
    },
    actionSteps: (f) => {
      const steps: ActionStep[] = []
      if (f.percentage < 60) {
        steps.push({ title: 'Verifique seu saldo de FGTS disponível', description: 'O FGTS pode ser usado como entrada em imóveis residenciais. Consulte seu saldo pelo app da Caixa Econômica ou site fgts.caixa.gov.br gratuitamente.', priority: 'urgent', time: 'Hoje' })
        steps.push({ title: 'Pesquise programas Minha Casa Minha Vida', description: 'Dependendo da sua renda e cidade, você pode ter acesso a condições de entrada facilitada ou subsidiada. Verifique elegibilidade em caixa.gov.br/mcmv.', priority: 'urgent', time: '1–2 dias' })
      }
      steps.push({ title: 'Monte um plano de poupança com prazo definido', description: 'Calcule quanto precisa para atingir 20% do valor do imóvel e divida pelo prazo. Guarde esse valor mensalmente em uma conta separada ou CDB.', priority: f.percentage < 50 ? 'important' : 'recommended', time: '3–12 meses conforme meta' })
      steps.push({ title: 'Explore a venda de bens não essenciais', description: 'Veículos, equipamentos ou outros bens podem ser convertidos em entrada. Um bem quitado também pode ser usado como garantia para melhorar as condições.', priority: 'recommended', time: 'Conforme disponibilidade' })
      steps.push({ title: 'Considere um imóvel de valor menor como primeiro passo', description: 'Um imóvel de menor valor exige menos entrada e pode ser a porta de entrada para o mercado imobiliário. Depois de quitado, facilita o próximo financiamento.', priority: 'recommended', time: 'Reavaliação do objetivo' })
      return steps
    },
    tips: [
      '20% de entrada é o ponto que destravan as melhores taxas — abaixo disso os juros sobem significativamente',
      'O FGTS pode ser usado como entrada mesmo para quem não tem saldo alto — todo valor ajuda',
      'Programas como MCMV permitem entrada de apenas 5% em alguns casos — vale pesquisar sua elegibilidade',
    ],
  },
}

// ── Status helpers ─────────────────────────────────────────────
function statusDotColor(status: FactorStatus): string {
  const map: Record<FactorStatus, string> = {
    excellent: 'bg-emerald-500',
    good: 'bg-green-500',
    fair: 'bg-yellow-500',
    poor: 'bg-orange-500',
    critical: 'bg-red-500',
    unknown: 'bg-slate-400',
  }
  return map[status]
}

function statusLabel(status: FactorStatus): string {
  const map: Record<FactorStatus, string> = {
    excellent: 'Excelente', good: 'Bom', fair: 'Regular',
    poor: 'Ruim', critical: 'Crítico', unknown: 'Indefinido',
  }
  return map[status]
}

function statusCardStyle(status: FactorStatus): string {
  const map: Record<FactorStatus, string> = {
    excellent: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    good: 'border-green-200 bg-green-50 text-green-800',
    fair: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    poor: 'border-orange-200 bg-orange-50 text-orange-800',
    critical: 'border-red-200 bg-red-50 text-red-800',
    unknown: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return map[status]
}

function StatusIcon({ status }: { status: FactorStatus }) {
  if (status === 'excellent' || status === 'good') return <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
  if (status === 'fair') return <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500" />
  if (status === 'poor' || status === 'critical') return <XCircle className="h-5 w-5 shrink-0 text-red-500" />
  return <AlertTriangle className="h-5 w-5 shrink-0 text-slate-400" />
}

function priorityBadge(priority: ActionStep['priority']) {
  if (priority === 'urgent') return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Urgente</span>
  if (priority === 'important') return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Importante</span>
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Recomendado</span>
}

// ── Nav items ──────────────────────────────────────────────────
const NAV_ITEMS: { id: ModuleId; label: string; shortLabel: string; icon: React.ElementType; factorId?: string }[] = [
  { id: 'overview', label: 'Visão Geral', shortLabel: 'Geral', icon: LayoutDashboard },
  { id: 'restrictions', label: 'Histórico do CPF', shortLabel: 'CPF', icon: Shield, factorId: 'restrictions' },
  { id: 'credit_score', label: 'Comportamento Financeiro', shortLabel: 'Score', icon: CreditCard, factorId: 'credit_score' },
  { id: 'income_commitment', label: 'Comprometimento de Renda', shortLabel: 'Renda', icon: TrendingUp, factorId: 'income_commitment' },
  { id: 'employment', label: 'Estabilidade da Renda', shortLabel: 'Estabilidade', icon: Briefcase, factorId: 'employment' },
  { id: 'down_payment', label: 'Capacidade de Entrada', shortLabel: 'Entrada', icon: DollarSign, factorId: 'down_payment' },
]

// ── Overview Module ────────────────────────────────────────────
function OverviewModule({ result }: { result: ScoringResult }) {
  const score = result.approval_percentage
  const color = scoreColor(score)

  return (
    <div className="space-y-6">
      {/* Score hero */}
      <div
        className="rounded-2xl p-5 text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #0F2830 0%, #1A4D58 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <ScoreGauge score={score} size={130} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Resultado da análise
            </p>
            <div
              className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-bold"
              style={{ background: `${color}28`, color }}
            >
              Aprovação {result.label}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {score >= 80
                ? 'Perfil bem posicionado. Veja cada módulo para manter seu resultado.'
                : score >= 60
                ? 'Potencial de aprovação com ajustes pontuais. Siga o plano de cada módulo.'
                : score >= 40
                ? 'Pontos importantes a ajustar. Cada módulo tem um plano de ação específico.'
                : 'Atenção necessária em critérios fundamentais. O plano de ação vai te guiar.'}
            </p>
          </div>
        </div>
      </div>

      {/* Priority actions */}
      {result.general_recommendations.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-slate-900">Próximos passos prioritários</h3>
          <div className="space-y-3">
            {result.general_recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex gap-4">
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  rec.impact === 'high' ? 'bg-red-100 text-red-600' : rec.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                )}>{i + 1}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rec.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Factor mini grid */}
      <div>
        <h3 className="mb-3 text-base font-bold text-slate-900">Análise por fator</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.factors.map((factor) => (
            <div key={factor.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 truncate pr-2">{factor.name}</span>
                <span className="shrink-0 text-xs font-bold" style={{ color: scoreColor(factor.percentage) }}>{factor.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn('h-full rounded-full transition-all', statusBarColor(factor.status))}
                  style={{ width: `${factor.percentage}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', statusDotColor(factor.status))} />
                <span className="text-xs text-slate-500">{statusLabel(factor.status)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl p-6 text-center" style={{ background: '#0F2830' }}>
        <p className="mb-2 text-lg font-bold text-white">Quer avançar com orientação?</p>
        <p className="mb-5 text-sm text-slate-400">Nossa equipe analisa seu perfil e te orienta no caminho certo para aprovação.</p>
        <ContactCTA score={score} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors" />
      </div>
    </div>
  )
}

// ── Factor Module ──────────────────────────────────────────────
function FactorModule({ factor }: { factor: ScoringFactor }) {
  const content = MODULE_CONTENT[factor.id]
  if (!content) return null

  const situation = content.situationText(factor)
  const steps = content.actionSteps(factor)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">{content.weight}</p>
            <h2 className="text-xl font-bold text-slate-900">{factor.name}</h2>
          </div>
          <div className={cn('shrink-0 rounded-full px-3 py-1 text-sm font-bold border', statusCardStyle(factor.status))}>
            {statusLabel(factor.status)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all', statusBarColor(factor.status))}
              style={{ width: `${factor.percentage}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-bold text-slate-700">{factor.points}/{factor.max_points} pts</span>
        </div>
      </div>

      {/* How bank analyzes */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-900 uppercase tracking-wide">Como o banco analisa</h3>
        <div className="space-y-2">
          {content.bankCriteria.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              <span className="text-sm text-slate-600">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current situation */}
      <div className={cn('rounded-2xl border p-5', statusCardStyle(factor.status))}>
        <div className="flex gap-3">
          <StatusIcon status={factor.status} />
          <div>
            <p className="mb-1 text-sm font-bold">Sua situação atual</p>
            <p className="text-sm leading-relaxed">{situation}</p>
          </div>
        </div>
      </div>

      {/* Action plan */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wide">Plano de ação</h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-slate-100 min-h-4" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                  {priorityBadge(step.priority)}
                </div>
                <p className="mb-2 text-sm text-slate-500 leading-relaxed">{step.description}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {step.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-900 uppercase tracking-wide">Dicas práticas</h3>
        <div className="space-y-3">
          {content.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <p className="text-sm text-slate-600">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function ResultadoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const local = searchParams.get('local')

  const [result, setResult] = useState<ScoringResult | null>(null)
  const [rawAnswers, setRawAnswers] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState<ModuleId>('overview')
  const [leadCaptured, setLeadCaptured] = useState(false)

  useEffect(() => {
    async function load() {
      if (local) {
        const raw = sessionStorage.getItem('financiare_result')
        if (raw) {
          const parsed = JSON.parse(raw)
          setResult(parsed.result)
          setRawAnswers(parsed.answers)
        }
        setLoading(false)
        return
      }
      if (!id) { router.push('/simulacao'); return }
      const supabase = createClient()
      const { data } = await supabase.from('simulations').select('result').eq('id', id).single()
      if (data?.result) setResult(data.result as ScoringResult)
      setLoading(false)
    }
    load()
  }, [id, local, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-slate-500">Carregando sua análise...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-bold text-slate-900">Análise não encontrada</h2>
          <p className="text-slate-500">Entre em contato com nossa equipe para iniciar sua análise.</p>
        </div>
      </div>
    )
  }

  const activeFactorId = NAV_ITEMS.find(n => n.id === activeModule)?.factorId
  const activeFactor = activeFactorId ? result.factors.find(f => f.id === activeFactorId) : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 border-b border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <NavLogo iconSize={22} />
          {!local && (
            <Link href="/simulacao" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Nova análise
            </Link>
          )}
        </div>
      </nav>

      {/* Blocking modal — shown until lead data is submitted */}
      {local && result && !leadCaptured && (
        <LeadCaptureForm answers={rawAnswers} result={result} onSuccess={() => setLeadCaptured(true)} />
      )}

      {/* pb-24 on mobile to clear bottom bar */}
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6">
        <div className="flex gap-6">
          {/* Sidebar — desktop only */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-20 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Módulos</p>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const factor = item.factorId ? result.factors.find(f => f.id === item.factorId) : null
                  const isActive = activeModule === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveModule(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all',
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      {factor && (
                        <div className={cn('h-2 w-2 shrink-0 rounded-full', statusDotColor(factor.status))} />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {activeModule === 'overview'
              ? <OverviewModule result={result} />
              : activeFactor
                ? <FactorModule factor={activeFactor} />
                : null
            }
          </div>
        </div>
      </div>

      {/* Bottom bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white md:hidden">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const factor = item.factorId ? result.factors.find(f => f.id === item.factorId) : null
            const isActive = activeModule === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveModule(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-emerald-600' : 'text-slate-400'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-emerald-500" />
                )}
                <item.icon className={cn('h-5 w-5', isActive ? 'text-emerald-600' : 'text-slate-400')} />
                <span>{item.shortLabel}</span>
                {factor && (
                  <span className={cn('absolute top-2 right-1/4 h-1.5 w-1.5 rounded-full', statusDotColor(factor.status))} />
                )}
              </button>
            )
          })}
        </div>
        {/* Safe area spacer for iOS */}
        <div className="h-safe-bottom bg-white" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>
    </div>
  )
}
