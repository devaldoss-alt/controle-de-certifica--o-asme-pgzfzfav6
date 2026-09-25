/**
 * Página de Configurações do Sistema e Administração SGQ (/settings)
 * Acesso com ferramentas de gestão avançada, incluindo Ferramenta de Importação de RNCs FSGQ 8.7-2.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useAuth } from '../hooks/use-auth'
import { useCompany } from '../hooks/use-company'
import { getCompanies, type Company } from '../services/companies'
import { RNCImportDialog } from '../components/RNCImportDialog'
import {
  Settings,
  FileSpreadsheet,
  Building2,
  Shield,
  Layers,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  const { user } = useAuth()
  const { companies: contextCompanies, selectedCompanyId } = useCompany()
  const [companies, setCompanies] = useState<Company[]>([])
  const [rncImportOpen, setRncImportOpen] = useState(false)

  const canManage =
    user?.role && ['Manager', 'Director', 'QCC', 'Consultor', 'Supervisor'].includes(user.role)

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompanies()
        setCompanies(data)
      } catch (err) {
        console.error('Erro ao carregar empresas:', err)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-primary" />
            Configurações e Administração SGQ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de parâmetros do sistema, ferramentas de importação e dados das unidades.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/10 text-white/80 font-mono text-xs">
            Perfil: {user?.role || 'Usuário'}
          </Badge>
          {canManage && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
              Gestor SGQ
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-lg">
          <TabsTrigger
            value="integrations"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Database className="w-4 h-4 mr-2" />
            Cargas & Importações de Dados
          </TabsTrigger>
          <TabsTrigger
            value="companies"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Empresas & Unidades
          </TabsTrigger>
          <TabsTrigger
            value="access"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm"
          >
            <Shield className="w-4 h-4 mr-2" />
            Segurança & Controle
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: CARGAS & IMPORTAÇÕES */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD: Importação de RNCs FSGQ 8.7-2 */}
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="border-primary/40 text-primary text-[11px]">
                    FSGQ 8.7-2 / Excel & JSON
                  </Badge>
                </div>
                <CardTitle className="text-base text-white mt-3">
                  Importação de Não Conformidades (RNCs)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Carregue relatórios históricos das abas PSC e Koala System (2025/2026),
                  preservando a numeração original e unificando duplicidades.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 text-xs text-muted-foreground bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="flex items-center gap-1.5 text-white/90 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Recursos disponíveis:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>Upload de planilha Excel com múltiplas abas ou arquivo JSON</li>
                    <li>Identificação automática da empresa e ano pelo nome da aba</li>
                    <li>Opção de substituição total para limpeza de dados inconsistentes</li>
                    <li>Cálculo rigoroso de status (Fechada vs. Em Andamento)</li>
                  </ul>
                </div>

                {canManage ? (
                  <Button
                    onClick={() => setRncImportOpen(true)}
                    className="w-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Abrir Assistente de Carga de RNCs
                  </Button>
                ) : (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                    Acesso restrito ao perfil de Gestor da Qualidade (Manager).
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CARD: Atalho para Gestão de RNCs */}
            <Card className="glass border-white/10 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 w-fit">
                  <Layers className="w-6 h-6" />
                </div>
                <CardTitle className="text-base text-white mt-3">
                  Módulo de RNC & Não Conformidades
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Acesse o controle diário (FSGQ 8.7-1), visualização de desvios, indicadores
                  IRPI/INCF e cálculo do custo da não qualidade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/15 text-white text-xs sm:text-sm gap-2"
                >
                  <Link to="/rnc">
                    Ir para RNCs <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 2: EMPRESAS & UNIDADES */}
        <TabsContent value="companies" className="space-y-4">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-base text-white">Unidades Cadastradas</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Empresas vinculadas ao SGQ para emissão de RNCs e ordens de serviço.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-black/30 border border-white/10 space-y-1"
                  >
                    <p className="font-bold text-sm text-white">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">ID: {c.id}</p>
                    {c.tax_id && <p className="text-xs text-white/60">CNPJ: {c.tax_id}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: SEGURANÇA & CONTROLE */}
        <TabsContent value="access" className="space-y-4">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-base text-white">Controle de Acesso por Módulo</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Configuração detalhada de permissões de visualização e edição de colaboradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="border-white/15 text-white text-xs">
                <Link to="/access-control">Abrir Matriz de Permissões</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGO DE IMPORTAÇÃO DE RNCS */}
      <RNCImportDialog
        open={rncImportOpen}
        onOpenChange={setRncImportOpen}
        companies={companies.length > 0 ? companies : contextCompanies}
        defaultCompanyId={
          selectedCompanyId !== 'all'
            ? selectedCompanyId
            : user?.primary_company_id || 'a631bv695rr4gef'
        }
        onSuccess={() => {
          // Callback de sucesso
        }}
      />
    </div>
  )
}
export default SettingsPage
