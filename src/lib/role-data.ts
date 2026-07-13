export const ROLES = [
  'Director',
  'QCC',
  'Inspector',
  'AI',
  'Designer',
  'Engineer',
  'CertifyingEngineer',
  'Welder',
  'NDE',
  'Manager',
] as const

export interface RoleData {
  authorities: string[]
  responsibilities: string[]
}

export const roleData: Record<string, RoleData> = {
  Director: {
    authorities: [
      'Assinar e emitir a Declaracao de Politica e Autoridade',
      'Autoridade final sobre o Sistema de Gestao da Qualidade',
      'Autoridade para interromper trabalhos nao conformes',
    ],
    responsibilities: [
      'Garantir que o SCQ seja implementado e mantido',
      'Alocar recursos para manutencao da certificacao ASME/NBIC',
      'Conduzir revisoes gerenciais do sistema de qualidade',
    ],
  },
  QCC: {
    authorities: [
      'Revisar e aprovar calculos de projeto',
      'Controlar revisoes do MCQ e retirar obsoletas',
      'Autoridade de auditoria interna',
    ],
    responsibilities: [
      'Manter o Manual de Controle de Qualidade atualizado',
      'Coordenar inspecoes e pontos de espera',
      'Gerenciar registros de qualidade',
    ],
  },
  Inspector: {
    authorities: [
      'Verificar conformidade com codigo ASME',
      'Presenciar e documentar testes',
      'Aceitar ou rejeitar materiais',
    ],
    responsibilities: [
      'Preparar Plano de Inspecao e Teste (ITP)',
      'Documentar inspecoes realizadas',
      'Verificar conformidade com WPS',
    ],
  },
  AI: {
    authorities: [
      'Verificacao independente de conformidade',
      'Confirmar conformidade com codigo',
      'Testemunhar Hold Points',
    ],
    responsibilities: [
      'Documentar aceitacao no ITP (Hold Points)',
      'Revisar MDeR para certificacao',
      'Verificar qualificacoes de soldadores',
    ],
  },
  Designer: {
    authorities: ['Aprovacao de projeto dentro do escopo', 'Selecao de materiais'],
    responsibilities: ['Preparar calculos de projeto', 'Manter registros de projeto'],
  },
  Engineer: {
    authorities: ['Revisao de engenharia', 'Aprovacao de calculos'],
    responsibilities: ['Preparar MDeR para certificacao', 'Verificar conformidade de projeto'],
  },
  CertifyingEngineer: {
    authorities: ['Certificacao final de conformidade', 'Interpretacao de codigo ASME'],
    responsibilities: ['Certificar projeto', 'Revisar toda documentacao', 'Assinar MDeR'],
  },
  Welder: {
    authorities: ['Executar soldagem conforme WPS', 'Rejeitar trabalho nao conforme'],
    responsibilities: [
      'Manter registro de continuidade de qualificacao',
      'Seguir WPS aprovado',
      'Documentar soldas executadas',
    ],
  },
  NDE: {
    authorities: ['Executar ensaios nao destrutivos', 'Aceitar ou rejeitar baseado em resultados'],
    responsibilities: [
      'Emitir relatorios de END documentados',
      'Manter calibracao de equipamentos',
      'Seguir procedimentos de END',
    ],
  },
  Manager: {
    authorities: [
      'Supervisionar todo o SCQ',
      'Aprovar ou rejeitar checklists concluidos',
      'Autoridade para interromper trabalhos',
    ],
    responsibilities: [
      'Monitorar conformidade de toda a equipe',
      'Gerenciar equipe e treinamentos',
      'Manter prontidao para auditorias',
      'Reportar ao Diretor',
    ],
  },
}
