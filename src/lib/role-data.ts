// Lista unificada e oficial de cargos alinhada ao Organograma FSGQ 5.0-10 Rev. 05
// Válido para PSC, Koala System e GenTi, preservando a retrocompatibilidade com perfis legados.

export interface RoleGroup {
  sector: string
  roles: string[]
}

// Grupos estruturados por setor conforme organograma FSGQ 5.0-10 Rev. 05
export const ROLE_GROUPS: RoleGroup[] = [
  {
    sector: 'Gestão e Liderança',
    roles: [
      'Diretoria',
      'Gestor da Qualidade',
      'Gerente',
      'Coordenador de Fábrica',
      'Coordenador de CQ',
      'Supervisor',
    ],
  },
  {
    sector: 'Técnico e Engenharia',
    roles: ['Analista', 'Técnico', 'Inspetor', 'Engenheiro'],
  },
  {
    sector: 'Operacional e Produção',
    roles: [
      'Soldador',
      'Caldeireiro',
      'Torneiro/Usinador',
      'Operador',
      'Almoxarife',
      'PCP',
      'Colaborador',
      'Auxiliar Administrativo',
    ],
  },
  {
    sector: 'Perfis de Sistema e Legados ASME/SGQ',
    roles: [
      'Apontador',
      'Consultor',
      'Manager',
      'Director',
      'QCC',
      'Inspector',
      'AI',
      'Designer',
      'Engineer',
      'CertifyingEngineer',
      'Welder',
      'NDE',
    ],
  },
]

// Lista plana de todos os cargos reconhecidos no sistema (evita duplicidades)
export const ROLES = [
  // Gestão / Liderança
  'Diretoria',
  'Gestor da Qualidade',
  'Gerente',
  'Coordenador de Fábrica',
  'Coordenador de CQ',
  'Supervisor',
  // Técnico / Engenharia
  'Analista',
  'Técnico',
  'Inspetor',
  'Engenheiro',
  // Operacional / Chão de Fábrica
  'Soldador',
  'Caldeireiro',
  'Torneiro/Usinador',
  'Operador',
  'Almoxarife',
  'PCP',
  'Colaborador',
  'Auxiliar Administrativo',
  // Perfis do Sistema / Legados ASME
  'Apontador',
  'Consultor',
  'Manager',
  'Director',
  'QCC',
  'Inspector',
  'AI',
  'Designer',
  'Engineer',
  'CertifyingEngineer',
  'Welder',
  'NDE',
] as const

// Cargos principais para exibição em formulários com label em português
export const DISPLAY_ROLES = [
  // Gestão & Liderança
  { value: 'Diretoria', label: 'Diretoria', group: 'Gestão e Liderança' },
  { value: 'Gestor da Qualidade', label: 'Gestor da Qualidade', group: 'Gestão e Liderança' },
  { value: 'Gerente', label: 'Gerente', group: 'Gestão e Liderança' },
  { value: 'Coordenador de Fábrica', label: 'Coordenador de Fábrica', group: 'Gestão e Liderança' },
  { value: 'Coordenador de CQ', label: 'Coordenador de CQ', group: 'Gestão e Liderança' },
  { value: 'Supervisor', label: 'Supervisor', group: 'Gestão e Liderança' },
  // Técnico & Especialistas
  { value: 'Analista', label: 'Analista', group: 'Técnico e Engenharia' },
  { value: 'Técnico', label: 'Técnico', group: 'Técnico e Engenharia' },
  { value: 'Inspetor', label: 'Inspetor', group: 'Técnico e Engenharia' },
  { value: 'Engenheiro', label: 'Engenheiro', group: 'Técnico e Engenharia' },
  // Operacional & Apoio
  { value: 'Soldador', label: 'Soldador', group: 'Operacional e Produção' },
  { value: 'Caldeireiro', label: 'Caldeireiro', group: 'Operacional e Produção' },
  { value: 'Torneiro/Usinador', label: 'Torneiro / Usinador', group: 'Operacional e Produção' },
  { value: 'Operador', label: 'Operador', group: 'Operacional e Produção' },
  { value: 'Almoxarife', label: 'Almoxarife', group: 'Operacional e Produção' },
  { value: 'PCP', label: 'PCP', group: 'Operacional e Produção' },
  { value: 'Colaborador', label: 'Colaborador', group: 'Operacional e Produção' },
  {
    value: 'Auxiliar Administrativo',
    label: 'Auxiliar Administrativo',
    group: 'Operacional e Produção',
  },
  // Perfis de Acesso & Legados
  {
    value: 'Apontador',
    label: 'Apontador (Checklists & Chão de Fábrica)',
    group: 'Perfis de Sistema',
  },
  { value: 'Consultor', label: 'Consultor (Auditoria / Visualização)', group: 'Perfis de Sistema' },
  { value: 'Manager', label: 'Manager (Gestão Geral)', group: 'Perfis Legados ASME' },
  { value: 'Director', label: 'Director (Diretor ASME)', group: 'Perfis Legados ASME' },
  { value: 'QCC', label: 'QCC (Coordenação da Qualidade ASME)', group: 'Perfis Legados ASME' },
  { value: 'Inspector', label: 'Inspector (Inspetor ASME)', group: 'Perfis Legados ASME' },
  { value: 'AI', label: 'AI (Authorized Inspector ASME)', group: 'Perfis Legados ASME' },
  { value: 'Designer', label: 'Designer (Projetista ASME)', group: 'Perfis Legados ASME' },
  { value: 'Engineer', label: 'Engineer (Engenheiro ASME)', group: 'Perfis Legados ASME' },
  {
    value: 'CertifyingEngineer',
    label: 'Certifying Engineer (Engenheiro Certificador ASME)',
    group: 'Perfis Legados ASME',
  },
  { value: 'Welder', label: 'Welder (Soldador Qualificado ASME)', group: 'Perfis Legados ASME' },
  { value: 'NDE', label: 'NDE (Inspetor END ASME)', group: 'Perfis Legados ASME' },
]

export interface RoleData {
  objetivo: string
  authorities: string[]
  responsibilities: string[]
  observacoes: string
}

export const roleData: Record<string, RoleData> = {
  // Gestão / Liderança
  Diretoria: {
    objetivo:
      'Garantir a liderança estratégica, aprovação de políticas da qualidade e provisão de recursos para as 3 empresas (PSC, Koala, GenTi).',
    authorities: [
      'Aprovar Política da Qualidade e Plano de Investimentos',
      'Autoridade final sobre o Sistema de Gestão da Qualidade',
      'Autoridade para interromper trabalhos não conformes',
    ],
    responsibilities: [
      'Garantir que os requisitos do SGQ sejam atendidos',
      'Alocar recursos para operações, certificações e infraestrutura',
      'Conduzir reuniões de análise crítica pela Direção',
    ],
    observacoes: 'Perfil de Direção Executiva no organograma oficial.',
  },
  'Gestor da Qualidade': {
    objetivo:
      'Supervisionar, gerenciar e assegurar a conformidade integral do Sistema de Gestão da Qualidade (ISO 9001 / ASME) e melhoria contínua.',
    authorities: [
      'Supervisionar todo o SGQ e aprovar procedimentos e instruções',
      'Aprovar ou rejeitar checklists, RNCs e liberações da qualidade',
      'Autoridade de auditoria interna e interrupção de processos não conformes',
    ],
    responsibilities: [
      'Manter manuais, procedimentos e documentação atualizados',
      'Monitorar indicadores de desempenho da qualidade (IET, RNCs, Lead Time)',
      'Acompanhar auditorias internas, externas e certificadoras',
    ],
    observacoes: 'Papel central da Qualidade no organograma.',
  },
  Gerente: {
    objetivo:
      'Gerenciar operações, equipes e recursos alinhados às diretrizes estratégicas da organização.',
    authorities: [
      'Gestão de equipes operacionais e administrativas',
      'Aprovação de alocação de recursos e requisições',
    ],
    responsibilities: [
      'Assegurar cumprimento de metas e prazos operacionais',
      'Acompanhar desempenho de processos e relatórios gerenciais',
    ],
    observacoes: 'Liderança gerencial nos setores.',
  },
  'Coordenador de Fábrica': {
    objetivo:
      'Coordenar o fluxo produtivo na fábrica, alinhando caldeiraria, solda, usinagem e expedição.',
    authorities: [
      'Coordenação de equipes e frentes de produção',
      'Acompanhamento de prazos e ordem de prioridade de ordens de serviço',
    ],
    responsibilities: [
      'Garantir cumprimento do planejamento e controle de produção (PCP)',
      'Zelar pela segurança e disciplina operacional no chão de fábrica',
      'Articular com a Coordenação de CQ e Apontadores',
    ],
    observacoes: 'Função-chave na execução da fábrica.',
  },
  'Coordenador de CQ': {
    objetivo:
      'Coordenar as inspeções de controle de qualidade, ensaios dimensionais, ensaios não destrutivos e liberação de produto.',
    authorities: [
      'Coordenar inspetores de qualidade e ensaiadores',
      'Liberar ou reter produtos e materiais conforme critérios de aceitação',
    ],
    responsibilities: [
      'Assegurar aplicação rigorosa dos ITPs e procedimentos de inspeção',
      'Emitir e controlar relatórios de não-conformidade (RNC)',
      'Organizar databooks e evidências de inspeção',
    ],
    observacoes: 'Liderança técnica da inspeção no organograma.',
  },
  Supervisor: {
    objetivo:
      'Supervisionar e orientar as equipes na execução diária das atividades industriais e procedimentos.',
    authorities: [
      'Supervisionar equipe operacional de campo',
      'Acompanhar andamento de atividades e registros de rotina',
    ],
    responsibilities: [
      'Orientar a equipe na execução conforme normas e procedimentos',
      'Garantir conformidade operacional e cumprimento de prazos',
      'Reportar desvios e progresso à coordenação',
    ],
    observacoes: 'Elo direto entre coordenação e operadores.',
  },

  // Técnico / Engenharia
  Analista: {
    objetivo:
      'Analisar dados, documentações e processos de qualidade, apoiando na melhoria contínua e conformidade de registros.',
    authorities: [
      'Revisar relatórios e documentações técnicas',
      'Consolidar dados e métricas operacionais',
    ],
    responsibilities: [
      'Analisar registros e evidências do sistema de gestão da qualidade',
      'Acompanhar indicadores e rotinas de controle',
      'Preparar relatórios e relatar divergências',
    ],
    observacoes: 'Apoia diretamente a coordenação e a gestão na análise de conformidade.',
  },
  Técnico: {
    objetivo:
      'Executar rotinas e ensaios técnicos especializados conforme procedimentos e normas aplicáveis.',
    authorities: [
      'Executar verificações técnicas de campo',
      'Emitir laudos e registros técnicos preliminares',
    ],
    responsibilities: [
      'Acompanhar e registrar parâmetros técnicos de execução',
      'Zelar pelo cumprimento das especificações de engenharia e inspeção',
      'Reportar inconsistências técnicas aos inspetores e engenheiros',
    ],
    observacoes: 'Atuação técnica focada no acompanhamento de requisitos e normas.',
  },
  Inspetor: {
    objetivo:
      'Realizar inspeções visuais, dimensionais e de processo, assegurando aderência aos requisitos normativos.',
    authorities: [
      'Verificar conformidade com normas e projetos',
      'Presenciar e documentar ensaios e medições',
      'Aprovar ou rejeitar etapas de inspeção',
    ],
    responsibilities: [
      'Executar inspeções conforme planos de controle da qualidade',
      'Documentar relatórios de inspeção dimensional e visual',
      'Identificar desvios e notificar o Controle de Qualidade',
    ],
    observacoes: 'Cargo oficial em português alinhado com o organograma.',
  },
  Engenheiro: {
    objetivo:
      'Desenvolver soluções de engenharia, cálculos, projetos e especificações técnicas de fabricação.',
    authorities: [
      'Elaborar e revisar cálculos de engenharia e especificações técnicas',
      'Validar alterações de projeto e requisitos normativos',
    ],
    responsibilities: [
      'Garantir aderência a normas técnicas aplicáveis',
      'Prestar suporte técnico à produção e inspeção',
      'Documentar memoriais de cálculo e análises técnicas',
    ],
    observacoes: 'Cargo oficial em português no organograma.',
  },

  // Operacional & Apoio
  Soldador: {
    objetivo:
      'Executar operações de soldagem conforme especificações de procedimento de soldagem (EPS/WPS).',
    authorities: ['Executar soldagem conforme EPS', 'Identificar soldas com sinete'],
    responsibilities: [
      'Seguir rigorosamente procedimentos e consumíveis indicados',
      'Manter continuidade de qualificação',
      'Solicitar inspeção das juntas soldadas',
    ],
    observacoes: 'Cargo oficial de chão de fábrica.',
  },
  Caldeireiro: {
    objetivo:
      'Executar traçagem, corte, conformação e montagem de componentes e estruturas metálicas.',
    authorities: ['Realizar montagem conforme desenhos técnicos aprovados'],
    responsibilities: [
      'Montar peças e conjuntos respeitando tolerâncias dimensionais',
      'Zelar pela conservação de materiais e equipamentos',
    ],
    observacoes: 'Operação de caldeiraria e montagem.',
  },
  'Torneiro/Usinador': {
    objetivo:
      'Operar máquinas-ferramentas para usinagem de precisão de peças e componentes industriais.',
    authorities: ['Verificar dimensões de usinagem com instrumentos calibrados'],
    responsibilities: [
      'Usinar peças conforme desenhos e tolerâncias especificadas',
      'Preservar ferramentas e instrumentos de medição',
    ],
    observacoes: 'Operação de usinagem.',
  },
  Operador: {
    objetivo:
      'Operar equipamentos industriais e executar rotinas de apoio fabril com segurança e qualidade.',
    authorities: ['Operar máquinas autorizadas'],
    responsibilities: [
      'Cumprir instruções de trabalho e normas de SMS',
      'Zelar pelos equipamentos e organização do posto de trabalho',
    ],
    observacoes: 'Operação geral de fábrica.',
  },
  Almoxarife: {
    objetivo:
      'Controlar recebimento, armazenamento, estocagem e distribuição de materiais e insumos.',
    authorities: ['Receber materiais, conferir NFe/romaneios e registrar entradas'],
    responsibilities: [
      'Garantir identificação e rastreabilidade dos materiais',
      'Atender requisições de material com liberação prévia de CQ quando aplicável',
    ],
    observacoes: 'Almoxarifado e suprimentos.',
  },
  PCP: {
    objetivo: 'Planejar, programar e controlar as ordens de serviço e capacidade produtiva.',
    authorities: ['Programar ordens de serviço e cronogramas de fabricação'],
    responsibilities: [
      'Acompanhar prazos de entrega e carga-máquina',
      'Emitir e distribuir programações de trabalho',
    ],
    observacoes: 'Planejamento e Controle da Produção.',
  },
  Colaborador: {
    objetivo:
      'Executar as atividades atribuídas de acordo com os procedimentos e orientações da empresa.',
    authorities: ['Executar tarefas atribuídas'],
    responsibilities: ['Cumprir normas internas, procedimentos de segurança e qualidade'],
    observacoes: 'Perfil base de colaborador.',
  },
  'Auxiliar Administrativo': {
    objetivo:
      'Apoiar as rotinas administrativas, controle de documentos, lançamentos e atendimento interno.',
    authorities: ['Organizar arquivos e registros administrativos'],
    responsibilities: [
      'Alimentar planilhas e sistemas internos',
      'Prestar suporte aos setores de apoio e gestão',
    ],
    observacoes: 'Apoio administrativo e SGQ.',
  },

  // Perfis do Sistema / Legados ASME
  Apontador: {
    objetivo:
      'Auxiliar no acompanhamento e lançamento de checklists designados no chão de fábrica em nome dos operadores vinculados.',
    authorities: [
      'Visualizar e concluir checklists designados e de operadores vinculados',
      'Reportar progresso das atividades atribuídas',
    ],
    responsibilities: [
      'Acompanhar e registrar checklists no chão de fábrica',
      'Garantir preenchimento tempestivo de evidências operacionais',
    ],
    observacoes: 'Perfil de campo para digitação e acompanhamento de tarefas.',
  },
  Consultor: {
    objetivo:
      'Apoiar e prestar consultoria técnica no Sistema de Gestão da Qualidade e auditorias.',
    authorities: [
      'Acesso de visualização global para avaliação e suporte técnico',
      'Emitir pareceres e recomendações técnicas',
    ],
    responsibilities: [
      'Avaliar conformidade do sistema e processos',
      'Recomendar melhorias técnicas e operacionais',
      'Auxiliar na preparação e acompanhamento de auditorias',
    ],
    observacoes: 'Perfil de consultoria externa ou auditoria interna técnica.',
  },
  Manager: {
    objetivo:
      'Supervisionar todo o SCQ/SGQ, monitorando conformidade de toda a equipe e mantendo prontidão para auditorias.',
    authorities: [
      'Supervisionar todo o SCQ',
      'Aprovar ou rejeitar checklists concluídos',
      'Autoridade para interromper trabalhos',
    ],
    responsibilities: [
      'Monitorar conformidade de toda a equipe',
      'Gerenciar equipe e treinamentos',
      'Manter prontidão para auditorias',
      'Reportar ao Diretor',
    ],
    observacoes: 'Perfil gerencial mestre.',
  },
  Director: {
    objetivo:
      'Garantir a implementação e manutenção do Sistema de Controle da Qualidade (SCQ), assegurando conformidade com ASME Section VIII e NBIC.',
    authorities: [
      'Assinar e emitir a Declaração de Política e Autoridade do MCQ',
      'Autoridade final sobre o Sistema de Gestão da Qualidade',
      'Autoridade para interromper trabalhos não conformes',
    ],
    responsibilities: [
      'Garantir que o SCQ seja implementado e mantido',
      'Alocar recursos para manutenção da certificação ASME/NBIC',
      'Conduzir revisões gerenciais do sistema de qualidade',
    ],
    observacoes: 'Perfil legado ASME de Diretor.',
  },
  QCC: {
    objetivo:
      'Coordenar e manter o Sistema de Controle da Qualidade ASME, garantindo que todos os procedimentos do MCQ sejam seguidos.',
    authorities: [
      'Revisar e aprovar cálculos de projeto',
      'Controlar revisões do MCQ e retirar obsoletas',
      'Autoridade de auditoria interna',
    ],
    responsibilities: [
      'Manter o Manual de Controle de Qualidade atualizado',
      'Coordenar inspeções e pontos de espera',
      'Distribuir ITPs e coordenar Hold Points com o AI',
    ],
    observacoes: 'Coordenador da Qualidade no MCQ ASME.',
  },
  Inspector: {
    objetivo:
      'Verificar conformidade dos materiais, processos e produtos finais com os códigos ASME e procedimentos internos.',
    authorities: [
      'Verificar conformidade com código ASME',
      'Presenciar e documentar testes',
      'Aceitar ou rejeitar materiais',
    ],
    responsibilities: [
      'Preparar Plano de Inspeção e Teste (ITP)',
      'Documentar inspeções realizadas',
      'Verificar conformidade com WPS',
    ],
    observacoes: 'Inspetor de Controle da Qualidade ASME.',
  },
  AI: {
    objetivo:
      'Realizar verificação independente de conformidade com código ASME, testemunhando Hold Points e certificando MDeR.',
    authorities: [
      'Verificação independente de conformidade',
      'Confirmar conformidade com código',
      'Testemunhar Hold Points',
    ],
    responsibilities: [
      'Documentar aceitação no ITP (Hold Points)',
      'Revisar MDeR para certificação',
      'Verificar qualificações de soldadores',
    ],
    observacoes: 'Authorized Inspector (Inspetor Credenciado ASME).',
  },
  Designer: {
    objetivo:
      'Preparar cálculos de projeto e seleção de materiais conforme ASME Section VIII Divisão 1.',
    authorities: ['Aprovação de projeto dentro do escopo'],
    responsibilities: [
      'Preparar cálculos de projeto (Div 1)',
      'Manter registros de projeto atualizados',
    ],
    observacoes: 'Projetista ASME.',
  },
  Engineer: {
    objetivo: 'Preparar cálculos de engenharia e MDeR conforme ASME Section VIII Divisão 2.',
    authorities: ['Revisão de engenharia', 'Aprovação de cálculos'],
    responsibilities: ['Preparar MDeR para certificação', 'Verificar conformidade de projeto'],
    observacoes: 'Engenheiro ASME.',
  },
  CertifyingEngineer: {
    objetivo:
      'Certificar a conformidade final do projeto, revisando toda documentação e assinando o MDeR.',
    authorities: ['Certificação final de conformidade', 'Interpretação de código ASME'],
    responsibilities: ['Certificar projeto', 'Revisar toda documentação e assinar MDeR'],
    observacoes: 'Engenheiro Certificador ASME.',
  },
  Welder: {
    objetivo:
      'Executar soldagem conforme WPS aprovado, mantendo registros de continuidade de qualificação.',
    authorities: ['Executar soldagem conforme WPS', 'Rejeitar trabalho não conforme'],
    responsibilities: ['Manter registro de continuidade de qualificação', 'Seguir WPS aprovado'],
    observacoes: 'Soldador ASME.',
  },
  NDE: {
    objetivo:
      'Executar ensaios não destrutivos conforme procedimentos aprovados, emitindo relatórios documentados.',
    authorities: ['Executar ensaios não destrutivos', 'Aceitar ou rejeitar baseado em resultados'],
    responsibilities: [
      'Emitir relatórios de END documentados',
      'Manter calibração de equipamentos',
    ],
    observacoes: 'Inspetor de Ensaios Não Destrutivos ASME.',
  },
  Unknown: {
    objetivo: 'Dados do perfil não disponíveis. Contate o administrador do sistema.',
    authorities: [],
    responsibilities: [],
    observacoes: 'Perfil não reconhecido no sistema.',
  },
}
