import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Upload,
  FileText,
  Plus,
  Trash2,
  Save,
  FileSearch,
} from 'lucide-react'
import {
  AuditProgramItem,
  AuditChecklistSection,
  AuditChecklistItem,
  DEFAULT_ISO_AUDIT_SECTIONS,
  saveAuditChecklistSection,
  deleteAuditChecklistSection,
} from '@/services/audits'
import { DocumentRecord } from '@/services/documents'

interface AuditExecutionTabProps {
  audit: AuditProgramItem
  checklistSections: AuditChecklistSection[]
  availableDocuments: DocumentRecord[]
  onReload: () => Promise<void>
}

export const AuditExecutionTab: React.FC<AuditExecutionTabProps> = ({
  audit,
  checklistSections,
  availableDocuments,
  onReload,
}) => {
  const [sections, setSections] = useState<AuditChecklistSection[]>(checklistSections)
  const [newSectionName, setNewSectionName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [sectionFiles, setSectionFiles] = useState<Record<string, File[]>>({})

  React.useEffect(() => {
    setSections(checklistSections)
  }, [checklistSections])

  // Helper to initialize standard ISO 9001 checklists if empty
  const handleLoadStandardSections = async () => {
    if (!confirm('Deseja carregar a estrutura padrão de requisitos ISO 9001 (seções 4 a 10)?')) {
      return
    }

    try {
      setSavingId('bulk-init')
      for (const stdSec of DEFAULT_ISO_AUDIT_SECTIONS) {
        const items: AuditChecklistItem[] = stdSec.requirements.map((req, idx) => ({
          id: `req-${Date.now()}-${idx}`,
          requirement: req,
          compliance: 'C',
          evidence: '',
        }))

        await saveAuditChecklistSection({
          audit_id: audit.id,
          section: stdSec.section,
          items,
        })
      }
      await onReload()
    } catch (err) {
      console.error('Failed to load standard sections:', err)
      alert('Erro ao carregar estrutura padrão.')
    } finally {
      setSavingId(null)
    }
  }

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return
    try {
      setSavingId('new-sec')
      await saveAuditChecklistSection({
        audit_id: audit.id,
        section: newSectionName.trim(),
        items: [
          {
            id: `req-${Date.now()}-1`,
            requirement: 'Verificar conformidade com os procedimentos estabelecidos.',
            compliance: 'C',
            evidence: '',
          },
        ],
      })
      setNewSectionName('')
      await onReload()
    } finally {
      setSavingId(null)
    }
  }

  const handleItemChange = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof AuditChecklistItem,
    val: any,
  ) => {
    const next = [...sections]
    const sec = { ...next[sectionIndex] }
    const items = [...sec.items]
    items[itemIndex] = { ...items[itemIndex], [field]: val }
    sec.items = items
    next[sectionIndex] = sec
    setSections(next)
  }

  const handleAddItemToSection = (sectionIndex: number) => {
    const next = [...sections]
    const sec = { ...next[sectionIndex] }
    sec.items = [
      ...sec.items,
      {
        id: `item-${Date.now()}`,
        requirement: '',
        compliance: 'C',
        evidence: '',
      },
    ]
    next[sectionIndex] = sec
    setSections(next)
  }

  const handleRemoveItem = (sectionIndex: number, itemIndex: number) => {
    const next = [...sections]
    const sec = { ...next[sectionIndex] }
    sec.items = sec.items.filter((_, idx) => idx !== itemIndex)
    next[sectionIndex] = sec
    setSections(next)
  }

  const handleSaveSection = async (section: AuditChecklistSection) => {
    try {
      setSavingId(section.id)
      const files = sectionFiles[section.id]
      await saveAuditChecklistSection(
        {
          id: section.id,
          audit_id: audit.id,
          section: section.section,
          items: section.items,
          cross_doc_id: section.cross_doc_id,
        },
        files,
      )
      await onReload()
    } catch (e) {
      console.error('Failed to save section:', e)
      alert('Erro ao salvar seção de checklist.')
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteSection = async (secId: string) => {
    if (!confirm('Deseja excluir esta seção do checklist?')) return
    try {
      setSavingId(secId)
      await deleteAuditChecklistSection(secId)
      await onReload()
    } finally {
      setSavingId(null)
    }
  }

  // Calculate section progress
  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0)
  const cCount = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.compliance === 'C').length,
    0,
  )
  const ncCount = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.compliance === 'NC').length,
    0,
  )
  const naCount = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.compliance === 'N.A.').length,
    0,
  )

  return (
    <div className="space-y-6">
      {/* Execution Header Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 border rounded-lg">
        <div>
          <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            Execução do Checklist: {audit.audit_scope} ({audit.audit_type})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Avalie cada requisito normativo, classifique em Conforme (C), Não Conforme (NC) ou Não
            Aplicável (N.A.) e aponte evidências objetivas auditadas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {sections.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadStandardSections}
              disabled={savingId === 'bulk-init'}
              className="text-xs"
            >
              {savingId === 'bulk-init' ? 'Carregando...' : 'Carregar Requisitos ISO 9001'}
            </Button>
          )}

          <div className="flex items-center gap-1.5 text-xs bg-background p-1.5 border rounded">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              C: {cCount}
            </Badge>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
              NC: {ncCount}
            </Badge>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
              N.A.: {naCount}
            </Badge>
            <span className="text-muted-foreground ml-1">Total: {totalItems}</span>
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      {sections.length === 0 ? (
        <Card className="text-center py-10 bg-muted/10 border-dashed">
          <CardContent className="space-y-3">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm font-medium">
              Nenhum requisito ou seção configurada nesta auditoria.
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Você pode iniciar rapidamente importando a estrutura padrão de requisitos da ISO 9001
              ou criar seções personalizadas para este processo.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button size="sm" onClick={handleLoadStandardSections}>
                Carregar Padrão ISO 9001 (§4 ao §10)
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sIdx) => (
            <Card key={section.id} className="border shadow-xs">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-semibold text-xs">
                    Seção {sIdx + 1}
                  </Badge>
                  <CardTitle className="text-sm font-medium">{section.section}</CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-muted-foreground hover:text-rose-600 h-8 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveSection(section)}
                    disabled={savingId === section.id}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingId === section.id ? 'Salvando...' : 'Salvar Seção'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Cross-reference to SGQ Document */}
                <div className="flex items-center gap-3 p-2 bg-muted/10 rounded-md text-xs">
                  <Label className="text-xs text-muted-foreground shrink-0 font-medium">
                    Procedimento / Documento Referência:
                  </Label>
                  <Select
                    value={section.cross_doc_id || 'none'}
                    onValueChange={(val) => {
                      const next = [...sections]
                      next[sIdx].cross_doc_id = val === 'none' ? undefined : val
                      setSections(next)
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs max-w-md">
                      <SelectValue placeholder="Selecione documento de referência do SGQ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum documento vinculado</SelectItem>
                      {availableDocuments.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.code ? `[${doc.code}] ` : ''}
                          {doc.title} {doc.revision ? `(Rev. ${doc.revision})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Section Evidence Upload */}
                  <div className="ml-auto flex items-center gap-2">
                    <Label
                      htmlFor={`file-${section.id}`}
                      className="cursor-pointer text-xs flex items-center gap-1 text-primary hover:underline"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Anexar evidência da seção
                    </Label>
                    <input
                      id={`file-${section.id}`}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setSectionFiles({
                            ...sectionFiles,
                            [section.id]: Array.from(e.target.files),
                          })
                        }
                      }}
                    />
                    {sectionFiles[section.id]?.length ? (
                      <span className="text-[11px] text-emerald-600 font-medium">
                        ({sectionFiles[section.id].length} arquivo(s))
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-3">
                  {section.items.map((item, iIdx) => (
                    <div
                      key={item.id || iIdx}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        item.compliance === 'NC'
                          ? 'bg-rose-50/50 border-rose-200'
                          : item.compliance === 'C'
                            ? 'bg-emerald-50/20 border-border'
                            : 'bg-muted/10 border-border'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-2">
                        <div className="flex-1 w-full">
                          <Input
                            value={item.requirement}
                            onChange={(e) =>
                              handleItemChange(sIdx, iIdx, 'requirement', e.target.value)
                            }
                            placeholder="Requisito normativo ou pergunta de verificação..."
                            className="text-xs h-8 font-medium"
                          />
                        </div>

                        {/* Compliance Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant={item.compliance === 'C' ? 'default' : 'outline'}
                            onClick={() => handleItemChange(sIdx, iIdx, 'compliance', 'C')}
                            className={`h-7 px-2.5 text-xs font-semibold ${
                              item.compliance === 'C'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            C (Conforme)
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant={item.compliance === 'NC' ? 'destructive' : 'outline'}
                            onClick={() => handleItemChange(sIdx, iIdx, 'compliance', 'NC')}
                            className={`h-7 px-2.5 text-xs font-semibold ${
                              item.compliance === 'NC'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            NC (Não Conforme)
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant={item.compliance === 'N.A.' ? 'secondary' : 'outline'}
                            onClick={() => handleItemChange(sIdx, iIdx, 'compliance', 'N.A.')}
                            className={`h-7 px-2.5 text-xs ${
                              item.compliance === 'N.A.'
                                ? 'bg-slate-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <MinusCircle className="w-3.5 h-3.5 mr-1" />
                            N.A.
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(sIdx, iIdx)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Evidence Field */}
                      <div>
                        <Input
                          value={item.evidence || ''}
                          onChange={(e) => handleItemChange(sIdx, iIdx, 'evidence', e.target.value)}
                          placeholder="Evidência objetiva auditada (ex.: Amostra OS 104, Registro CQ 2026-03, Formulário FSGQ 8.5-1 devidamente preenchido)..."
                          className="text-xs h-7 text-muted-foreground bg-background"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItemToSection(sIdx)}
                    className="w-full text-xs h-8 border-dashed gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Requisito a esta Seção
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Custom Section */}
      <div className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row items-center gap-3">
        <Input
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
          placeholder="Título da nova seção (ex.: Requisitos Específicos do Cliente, Verificação ASME...)"
          className="text-xs h-9"
        />
        <Button
          size="sm"
          onClick={handleAddSection}
          disabled={!newSectionName.trim() || savingId === 'new-sec'}
          className="shrink-0 h-9 gap-1 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          {savingId === 'new-sec' ? 'Adicionando...' : 'Adicionar Nova Seção'}
        </Button>
      </div>
    </div>
  )
}
