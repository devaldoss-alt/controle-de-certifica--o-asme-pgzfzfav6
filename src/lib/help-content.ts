export interface HelpFeature {
  name: string
  description: string
  badge?: string
}

export interface HelpStep {
  step: number
  title: string
  instruction: string
  tip?: string
}

export interface HelpTopic {
  id: string
  path: string
  subTab?: string
  groupId:
    | 'home'
    | 'quality'
    | 'operation'
    | 'materials'
    | 'people'
    | 'management'
    | 'administration'
  groupTitle: string
  title: string
  subtitle?: string
  summary: string
  features: HelpFeature[]
  steps: HelpStep[]
  tags?: string[]
}

export const HELP_CONTENT: Record<string, HelpTopic> = {
  // 1. Início: Dashboard
  '/': {
    id: 'dashboard',
    path: '/',
    groupId: 'home',
    groupTitle: 'Início',
    title: 'Dashboard (Central de Controle)',
    subtitle: 'Visão executiva da conformidade da qualidade e pendências',
    summary:
      'Painel central de monitoramento em tempo real da conformidade ASME, NBIC e ISO 9001. Apresenta indicadores de tarefas, itens críticos com vencimento próximo, conformidade por cargo e atalhos operacionais.',
    features: [
      {
        name: 'Cards de Status (KPIs)',
        description:
          'Exibe o total de tarefas pendentes, aguardando aprovação, aprovadas e expiradas.',
      },
      {
        name: 'Alertas Críticos',
        description:
          'Destaca itens mandatórios de qualidade que requerem evidência e revisão imediata.',
        badge: 'Crítico',
      },
      {
        name: 'Conformidade por Cargo',
        description:
          'Gráficos de cumprimento de rotinas operacionais por função (Soldador, Montador, CQ, etc.).',
      },
      {
        name: 'Exportar Relatório',
        description: 'Gera relatório consolidado em PDF/CSV dos checklists e status vigentes.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Verifique os Alertas Críticos',
        instruction:
          'Revise os cartões em destaque vermelho ou âmbar no topo da página para identificar pendências imediatas.',
        tip: 'Checklists críticos com prazo próximo devem ser concluídos prioritariamente.',
      },
      {
        step: 2,
        title: 'Consulte as Aprovações Pendentes',
        instruction:
          'Caso possua perfil Gerencial ou CQ, clique em "Revisar Evidência" na lista de aprovações pendentes para validar tarefas.',
      },
      {
        step: 3,
        title: 'Filtre por Empresa',
        instruction:
          'Use o seletor de empresa no cabeçalho superior para isolar dados de uma unidade ou visualizar o consolidado.',
      },
    ],
    tags: ['dashboard', 'conformidade', 'kpis', 'alertas', 'geral'],
  },

  // 2. Qualidade: Documentos
  '/documents': {
    id: 'documents',
    path: '/documents',
    groupId: 'quality',
    groupTitle: 'Qualidade',
    title: 'Documentos Técnicos (DMS)',
    subtitle: 'Gestão de procedimentos, instruções de trabalho e normas',
    summary:
      'Módulo de gestão eletrônica de documentos (GED/DMS). Organiza procedimentos internos, especificações e normas técnicas em pastas virtuais classificadas por prefixos padronizados com controle de revisão e exportações.',
    features: [
      {
        name: 'Pastas Virtuais por Prefixo',
        description:
          'Estruturação por prefixos padronizados como PR (Procedimentos), IT (Instruções) e PO (Políticas).',
      },
      {
        name: 'Editor com Rich Text',
        description: 'Elaboração e formatação de documentos técnicos diretamente na plataforma.',
      },
      {
        name: 'Exportações Técnicas',
        description:
          'Download do documento formatado em PDF oficial, DOCX (Word) ou planilhas auxiliares.',
      },
      {
        name: 'Controle de Versão e Código',
        description: 'Registro de revisão vigente, histórico e numeração rastreável do documento.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Localize ou filtre documentos',
        instruction:
          'Navegue pelas pastas virtuais à esquerda ou use a busca para encontrar o procedimento desejado.',
      },
      {
        step: 2,
        title: 'Crie um novo documento técnico',
        instruction:
          'Clique em "Novo Documento", selecione o prefixo padronizado, informe o código, título e digite o conteúdo no editor.',
        tip: 'Campos bilíngues permitem manter o procedimento alinhado com auditorias internacionais.',
      },
      {
        step: 3,
        title: 'Exporte para compartilhamento',
        instruction:
          'Na visualização do documento, use os botões "Exportar PDF" ou "Word" para disponibilizar a cópia controlada.',
      },
    ],
    tags: ['documentos', 'procedimentos', 'dms', 'it', 'qualidade'],
  },

  // 2. Qualidade: Lista Mestra
  '/master-list': {
    id: 'master-list',
    path: '/master-list',
    groupId: 'quality',
    groupTitle: 'Qualidade',
    title: 'Lista Mestra de Documentos Internos',
    subtitle: 'Controle formal de revisões, status e prazos de validade',
    summary:
      'Registro oficial de todos os documentos válidos, em revisão e obsoletos do Sistema de Gestão da Qualidade (SGQ). Permite importação em massa via planilha, upload de arquivos controlados e cálculo de prazos de revisão.',
    features: [
      {
        name: 'Tabela Master Consolidada',
        description:
          'Visão tabular completa com código, título, revisão, setor, status, data de aprovação e anexos.',
      },
      {
        name: 'Importação por Planilha',
        description:
          'Permite carregar inventários legados em formato Excel/CSV com mapeamento automático de colunas.',
        badge: 'Importar',
      },
      {
        name: 'Status de Homologação',
        description:
          'Classificação oficial em APROVADO, EM REVISÃO e OBSOLETO, evitando uso de versões desatualizadas.',
      },
      {
        name: 'Prazos de Revisão Periódica',
        description:
          'Monitoramento dos dias restantes para reaprovação obrigatória conforme requisitos de auditoria.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Consultar vigência de documentos',
        instruction:
          'Utilize os filtros superiores de revisão, categoria e status para localizar a versão em vigor do documento.',
      },
      {
        step: 2,
        title: 'Cadastrar ou revisar documento',
        instruction:
          'Clique em "Adicionar", preencha o código oficial, título, setor responsável e anexe o arquivo PDF ou Word aprovado.',
      },
      {
        step: 3,
        title: 'Importar lista em massa',
        instruction:
          'Clique em "Importar Planilha", selecione o arquivo XLSX da empresa e valide as linhas no assistente antes de gravar.',
        tip: 'Se a planilha contiver códigos existentes, eles serão sincronizados e atualizados sem duplicidade.',
      },
    ],
    tags: ['lista mestra', 'sgq', 'revisão', 'normas', 'iso9001'],
  },

  // 2. Qualidade: Checklists
  '/checklists': {
    id: 'checklists',
    path: '/checklists',
    groupId: 'quality',
    groupTitle: 'Qualidade',
    title: 'Checklists Operacionais',
    subtitle: 'Execução de rotinas de qualidade e submissão de evidências',
    summary:
      'Garante o cumprimento diário dos procedimentos ASME/NBIC e ISO 9001 no chão de fábrica e na engenharia. O Apontador lança o checklist pelo operador, o Gestor da Qualidade aprova ou devolve com comentário, e todos recebem notificação no sino.',
    features: [
      {
        name: 'Papel do Apontador',
        description:
          'Permite que apontadores credenciados registrem tarefas em nome de soldadores e operadores vinculados.',
      },
      {
        name: 'Submissão de Evidência',
        description:
          'Upload de foto, relatório ou comprovante obrigatório para validação de conformidade técnica.',
      },
      {
        name: 'Itens Críticos e Bloqueio',
        description:
          'Itens marcados como críticos entram em fila de aprovação e são bloqueados após validação do CQ.',
        badge: 'Crítico',
      },
      {
        name: 'Tutorial "Como Fazer"',
        description:
          'Instruções passo a passo detalhadas diretamente no card do checklist via botão How-To.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Abra o checklist pendente',
        instruction:
          'Localize a tarefa atribuída ao seu cargo ou operador na lista, observando a cor do prazo e a OS vinculada.',
      },
      {
        step: 2,
        title: 'Preencha os itens e leia as instruções',
        instruction:
          'Clique em "Como Fazer" caso tenha dúvidas sobre critérios técnicos, parâmetros de soldagem ou tolerâncias.',
      },
      {
        step: 3,
        title: 'Anexe as evidências obrigatórias',
        instruction:
          'Clique na caixa de seleção. Se a tarefa exigir comprovação, a janela de anexo será aberta para envio de fotos ou PDF.',
      },
      {
        step: 4,
        title: 'Submeta para análise do Gestor/CQ',
        instruction:
          'Confirme o envio. O item passará ao status "Aguardando Aprovação", notificando o Gestor no sino.',
        tip: 'Caso o Gestor rejeite, o item voltará para pendente com o motivo em destaque vermelho.',
      },
    ],
    tags: ['checklists', 'apontador', 'evidência', 'asme', 'inspeção'],
  },

  // 2. Qualidade: Qualificações
  '/qualifications': {
    id: 'qualifications',
    path: '/qualifications',
    groupId: 'quality',
    groupTitle: 'Qualidade',
    title: 'Qualificações e Continuidade',
    subtitle: 'Controle de certificados e continuidade de soldadores ASME IX',
    summary:
      'Gerenciamento das qualificações técnicas, certificações e registros de continuidade de soldagem (Welder Continuity Log). Alerta proativamente sobre validades vencidas ou prestes a vencer para evitar paradas na produção.',
    features: [
      {
        name: 'Monitoramento de Validade',
        description:
          'Contagem regressiva de dias para expiração de carteiras de soldador, END e normas regulamentadoras.',
      },
      {
        name: 'Continuidade de Soldagem',
        description:
          'Comprovação periódica de atividade para manter a qualificação ativa segundo ASME Seção IX.',
      },
      {
        name: 'Filtro por Status e Empresa',
        description: 'Isolamento visual de itens válidos, expirando em até 30 dias e já expirados.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Verifique profissionais com prazo crítico',
        instruction:
          'Consulte os crachás com alerta âmbar (expira em breve) e vermelho (expirada) no topo da grade.',
      },
      {
        step: 2,
        title: 'Atualize a data de continuidade',
        instruction:
          'Ao realizar junta soldada ou ensaio não destrutivo com laudo, registre a renovação do colaborador.',
      },
      {
        step: 3,
        title: 'Anexe o novo certificado',
        instruction:
          'Acesse o cadastro do colaborador na tela de Equipe para fazer o upload do documento digitalizado.',
      },
    ],
    tags: ['qualificações', 'soldadores', 'continuidade', 'asme ix', 'certificados'],
  },

  // 2. Qualidade: Aprovações
  '/approvals': {
    id: 'approvals',
    path: '/approvals',
    groupId: 'quality',
    groupTitle: 'Qualidade',
    title: 'Aprovações Pendentes',
    subtitle: 'Validação e auditoria das evidências de qualidade submetidas',
    summary:
      'Painel restrito a Gestores, QCC e Consultores para homologação ou rejeição fundamentada de tarefas operacionais. Permite visualizar laudos, fotos anexadas e dados da Ordem de Serviço antes do aceite final.',
    features: [
      {
        name: 'Visualizador de Evidência',
        description: 'Abertura rápida de fotos, laudos técnicos e PDFs anexados pelos operadores.',
      },
      {
        name: 'Aprovação com Comentário Opcional',
        description:
          'Homologa o checklist, trava a edição e registra a assinatura digital com carimbo de data/hora.',
      },
      {
        name: 'Rejeição Fundamentada',
        description:
          'Devolve a tarefa para o operador/apontador com justificativa obrigatória e notificação imediata.',
        badge: 'Devolução',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecione a tarefa pendente de análise',
        instruction:
          'Identifique o checklist aguardando validação pela OS, operador e criticidade.',
      },
      {
        step: 2,
        title: 'Analise a evidência anexada',
        instruction:
          'Clique no botão de visualização de evidência para inspecionar fotos de solda, calibração ou relatório.',
      },
      {
        step: 3,
        title: 'Aprove ou devolva com justificativa',
        instruction:
          'Se estiver de acordo, clique em "Aprovar". Caso haja não conformidade, clique em "Rejeitar" e descreva a correção necessária.',
        tip: 'O operador receberá um aviso pelo sino e verá seu comentário na cor vermelha no checklist.',
      },
    ],
    tags: ['aprovações', 'qcc', 'auditoria', 'validação', 'evidências'],
  },

  // 3. Operação: Ordens de Serviço
  '/service-orders': {
    id: 'service-orders',
    path: '/service-orders',
    groupId: 'operation',
    groupTitle: 'Operação',
    title: 'Ordens de Serviço (OS)',
    subtitle: 'Gestão de projetos industriais, clientes e equipamentos',
    summary:
      'Central de acompanhamento de fabricação e manutenção. Cada OS congrega dados do cliente, equipamento, normas aplicáveis, prazos e os checklists técnicos correspondentes executados na fábrica.',
    features: [
      {
        name: 'Cadastro de OS com Metadados',
        description:
          'Vinculação de número, cliente, equipamento, TAG, data de início e previsão de entrega.',
      },
      {
        name: 'Progresso de Checklists',
        description:
          'Barra visual que calcula em tempo real o percentual de tarefas de qualidade concluídas da OS.',
      },
      {
        name: 'Controle de Vencimento',
        description:
          'Alertas automáticos de prazos críticos e OSs com risco de atraso na entrega fabril.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Criar uma nova Ordem de Serviço',
        instruction:
          'Clique em "Nova OS", informe o número de identificação, cliente, equipamento e prazo.',
      },
      {
        step: 2,
        title: 'Vincular checklists à OS',
        instruction:
          'Na tela de checklists, associe as tarefas de fabricação e inspeção a esta OS.',
      },
      {
        step: 3,
        title: 'Acompanhar avanço físico',
        instruction:
          'Monitore a evolução dos checklists concluídos e libere romaneios parciais conforme os conjuntos ficarem prontos.',
      },
    ],
    tags: ['ordem de serviço', 'os', 'fabricação', 'projetos', 'equipamentos'],
  },

  // 3. Operação: PCP
  '/pcp': {
    id: 'pcp',
    path: '/pcp',
    groupId: 'operation',
    groupTitle: 'Operação',
    title: 'PCP (Planejamento e Capacidade)',
    subtitle: 'Balanceamento de carga fabril e capacidade por setor',
    summary:
      'Painel de Planejamento e Controle da Produção. Cruza a demanda em horas das Ordens de Serviço ativas com a capacidade instalada dos setores (Corte, Caldeiraria, Solda, Usinagem, Pintura e CQ).',
    features: [
      {
        name: 'Carga vs. Capacidade',
        description:
          'Gráfico comparativo de horas demandadas versus horas disponíveis por posto de trabalho.',
      },
      {
        name: 'Detecção de Gargalos',
        description:
          'Indicação em destaque vermelho quando a ocupação do setor ultrapassa 100% da capacidade.',
        badge: 'Gargalo',
      },
      {
        name: 'Distribuição por OS',
        description:
          'Detalhamento do consumo de horas de cada projeto dentro de cada célula de produção.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Avalie a ocupação dos setores',
        instruction:
          'Analise os cards de cada setor fabril para verificar se algum setor está em sobrecarga.',
      },
      {
        step: 2,
        title: 'Identifique os projetos causadores de pico',
        instruction:
          'Expanda o setor em alerta para ver quais Ordens de Serviço concentram maior alocação de horas.',
      },
      {
        step: 3,
        title: 'Reprograme ou remaneje equipe',
        instruction:
          'Utilize os dados do PCP para negociar prazos de entrega ou reforçar a equipe com horas adicionais.',
      },
    ],
    tags: ['pcp', 'capacidade', 'planejamento', 'carga fabril', 'gargalos'],
  },

  // 3. Operação: Agenda
  '/calendar': {
    id: 'calendar',
    path: '/calendar',
    groupId: 'operation',
    groupTitle: 'Operação',
    title: 'Agenda de Entregas e Vencimentos',
    subtitle: 'Cronograma visual integrado de prazos e eventos',
    summary:
      'Calendário unificado do sistema. Apresenta datas de entrega de Ordens de Serviço, vencimentos de checklists críticos, vistorias de romaneios, auditorias do SGQ e sessões de treinamento agendadas.',
    features: [
      {
        name: 'Visão Mensal Integrada',
        description:
          'Mapeamento cromático por tipo de evento (OS, Checklist, Treinamento, Romaneio).',
      },
      {
        name: 'Filtro Dinâmico',
        description:
          'Habilite ou desabilite categorias específicas de compromissos para focar no que importa.',
      },
      {
        name: 'Detalhes Rápidos em Modal',
        description:
          'Clique em qualquer dia ou evento para abrir detalhes completos e link direto para a tela de origem.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Navegar pelo mês corrente',
        instruction:
          'Use as setas para alternar os meses e visualize a densidade de entregas programadas.',
      },
      {
        step: 2,
        title: 'Filtrar por tipo de compromisso',
        instruction:
          'Desmarque categorias na legenda lateral para isolar, por exemplo, apenas vistorias de OSs.',
      },
      {
        step: 3,
        title: 'Acessar o registro de origem',
        instruction:
          'Clique sobre um evento na grade para conferir os responsáveis e navegar diretamente até a tela do registro.',
      },
    ],
    tags: ['agenda', 'calendário', 'prazos', 'cronograma', 'vencimentos'],
  },

  // 3. Operação: Romaneios
  '/packing-slips': {
    id: 'packing-slips',
    path: '/packing-slips',
    groupId: 'operation',
    groupTitle: 'Operação',
    title: 'Romaneios de Entrada e Saída (FSGQ 8.5-22)',
    subtitle:
      'Controle de movimentações, tempo fora em serviços especiais e rastreabilidade de itens',
    summary:
      'Módulo oficial de gestão de romaneios conforme FSGQ 8.5-22 Rev.02. Abrange o controle rigoroso de Entradas e Saídas, rastreabilidade de peças enviadas para serviços especiais (galvanização, pintura, tratamentos térmicos) com contagem de dias fora e alerta de atraso (>7 dias), 3 perguntas técnicas de qualidade por item (matéria-prima, certificado, nota fiscal) com evidências, anexo de fotos comprobatórias do estado do material e histórico pesquisável por item.',
    features: [
      {
        name: 'Controle de Tempo Fora em Serviços Especiais',
        description:
          'Monitora peças enviadas para pintura, galvanização e tratamentos térmicos com status aguardando retorno, cálculo automático de dias fora e indicador de tempo médio.',
        badge: 'Serviços Especiais',
      },
      {
        name: 'Perguntas Técnicas e Qualidade por Item',
        description:
          'Respostas Sim/Não para "É matéria-prima?", "Tem certificado?" e "Veio com nota?", com campos de anotação de evidências e certificados.',
      },
      {
        name: 'Evidências Fotográficas do Estado Físico',
        description:
          'Anexo de múltiplas fotos por item para evidenciar o estado dos materiais na entrada ou na saída, impressas no PDF oficial.',
      },
      {
        name: 'Pesquisa do Histórico Completo de Itens',
        description:
          'Busca instantânea que lista todas as movimentações de um material específico com datas, quantidades, O.S. e notas fiscais vinculadas.',
      },
      {
        name: 'PDF Repetitivo FSGQ 8.5-22',
        description:
          'Emissão de PDF com cabeçalho de identificação e cabeçalho da tabela fixos em todas as páginas e rodapé padronizado em cada folha.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Iniciar novo romaneio com data/hora automáticas',
        instruction:
          'Clique em "+ Novo Romaneio". O sistema preenche automaticamente o número sequencial, data e hora de emissão.',
      },
      {
        step: 2,
        title: 'Selecionar tipo, motivo e destinatário',
        instruction:
          'Defina se é Entrada ou Saída. Em Saída para serviço especial, o encarregado torna-se "Encarregado pelo recebimento".',
      },
      {
        step: 3,
        title: 'Preencher itens, perguntas técnicas e anexar fotos',
        instruction:
          'Para cada item, informe quantidade, unidade, descrição, responda às 3 perguntas técnicas e anexe as fotos de evidência.',
      },
      {
        step: 4,
        title: 'Acompanhar itens fora e registrar retorno',
        instruction:
          'Na aba "Itens Fora em Serviço Especial", monitore os dias decorridos e clique em "Registrar Retorno" quando o material voltar à fábrica.',
      },
    ],
    tags: [
      'romaneios',
      'fsgq 8.5-22',
      'serviços especiais',
      'galvanização',
      'pintura',
      'fotos',
      'rastreabilidade',
    ],
  },

  // 4. Suprimentos: Almoxarifado e Qualificação de Fornecedores
  '/suppliers': {
    id: 'suprimentos',
    path: '/suppliers',
    groupId: 'materials',
    groupTitle: 'Suprimentos',
    title: 'Suprimentos: Qualificação de Fornecedores (PSGQ 8.4)',
    subtitle: 'Homologação, esteira de compras, avaliação bienal e indicadores de suprimentos',
    summary:
      'Módulo oficial de gestão e homologação de fornecedores segundo o procedimento PSGQ 8.4 Aquisição (Rev. 03). Abrange a qualificação de fornecedores críticos e não críticos (ISO 9001, RBC/ASME, histórico e questionário FSGQ 8.4-2), reavaliação bienal (FSGQ 8.4-2.1), geração da Lista Mestra de Fornecedores Qualificados (FSGQ 8.4-4), esteira formal de compras com cotação mínima de 3 fornecedores (FSGQ 8.4-7) e recálculo automático dos indicadores do SGQ integrados à RNC.',
    features: [
      {
        name: 'Qualificação Automática via ISO 9001',
        description:
          'Fornecedores com ISO 9001 válida são qualificados automaticamente e dispensados de reavaliação periódica durante o prazo de vigência do certificado.',
        badge: 'ISO 9001',
      },
      {
        name: 'Questionários Digitais FSGQ 8.4-2 e 8.4-2.1',
        description:
          'Formulários eletrônicos com escala de conformidade (2, 1 ou 0) e nota de corte ≥ 6,0 pontos para aprovação imediata.',
      },
      {
        name: 'Esteira de Compras com 3 Cotações (FSGQ 8.4-7)',
        description:
          'Coleta de preços formalizada com controle de fornecedores qualificados, registro de exceções e monitoramento de pontualidade de entrega (FSGQ 8.4-6).',
      },
      {
        name: 'Consumo Automático do INCF da RNC',
        description:
          'Alimenta o indicador INCF (< 30%) diretamente dos registros de não conformidade de fornecedor gerados no módulo RNC sem digitação manual.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Cadastrar novo fornecedor e classificação',
        instruction:
          'Clique em "Novo Fornecedor" e selecione a classificação (Crítico ou Não Crítico) e os escopos fornecidos (aços, tratamentos térmicos, soldagem, etc.).',
      },
      {
        step: 2,
        title: 'Qualificar por ISO 9001 ou Questionário FSGQ 8.4-2',
        instruction:
          'Insira o certificado ISO 9001 válido ou clique em "Avaliar" na linha do fornecedor para preencher o questionário técnico de 5 blocos.',
      },
      {
        step: 3,
        title: 'Emitir Lista de Fornecedores Qualificados (FSGQ 8.4-4)',
        instruction:
          'Acesse a aba "Lista Qualificados (FSGQ 8.4-4)" para gerar a visão em formato oficial de formulário SGQ pronta para auditoria ou impressão/PDF.',
      },
      {
        step: 4,
        title: 'Realizar Coleta de Preço com Mínimo 3 Fornecedores',
        instruction:
          'Na aba "Esteira de Compras", abra uma nova coleta FSGQ 8.4-7, insira as 3 propostas e selecione o vencedor, registrando a previsão de entrega.',
      },
    ],
    tags: [
      'suprimentos',
      'fornecedores',
      'psgq 8.4',
      'fsgq 8.4-4',
      'incf',
      'cotações',
      'qualificação',
    ],
  },

  '/inventory': {
    id: 'inventory',
    path: '/inventory',
    groupId: 'materials',
    groupTitle: 'Suprimentos',
    title: 'Almoxarifado & Gestão de Estoque',
    subtitle: 'Controle de saldo, inspeção CQ, solicitações e compras',
    summary:
      'Sistema integrado de suprimentos e estoque industrial. Controla os dois fluxos de atendimento (Retirada direta quando há saldo / Requisição de Compra quando o saldo é insuficiente com roteamento automático), bloqueio obrigatório de itens pelo Controle da Qualidade (CQ) e projeção de estoque mínimo.',
    features: [
      {
        name: 'Catálogo & Saldo por Empresa',
        description:
          'Rastreabilidade de lotes com código de rastreamento por empresa, insumos, consumíveis e ferramentas.',
      },
      {
        name: 'Dois Fluxos com Roteamento Automático',
        description:
          'Se houver estoque disponível: gera requisição de retirada para o almoxarife. Se faltar saldo: converte automaticamente em requisição de compra.',
      },
      {
        name: 'Bloqueio CQ (Inspeção de Recebimento)',
        description:
          'Itens críticos entram bloqueados no estoque até que o inspetor CQ homologue laudos e certificados de matéria-prima.',
        badge: 'Inspeção CQ',
      },
      {
        name: 'Estoque Mínimo Projetado & Indicadores',
        description:
          'Cálculo de cobertura em dias e alertas antecipados de ruptura com reposição sugerida.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Solicitar material no chão de fábrica (Touch)',
        instruction:
          'Acesse a aba "Solicitação Touch", escolha o item, a quantidade necessária e a OS vinculada. O sistema verificará o saldo imediatamente.',
      },
      {
        step: 2,
        title: 'Atendimento pelo Almoxarife',
        instruction:
          'Na aba "Atendimento Almoxarifado", atenda as retiradas separando o lote físico e confirmando a entrega ao operador.',
      },
      {
        step: 3,
        title: 'Cotação e Compras de Itens Faltantes',
        instruction:
          'Na aba "Suprimentos & Compras", processe os itens sem saldo, registre cotações com fornecedores e confirme a chegada.',
      },
      {
        step: 4,
        title: 'Liberação Técnica do CQ',
        instruction:
          'Para matérias-primas com exigência de qualidade, o inspetor avalia o certificado e clica em "Liberar CQ" antes do uso na produção.',
      },
    ],
    tags: ['almoxarifado', 'estoque', 'materiais', 'touch', 'compras', 'inspeção cq'],
  },

  // Almoxarifado - Aba Touch
  '/inventory#touch': {
    id: 'inventory-touch',
    path: '/inventory',
    subTab: 'touch',
    groupId: 'materials',
    groupTitle: 'Suprimentos',
    title: 'Almoxarifado: Solicitação Touch',
    subtitle: 'Interface ágil para operadores e supervisores no quiosque',
    summary:
      'Tela otimizada para terminais touch-screen no chão de fábrica. Permite ao operador selecionar consumíveis, eletrodos, discos e EPIs com poucos toques, associando o consumo a uma Ordem de Serviço ou centro de custo.',
    features: [
      {
        name: 'Interface em Cartões Grandes',
        description:
          'Botões ampliados e busca instantânea ideal para uso com luvas ou tablets industriais.',
      },
      {
        name: 'Verificação Imediata de Saldo',
        description:
          'Exibe o saldo real em tempo real; se faltar, já encaminha para cotação em Compras.',
      },
      {
        name: 'Identificação Rápida de Operador',
        description:
          'Vínculo do solicitante cadastrado na equipe para total controle de entrega de consumíveis.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecione a Ordem de Serviço e Solicitante',
        instruction:
          'Defina para qual projeto os materiais serão debitados e selecione seu nome na lista.',
      },
      {
        step: 2,
        title: 'Adicione os materiais à cesta',
        instruction:
          'Toque nos cartões de materiais ou utilize o campo de busca rápida digitando o nome do item.',
      },
      {
        step: 3,
        title: 'Confirme o pedido',
        instruction:
          'Revise as quantidades e clique em "Confirmar Solicitação". O almoxarife receberá a notificação em tempo real.',
      },
    ],
    tags: ['touch', 'requisição rápida', 'operador', 'consumíveis', 'quiosque'],
  },

  // Almoxarifado - Aba Atendimento
  '/inventory#requisitions': {
    id: 'inventory-requisitions',
    path: '/inventory',
    subTab: 'requisitions',
    groupId: 'materials',
    groupTitle: 'Suprimentos',
    title: 'Almoxarifado: Atendimento Almoxarifado',
    subtitle: 'Fila de separação e entrega física de pedidos',
    summary:
      'Painel operacional do almoxarife. Lista todos os pedidos de retirada pendentes solicitados pelas equipes de produção, permitindo separar itens por localização física na prateleira e registrar a entrega final.',
    features: [
      {
        name: 'Fila de Separação em Tempo Real',
        description:
          'Notificação automática com som e atualização contínua assim que um operador faz um pedido no Touch.',
      },
      {
        name: 'Baixa Automática de Estoque',
        description:
          'Ao clicar em "Atender Retirada", o saldo do inventário é debitado instantaneamente do lote selecionado.',
      },
      {
        name: 'Rastreamento por Localização',
        description: 'Indica a estante, corredor ou gaveta onde o item está acondicionado.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Identifique o pedido na fila',
        instruction: 'Localize a solicitação com status "Pendente" ordenada pelas mais antigas.',
      },
      {
        step: 2,
        title: 'Separe os materiais fisicamente',
        instruction:
          'Consulte a localização no almoxarifado indicada no card e separe a quantidade solicitada.',
      },
      {
        step: 3,
        title: 'Confirme a entrega',
        instruction:
          'Clique no botão "Atender", conferindo o operador que está retirando os materiais no balcão.',
      },
    ],
    tags: ['atendimento', 'almoxarife', 'separação', 'baixa de estoque', 'retirada'],
  },

  // Almoxarifado - Aba Compras
  '/inventory#supplies': {
    id: 'inventory-supplies',
    path: '/inventory',
    subTab: 'supplies',
    groupId: 'materials',
    groupTitle: 'Suprimentos',
    title: 'Almoxarifado: Suprimentos & Compras',
    subtitle: 'Roteamento automático de compras, cotações e recebimento',
    summary:
      'Módulo de aquisição de insumos gerados por falta de saldo no almoxarifado ou necessidade de reposição de estoque mínimo. Integra o fluxo desde o pedido do operador, passando por cotação, autorização e recebimento.',
    features: [
      {
        name: 'Roteamento Automático',
        description:
          'Solicitações feitas no Touch sem saldo disponível caem diretamente nesta fila de compras.',
      },
      {
        name: 'Status de Aquisição',
        description:
          'Etapas claras: Pendente → Cotado → Aprovado → Comprado → Recebido no Almoxarifado.',
      },
      {
        name: 'Entrada com Inspeção CQ Vinculada',
        description:
          'Ao confirmar o recebimento de itens que exigem CQ, eles são lançados já com o status "Aguardando Inspeção".',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Analise as necessidades de compra',
        instruction:
          'Verifique a lista de requisições pendentes originadas da produção ou por atingimento do estoque mínimo.',
      },
      {
        step: 2,
        title: 'Registre cotações e fornecedores',
        instruction:
          'Insira o preço unitário cotado, prazo de entrega do fornecedor e anexe cotações se necessário.',
      },
      {
        step: 3,
        title: 'Confirmar recebimento de mercadoria',
        instruction:
          'Quando os materiais chegarem à fábrica, clique em "Receber", inserindo a quantidade efetiva entregue e a nota fiscal.',
      },
    ],
    tags: ['compras', 'suprimentos', 'cotação', 'fornecedor', 'recebimento'],
  },

  // Almoxarifado - Aba Indicadores
  '/inventory#indicators': {
    id: 'inventory-indicators',
    path: '/inventory',
    subTab: 'indicators',
    groupId: 'materials',
    groupTitle: 'Suprimentos',
    title: 'Almoxarifado: Indicadores & Estoque Mínimo',
    subtitle: 'Métricas de acuracidade, rupturas e capital imobilizado',
    summary:
      'Painel de inteligência de suprimentos. Apresenta o valor total do patrimônio em estoque, itens abaixo do ponto de reposição (estoque mínimo), pendências com o CQ e curva de consumo de materiais.',
    features: [
      {
        name: 'Valor Total em Estoque',
        description:
          'Cálculo do montante financeiro em inventário baseado no custo unitário atualizado.',
      },
      {
        name: 'Alerta de Ruptura Iminente',
        description:
          'Lista itens cujo saldo atual é inferior ao estoque de segurança definido para a operação.',
        badge: 'Ruptura',
      },
      {
        name: 'Taxa de Retenção CQ',
        description:
          'Percentual de materiais recebidos que ainda aguardam laudo de inspeção para liberação.',
      },
      {
        name: 'Recálculo e Sincronização',
        description:
          'Botão de recálculo que atualiza os indicadores e os sincroniza com a Matriz Geral de Indicadores.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Avaliar itens em nível crítico',
        instruction:
          'Consulte a tabela de "Estoque Crítico / Mínimo" para identificar itens que necessitam de pedido urgente.',
      },
      {
        step: 2,
        title: 'Sincronizar indicadores',
        instruction:
          'Clique em "Recalcular Indicadores" para atualizar as métricas com as últimas movimentações e entradas de notas.',
      },
      {
        step: 3,
        title: 'Tomar ações preventivas',
        instruction:
          'Use os dados para renegociar lotes mínimos com fornecedores e calibrar estoques de segurança.',
      },
    ],
    tags: ['indicadores de estoque', 'estoque mínimo', 'kpis', 'patrimônio', 'ruptura'],
  },

  // 5. Pessoas: Treinamentos (Geral + Abas)
  '/trainings': {
    id: 'trainings',
    path: '/trainings',
    groupId: 'people',
    groupTitle: 'Pessoas',
    title: 'Plano de Treinamentos (FSGQ 7.2-1)',
    subtitle: 'Gestão completa da capacitação técnica e conformidade ISO/ASME',
    summary:
      'Módulo oficial de gestão de competências segundo o procedimento FSGQ 7.2-1 Rev.03. Controla o cronograma anual de ações, listas de presença digitais (FSGQ 7.2-3), avaliação de eficácia após 60 dias da conclusão e cálculo automático do indicador Homem-Hora de Treinamento (HHT).',
    features: [
      {
        name: 'Formulário Oficial FSGQ 7.2-1',
        description:
          'Controle de ação, periodicidade, responsável, público-alvo, origem (Interno/Externo) e modalidade.',
      },
      {
        name: 'Lista de Presença Digital (FSGQ 7.2-3)',
        description:
          'Coleta de assinaturas digitais dos colaboradores, foto da turma, instrutor e nota de aproveitamento.',
      },
      {
        name: 'Ciclo de Eficácia (+60 dias)',
        description:
          'Dispara automaticamente o prazo de 60 dias após o treinamento para o gestor avaliar se a competência foi absorvida na prática.',
        badge: '+60 dias',
      },
      {
        name: 'Indicadores Automáticos (HHT)',
        description:
          'Cálculo de Homem-Hora de Treinamento, % de aderência ao plano anual e índice de eficácia atingido.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Planejar as ações anuais',
        instruction:
          'Cadastre as ações do ano clicando em "Nova Ação" ou faça a importação da planilha oficial FSGQ 7.2-1.',
      },
      {
        step: 2,
        title: 'Registrar a realização com Lista de Presença',
        instruction:
          'Após ministrar o curso, clique no botão "Lista de Presença" na linha da ação. Registre participantes e notas.',
      },
      {
        step: 3,
        title: 'Conduzir a Avaliação de Eficácia após 60 dias',
        instruction:
          'Após 60 dias da realização, o supervisor avalia o impacto do colaborador na fábrica respondendo ao questionário oficial.',
      },
      {
        step: 4,
        title: 'Acompanhar a aba de Indicadores de Treinamento',
        instruction:
          'Monitore a meta mensal de HHT e o percentual de cumprimento da matriz anual na aba Indicadores.',
      },
    ],
    tags: ['treinamentos', 'fsgq 7.2-1', 'hht', 'eficácia', 'capacitação'],
  },

  // Treinamentos - Aba Plano de Ações
  '/trainings#plano': {
    id: 'trainings-plano',
    path: '/trainings',
    subTab: 'plano',
    groupId: 'people',
    groupTitle: 'Pessoas',
    title: 'Treinamentos: Plano de Ações (FSGQ 7.2-1)',
    subtitle: 'Cronograma anual, filtros e registro de realização',
    summary:
      'Planilha mestra digital com todos os treinamentos previstos para o ano. Apresenta o status em dias (OK, Pendente, Atrasado), a carga horária prevista/realizada e os atalhos para lista de presença e edição.',
    features: [
      {
        name: 'Status Visual em Dias',
        description: 'Cálculo automático de conformidade com os prazos previstos no plano anual.',
      },
      {
        name: 'Exportação para Planilha CSV',
        description:
          'Exporta o plano completo com cabeçalho oficial para apresentar a auditores externos.',
      },
      {
        name: 'Realização Rápida ou Completa',
        description:
          'Opção de registrar realização expressa ou preencher o formulário completo de evidência.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Localize a ação no plano',
        instruction:
          'Filtre por tipo (SMS, Qualificação, Procedimento) ou pesquise pelo nome do curso.',
      },
      {
        step: 2,
        title: 'Abra a Lista de Presença',
        instruction:
          'Clique no botão verde "Lista de Presença" para abrir o formulário digital FSGQ 7.2-3.',
      },
      {
        step: 3,
        title: 'Verifique o status de eficácia',
        instruction:
          'Monitore a coluna "STATUS EFIC." para saber quais ações já ultrapassaram os 60 dias e requerem entrevista.',
      },
    ],
    tags: ['plano de treinamento', 'fsgq', 'cronograma', 'ações', 'capacitação'],
  },

  // Treinamentos - Aba Indicadores
  '/trainings#indicadores': {
    id: 'trainings-indicadores',
    path: '/trainings',
    subTab: 'indicadores',
    groupId: 'people',
    groupTitle: 'Pessoas',
    title: 'Treinamentos: Indicadores de Desempenho (HHT)',
    subtitle: 'Metas corporativas, HHT mensal e índice de eficácia',
    summary:
      'Painel executivo com os 3 indicadores mandatórios de Gente & Gestão: Homem-Hora de Treinamento (meta % sobre a base de horas úteis), Cumprimento do Plano Anual e Índice de Eficácia dos Treinamentos.',
    features: [
      {
        name: 'HHT Mensal e Acumulado',
        description:
          'Total de horas investidas em capacitação versus o efetivo total de colaboradores da empresa.',
      },
      {
        name: 'Meta de Cumprimento do Plano',
        description:
          'Percentual de cursos realizados no prazo em comparação ao total programado no FSGQ 7.2-1.',
      },
      {
        name: 'Eficácia de Aprendizado',
        description:
          'Índice de aproveitamento das avaliações práticas após 60 dias de aplicação no trabalho.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Consulte o gráfico mensal de HHT',
        instruction:
          'Verifique se a meta mínima de horas de capacitação do mês atual foi atingida.',
      },
      {
        step: 2,
        title: 'Monitore a eficácia dos treinamentos',
        instruction: 'Certifique-se de que as notas pós-60 dias se mantêm acima da meta de 80%.',
      },
      {
        step: 3,
        title: 'Ajuste a base de colaboradores',
        instruction:
          'Caso a empresa admita novos funcionários, atualize o efetivo para manter a precisão do cálculo de HHT.',
      },
    ],
    tags: ['hht', 'indicadores de treinamento', 'metas', 'fsgq 7.2-1', 'eficácia'],
  },

  // 5. Pessoas: Equipe
  '/team': {
    id: 'team',
    path: '/team',
    groupId: 'people',
    groupTitle: 'Pessoas',
    title: 'Visão da Equipe & Colaboradores',
    subtitle: 'Gestão de operadores, cargos, apontadores e certificados',
    summary:
      'Controle do quadro de colaboradores das empresas do grupo. Permite cadastrar dados funcionais, definir quem atua como Apontador no chão de fábrica, vincular operadores sob sua responsabilidade e arquivar certificados.',
    features: [
      {
        name: 'Flag de Apontador & Operadores Vinculados',
        description:
          'Define se o colaborador é apontador e quais operadores ele tem autorização para lançar checklists.',
        badge: 'Apontador',
      },
      {
        name: 'Repositório de Certificados',
        description:
          'Upload de NR-10, NR-35, carteiras de soldador e certificados de qualificação com validade.',
      },
      {
        name: 'Importação da Equipe via Planilha',
        description:
          'Carga em lote de funcionários a partir de planilhas de RH com departamento e cargo.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Cadastrar ou editar colaborador',
        instruction:
          'Clique em "Novo Usuário" ou no ícone de lápis do colaborador para atualizar cargo, empresa e departamento.',
      },
      {
        step: 2,
        title: 'Configurar permissão de Apontador',
        instruction:
          'Marque a opção "É Apontador" e selecione os operadores vinculados que ele poderá apontar no dia a dia.',
      },
      {
        step: 3,
        title: 'Anexar certificados e NRs',
        instruction:
          'Abra os certificados do colaborador para adicionar documentos comprobatórios com as datas de expiração.',
      },
    ],
    tags: ['equipe', 'colaboradores', 'apontador', 'certificados', 'nr'],
  },

  // 6. Gestão: Indicadores
  '/indicators': {
    id: 'indicators',
    path: '/indicators',
    groupId: 'management',
    groupTitle: 'Gestão',
    title: 'Indicadores Globais da Qualidade',
    subtitle: 'Matriz estratégica de KPIs dos processos do SGQ',
    summary:
      'Painel de governança corporativa da qualidade. Centraliza os indicadores de conformidade de processos, refugo, atendimento a prazos, fornecedores, almoxarifado e treinamento com histórico e metas.',
    features: [
      {
        name: 'Metas e Limites de Controle',
        description:
          'Definição de metas mínimas e máximas com indicação visual de status verde, âmbar e vermelho.',
      },
      {
        name: 'Histórico Mensal de Medições',
        description: 'Registro das apurações mensais com notas explicativas e causas de variações.',
      },
      {
        name: 'Integração com Módulos Operacionais',
        description:
          'Consolida automaticamente indicadores vindos do Almoxarifado, Treinamentos e Checklists.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecione o processo ou setor',
        instruction:
          'Navegue pelos cartões de indicadores para avaliar o desempenho em relação à meta contratada.',
      },
      {
        step: 2,
        title: 'Registrar nova medição do mês',
        instruction:
          'Clique no card do indicador e selecione "Inserir Valor" para alimentar o mês com o resultado obtido.',
      },
      {
        step: 3,
        title: 'Consultar histórico e evolução',
        instruction:
          'Abra o gráfico de tendência para verificar a curva dos últimos 12 meses e identificar desvios.',
      },
    ],
    tags: ['indicadores', 'kpis', 'metas', 'sgq', 'qualidade'],
  },

  // 6. Gestão: RNC
  '/rnc': {
    id: 'rnc',
    path: '/rnc',
    groupId: 'management',
    groupTitle: 'Gestão',
    title: 'RNC (Controle e Relatório de Não Conformidade)',
    subtitle: 'Módulo oficial fiel aos formulários FSGQ 8.7-1 (Livro) e FSGQ 8.7-2 (Relatório)',
    summary:
      'Tratamento estruturado de desvios, falhas e reclamações de clientes rigorosamente fiel aos formulários FSGQ 8.7-1 e FSGQ 8.7-2 da empresa. Inclui cálculo automático do Custo da Não Qualidade, ferramentas de 5 Por Quês e Diagrama de Ishikawa (6M), avaliação de riscos, verificação de eficácia com abertura automática de RNC filha e recálculo tolerante dos indicadores IRPI e INCF.',
    features: [
      {
        name: 'Numeração no Padrão da Empresa',
        description:
          'Geração automática de numeração no formato oficial RNC 015-26 e rastreabilidade total.',
      },
      {
        name: '8 Seções Sequenciais FSGQ 8.7-2',
        description:
          'Descrição, Correção imediata com cálculo de custos, Reinspeção, Causa Raiz (Ishikawa e 5 Por Quês), Ação Corretiva, Avaliação de Riscos, Eficácia e Evidências.',
      },
      {
        name: 'Cálculo Automático do Custo da Não Qualidade',
        description:
          'Soma em tempo real: Matéria-Prima + Insumos + Serviços Terceirizados = Custo Total da Não Qualidade.',
      },
      {
        name: 'Verificação de Eficácia e RNC Filha',
        description:
          'Se a eficácia for declarada NÃO pelo auditor CQ, o sistema abre automaticamente uma RNC Filha vinculada à RNC Pai.',
      },
      {
        name: 'Alimentação Automática de Indicadores',
        description:
          'Atualização dinâmica de IRPI (Índice de Reclamações de Produtos) e INCF (Índice de NC por Fornecedor), sem risco de travar operações.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Acessar o Livro de RNCs (FSGQ 8.7-1)',
        instruction:
          'Consulte a listagem geral com filtros rápidos por empresa (PSC/KOALA/GENTI), status, origem da notificação, processo e severidade.',
      },
      {
        step: 2,
        title: 'Emitir Nova RNC (FSGQ 8.7-2)',
        instruction:
          'Clique em "Emitir Nova RNC", preencha o cabeçalho oficial (origem, OS vinculada, processo, grau de desvio e emitente) e avance pelas seções sequenciais.',
      },
      {
        step: 3,
        title: 'Registrar Disposição e Custos da Não Qualidade',
        instruction:
          'Indique se a peça será retrabalhada, reparada ou rejeitada e preencha os valores de matéria-prima, insumos e serviços.',
      },
      {
        step: 4,
        title: 'Conduzir a análise de 5 Por Quês e Ishikawa',
        instruction:
          'Utilize as ferramentas de análise integradas na aba Causa Raiz para documentar os fatores Método, Máquina, Mão de Obra, Material, Meio Ambiente e Medição.',
      },
      {
        step: 5,
        title: 'Auditar Eficácia e Gerar RNC Filha',
        instruction:
          'Na data estipulada, realize a auditoria. Se o problema reincidir e a eficácia for "NÃO", uma RNC Filha será criada automaticamente para nova tratativa.',
      },
    ],
    tags: [
      'rnc',
      'não conformidade',
      'fsgq 8.7-1',
      'fsgq 8.7-2',
      '5 porquês',
      'ishikawa',
      'irpi',
      'incf',
      'ação corretiva',
    ],
  },

  // 6. Gestão: Notificações
  '/notifications': {
    id: 'notifications',
    path: '/notifications',
    groupId: 'management',
    groupTitle: 'Gestão',
    title: 'Central de Notificações',
    subtitle: 'Histórico completo de alertas, aprovações e convocações',
    summary:
      'Registro cronológico de todas as mensagens do sistema disparadas para o seu perfil: checklists aguardando aprovação, recusas fundamentadas, convocações para treinamentos e pedidos de materiais no almoxarifado.',
    features: [
      {
        name: 'Marcação de Lido/Não Lido',
        description:
          'Controle das mensagens pendentes com botão rápido de marcar todas como lidas.',
      },
      {
        name: 'Links Diretos de Navegação',
        description:
          'Ao clicar no card da notificação, você é redirecionado exatamente para o registro em questão.',
      },
      {
        name: 'Categorização de Severidade',
        description:
          'Diferenciação clara entre alertas normais, informativos e avisos críticos de qualidade.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Acessar mensagens não lidas',
        instruction:
          'Clique no ícone de sino no cabeçalho ou navegue até a tela pelo menu lateral.',
      },
      {
        step: 2,
        title: 'Agir sobre a notificação',
        instruction:
          'Clique sobre a notificação desejada para abrir a tela da tarefa, aprovação ou pedido correspondente.',
      },
      {
        step: 3,
        title: 'Limpar a caixa de entrada',
        instruction: 'Utilize "Marcar todas como lidas" para manter seu painel organizado.',
      },
    ],
    tags: ['notificações', 'mensagens', 'sino', 'alertas', 'comunicação'],
  },

  // 7. Administração: Empresas
  '/companies': {
    id: 'companies',
    path: '/companies',
    groupId: 'administration',
    groupTitle: 'Administração',
    title: 'Gestão de Empresas & Certificações',
    subtitle: 'Entidades jurídicas do grupo, certificações ASME, NBIC e ISO',
    summary:
      'Cadastro e parametrização das empresas que compõem o grupo econômico no UQualiHub. Permite configurar selos e certificações oficiais (Estampas ASME U/S, NBIC R, ISO 9001), logotipo e razão social.',
    features: [
      {
        name: 'Certificações Internacionais',
        description:
          'Registro formal de escopos, números de certificados e datas de validade das auditorias de estampa.',
      },
      {
        name: 'Multi-empresa Nativo',
        description:
          'Isola e compartilha dados com segurança de acordo com a empresa selecionada no cabeçalho.',
      },
      {
        name: 'Alocação de Colaboradores',
        description:
          'Atribuição de usuários a uma ou múltiplas empresas com diferentes níveis de acesso.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Cadastrar nova empresa do grupo',
        instruction:
          'Clique em "Nova Empresa", informe a Razão Social, CNPJ, sigla e faça upload da logomarca.',
      },
      {
        step: 2,
        title: 'Vincular selos e estampas',
        instruction:
          'Adicione os registros das auditorias ASME, NBIC e ISO vigentes com as datas de expiração.',
      },
      {
        step: 3,
        title: 'Definir usuários autorizados',
        instruction:
          'Gerencie as alocações para definir quais colaboradores podem visualizar os registros dessa empresa.',
      },
    ],
    tags: ['empresas', 'cnpj', 'certificações', 'asme', 'nbic', 'iso'],
  },

  // 7. Administração: Controle de Acesso
  '/access-control': {
    id: 'access-control',
    path: '/access-control',
    groupId: 'administration',
    groupTitle: 'Administração',
    title: 'Controle de Acesso & Permissões',
    subtitle: 'Segurança granular por módulo, pastas de documentos e papéis',
    summary:
      'Painel de segurança administrativa do UQualiHub. Permite aos Gestores configurar com precisão quais módulos cada papel (Manager, QCC, Consultor, Supervisor, Apontador) pode visualizar, criar, editar ou excluir, além de proteger pastas de documentos confidenciais.',
    features: [
      {
        name: 'Matriz de Permissões por Módulo',
        description:
          'Grade completa onde cada linha é um módulo do sistema e cada coluna define os direitos de cada papel.',
      },
      {
        name: 'Permissões por Pasta Técnica',
        description:
          'Restrição de acesso a pastas de procedimentos específicos (ex: apenas Solda ou apenas Diretoria).',
      },
      {
        name: 'Atribuição Imediata',
        description:
          'Alterações entram em vigor imediatamente para todos os usuários logados do papel selecionado.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecione a empresa ou visão global',
        instruction:
          'Escolha se deseja configurar a matriz para uma empresa específica ou para todas as unidades.',
      },
      {
        step: 2,
        title: 'Ajuste os privilégios dos módulos',
        instruction:
          'Marque ou desmarque as caixas de "Ver", "Criar", "Editar" e "Excluir" para os papéis desejados.',
        tip: 'O módulo de Ajuda é aberto para todos os colaboradores por padrão.',
      },
      {
        step: 3,
        title: 'Configure o acesso a pastas de documentos',
        instruction:
          'Na aba correspondente, libere ou restrinja o acesso aos prefixos do DMS conforme o setor do colaborador.',
      },
    ],
    tags: ['controle de acesso', 'permissões', 'segurança', 'papéis', 'administração'],
  },
}

/**
 * Retorna o tópico de ajuda para a rota e sub-aba atual.
 * Fallback seguro: se a rota não for mapeada, retorna um objeto padrão gentil.
 */
export function getHelpTopic(pathname: string, subTab?: string): HelpTopic {
  // Primeiro tenta match exato da rota + sub-aba (ex: /inventory#touch)
  if (subTab) {
    const compoundKey = `${pathname}#${subTab}`
    if (HELP_CONTENT[compoundKey]) {
      return HELP_CONTENT[compoundKey]
    }
  }

  // Depois tenta match da rota exata
  if (HELP_CONTENT[pathname]) {
    return HELP_CONTENT[pathname]
  }

  // Tenta normalizar sem trailing slash
  const cleanPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  if (HELP_CONTENT[cleanPath]) {
    return HELP_CONTENT[cleanPath]
  }

  // Fallback padrão gentil — nunca quebra
  return {
    id: 'generic-help',
    path: pathname,
    groupId: 'home',
    groupTitle: 'Ajuda UQualiHub',
    title: 'Guia de Navegação UQualiHub',
    subtitle: 'Instruções gerais do sistema',
    summary:
      'Você está visualizando uma tela do UQualiHub. Caso tenha dúvidas sobre a operação deste recurso, consulte o menu lateral para acessar a Central de Tutoriais completa ou recorra ao seu Gestor da Qualidade.',
    features: [
      {
        name: 'Menu Lateral Integrado',
        description:
          'Acesse os 7 grupos do sistema: Início, Qualidade, Operação, Materiais, Pessoas, Gestão e Administração.',
      },
      {
        name: 'Central de Tutoriais (/help)',
        description:
          'Consulte o passo a passo completo de cada recurso em linguagem simples e direta.',
      },
      {
        name: 'Notificações no Sino',
        description:
          'Acompanhe tarefas atribuídas e retornos de aprovação pelo ícone no cabeçalho.',
      },
    ],
    steps: [
      {
        step: 1,
        title: 'Selecione a empresa correta',
        instruction: 'Confirme no topo superior direito se você está operando na unidade desejada.',
      },
      {
        step: 2,
        title: 'Consulte os tutoriais passo a passo',
        instruction:
          'Acesse o item "Ajuda" no menu lateral para visualizar guias detalhados de cada funcionalidade.',
      },
      {
        step: 3,
        title: 'Fale com o suporte técnico',
        instruction:
          'Se encontrar qualquer dificuldade ou inconsistência, entre em contato com a equipe de Qualidade.',
      },
    ],
    tags: ['ajuda', 'suporte', 'uqualihub'],
  }
}

/**
 * Retorna todos os tópicos primários (sem sub-abas duplicadas no índice principal)
 * organizados para a Central de Tutoriais.
 */
export function getAllHelpTopics(): HelpTopic[] {
  // Retorna os tópicos com chave sem '#' para a lista principal
  return Object.entries(HELP_CONTENT)
    .filter(([key]) => !key.includes('#'))
    .map(([, topic]) => topic)
}

/**
 * Retorna todos os tópicos incluindo sub-abas para busca abrangente
 */
export function getAllHelpTopicsWithSubtabs(): HelpTopic[] {
  return Object.values(HELP_CONTENT)
}
