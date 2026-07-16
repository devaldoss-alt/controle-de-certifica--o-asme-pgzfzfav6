export type Language = 'pt' | 'en'

export const translations: Record<string, { pt: string; en: string }> = {
  'nav.dashboard': { pt: 'Dashboard', en: 'Dashboard' },
  'nav.checklists': { pt: 'Checklists', en: 'Checklists' },
  'nav.serviceOrders': { pt: 'Ordens de Serviço', en: 'Service Orders' },
  'nav.documents': { pt: 'Documentos', en: 'Documents' },
  'nav.approvals': { pt: 'Aprovações', en: 'Approvals' },
  'nav.team': { pt: 'Equipe', en: 'Team' },
  'nav.qualifications': { pt: 'Qualificações', en: 'Qualifications' },
  'nav.logout': { pt: 'Sair', en: 'Logout' },
  'nav.mainMenu': { pt: 'Menu Principal', en: 'Main Menu' },

  'page.checklists.title': { pt: 'Checklists Operacionais', en: 'Operational Checklists' },
  'page.checklists.desc': {
    pt: 'Controle rigoroso dos procedimentos da Qualidade ASME/NBIC.',
    en: 'Strict control of ASME/NBIC Quality procedures.',
  },
  'page.serviceOrders.title': { pt: 'Ordens de Serviço', en: 'Service Orders' },
  'page.serviceOrders.desc': {
    pt: 'Gerencie projetos vinculados a clientes e equipamentos.',
    en: 'Manage projects linked to clients and equipment.',
  },
  'page.documents.title': { pt: 'Documentos Técnicos', en: 'Technical Documents' },
  'page.documents.desc': {
    pt: 'Crie e consulte procedimentos e relatórios internos.',
    en: 'Create and consult internal procedures and reports.',
  },
  'page.approvals.title': { pt: 'Aprovações Pendentes', en: 'Pending Approvals' },
  'page.approvals.desc': {
    pt: 'Revise e valide os checklists concluídos pela equipe.',
    en: 'Review and validate checklists completed by the team.',
  },

  'common.create': { pt: 'Criar', en: 'Create' },
  'common.cancel': { pt: 'Cancelar', en: 'Cancel' },
  'common.save': { pt: 'Salvar', en: 'Save' },
  'common.edit': { pt: 'Editar', en: 'Edit' },
  'common.all': { pt: 'Todos', en: 'All' },
  'common.evidence': { pt: 'Evidência', en: 'Evidence' },
  'common.approve': { pt: 'Aprovar', en: 'Approve' },
  'common.reject': { pt: 'Rejeitar', en: 'Reject' },
  'common.client': { pt: 'Cliente', en: 'Client' },
  'common.equipment': { pt: 'Equipamento', en: 'Equipment' },
  'common.standard': { pt: 'Norma', en: 'Standard' },
  'common.number': { pt: 'Número', en: 'Number' },
  'common.title': { pt: 'Título', en: 'Title' },
  'common.deadline': { pt: 'Prazo', en: 'Deadline' },
  'common.status': { pt: 'Status', en: 'Status' },
  'common.category': { pt: 'Categoria', en: 'Category' },

  'status.active': { pt: 'Ativo', en: 'Active' },
  'status.completed': { pt: 'Concluído', en: 'Completed' },
  'status.paused': { pt: 'Pausado', en: 'Paused' },
  'status.approved': { pt: 'Aprovado', en: 'Approved' },
  'status.rejected': { pt: 'Rejeitado', en: 'Rejected' },
  'status.expired': { pt: 'Expirado', en: 'Expired' },

  'filter.allCategories': { pt: 'Todas as Categorias', en: 'All Categories' },
  'filter.iso9001': { pt: 'ISO 9001', en: 'ISO 9001' },
  'filter.departmental': { pt: 'Departamental', en: 'Departmental' },
  'filter.osLinked': { pt: 'Vinculado à OS', en: 'OS-Linked' },

  'evidence.title': { pt: 'Anexar Evidência', en: 'Attach Evidence' },
  'evidence.desc': {
    pt: 'Envie um arquivo como comprovação da conclusão da tarefa.',
    en: 'Upload a file as proof of task completion.',
  },
  'evidence.submit': { pt: 'Enviar e Concluir', en: 'Submit and Complete' },
  'evidence.noFile': { pt: 'Nenhum arquivo selecionado', en: 'No file selected' },
  'evidence.viewPdf': { pt: 'Ver Evidência (PDF)', en: 'View Evidence (PDF)' },
  'evidence.notes': { pt: 'Observações', en: 'Notes' },
  'evidence.file': { pt: 'Arquivo de Evidência', en: 'Evidence File' },

  'msg.noChecklists': {
    pt: 'Nenhum checklist atribuído para o seu perfil no momento.',
    en: 'No checklists assigned to your profile at the moment.',
  },
  'msg.noApprovals': {
    pt: 'Nenhuma aprovação pendente no momento.',
    en: 'No pending approvals at the moment.',
  },
  'msg.noDocuments': { pt: 'Nenhum documento encontrado.', en: 'No documents found.' },
  'msg.noServiceOrders': {
    pt: 'Nenhuma ordem de serviço encontrada.',
    en: 'No service orders found.',
  },
  'msg.planRestricted': {
    pt: 'Recurso disponível apenas nos planos Pro e Gold.',
    en: 'Feature available only in Pro and Gold plans.',
  },
  'msg.osLimitReached': {
    pt: 'Limite de OS do plano atingido.',
    en: 'OS limit for your plan reached.',
  },

  'doc.exportPdf': { pt: 'Exportar PDF', en: 'Export PDF' },
  'doc.exportWord': { pt: 'Word', en: 'Word' },
  'doc.exportExcel': { pt: 'Excel', en: 'Excel' },
  'doc.filePath': { pt: 'Caminho do Arquivo (Rede)', en: 'File Path (Network)' },
  'doc.new': { pt: 'Novo Documento', en: 'New Document' },
  'doc.back': { pt: 'Voltar', en: 'Back' },
  'os.new': { pt: 'Nova OS', en: 'New OS' },
  'os.critical': { pt: 'Crítico', en: 'Critical' },
  'os.awaiting': { pt: 'Aguard. Aprovação', en: 'Awaiting Approval' },
}

export function getTranslation(key: string, lang: Language): string {
  return translations[key]?.[lang] ?? key
}
