import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import { useToast } from '@/components/ui/use-toast'
import useRealtime from '@/hooks/use-realtime'
import { getUsers, getChecklists, type User, type Checklist } from '@/services/api'
import { generateComplianceReport } from '@/services/reports'
import {
  getTeamMembers,
  getTeamDepartments,
  createTeamMember,
  updateTeamMember,
  bulkImportTeamMembers,
  getCollaboratorPendingItems,
  deactivateCollaborator,
  reactivateCollaborator,
  type TeamMember,
  type TeamImportRow,
  type TeamImportResult,
  type TeamImportProgressCallback,
  type CollaboratorPendingItems,
} from '@/services/team'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { UserFormDialog } from '@/components/UserFormDialog'
import { AllocationDialog } from '@/components/AllocationDialog'
import { TeamFormDialog, type TeamMemberFormData } from '@/components/TeamFormDialog'
import { TeamImportDialog } from '@/components/TeamImportDialog'
import {
  UserPlus,
  FileDown,
  Pencil,
  Building2,
  Upload,
  Users,
  Search,
  UserCheck,
  UserX,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { UserCertificates } from '@/components/UserCertificates'
import { getCertificates, type Certificate } from '@/services/certificates'
import { CollaboratorProfileDialog } from '@/components/CollaboratorProfileDialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

export default function Team() {
  const { user } = useAuth()
  const { t } = useI18n()
  const { toast } = useToast()
  const { selectedCompanyId, companies, availableCompanyIds } = useCompany()
  const [users, setUsers] = useState<User[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [allocUser, setAllocUser] = useState<User | null>(null)

  // ---- Team members (collaborators) --------------------------------------
  const [members, setMembers] = useState<TeamMember[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [memberDept, setMemberDept] = useState('all')
  const [memberStatusTab, setMemberStatusTab] = useState<'active' | 'inactive'>('active')
  const [memberFormOpen, setMemberFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [memberSaving, setMemberSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileMember, setProfileMember] = useState<TeamMember | null>(null)

  // Desativação / Reativação
  const [deactivatingMember, setDeactivatingMember] = useState<TeamMember | null>(null)
  const [pendingItems, setPendingItems] = useState<CollaboratorPendingItems | null>(null)
  const [loadingPending, setLoadingPending] = useState(false)
  const [substituteMemberId, setSubstituteMemberId] = useState<string>('none')
  const [isProcessingStatus, setIsProcessingStatus] = useState(false)
  const [reactivatingMember, setReactivatingMember] = useState<TeamMember | null>(null)

  const availableCompanies = useMemo(() => (companies.length > 0 ? companies : []), [companies])

  const loadMembers = async () => {
    const [list, depts] = await Promise.all([
      getTeamMembers({
        companyId: selectedCompanyId,
        department: memberDept,
        search: memberSearch,
      }),
      getTeamDepartments(selectedCompanyId),
    ])
    setMembers(list)
    setDepartments(depts)
  }

  const loadData = async () => {
    try {
      const [uData, clData, certData] = await Promise.all([
        getUsers(selectedCompanyId),
        getChecklists(undefined, undefined, undefined, selectedCompanyId),
        getCertificates(),
      ])
      setUsers(uData)
      setChecklists(clData)
      setCertificates(certData)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, memberSearch, memberDept])
  useRealtime('checklists', () => loadData())
  useRealtime('user_certificates', () => loadData())
  useRealtime('team', () => loadMembers())

  // Separar ativos e inativos
  const activeMembers = useMemo(() => members.filter((m) => m.is_active !== false), [members])
  const inactiveMembers = useMemo(() => members.filter((m) => m.is_active === false), [members])

  const displayedMembers = memberStatusTab === 'active' ? activeMembers : inactiveMembers

  // Candidatos para substituição (colaboradores ativos da mesma empresa, excluindo o próprio)
  const availableSubstitutes = useMemo(() => {
    if (!deactivatingMember) return []
    return activeMembers.filter(
      (m) => m.id !== deactivatingMember.id && m.company_id === deactivatingMember.company_id,
    )
  }, [activeMembers, deactivatingMember])

  if (user?.role !== 'Manager') {
    return <div className="p-8 text-center text-rose-500">{t('msg.accessDenied')}</div>
  }

  const roleStats = (role: string) => {
    const roleLower = (role || '').toLowerCase().trim()
    const items = checklists.filter((c) => {
      const assigned = Array.isArray(c.role_assigned) ? c.role_assigned : [c.role_assigned]
      return assigned.some((r) => {
        if (!r) return false
        const rLower = r.toLowerCase().trim()
        if (rLower === roleLower) return true
        if (
          (roleLower === 'welder' && rLower === 'soldador') ||
          (roleLower === 'soldador' && rLower === 'welder')
        )
          return true
        return false
      })
    })
    const done = items.filter(
      (c) => c.status === 'completed' || c.approval_status === 'approved',
    ).length
    return { total: items.length, done }
  }

  const handleSaveMember = async (data: TeamMemberFormData) => {
    setMemberSaving(true)
    try {
      if (editingMember) {
        await updateTeamMember(editingMember.id, {
          name: data.name,
          company_id: data.company_id,
          department: data.department,
          role: data.role,
          is_indicator: data.is_indicator,
          linked_operators: data.linked_operators,
        })
        toast({ title: 'Colaborador atualizado' })
      } else {
        await createTeamMember(data)
        toast({ title: 'Colaborador adicionado' })
      }
      setMemberFormOpen(false)
      setEditingMember(null)
      loadMembers()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' })
    } finally {
      setMemberSaving(false)
    }
  }

  // Iniciar diálogo de desativação (busca pendências em aberto)
  const handleOpenDeactivateDialog = async (m: TeamMember) => {
    setDeactivatingMember(m)
    setPendingItems(null)
    setSubstituteMemberId('none')
    setLoadingPending(true)
    try {
      const items = await getCollaboratorPendingItems(m)
      setPendingItems(items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPending(false)
    }
  }

  // Executar desativação
  const handleConfirmDeactivate = async () => {
    if (!deactivatingMember) return
    setIsProcessingStatus(true)
    try {
      const substitute =
        substituteMemberId && substituteMemberId !== 'none'
          ? members.find((m) => m.id === substituteMemberId)
          : undefined

      const res = await deactivateCollaborator(deactivatingMember.id, {
        reassignToMember: substitute,
        linkedUserId: pendingItems?.linkedUser?.id,
      })

      toast({
        title: 'Colaborador desativado',
        description: `${deactivatingMember.name} foi desativado. Histórico integralmente preservado no SGQ.${
          res.reassignedCount > 0
            ? ` ${res.reassignedCount} pendência(s) reatribuída(s) para ${substitute?.name}.`
            : ''
        }${res.userDisabled ? ' Acesso de login suspenso.' : ''}`,
      })

      setDeactivatingMember(null)
      setPendingItems(null)
      loadMembers()
    } catch (e: any) {
      toast({ title: 'Erro ao desativar', description: e?.message, variant: 'destructive' })
    } finally {
      setIsProcessingStatus(false)
    }
  }

  // Executar reativação
  const handleConfirmReactivate = async () => {
    if (!reactivatingMember) return
    setIsProcessingStatus(true)
    try {
      const res = await reactivateCollaborator(reactivatingMember.id)
      toast({
        title: 'Colaborador reativado',
        description: `${reactivatingMember.name} está novamente ativo nas listas.${
          res.userReactivated ? ' Acesso de login reabilitado.' : ''
        }`,
      })
      setReactivatingMember(null)
      loadMembers()
    } catch (e: any) {
      toast({ title: 'Erro ao reativar', description: e?.message, variant: 'destructive' })
    } finally {
      setIsProcessingStatus(false)
    }
  }

  const handleImport = async (
    rows: TeamImportRow[],
    companyId: string,
    onProgress?: TeamImportProgressCallback,
  ): Promise<TeamImportResult> => {
    return bulkImportTeamMembers(rows, companyId, availableCompanies, onProgress)
  }

  const companyName = (id?: string) =>
    companies.find((c) => c.id === id)?.name ||
    members.find((m) => m.company_id === id)?.expand?.company_id?.name ||
    '—'

  // Formatar cargos múltiplos para exibição com badges
  const renderRoleBadges = (roleStr?: string) => {
    if (!roleStr || !roleStr.trim()) return <span className="text-muted-foreground">—</span>
    const parts = roleStr
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length === 1) {
      return <span>{parts[0]}</span>
    }
    return (
      <div className="flex flex-wrap gap-1">
        {parts.map((r, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="text-[11px] font-normal bg-white/5 border border-white/10 text-white/90 py-0 px-1.5"
          >
            {r}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* ============ Colaboradores (team collection) ============ */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Colaboradores
            </h2>
            <p className="text-muted-foreground text-sm">
              Cadastro de colaboradores por empresa e departamento com rastreabilidade integral SGQ
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="border-white/10 text-muted-foreground hover:text-primary"
            >
              <Upload className="w-4 h-4 mr-2" /> Importar Colaboradores
            </Button>
            <Button
              onClick={() => {
                setEditingMember(null)
                setMemberFormOpen(true)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </div>
        </div>

        <Card className="glass border-white/5">
          <CardContent className="p-4 space-y-4">
            {/* Abas: Ativos vs Inativos */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={memberStatusTab === 'active' ? 'default' : 'outline'}
                  onClick={() => setMemberStatusTab('active')}
                  className={
                    memberStatusTab === 'active'
                      ? 'bg-primary text-primary-foreground text-xs font-semibold'
                      : 'border-white/10 text-muted-foreground text-xs'
                  }
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  Ativos ({activeMembers.length})
                </Button>
                <Button
                  size="sm"
                  variant={memberStatusTab === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setMemberStatusTab('inactive')}
                  className={
                    memberStatusTab === 'inactive'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs font-semibold'
                      : 'border-white/10 text-muted-foreground text-xs'
                  }
                >
                  <UserX className="w-3.5 h-3.5 mr-1.5" />
                  Inativos / Desativados ({inactiveMembers.length})
                </Button>
              </div>

              <div className="text-xs text-muted-foreground italic flex items-center gap-1">
                <span>Histórico auditado ASME/NBIC: registros nunca são excluídos</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Buscar colaborador..."
                  className="bg-black/20 border-white/10 text-white pl-9"
                />
              </div>
              <Select value={memberDept} onValueChange={setMemberDept}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white w-48 h-9">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="outline" className="border-primary/30 text-primary self-center">
                {displayedMembers.length} exibido(s)
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-xs text-white/60">Nome</TableHead>
                    <TableHead className="text-xs text-white/60">Empresa</TableHead>
                    <TableHead className="text-xs text-white/60">Departamento</TableHead>
                    <TableHead className="text-xs text-white/60">Cargo(s)</TableHead>
                    <TableHead className="text-xs text-white/60 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedMembers.map((m) => (
                    <TableRow key={m.id} className="border-white/5">
                      <TableCell className="text-sm text-white flex items-center gap-2">
                        <Avatar className="h-7 w-7 border border-primary/20">
                          <AvatarFallback className="bg-card text-primary text-xs">
                            {m.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMember(m)
                            setProfileOpen(true)
                          }}
                          className={`hover:underline hover:text-primary font-medium text-left transition-colors ${
                            m.is_active === false ? 'line-through text-muted-foreground' : ''
                          }`}
                          title="Clique para abrir Ficha do Colaborador"
                        >
                          {m.name}
                        </button>
                        {m.is_indicator && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 text-[10px]"
                          >
                            Apontador
                          </Badge>
                        )}
                        {m.is_active === false && (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 text-rose-400 text-[10px]"
                          >
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-white/70">
                        {companyName(m.company_id)}
                      </TableCell>
                      <TableCell className="text-xs text-white/70">{m.department || '—'}</TableCell>
                      <TableCell className="text-xs text-white/70">
                        {renderRoleBadges(m.role)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setProfileMember(m)
                              setProfileOpen(true)
                            }}
                            className="text-xs text-primary/90 hover:text-primary hover:bg-primary/10 h-8 px-2"
                            title="Ficha do Colaborador"
                          >
                            Ficha
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingMember(m)
                              setMemberFormOpen(true)
                            }}
                            className="text-muted-foreground hover:text-primary h-8 w-8"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {m.is_active === false ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReactivatingMember(m)}
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 px-2 gap-1 text-xs"
                              title="Reativar Colaborador"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reativar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDeactivateDialog(m)}
                              className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 h-8 px-2 gap-1 text-xs"
                              title="Desativar Colaborador (Preserva Histórico)"
                            >
                              <UserX className="w-3.5 h-3.5" /> Desativar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {displayedMembers.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {memberStatusTab === 'active'
                      ? 'Nenhum colaborador ativo encontrado.'
                      : 'Nenhum colaborador inativo cadastrado.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============ Usuários / conformidade (existente) ============ */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold text-white mb-1">
              {t('page.team.title')}
            </h2>
            <p className="text-muted-foreground">{t('page.team.desc')}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => generateComplianceReport(checklists, users, t)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {t('team.exportReport')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => {
            const s = roleStats(u.role)
            const pct = s.total === 0 ? 100 : Math.round((s.done / s.total) * 100)
            return (
              <Card key={u.id} className="glass border-white/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-card text-primary text-lg">
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg text-white">{u.name}</CardTitle>
                        <p className="text-sm text-primary">{u.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setAllocUser(u)}
                        className="text-muted-foreground hover:text-primary"
                        title={t('company.assign')}
                      >
                        <Building2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingUser(u)
                          setDialogOpen(true)
                        }}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('team.compliance')}</span>
                      <span className="font-medium text-white">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2 bg-white/5" />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {s.done} {t('team.completed')} {s.total}
                    </p>
                  </div>
                  <UserCertificates
                    userId={u.id}
                    certificates={certificates.filter((c) => c.user_id === u.id)}
                    onRefresh={loadData}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSaved={loadData}
      />
      <AllocationDialog
        open={!!allocUser}
        onOpenChange={(v) => !v && setAllocUser(null)}
        userId={allocUser?.id || ''}
        userName={allocUser?.name || ''}
      />
      <TeamFormDialog
        open={memberFormOpen}
        onOpenChange={(v) => {
          setMemberFormOpen(v)
          if (!v) setEditingMember(null)
        }}
        onSave={handleSaveMember}
        editing={editingMember}
        companies={availableCompanies}
        defaultCompanyId={selectedCompanyId !== 'all' ? selectedCompanyId : undefined}
        isSaving={memberSaving}
      />
      <TeamImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        companies={availableCompanies}
        defaultCompanyId={selectedCompanyId !== 'all' ? selectedCompanyId : undefined}
      />

      {/* Diálogo de Desativação com Resumo de Pendências e Opção de Reatribuição */}
      <AlertDialog
        open={!!deactivatingMember}
        onOpenChange={(open) => {
          if (!open && !isProcessingStatus) {
            setDeactivatingMember(null)
            setPendingItems(null)
          }
        }}
      >
        <AlertDialogContent className="max-w-xl bg-card border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2 text-rose-400">
              <UserX className="w-5 h-5" />
              Desativar Colaborador
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 space-y-3 pt-2 text-sm">
              <p>
                Você está prestes a desativar{' '}
                <strong className="text-white">{deactivatingMember?.name}</strong>.
              </p>
              <div className="p-3 bg-white/5 border border-white/10 rounded-md text-xs text-white/90 space-y-1.5">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Princípio SGQ ASME / NBIC:
                </div>
                <p>
                  O histórico <strong>NUNCA</strong> é apagado. Treinamentos realizados, listas
                  assinadas, leituras de procedimentos e RNCs permanecerão integralmente preservados
                  para auditoria.
                </p>
                <p>
                  O colaborador apenas deixará de aparecer em novas seleções de apontamento e listas
                  operacionais.
                </p>
              </div>

              {loadingPending ? (
                <div className="flex items-center justify-center p-6 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verificando pendências ativas do colaborador...
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Conta de usuário vinculada */}
                  {pendingItems?.linkedUser && (
                    <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
                      <span className="font-semibold text-amber-300">
                        Conta de acesso ao sistema detectada:
                      </span>{' '}
                      {pendingItems.linkedUser.email}. O acesso de login será suspenso (disabled =
                      true) sem exclusão da conta.
                    </div>
                  )}

                  {/* Resumo de pendências ativas */}
                  {pendingItems &&
                  (pendingItems.checklists.length > 0 || pendingItems.rncs.length > 0) ? (
                    <div className="space-y-2 border border-rose-500/20 bg-rose-500/5 p-3 rounded-md">
                      <div className="font-semibold text-rose-400 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Pendências ativas encontradas (
                        {pendingItems.checklists.length + pendingItems.rncs.length})
                      </div>

                      {pendingItems.rncs.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-white/80 font-medium">
                            RNCs em andamento sob responsabilidade ({pendingItems.rncs.length}):
                          </span>
                          <ul className="list-disc pl-5 text-white/70 space-y-0.5">
                            {pendingItems.rncs.map((r) => (
                              <li key={r.id}>
                                RNC #{r.number}: {r.description.slice(0, 70)}...
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {pendingItems.checklists.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-white/80 font-medium">
                            Checklists pendentes vinculados ({pendingItems.checklists.length}):
                          </span>
                          <ul className="list-disc pl-5 text-white/70 space-y-0.5">
                            {pendingItems.checklists.map((c) => (
                              <li key={c.id}>{c.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Opção de reatribuição */}
                      <div className="pt-2 border-t border-rose-500/20">
                        <Label className="text-white text-xs block mb-1">
                          Reatribuir pendências ativas para outro colaborador (mesma empresa):
                        </Label>
                        <Select value={substituteMemberId} onValueChange={setSubstituteMemberId}>
                          <SelectTrigger className="bg-black/30 border-white/10 text-white h-8 text-xs">
                            <SelectValue placeholder="Selecione um substituto (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              Não reatribuir agora (manter pendências em aberto)
                            </SelectItem>
                            {availableSubstitutes.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name} {sub.role ? `(${sub.role})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {substituteMemberId === 'none' && (
                          <p className="text-[11px] text-amber-400 mt-1">
                            Atenção: ao desativar sem substituto, as pendências ativas continuarão
                            registradas com o responsável anterior.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Nenhuma pendência ativa (checklists ou RNCs em andamento) atribuída a este
                      colaborador.
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3">
            <AlertDialogCancel
              disabled={isProcessingStatus}
              className="border-white/10 text-muted-foreground"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDeactivate()
              }}
              disabled={isProcessingStatus || loadingPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isProcessingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Desativando...
                </>
              ) : (
                'Confirmar Desativação'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Reativação */}
      <AlertDialog
        open={!!reactivatingMember}
        onOpenChange={(open) => !open && !isProcessingStatus && setReactivatingMember(null)}
      >
        <AlertDialogContent className="bg-card border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2 text-emerald-400">
              <RotateCcw className="w-5 h-5" />
              Reativar Colaborador
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 space-y-2 text-sm pt-2">
              <p>
                Deseja reativar o colaborador{' '}
                <strong className="text-white">{reactivatingMember?.name}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                Ele voltará a constar normalmente nas listas de seleção operacional e, se possuir
                conta de acesso, a mesma será reabilitada.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isProcessingStatus}
              className="border-white/10 text-muted-foreground"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmReactivate()
              }}
              disabled={isProcessingStatus}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Reativando...
                </>
              ) : (
                'Confirmar Reativação'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Collaborator Profile Modal */}
      <CollaboratorProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        teamMemberId={profileMember?.id}
        collaboratorName={profileMember?.name}
        companyId={profileMember?.company_id}
      />
    </div>
  )
}
