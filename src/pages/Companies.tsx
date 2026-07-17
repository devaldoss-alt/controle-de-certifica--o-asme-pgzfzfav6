import { useEffect, useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  type Company,
} from '@/services/companies'
import useRealtime from '@/hooks/use-realtime'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Building2, Plus, Pencil, Trash2, Award } from 'lucide-react'

export default function Companies() {
  const { t } = useI18n()
  const [companies, setCompanies] = useState<Company[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState({
    name: '',
    tax_id: '',
    iso_certs: '',
    asme_certs: '',
    nbic_certs: '',
  })

  const loadData = async () => {
    const data = await getCompanies()
    setCompanies(data)
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('companies', () => loadData())

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', tax_id: '', iso_certs: '', asme_certs: '', nbic_certs: '' })
    setDialogOpen(true)
  }

  const openEdit = (c: Company) => {
    setEditing(c)
    setForm({
      name: c.name,
      tax_id: c.tax_id || '',
      iso_certs: c.iso_certs || '',
      asme_certs: c.asme_certs || '',
      nbic_certs: c.nbic_certs || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    try {
      if (editing) {
        await updateCompany(editing.id, form)
      } else {
        await createCompany(form)
      }
      setDialogOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCompany(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const certs = (c: Company) => {
    const list: string[] = []
    if (c.iso_certs) list.push('ISO')
    if (c.asme_certs) list.push('ASME')
    if (c.nbic_certs) list.push('NBIC')
    return list
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {t('page.companies.title')}
          </h1>
          <p className="text-muted-foreground">{t('page.companies.desc')}</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          {t('company.new')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <Card
            key={c.id}
            className="glass border-white/5 backdrop-blur-md hover:border-primary/20 transition-colors"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <Building2 className="w-8 h-8 text-primary" />
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(c)}
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(c.id)}
                    className="h-7 w-7 text-rose-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-white text-lg">{c.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{c.tax_id || '—'}</p>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                {certs(c).map((cert) => (
                  <Badge
                    key={cert}
                    variant="outline"
                    className="border-primary/20 text-primary text-xs"
                  >
                    <Award className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
                {certs(c).length === 0 && (
                  <span className="text-xs text-muted-foreground">{t('company.noCerts')}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>{t('company.noCompanies')}</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editing ? t('common.edit') : t('company.new')}
            </DialogTitle>
            <DialogDescription>{t('page.companies.desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-white/80 mb-1 block">{t('company.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">{t('company.taxId')}</Label>
              <Input
                value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">{t('company.isoCerts')}</Label>
              <Input
                value={form.iso_certs}
                onChange={(e) => setForm({ ...form, iso_certs: e.target.value })}
                placeholder="ISO 9001:2015"
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">{t('company.asmeCerts')}</Label>
              <Input
                value={form.asme_certs}
                onChange={(e) => setForm({ ...form, asme_certs: e.target.value })}
                placeholder="ASME U, S"
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80 mb-1 block">{t('company.nbicCerts')}</Label>
              <Input
                value={form.nbic_certs}
                onChange={(e) => setForm({ ...form, nbic_certs: e.target.value })}
                placeholder="NBIC R, NR"
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
