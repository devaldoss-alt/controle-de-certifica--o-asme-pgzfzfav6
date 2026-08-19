import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import { useI18n, BilingualText } from '@/hooks/use-i18n'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import {
  getModulePermissions,
  saveModulePermission,
  type ModulePermission,
} from '@/services/module-permissions'
import {
  getDocumentAccess,
  updateDocumentAccess,
  createDocumentAccess,
  deleteDocumentAccess,
  type DocumentAccess,
} from '@/services/document-access'
import {
  getDocumentPermissions,
  getDocumentSectors,
  toggleDocumentPermission,
  type DocumentPermission,
} from '@/services/document-permissions'
import { getTeamMembers, type TeamMember } from '@/services/team'
import { DMS_PREFIXES } from '@/lib/dms-codes'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShieldCheck,
  Lock,
  ShieldAlert,
  FileText,
  CheckCircle2,
  Save,
  UserCheck,
  Settings,
  Users,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
const ROLES = [
  'Manager',
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
  'Consultor',
]
const MODULES: Array<'Documentos' | 'Romaneios' | 'Checklists' | 'Indicadores'> = [
  'Documentos',
  'Romaneios',
  'Checklists',
  'Indicadores',
]

export default function AccessControl() {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const { lang, t } = useI18n()
  const { toast } = useToast()

  const [permissions, setPermissions] = useState<ModulePermission[]>([])
  const [docAccessList, setDocAccessList] = useState<DocumentAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('Consultor')

  const isQualityManager =
    user?.email === 'devaldoss@gmail.com' ||
    user?.name?.toLowerCase().includes('quality manager') ||
    user?.name?.toLowerCase().includes('gestor da qualidade')
  const isConsultantTest =
    user?.name?.toLowerCase().includes('consultor teste') ||
    user?.email === 'consultor.teste@qualihub.com'

  const isRestricted = !(isQualityManager || isConsultantTest || user?.role === 'Manager')

  const loadData = async () => {
    try {
      setLoading(true)
      const [perms, docAcc] = await Promise.all([
        getModulePermissions(selectedCompanyId),
        getDocumentAccess(),
      ])
      setPermissions(perms)
      setDocAccessList(docAcc)
    } catch (e) {
      console.error(e)
      toast({
        title: lang === 'pt' ? 'Erro ao carregar permissões' : 'Error loading permissions',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCompanyId])

  useRealtime('module_permissions', () => loadData())
  useRealtime('document_access', () => loadData())

  const getPerm = (role: string, module: ModulePermission['module']) => {
    return (
      permissions.find((p) => p.role === role && p.module === module) || {
        id: '',
        role,
        module,
        can_view: true,
        can_create: role === 'Manager' || role === 'QCC',
        can_edit: role === 'Manager' || role === 'QCC',
        can_delete: role === 'Manager',
        company_id: selectedCompanyId !== 'all' ? selectedCompanyId : '',
      }
    )
  }

  const handleToggleModulePerm = async (
    role: string,
    module: ModulePermission['module'],
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    val: boolean,
  ) => {
    let previousPermissions: ModulePermission[] = []
    let updatedPermission: ModulePermission | null = null

    setPermissions((prev) => {
      previousPermissions = prev
      const existingIdx = prev.findIndex((p) => p.role === role && p.module === module)
      if (existingIdx >= 0) {
        const copy = [...prev]
        updatedPermission = { ...copy[existingIdx], [field]: val }
        copy[existingIdx] = updatedPermission
        return copy
      } else {
        updatedPermission = {
          id: '',
          role,
          module,
          can_view: field === 'can_view' ? val : true,
          can_create: field === 'can_create' ? val : false,
          can_edit: field === 'can_edit' ? val : false,
          can_delete: field === 'can_delete' ? val : false,
          company_id: selectedCompanyId !== 'all' ? selectedCompanyId : '',
        }
        return [...prev, updatedPermission]
      }
    })

    if (updatedPermission) {
      try {
        const effectiveCompany = selectedCompanyId !== 'all' ? selectedCompanyId : ''
        const saved = await saveModulePermission({
          ...updatedPermission,
          company_id: effectiveCompany,
        })
        // Update stored record with real ID from database if it was a new creation
        setPermissions((prev) =>
          prev.map((p) => (p.role === role && p.module === module ? saved : p)),
        )
      } catch (e) {
        setPermissions(previousPermissions)
        toast({
          title: lang === 'pt' ? 'Erro ao salvar permissão' : 'Error saving permission',
          description: getErrorMessage(e),
          variant: 'destructive',
        })
      }
    }
  }

  const handleSaveModulePermissions = async () => {
    setIsSaving(true)
    try {
      const effectiveCompany = selectedCompanyId !== 'all' ? selectedCompanyId : ''
      for (const p of permissions) {
        await saveModulePermission({
          ...p,
          company_id: effectiveCompany,
        })
      }
      toast({
        title: lang === 'pt' ? 'Permissões salvas com sucesso' : 'Permissions saved successfully',
      })
      loadData()
    } catch (e) {
      toast({
        title: lang === 'pt' ? 'Erro ao salvar' : 'Error saving',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getDocAccess = (role: string, prefix: string) => {
    return (
      docAccessList.find((d) => d.role === role && d.document_prefix === prefix) || {
        id: '',
        role,
        document_prefix: prefix,
        can_view: ['Manager', 'QCC', 'Consultor', 'Director'].includes(role),
        can_edit: ['Manager', 'QCC'].includes(role),
      }
    )
  }

  const handleToggleDocAccess = async (
    role: string,
    prefix: string,
    field: 'can_view' | 'can_edit',
    val: boolean,
  ) => {
    const previousList = docAccessList
    const existing = docAccessList.find((d) => d.role === role && d.document_prefix === prefix)

    // Optimistic UI update
    setDocAccessList((prev) => {
      const idx = prev.findIndex((d) => d.role === role && d.document_prefix === prefix)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], [field]: val }
        return copy
      } else {
        const newAccess: DocumentAccess = {
          id: '',
          role,
          document_prefix: prefix,
          can_view: field === 'can_view' ? val : true,
          can_edit: field === 'can_edit' ? val : false,
          created: '',
          updated: '',
        }
        return [...prev, newAccess]
      }
    })

    try {
      let saved: any
      if (existing && existing.id) {
        saved = await updateDocumentAccess(existing.id, { [field]: val })
      } else {
        saved = await createDocumentAccess({
          role,
          document_prefix: prefix,
          can_view: field === 'can_view' ? val : true,
          can_edit: field === 'can_edit' ? val : false,
        })
      }
      setDocAccessList((prev) =>
        prev.map((d) => (d.role === role && d.document_prefix === prefix ? { ...d, ...saved } : d)),
      )
    } catch (e) {
      setDocAccessList(previousList)
      toast({
        title: lang === 'pt' ? 'Erro ao atualizar acesso' : 'Error updating access',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const [selectedTab, setSelectedTab] = useState<'modules' | 'documents' | 'docs' | 'team'>(
    'modules',
  )

  // ---- Documents (per-person) tab state ----------------------------------
  const [docPermMembers, setDocPermMembers] = useState<TeamMember[]>([])
  const [docPermSectors, setDocPermSectors] = useState<string[]>([])
  const [docPerms, setDocPerms] = useState<DocumentPermission[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')

  const loadDocPermData = async () => {
    try {
      const [members, sectors, perms] = await Promise.all([
        getTeamMembers({ companyId: selectedCompanyId }),
        getDocumentSectors(selectedCompanyId),
        getDocumentPermissions(selectedCompanyId),
      ])
      setDocPermMembers(members)
      setDocPermSectors(sectors)
      setDocPerms(perms)
      if (!selectedMemberId && members.length > 0) {
        setSelectedMemberId(members[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (selectedTab === 'docs') loadDocPermData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, selectedCompanyId])

  const handleToggleDocPerm = async (
    sector: string,
    field: 'can_view' | 'can_edit',
    val: boolean,
  ) => {
    if (!selectedMemberId) return
    const previousDocPerms = docPerms
    const companyId = selectedCompanyId !== 'all' ? selectedCompanyId : ''
    const existing = docPerms.find((p) => p.team_id === selectedMemberId && p.sector === sector)

    // Optimistic UI update
    setDocPerms((prev) => {
      const without = prev.filter((p) => !(p.team_id === selectedMemberId && p.sector === sector))
      const curView = existing ? existing.can_view : false
      const curEdit = existing ? existing.can_edit : false
      const nextView = field === 'can_view' ? val : curView
      const nextEdit = field === 'can_edit' ? val : curEdit

      if (!nextView && !nextEdit) return without

      const updatedOpt: DocumentPermission = {
        id: existing ? existing.id : '',
        team_id: selectedMemberId,
        company_id: companyId,
        sector,
        can_view: nextView,
        can_edit: nextEdit,
        created: existing ? existing.created : '',
        updated: existing ? existing.updated : '',
      }
      return [...without, updatedOpt]
    })

    try {
      const updated = await toggleDocumentPermission(
        selectedMemberId,
        sector,
        companyId,
        field,
        val,
        existing,
      )
      setDocPerms((prev) => {
        const without = prev.filter((p) => !(p.team_id === selectedMemberId && p.sector === sector))
        if (updated) return [...without, updated]
        return without
      })
    } catch (e) {
      setDocPerms(previousDocPerms)
      toast({
        title: lang === 'pt' ? 'Erro ao atualizar permissão' : 'Error updating permission',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const getDocPerm = (sector: string) =>
    docPerms.find((p) => p.team_id === selectedMemberId && p.sector === sector) || {
      can_view: false,
      can_edit: false,
    }

  if (isRestricted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          {lang === 'pt' ? 'Acesso Restrito' : 'Restricted Access'}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {lang === 'pt'
            ? 'O módulo de Controle de Acesso é restrito apenas ao Gestor da Qualidade e ao Consultor Teste.'
            : 'Access Control module is restricted only to Quality Manager and Consultant Test.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> RBAC & Governance
            </Badge>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">
            {lang === 'pt' ? 'Controle de Acesso e Permissões' : 'Access Control & Permissions'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'pt'
              ? 'Consolidação de regras CRUD por Módulo e por Pasta de Documentos'
              : 'Centralized CRUD rules per Module and Document Folder'}
          </p>
        </div>

        <Button
          onClick={handleSaveModulePermissions}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : lang === 'pt' ? 'Salvar Configurações' : 'Save Settings'}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 border-b border-white/10 pb-2">
          <Button
            variant={selectedTab === 'modules' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('modules')}
            className={
              selectedTab === 'modules' ? 'bg-primary text-white' : 'text-muted-foreground'
            }
          >
            <Settings className="w-4 h-4 mr-2" />
            {lang === 'pt' ? 'Permissões por Módulo' : 'Module Permissions'}
          </Button>
          <Button
            variant={selectedTab === 'documents' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('documents')}
            className={
              selectedTab === 'documents' ? 'bg-primary text-white' : 'text-muted-foreground'
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            {lang === 'pt' ? 'Acesso a Pastas/Prefixos' : 'Folder Access'}
          </Button>
          <Button
            variant={selectedTab === 'docs' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('docs')}
            className={selectedTab === 'docs' ? 'bg-primary text-white' : 'text-muted-foreground'}
          >
            <Users className="w-4 h-4 mr-2" />
            {lang === 'pt' ? 'Documentos' : 'Documents'}
          </Button>
        </div>

        {selectedTab === 'modules' ? (
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                {lang === 'pt' ? 'Matriz de Permissões de Módulos' : 'Module Permission Matrix'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {lang === 'pt'
                  ? 'Defina ações de Leitura (V), Criação (C), Edição (E) e Exclusão (D) para cada cargo.'
                  : 'Configure Read (V), Create (C), Edit (E) and Delete (D) per user role.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-black/40 text-[11px] uppercase text-muted-foreground border-b border-white/10">
                  <tr>
                    <th className="p-3">Cargo / Papel</th>
                    {MODULES.map((m) => (
                      <th key={m} className="p-3 text-center min-w-[140px]">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ROLES.map((r) => (
                    <tr key={r} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" />
                        {r}
                        {r === 'Consultor' && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 text-[10px] ml-1"
                          >
                            Novo
                          </Badge>
                        )}
                      </td>

                      {MODULES.map((m) => {
                        const perm = getPerm(r, m)
                        return (
                          <td key={m} className="p-3">
                            <div className="flex items-center justify-center gap-2 bg-black/20 p-2 rounded border border-white/5">
                              <label
                                className="flex items-center gap-1 cursor-pointer"
                                title="Ver / Listar"
                              >
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  V
                                </span>
                                <Checkbox
                                  checked={perm.can_view}
                                  onCheckedChange={(c) =>
                                    handleToggleModulePerm(r, m, 'can_view', !!c)
                                  }
                                />
                              </label>

                              <label
                                className="flex items-center gap-1 cursor-pointer"
                                title="Criar"
                              >
                                <span className="text-[10px] font-bold text-emerald-400">C</span>
                                <Checkbox
                                  checked={perm.can_create}
                                  onCheckedChange={(c) =>
                                    handleToggleModulePerm(r, m, 'can_create', !!c)
                                  }
                                />
                              </label>

                              <label
                                className="flex items-center gap-1 cursor-pointer"
                                title="Editar"
                              >
                                <span className="text-[10px] font-bold text-amber-400">E</span>
                                <Checkbox
                                  checked={perm.can_edit}
                                  onCheckedChange={(c) =>
                                    handleToggleModulePerm(r, m, 'can_edit', !!c)
                                  }
                                />
                              </label>

                              <label
                                className="flex items-center gap-1 cursor-pointer"
                                title="Excluir"
                              >
                                <span className="text-[10px] font-bold text-rose-400">D</span>
                                <Checkbox
                                  checked={perm.can_delete}
                                  onCheckedChange={(c) =>
                                    handleToggleModulePerm(r, m, 'can_delete', !!c)
                                  }
                                />
                              </label>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : selectedTab === 'documents' ? (
          <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white">
                  {lang === 'pt' ? 'Acesso por Prefixo de Documento' : 'Document Prefix Access'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {lang === 'pt'
                    ? 'Selecione o papel para configurar a visualização e edição de pastas técnicas (DMS).'
                    : 'Select role to manage technical folder (DMS) view and edit permissions.'}
                </CardDescription>
              </div>

              <div className="w-56">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {DMS_PREFIXES.map((prefix) => {
                  const docAcc = getDocAccess(selectedRole, prefix.prefix)
                  return (
                    <div
                      key={prefix.prefix}
                      className="p-3 rounded-lg bg-black/20 border border-white/10 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary">
                            [{prefix.prefix}]
                          </span>
                          <span className="text-xs font-medium text-white">{prefix.label_pt}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {prefix.label_en || ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <Checkbox
                            checked={docAcc.can_view}
                            onCheckedChange={(c) =>
                              handleToggleDocAccess(selectedRole, prefix.prefix, 'can_view', !!c)
                            }
                          />
                          <span className="text-muted-foreground">
                            {lang === 'pt' ? 'Visualizar' : 'View'}
                          </span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <Checkbox
                            checked={docAcc.can_edit}
                            onCheckedChange={(c) =>
                              handleToggleDocAccess(selectedRole, prefix.prefix, 'can_edit', !!c)
                            }
                          />
                          <span className="text-amber-400">
                            {lang === 'pt' ? 'Editar' : 'Edit'}
                          </span>
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          // ---- Documentos: per-person sector matrix ----
          <Card className="glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {lang === 'pt'
                    ? 'Permissões por Documento (Setores)'
                    : 'Document Permissions (Sectors)'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {lang === 'pt'
                    ? 'Matriz por colaborador: linhas = setores da Lista Mestra, colunas = Visualizar / Editar.'
                    : 'Per-person matrix: rows = Master List sectors, columns = View / Edit.'}
                </CardDescription>
              </div>

              <div className="w-64">
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white">
                    <SelectValue
                      placeholder={lang === 'pt' ? 'Selecione o colaborador' : 'Select team member'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {docPermMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                        {m.department ? ` — ${m.department}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {!selectedMemberId ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {lang === 'pt'
                    ? 'Cadastre colaboradores na tela /team para habilitar esta matriz.'
                    : 'Add team members in /team to enable this matrix.'}
                </div>
              ) : docPermSectors.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {lang === 'pt'
                    ? 'Nenhum setor encontrado na Lista Mestra desta empresa.'
                    : 'No sectors found in the Master List for this company.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-xs text-white/60">
                          {lang === 'pt' ? 'Setor' : 'Sector'}
                        </TableHead>
                        <TableHead className="text-xs text-white/60 text-center">
                          {lang === 'pt' ? 'Visualizar' : 'View'}
                        </TableHead>
                        <TableHead className="text-xs text-white/60 text-center">
                          {lang === 'pt' ? 'Editar' : 'Edit'}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docPermSectors.map((sector) => {
                        const p = getDocPerm(sector)
                        return (
                          <TableRow key={sector} className="border-white/5">
                            <TableCell className="text-sm text-white">{sector}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={p.can_view}
                                  onCheckedChange={(c) =>
                                    handleToggleDocPerm(sector, 'can_view', !!c)
                                  }
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={p.can_edit}
                                  onCheckedChange={(c) =>
                                    handleToggleDocPerm(sector, 'can_edit', !!c)
                                  }
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
