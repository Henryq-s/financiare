// ============================================================
// Questionnaire step definitions
// ============================================================

export interface QuestionOption {
  value: string | number | boolean
  label: string
  sublabel?: string
}

export interface Question {
  id: string
  label: string
  sublabel?: string
  type: 'text' | 'cpf' | 'phone' | 'date' | 'number' | 'currency' | 'select' | 'radio' | 'boolean'
  options?: QuestionOption[]
  placeholder?: string
  required: boolean
  hint?: string
}

export interface Step {
  id: number
  title: string
  subtitle: string
  icon: string
  note?: string
  questions: Question[]
}

export const SIMULATION_STEPS: Step[] = [
  {
    id: 1,
    title: 'Agora vamos entender sua situação atual',
    subtitle: 'Suas respostas nos ajudam a entender o que pode aprovar ou impedir seu financiamento hoje.',
    icon: 'BarChart2',
    note: 'Suas informações são confidenciais. Nenhuma consulta será feita sem sua autorização.',
    questions: [
      {
        id: 'has_restrictions',
        label: 'Seu CPF possui alguma restrição atualmente?',
        sublabel: 'Isso nos ajuda a entender o melhor caminho para sua aprovação.',
        type: 'boolean',
        required: true,
      },
      {
        id: 'restriction_level',
        label: 'Qual o nível das restrições?',
        type: 'radio',
        required: false,
        hint: 'Responda apenas se possui restrições',
        options: [
          { value: 'light', label: 'Leves', sublabel: 'Dívidas pequenas ou recentes (até 1 ano)' },
          { value: 'severe', label: 'Graves', sublabel: 'Dívidas grandes, protestos ou execuções' },
        ],
      },
      {
        id: 'credit_score_range',
        label: 'Você sabe como está seu score de crédito hoje?',
        type: 'radio',
        required: true,
        options: [
          { value: 'unknown', label: 'Não sei', sublabel: 'Nunca consultei' },
          { value: '0_300', label: 'Até 300', sublabel: 'Muito baixo' },
          { value: '301_500', label: '300 a 500', sublabel: 'Baixo' },
          { value: '501_700', label: '500 a 700', sublabel: 'Regular' },
          { value: '701_850', label: 'Acima de 700', sublabel: 'Bom a excelente' },
          { value: '851_1000', label: 'Acima de 850', sublabel: 'Excelente' },
        ],
      },
      {
        id: 'has_fgts',
        label: 'Você possui FGTS disponível para utilizar?',
        type: 'radio',
        required: false,
        options: [
          { value: 'yes', label: 'Sim' },
          { value: 'no', label: 'Não' },
          { value: 'unknown', label: 'Não sei' },
        ],
      },
      {
        id: 'monthly_income',
        label: 'Qual é sua renda mensal aproximada?',
        sublabel: 'Pode considerar salário, renda extra ou outras entradas.',
        type: 'currency',
        placeholder: '0,00',
        required: true,
      },
      {
        id: 'financing_with',
        label: 'Você pretende financiar sozinho ou com outra pessoa?',
        type: 'radio',
        required: false,
        options: [
          { value: 'alone', label: 'Sozinho' },
          { value: 'spouse', label: 'Com cônjuge' },
          { value: 'other', label: 'Com outra pessoa' },
        ],
      },
      {
        id: 'current_income_commitment',
        label: 'Hoje você tem dívidas ou parcelas em andamento?',
        sublabel: 'Considere cartão, empréstimos ou financiamentos.',
        type: 'select',
        required: true,
        options: [
          { value: 0, label: 'Nenhuma dívida atual' },
          { value: 10, label: 'Até 10% da minha renda' },
          { value: 20, label: 'De 10% a 20% da minha renda' },
          { value: 30, label: 'De 20% a 30% da minha renda' },
          { value: 40, label: 'De 30% a 40% da minha renda' },
          { value: 55, label: 'Mais de 40% da minha renda' },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Qual é a sua forma de renda?',
    subtitle: 'Cada tipo de renda é analisado de forma diferente, queremos entender a sua.',
    icon: 'Briefcase',
    note: 'Não existe resposta certa ou errada, queremos apenas entender sua realidade.',
    questions: [
      {
        id: 'employment_type',
        label: 'Qual dessas opções melhor descreve sua renda hoje?',
        type: 'radio',
        required: true,
        hint: 'Mesmo quem não tem carteira assinada pode ser aprovado.',
        options: [
          { value: 'clt', label: 'CLT / carteira assinada', sublabel: 'Emprego com carteira' },
          { value: 'public_servant', label: 'Servidor público', sublabel: 'Federal, estadual ou municipal' },
          { value: 'retired', label: 'Aposentado ou pensionista', sublabel: 'INSS ou outro' },
          { value: 'business_owner', label: 'Empresário ou MEI', sublabel: 'Sócio ou dono de empresa' },
          { value: 'autonomous', label: 'Autônomo / renda por conta própria', sublabel: 'Trabalho por conta própria' },
          { value: 'other', label: 'Outro', sublabel: 'Bolsista, estagiário, etc.' },
        ],
      },
      {
        id: 'employment_time',
        label: 'Há quanto tempo você está na sua atividade atual?',
        sublabel: 'Isso ajuda a entender a estabilidade da sua renda.',
        type: 'radio',
        required: true,
        options: [
          { value: 'less_3m', label: 'Menos de 3 meses' },
          { value: '3m_6m', label: 'De 3 a 6 meses' },
          { value: '6m_1y', label: 'De 6 meses a 1 ano' },
          { value: '1y_2y', label: 'De 1 a 2 anos' },
          { value: '2y_5y', label: 'De 2 a 5 anos' },
          { value: 'more_5y', label: 'Mais de 5 anos' },
        ],
      },
      {
        id: 'has_proof_of_income',
        label: 'Hoje você possui alguma forma de comprovar sua renda?',
        sublabel: 'Pode ser holerite, extrato bancário, declaração de imposto de renda ou organização com contador.',
        type: 'radio',
        required: true,
        hint: 'Mesmo que não tenha, ainda existem caminhos, queremos entender sua situação.',
        options: [
          { value: true, label: 'Sim' },
          { value: false, label: 'Ainda não' },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Qual é o seu objetivo com a casa própria?',
    subtitle: 'Vamos entender seu objetivo para direcionar seu financiamento da forma correta.',
    icon: 'Home',
    questions: [
      {
        id: 'financing_type',
        label: 'O que você deseja financiar?',
        type: 'radio',
        required: true,
        options: [
          { value: 'ready_property', label: 'Casa pronta', sublabel: 'Imóvel já construído' },
          { value: 'land_construction', label: 'Terreno + construção', sublabel: 'Comprar o terreno e construir' },
          { value: 'land_only', label: 'Apenas o terreno', sublabel: 'Só o terreno por enquanto' },
          { value: 'evaluating', label: 'Ainda estou avaliando', sublabel: 'Não decidi ainda' },
        ],
      },
      {
        id: 'has_land',
        label: 'Você já possui um terreno?',
        type: 'boolean',
        required: false,
      },
      {
        id: 'city',
        label: 'Em qual cidade você pretende financiar?',
        type: 'text',
        placeholder: 'Cidade/Estado',
        required: false,
      },
      {
        id: 'asset_value',
        label: 'Qual o valor aproximado do imóvel que você deseja?',
        sublabel: 'Pode ser uma estimativa, vamos usar isso para entender sua aprovação.',
        type: 'currency',
        placeholder: '0,00',
        required: true,
      },
      {
        id: 'has_down_payment',
        label: 'Você possui algum valor para entrada hoje?',
        sublabel: 'Mesmo que não tenha, ainda existem possibilidades.',
        type: 'boolean',
        required: true,
      },
      {
        id: 'down_payment',
        label: 'Qual o valor disponível para entrada?',
        sublabel: 'Informe o valor aproximado que você tem disponível.',
        type: 'currency',
        placeholder: '0,00',
        required: false,
      },
      {
        id: 'desired_term_months',
        label: 'Em quanto tempo você gostaria de pagar seu financiamento?',
        type: 'select',
        required: true,
        options: [
          { value: 240, label: 'Até 20 anos' },
          { value: 300, label: 'De 20 a 30 anos' },
          { value: 420, label: 'De 30 a 35 anos' },
          { value: 360, label: 'Quero a melhor opção para minha realidade' },
        ],
      },
      {
        id: 'has_paid_asset',
        label: 'Você possui algum imóvel ou veículo quitado no seu nome?',
        sublabel: 'Bens quitados podem ser usados como garantia e aumentam a aprovação',
        type: 'boolean',
        required: true,
      },
      {
        id: 'main_difficulty',
        label: 'Qual é sua maior dificuldade hoje para conquistar sua casa?',
        type: 'radio',
        required: false,
        options: [
          { value: 'approval', label: 'Não sei se consigo aprovação' },
          { value: 'income', label: 'Minha renda é limitada' },
          { value: 'process', label: 'Tenho dúvidas sobre o processo' },
          { value: 'start', label: 'Não sei por onde começar' },
        ],
      },
      {
        id: 'wants_guidance',
        label: 'Você deseja realmente iniciar seu financiamento com orientação?',
        type: 'radio',
        required: false,
        options: [
          { value: 'yes', label: 'Sim, quero começar' },
          { value: 'understand', label: 'Quero entender melhor primeiro' },
          { value: 'researching', label: 'Só estou pesquisando' },
        ],
      },
      {
        id: 'financing_timeline',
        label: 'Em quanto tempo você pretende iniciar seu financiamento?',
        type: 'radio',
        required: false,
        options: [
          { value: 'asap', label: 'O quanto antes' },
          { value: '3months', label: 'Nos próximos 3 meses' },
          { value: '6months', label: 'De 3 a 6 meses' },
          { value: 'organizing', label: 'Ainda estou me organizando' },
        ],
      },
      {
        id: 'wants_contact',
        label: 'Podemos te orientar com base no seu perfil?',
        type: 'radio',
        required: false,
        options: [
          { value: 'yes', label: 'Sim, quero atendimento' },
          { value: 'no', label: 'Prefiro só ver meu resultado' },
        ],
      },
    ],
  },
]
