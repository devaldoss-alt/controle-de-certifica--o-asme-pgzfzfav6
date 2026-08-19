export const ROLES = [
  'Director',
  'QCC',
  'Inspector',
  'AI',
  'Designer',
  'Engineer',
  'CertifyingEngineer',
  'Supervisor',
  'Analista',
  'Técnico',
  'Welder',
  'NDE',
  'Apontador',
  'Manager',
  'Consultor',
] as const

export interface RoleData {
  objetivo: string
  authorities: string[]
  responsibilities: string[]
  observacoes: string
}

export const roleData: Record<string, RoleData> = {
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
      'Delegar responsabilidades e autoridades a cada função',
    ],
    observacoes:
      'Necessita revisão periódica da Declaração de Política para alinhamento com mudanças organizacionais.',
  },
  QCC: {
    objetivo:
      'Coordenar e manter o Sistema de Controle da Qualidade, garantindo que todos os procedimentos do MCQ sejam seguidos.',
    authorities: [
      'Revisar e aprovar cálculos de projeto',
      'Controlar revisões do MCQ e retirar obsoletas',
      'Autoridade de auditoria interna',
    ],
    responsibilities: [
      'Manter o Manual de Controle de Qualidade atualizado',
      'Coordenar inspeções e pontos de espera',
      'Gerenciar registros de qualidade',
      'Distribuir ITPs e coordenar Hold Points com o AI',
    ],
    observacoes: 'Risco de obsolescência do MCQ se revisões não forem controladas rigorosamente.',
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
      'Solicitar Hold Points ao AI com antecedência',
    ],
    observacoes:
      'Necessita acesso contínuo aos ITPs atualizados para garantir inspeções completas.',
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
      'Reportar não-conformidades ao QCC',
    ],
    observacoes: 'Dependência de comunicação tempestiva com QCC para agendamento de Hold Points.',
  },
  Designer: {
    objetivo:
      'Preparar cálculos de projeto e seleção de materiais conforme ASME Section VIII Divisão 1.',
    authorities: [
      'Aprovação de projeto dentro do escopo',
      'Seleção de materiais conforme ASME Section II',
    ],
    responsibilities: [
      'Preparar cálculos de projeto (Div 1)',
      'Manter registros de projeto atualizados',
      'Preparar desenhos de fabricação',
      'Preparar especificações de soldagem',
    ],
    observacoes: 'Necessita acesso atualizado às edições vigentes do ASME Section II.',
  },
  Engineer: {
    objetivo: 'Preparar cálculos de engenharia e MDeR conforme ASME Section VIII Divisão 2.',
    authorities: ['Revisão de engenharia', 'Aprovação de cálculos'],
    responsibilities: [
      'Preparar MDeR para certificação',
      'Verificar conformidade de projeto',
      'Documentar análise de tensões',
      'Submeter MDeR ao Engenheiro Certificador',
    ],
    observacoes: 'Lacuna identificada na rastreabilidade entre cálculos preliminares e MDeR final.',
  },
  CertifyingEngineer: {
    objetivo:
      'Certificar a conformidade final do projeto, revisando toda documentação e assinando o MDeR.',
    authorities: ['Certificação final de conformidade', 'Interpretação de código ASME'],
    responsibilities: [
      'Certificar projeto',
      'Revisar toda documentação',
      'Assinar MDeR',
      'Notificar AI sobre certificação de MDeR',
    ],
    observacoes: 'Necessita checklist de revisão completa antes da certificação final.',
  },
  Welder: {
    objetivo:
      'Executar soldagem conforme WPS aprovado, mantendo registros de continuidade de qualificação.',
    authorities: ['Executar soldagem conforme WPS', 'Rejeitar trabalho não conforme'],
    responsibilities: [
      'Manter registro de continuidade de qualificação',
      'Seguir WPS aprovado',
      'Documentar soldas executadas',
      'Solicitar inspeção de soldas ao Inspector',
    ],
    observacoes: 'Risco de perda de qualificação por falta de continuidade documentada.',
  },
  Supervisor: {
    objetivo:
      'Supervisionar e coordenar as atividades operacionais e de equipe, garantindo a execução conforme os procedimentos e prazos estabelecidos.',
    authorities: [
      'Supervisionar equipe operacional',
      'Acompanhar andamento de atividades e checklists',
    ],
    responsibilities: [
      'Orientar a equipe na execução das atividades de campo e qualidade',
      'Garantir conformidade operacional e cumprimento de prazos',
      'Reportar desvios e progresso à gestão',
    ],
    observacoes: 'Atua como elo de articulação direta entre a gestão e a operação.',
  },
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
  Consultor: {
    objetivo:
      'Apoiar e prestar consultoria técnica no Sistema de Controle da Qualidade e auditorias.',
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
  Apontador: {
    objetivo:
      'Auxiliar no acompanhamento e execução de checklists designados, garantindo que as atividades atribuídas sejam concluídas dentro dos prazos estabelecidos.',
    authorities: [
      'Visualizar e concluir checklists designados',
      'Reportar progresso das atividades atribuídas',
    ],
    responsibilities: [
      'Acompanhar e concluir checklists onde designado como responsável',
      'Reportar conclusão de atividades ao responsável técnico',
      'Manter registros atualizados das atividades executadas',
    ],
    observacoes:
      'O Apontador tem acesso apenas aos checklists onde foi explicitamente designado, não tendo acesso a checklists de outras funções.',
  },
  NDE: {
    objetivo:
      'Executar ensaios não destrutivos conforme procedimentos aprovados, emitindo relatórios documentados.',
    authorities: ['Executar ensaios não destrutivos', 'Aceitar ou rejeitar baseado em resultados'],
    responsibilities: [
      'Emitir relatórios de END documentados',
      'Manter calibração de equipamentos',
      'Seguir procedimentos de END',
      'Entregar relatórios ao Inspetor para aceitação',
    ],
    observacoes:
      'Necessita controle rigoroso de calibração de equipamentos para validade dos resultados.',
  },
  Manager: {
    objetivo:
      'Supervisionar todo o SCQ, monitorando conformidade de toda a equipe e mantendo prontidão para auditorias.',
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
    observacoes:
      'Necessita visão consolidada de todas as funções para identificação proativa de lacunas.',
  },
  Unknown: {
    objetivo: 'Dados do perfil não disponíveis. Contate o administrador do sistema.',
    authorities: [],
    responsibilities: [],
    observacoes: 'Perfil não reconhecido no sistema.',
  },
}
