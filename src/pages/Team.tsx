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
  deleteTeamMember,
  bulkImportTeamMembers,
  type TeamMember,
  type TeamImportRow,
  type TeamImportResult,
  type TeamImportProgressCallback,
} from '@/services/team'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Trash2,
  Users,
  Search,
  UserCheck,
} from 'lucide-react'
import { UserCertificates } from '@/components/UserCertificates'
import { getCertificates, type Certificate } from '@/services/certificates'
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
  const [memberFormOpen, setMemberFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [memberSaving, setMemberSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null)

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

  if (user?.role !== 'Manager') {
    return <div className="p-8 text-center text-rose-500">{t('msg.accessDenied')}</div>
  }

  const roleStats = (role: string) => {
    const items = checklists.filter((c) => c.role_assigned === role)
    const done = items.filter(
      (c) => c.status === 'completed' || c.approval_status === 'approved',
    ).length
    return { total: items.length, done }
  }

  const handleSaveMember = async (data: TeamMemberFormData) => {
    setMemberSaving(true)
    try {
      if (editingMember) {
        await updateTeamMember(editingMember.id, data)
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

  const handleDeleteMember = async (id: string) => {
    try {
      await deleteTeamMember(id)
      toast({ title: 'Colaborador excluído' })
      setDeleteMemberId(null)
      loadMembers()
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' })
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
              Cadastro de colaboradores por empresa e departamento
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
                {members.length} cadastrado(s)
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-xs text-white/60">Nome</TableHead>
                    <TableHead className="text-xs text-white/60">Empresa</TableHead>
                    <TableHead className="text-xs text-white/60">Departamento</TableHead>
                    <TableHead className="text-xs text-white/60">Cargo</TableHead>
                    <TableHead className="text-xs text-white/60 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id} className="border-white/5">
                      <TableCell className="text-sm text-white flex items-center gap-2">
                        <Avatar className="h-7 w-7 border border-primary/20">
                          <AvatarFallback className="bg-card text-primary text-xs">
                            {m.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {m.name}
                        {m.is_indicator && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 text-[10px]"
                          >
                            Apontador
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-white/70">
                        {companyName(m.company_id)}
                      </TableCell>
                      <TableCell className="text-xs text-white/70">{m.department || '—'}</TableCell>
                      <TableCell className="text-xs text-white/70">{m.role || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteMemberId(m.id)}
                            className="text-muted-foreground hover:text-rose-400 h-8 w-8"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {members.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    Nenhum colaborador cadastrado. Use "Importar" ou "Adicionar".
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

      <AlertDialog
        open={!!deleteMemberId}
        onOpenChange={(open) => !open && setDeleteMemberId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este colaborador?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMemberId && handleDeleteMember(deleteMemberId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
