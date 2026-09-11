import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { recalculateTrainingIndicators } from './training-indicators'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_option_index: number
  explanation?: string
}

export type QuizStatus = 'draft' | 'published' | 'archived'
export type QuizGenerationMethod = 'manual' | 'ai_generated' | 'hybrid'

export interface DocumentQuiz {
  id: string
  document_id: string
  title: string
  description?: string
  min_score_percent: number
  estimated_minutes?: number
  questions: QuizQuestion[] | string
  status: QuizStatus
  generation_method?: QuizGenerationMethod
  created_by_name?: string
  created?: string
  updated?: string
  expand?: {
    document_id?: {
      id: string
      title: string
      code?: string
      prefix?: string
      revision?: string
    }
  }
}

export interface ReadingSession {
  id: string
  document_id: string
  team_member_id?: string
  user_id?: string
  reader_name: string
  reader_role?: string
  company_id?: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  completed?: boolean
  abandoned?: boolean
  notes?: string
  created?: string
  updated?: string
  expand?: {
    document_id?: {
      id: string
      title: string
      code?: string
      prefix?: string
    }
    team_member_id?: {
      id: string
      name: string
      role?: string
      department?: string
    }
  }
}

export interface QuizAnswerItem {
  question_id: string
  selected_index: number
  is_correct: boolean
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  document_id: string
  team_member_id?: string
  user_id?: string
  collaborator_name: string
  collaborator_role?: string
  company_id?: string
  answers: QuizAnswerItem[] | string
  score_percent: number
  approved: boolean
  attempt_number: number
  duration_seconds?: number
  training_action_id?: string
  effectiveness_evaluated?: boolean
  created?: string
  updated?: string
  expand?: {
    quiz_id?: DocumentQuiz
    document_id?: {
      id: string
      title: string
      code?: string
      prefix?: string
    }
    team_member_id?: {
      id: string
      name: string
      role?: string
      department?: string
    }
  }
}

export interface DocumentReadingMetrics {
  document_id: string
  total_readers: number
  total_sessions: number
  avg_reading_time_seconds: number
  total_attempts: number
  approved_attempts: number
  approval_rate_percent: number
  active_quiz?: DocumentQuiz | null
}

export interface CollaboratorReadingHistory {
  sessions: ReadingSession[]
  attempts: QuizAttempt[]
  total_reading_time_seconds: number
  quizzes_passed_count: number
  quizzes_failed_count: number
}

// -------------------------------------------------------------
// READING SESSIONS
// -------------------------------------------------------------

const MAX_VALID_READING_SECONDS = 2 * 60 * 60 // 2 hours = 7200s (longer is flagged as abandoned)

export async function startReadingSession(params: {
  documentId: string
  teamMemberId?: string
  userId?: string
  readerName: string
  readerRole?: string
  companyId?: string
}): Promise<ReadingSession | null> {
  try {
    const payload = {
      document_id: params.documentId,
      team_member_id: params.teamMemberId || null,
      user_id: params.userId || null,
      reader_name: params.readerName,
      reader_role: params.readerRole || '',
      company_id: params.companyId || null,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      completed: false,
      abandoned: false,
    }
    const record = await pb.collection('document_reading_sessions').create<ReadingSession>(payload)
    return record
  } catch (err) {
    console.warn('startReadingSession warning:', err)
    return null
  }
}

export async function finishReadingSession(
  sessionId: string,
  startTime: Date,
  isExplicitCompletion = true,
): Promise<ReadingSession | null> {
  try {
    const now = new Date()
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000))
    const isAbandoned = elapsedSeconds > MAX_VALID_READING_SECONDS

    const payload = {
      ended_at: now.toISOString(),
      duration_seconds: isAbandoned ? MAX_VALID_READING_SECONDS : elapsedSeconds,
      completed: isExplicitCompletion && !isAbandoned,
      abandoned: isAbandoned,
    }
    const record = await pb
      .collection('document_reading_sessions')
      .update<ReadingSession>(sessionId, payload)
    return record
  } catch (err) {
    console.warn('finishReadingSession warning:', err)
    return null
  }
}

export async function getDocumentReadingSessions(documentId: string): Promise<ReadingSession[]> {
  try {
    const records = await pb.collection('document_reading_sessions').getFullList<ReadingSession>({
      filter: `document_id = "${documentId}"`,
      sort: '-started_at',
      expand: 'team_member_id,document_id',
    })
    return safeArray(records)
  } catch (err) {
    console.warn('getDocumentReadingSessions warning:', err)
    return []
  }
}

export async function getCollaboratorReadingSessions(
  teamMemberId?: string,
  readerName?: string,
): Promise<ReadingSession[]> {
  try {
    const filters: string[] = []
    if (teamMemberId) filters.push(`team_member_id = "${teamMemberId}"`)
    if (readerName && !teamMemberId) filters.push(`reader_name ~ "${readerName}"`)
    if (filters.length === 0) return []

    const records = await pb.collection('document_reading_sessions').getFullList<ReadingSession>({
      filter: filters.join(' || '),
      sort: '-started_at',
      expand: 'document_id',
    })
    return safeArray(records)
  } catch (err) {
    console.warn('getCollaboratorReadingSessions warning:', err)
    return []
  }
}

// -------------------------------------------------------------
// QUIZZES
// -------------------------------------------------------------

export async function getQuizForDocument(documentId: string): Promise<DocumentQuiz | null> {
  try {
    const records = await pb.collection('document_quizzes').getList<DocumentQuiz>(1, 1, {
      filter: `document_id = "${documentId}" && status = "published"`,
      sort: '-created',
    })
    if (records.items.length > 0) {
      const q = records.items[0]
      return parseQuizQuestions(q)
    }
    // Fallback to draft/any
    const anyRecord = await pb.collection('document_quizzes').getList<DocumentQuiz>(1, 1, {
      filter: `document_id = "${documentId}"`,
      sort: '-created',
    })
    return anyRecord.items.length > 0 ? parseQuizQuestions(anyRecord.items[0]) : null
  } catch (err) {
    console.warn('getQuizForDocument warning:', err)
    return null
  }
}

export async function getAllQuizzes(): Promise<DocumentQuiz[]> {
  try {
    const records = await pb.collection('document_quizzes').getFullList<DocumentQuiz>({
      sort: '-created',
      expand: 'document_id',
    })
    return safeArray(records).map(parseQuizQuestions)
  } catch (err) {
    console.warn('getAllQuizzes warning:', err)
    return []
  }
}

export async function saveDocumentQuiz(
  quiz: Partial<DocumentQuiz> & { document_id: string; title: string },
): Promise<DocumentQuiz> {
  const payload = {
    document_id: quiz.document_id,
    title: quiz.title,
    description: quiz.description || '',
    min_score_percent: typeof quiz.min_score_percent === 'number' ? quiz.min_score_percent : 70,
    estimated_minutes: quiz.estimated_minutes || 15,
    questions:
      typeof quiz.questions === 'string' ? quiz.questions : JSON.stringify(quiz.questions || []),
    status: quiz.status || 'published',
    generation_method: quiz.generation_method || 'manual',
    created_by_name: quiz.created_by_name || 'Gestão da Qualidade',
  }

  if (quiz.id) {
    const updated = await pb.collection('document_quizzes').update<DocumentQuiz>(quiz.id, payload)
    return parseQuizQuestions(updated)
  } else {
    const created = await pb.collection('document_quizzes').create<DocumentQuiz>(payload)
    return parseQuizQuestions(created)
  }
}

function parseQuizQuestions(quiz: DocumentQuiz): DocumentQuiz {
  if (typeof quiz.questions === 'string') {
    try {
      quiz.questions = JSON.parse(quiz.questions)
    } catch {
      quiz.questions = []
    }
  }
  return quiz
}

// -------------------------------------------------------------
// QUIZ ATTEMPTS
// -------------------------------------------------------------

export async function getAttemptsForDocument(documentId: string): Promise<QuizAttempt[]> {
  try {
    const records = await pb.collection('quiz_attempts').getFullList<QuizAttempt>({
      filter: `document_id = "${documentId}"`,
      sort: '-created',
      expand: 'team_member_id,quiz_id',
    })
    return safeArray(records).map(parseAttemptAnswers)
  } catch (err) {
    console.warn('getAttemptsForDocument warning:', err)
    return []
  }
}

export async function getCollaboratorAttempts(
  teamMemberId?: string,
  name?: string,
): Promise<QuizAttempt[]> {
  try {
    const filters: string[] = []
    if (teamMemberId) filters.push(`team_member_id = "${teamMemberId}"`)
    if (name && !teamMemberId) filters.push(`collaborator_name ~ "${name}"`)
    if (filters.length === 0) return []

    const records = await pb.collection('quiz_attempts').getFullList<QuizAttempt>({
      filter: filters.join(' || '),
      sort: '-created',
      expand: 'document_id,quiz_id',
    })
    return safeArray(records).map(parseAttemptAnswers)
  } catch (err) {
    console.warn('getCollaboratorAttempts warning:', err)
    return []
  }
}

function parseAttemptAnswers(attempt: QuizAttempt): QuizAttempt {
  if (typeof attempt.answers === 'string') {
    try {
      attempt.answers = JSON.parse(attempt.answers)
    } catch {
      attempt.answers = []
    }
  }
  return attempt
}

export async function submitQuizAttempt(params: {
  quiz: DocumentQuiz
  answers: Array<{ question_id: string; selected_index: number }>
  teamMemberId?: string
  userId?: string
  collaboratorName: string
  collaboratorRole?: string
  companyId?: string
  durationSeconds?: number
}): Promise<{
  attempt: QuizAttempt
  scorePercent: number
  approved: boolean
  totalQuestions: number
  correctCount: number
}> {
  const questions: QuizQuestion[] = Array.isArray(params.quiz.questions)
    ? params.quiz.questions
    : JSON.parse((params.quiz.questions as string) || '[]')

  let correctCount = 0
  const evaluatedAnswers: QuizAnswerItem[] = questions.map((q) => {
    const userAns = params.answers.find((a) => a.question_id === q.id)
    const selected = userAns !== undefined ? userAns.selected_index : -1
    const isCorrect = selected === q.correct_option_index
    if (isCorrect) correctCount++
    return {
      question_id: q.id,
      selected_index: selected,
      is_correct: isCorrect,
    }
  })

  const total = questions.length > 0 ? questions.length : 1
  const scorePercent = Math.round((correctCount / total) * 100)
  const minRequired = params.quiz.min_score_percent ?? 70
  const approved = scorePercent >= minRequired

  // Count previous attempts to compute attempt_number
  let attemptNumber = 1
  try {
    const filter = params.teamMemberId
      ? `quiz_id = "${params.quiz.id}" && team_member_id = "${params.teamMemberId}"`
      : `quiz_id = "${params.quiz.id}" && collaborator_name = "${params.collaboratorName}"`
    const prev = await pb.collection('quiz_attempts').getList(1, 1, { filter })
    attemptNumber = (prev.totalItems || 0) + 1
  } catch {
    /* intentionally ignored */
  }

  const payload = {
    quiz_id: params.quiz.id,
    document_id: params.quiz.document_id,
    team_member_id: params.teamMemberId || null,
    user_id: params.userId || null,
    collaborator_name: params.collaboratorName,
    collaborator_role: params.collaboratorRole || '',
    company_id: params.companyId || null,
    answers: JSON.stringify(evaluatedAnswers),
    score_percent: scorePercent,
    approved,
    attempt_number: attemptNumber,
    duration_seconds: params.durationSeconds || 0,
    effectiveness_evaluated: approved,
  }

  const record = await pb.collection('quiz_attempts').create<QuizAttempt>(payload)

  // Tolerant notification & KPI recalculation on approval
  try {
    if (params.companyId) {
      const year = new Date().getFullYear()
      // Recalculate indicators in background (never throws or blocks)
      recalculateTrainingIndicators({ companyId: params.companyId, year }).catch((e) =>
        console.warn('recalculateTrainingIndicators tolerant catch:', e),
      )
    }
  } catch (err) {
    console.warn('tolerant KPI trigger failed:', err)
  }

  // Non-blocking notification creation
  try {
    if (params.userId) {
      await pb.collection('notifications').create({
        user_id: params.userId,
        type: approved ? 'approved' : 'rejected',
        message: approved
          ? `Parabéns! Você foi APROVADO na Prova de Leitura com nota ${scorePercent}% (mínimo ${minRequired}%). Treinamento e eficácia registrados com sucesso!`
          : `Resultado da Prova de Leitura: nota ${scorePercent}% (mínimo ${minRequired}%). Você pode revisar o documento e tentar novamente.`,
        read: false,
      })
    }
  } catch (err) {
    console.warn('tolerant notification catch:', err)
  }

  return {
    attempt: parseAttemptAnswers(record),
    scorePercent,
    approved,
    totalQuestions: total,
    correctCount,
  }
}

// -------------------------------------------------------------
// DOCUMENT REPORT METRICS FOR GQ
// -------------------------------------------------------------

export async function getDocumentReadingMetrics(
  documentId: string,
): Promise<DocumentReadingMetrics> {
  try {
    const [sessions, attempts, quiz] = await Promise.all([
      getDocumentReadingSessions(documentId),
      getAttemptsForDocument(documentId),
      getQuizForDocument(documentId),
    ])

    const validSessions = sessions.filter((s) => !s.abandoned && (s.duration_seconds || 0) > 0)
    const totalDuration = validSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
    const avgReadingTime =
      validSessions.length > 0 ? Math.round(totalDuration / validSessions.length) : 0

    // Unique readers count
    const uniqueReaders = new Set(
      sessions.map((s) => s.team_member_id || s.reader_name).filter(Boolean),
    )

    const approvedAttempts = attempts.filter((a) => a.approved)
    const approvalRate =
      attempts.length > 0 ? Math.round((approvedAttempts.length / attempts.length) * 100) : 0

    return {
      document_id: documentId,
      total_readers: uniqueReaders.size,
      total_sessions: sessions.length,
      avg_reading_time_seconds: avgReadingTime,
      total_attempts: attempts.length,
      approved_attempts: approvedAttempts.length,
      approval_rate_percent: approvalRate,
      active_quiz: quiz,
    }
  } catch (err) {
    console.warn('getDocumentReadingMetrics warning:', err)
    return {
      document_id: documentId,
      total_readers: 0,
      total_sessions: 0,
      avg_reading_time_seconds: 0,
      total_attempts: 0,
      approved_attempts: 0,
      approval_rate_percent: 0,
      active_quiz: null,
    }
  }
}

// -------------------------------------------------------------
// IA GENERATION OF QUESTIONS (with solid fallback)
// -------------------------------------------------------------

export async function generateQuizQuestionsWithAI(document: {
  title: string
  code?: string
  content?: string
  sector?: string
  category?: string
}): Promise<{ questions: QuizQuestion[]; source: 'ai' | 'fallback' }> {
  const cleanContent = (document.content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const prompt = `Você é um Especialista em Gestão da Qualidade Industrial (ISO 9001 e ASME).
Crie exatamente 4 perguntas de múltipla escolha para comprovar a leitura e eficácia do procedimento:
Título: ${document.title}
Código: ${document.code || 'N/A'}
Setor: ${document.sector || 'Geral'}
Conteúdo do procedimento:
"""
${cleanContent.slice(0, 3000) || 'Procedimento operacional padrão de qualidade industrial, controle de processos e registros rastreáveis.'}
"""

Responda APENAS com um array JSON válido contendo exatamente este formato:
[
  {
    "id": "q1",
    "question": "Pergunta clara sobre o procedimento?",
    "options": ["Opção correta", "Distrator 1", "Distrator 2", "Distrator 3"],
    "correct_option_index": 0,
    "explanation": "Breve justificativa técnica referenciando a norma/procedimento."
  }
]`

  // Attempt Skip AI direct endpoint if reachable via pb client or standard assistant
  try {
    // Call via pb.send to ensure proper backend origin routing
    const res = await pb.send('/backend/v1/skip-ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify({ prompt, documentTitle: document.title }),
    })
    if (res && Array.isArray(res.questions) && res.questions.length > 0) {
      return { questions: res.questions, source: 'ai' }
    }
  } catch (_) {
    // Expected if endpoint not deployed; proceed gracefully to intelligent domain-aware generation
  }

  // High quality domain-aware generator based on document metadata & content
  const docTitle = document.title || 'Procedimento Técnico'
  const isWelding = /solda|wps|rqps|asme/i.test(docTitle)
  const isInspection = /ensaio|visual|dimensional|inspeção|insp/i.test(docTitle)
  const isWarehouse = /almoxarifado|material|recebimento|armazenamento/i.test(docTitle)

  let fallbackQuestions: QuizQuestion[] = []

  if (isWelding) {
    fallbackQuestions = [
      {
        id: 'q1',
        question: `De acordo com o ${docTitle}, qual requisito mandatório deve ser verificado antes do início da soldagem?`,
        options: [
          'Limpeza da junta, parâmetros de EPS/WPS qualificada e consumíveis estufados',
          'Apenas o horário de término do turno operacional',
          'Uso facultativo de EPIs conforme preferência do soldador',
          'Dispensa de rastreabilidade de consumíveis para juntas secundárias',
        ],
        correct_option_index: 0,
        explanation:
          'A preparação da junta e o atendimento aos parâmetros qualificados na EPS são obrigatórios conforme ASME Seção IX.',
      },
      {
        id: 'q2',
        question:
          'Qual a tolerância de temperatura de pré-aquecimento indicada para aços estruturais?',
        options: [
          'Não há controle necessário de temperatura',
          'Deverá obedecer à faixa estipulada na EPS com checagem por giz térmico ou pirômetro',
          'Sempre superior a 800°C independentemente do material',
          'Qualquer temperatura ambiente acima de 0°C',
        ],
        correct_option_index: 1,
        explanation:
          'O controle estrito do pré-aquecimento e interpasse evita zonas termicamente afetadas frágeis e trincas a frio.',
      },
      {
        id: 'q3',
        question:
          'Em caso de identificação de porosidades agrupadas ou falta de fusão, qual é a ação do Inspetor de Solda?',
        options: [
          'Liberar o vaso com advertência verbal',
          'Interromper a soldagem, emitir RNC, marcar o trecho para remoção por goivagem/esmerilhamento e reinspecionar',
          'Cobrir o defeito com cordão superficial de acabamento',
          'Aguardar o teste hidrostático para confirmar se vazará',
        ],
        correct_option_index: 1,
        explanation:
          'Descontinuidades inaceitáveis exigem registro de Não Conformidade e processo formal de reparo.',
      },
      {
        id: 'q4',
        question:
          'Onde devem ser arquivados os registros de rastreabilidade da solda (RRS / Mapeamento)?',
        options: [
          'No prontuário / Data Book da Obra sob guarda do CQ',
          'Descartados após 30 dias da entrega',
          'Em posse exclusiva do operador de soldagem',
          'Apenas na memória de cálculo preliminar',
        ],
        correct_option_index: 0,
        explanation:
          'O Data Book reúne todas as evidências mandatórias de conformidade exigidas pelo cliente e pela ISO 9001.',
      },
    ]
  } else if (isInspection) {
    fallbackQuestions = [
      {
        id: 'q1',
        question: `Qual é o critério principal de aceitação estipulado em ${docTitle}?`,
        options: [
          'Conformidade dimensional e ausência de descontinuidades além dos limites normativos',
          'Aprovação visual apenas quando solicitado pelo cliente',
          'Apenas liberação verbal sem preenchimento de relatório formal',
          'Redução do tempo de inspeção para acelerar o PCP',
        ],
        correct_option_index: 0,
        explanation:
          'A inspeção baseia-se em critérios objetivos dimensionais e de integridade física definidos no procedimento do SGQ.',
      },
      {
        id: 'q2',
        question:
          'Qual iluminação e ângulo de visualização são exigidos para inspeção visual direta?',
        options: [
          'Iluminação mínima de 1000 lux e ângulo de visão não inferior a 30 graus em relação à superfície',
          'Luz ambiente padrão sem necessidade de medição de lux',
          'Ângulo de visão rasante menor que 10 graus',
          'Inspeção unicamente através de fotos no celular',
        ],
        correct_option_index: 0,
        explanation:
          'Conforme ASME Seção V Artigo 9, a iluminação mínima deve ser de 1000 lux (100 fc) com ângulo mínimo de 30°.',
      },
      {
        id: 'q3',
        question:
          'Quando um instrumento de medição (ex: paquímetro) apresentar certificado de calibração vencido:',
        options: [
          'Pode ser utilizado se a medição parecer visualmente correta',
          'Deve ser imediatamente segregado, etiquetado como IMPRÓPRIO e enviado para calibração',
          'O inspetor pode prorrogar a validade por conta própria',
          'Não há restrição para medições internas de rotina',
        ],
        correct_option_index: 1,
        explanation:
          'A calibração de instrumentos de monitoramento e medição é requisito mandatório do item 7.1.5 da ISO 9001.',
      },
      {
        id: 'q4',
        question: 'Qual formulário oficial deve registrar a liberação da peça inspecionada?',
        options: [
          'Relatório de Inspeção / RRS assinado pelo Inspetor Credenciado',
          'Anotação em papel avulso',
          'E-mail sem número de rastreabilidade',
          'Nenhum registro se a peça estiver conforme',
        ],
        correct_option_index: 0,
        explanation:
          'Registros formais auditáveis garantem a integridade da garantia da qualidade e rastreabilidade total.',
      },
    ]
  } else if (isWarehouse) {
    fallbackQuestions = [
      {
        id: 'q1',
        question: `Conforme ${docTitle}, qual o procedimento imediato no recebimento físico de materiais?`,
        options: [
          'Conferência quantitativa, conferência de certificado da qualidade e conferência com a Ordem de Compra',
          'Armazenar direto nas prateleiras sem inspecionar a nota',
          'Descartar os certificados de matéria-prima',
          'Aguardar o uso na fábrica para verificar conformidade',
        ],
        correct_option_index: 0,
        explanation:
          'O CQ de entrada valida especificações, corrida de aço e integridade física antes de liberar para o estoque.',
      },
      {
        id: 'q2',
        question: 'Materiais aguardando inspeção ou laudo devem ser identificados como:',
        options: [
          'Em Quarentena / Aguardando Inspeção (área segregada)',
          'Liberado para Produção',
          'Refugo sem possibilidade de teste',
          'Não necessitam identificação',
        ],
        correct_option_index: 0,
        explanation:
          'A segregação em quarentena evita o uso inadvertido de insumos não homologados na fabricação.',
      },
      {
        id: 'q3',
        question: 'Como deve ser garantida a rastreabilidade de tubos e chapas cortadas?',
        options: [
          'Pintura ou puncionamento do número da corrida/TAG antes do corte',
          'Memória do operador de serra',
          'Etiqueta de papel removível que pode molhar',
          'Rastreabilidade não é necessária em sobras',
        ],
        correct_option_index: 0,
        explanation:
          'A transferência da identificação (número da corrida / heat number) é mandatória para preservar o histórico do material.',
      },
      {
        id: 'q4',
        question:
          'Qual documento formal autoriza a saída de materiais para serviços especiais externos (ex: galvanização)?',
        options: [
          'Romaneio de Carga e NF de remessa com aprovação do PCP/CQ',
          'Apenas mensagem de texto informal',
          'Retirada direta sem aviso',
          'Ordem de serviço verbal',
        ],
        correct_option_index: 0,
        explanation:
          'Romaneios emitidos com rastreabilidade formal e número de controle garantem a governança e controle de retorno.',
      },
    ]
  } else {
    fallbackQuestions = [
      {
        id: 'q1',
        question: `Qual é o objetivo principal estabelecido no procedimento ${docTitle}?`,
        options: [
          'Padronizar as práticas operacionais e garantir conformidade com as normas do SGQ',
          'Reduzir a documentação arquivada no sistema',
          'Tornar facultativo o cumprimento das etapas de controle',
          'Apenas atender a exigências burocráticas sem impacto prático',
        ],
        correct_option_index: 0,
        explanation:
          'A padronização assegura repetibilidade, segurança operacional e satisfação dos requisitos contratuais da qualidade.',
      },
      {
        id: 'q2',
        question:
          'Quem é responsável pela aplicação diária das diretrizes descritas neste procedimento?',
        options: [
          'Todos os colaboradores envolvidos no processo e suas respectivas lideranças',
          'Apenas a diretoria executiva',
          'Exclusivamente a consultoria externa',
          'Somente o auditor no dia da auditoria',
        ],
        correct_option_index: 0,
        explanation:
          'O SGQ é de responsabilidade de todos os colaboradores executores da atividade.',
      },
      {
        id: 'q3',
        question:
          'Ao identificar qualquer desvio ou dificuldade na execução conforme o procedimento, o colaborador deve:',
        options: [
          'Comunicar imediatamente o supervisor/GQ e registrar a ocorrência',
          'Alterar o processo por conta própria sem avisar ninguém',
          'Ocultar o desvio para não gerar apontamento',
          'Aguardar o fechamento do mês para relatar',
        ],
        correct_option_index: 0,
        explanation:
          'A transparência imediata permite a contenção rápida de riscos e a melhoria contínua dos processos.',
      },
      {
        id: 'q4',
        question:
          'Onde a versão mais atualizada e em vigor deste procedimento pode ser consultada a qualquer momento?',
        options: [
          'No módulo Documentos / Lista Mestra do UQualiHub',
          'Em cópias impressas antigas guardadas em gavetas',
          'Em sites de busca da internet',
          'No celular pessoal de colegas de trabalho',
        ],
        correct_option_index: 0,
        explanation:
          'A Lista Mestra do UQualiHub é o canal oficial de controle de documentos vigentes do sistema de gestão.',
      },
    ]
  }

  return { questions: fallbackQuestions, source: 'fallback' }
}
