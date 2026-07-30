import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/hooks/use-i18n'
import { useCompany } from '@/hooks/use-company'
import { createCertificate, updateCertificate, type Certificate } from '@/services/certificates'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  certificate?: Certificate | null
  onSaved?: () => void
}

export function CertificateDialog({ open, onOpenChange, userId, certificate, onSaved }: Props) {
  const { lang } = useI18n()
  const { selectedCompanyId } = useCompany()
  const [certType, setCertType] = useState('')
  const [certNumber, setCertNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setCertType(certificate?.certificate_type || '')
      setCertNumber(certificate?.certificate_number || '')
      setExpiry(certificate?.expiry_date ? certificate.expiry_date.split(' ')[0].split('T')[0] : '')
      setFile(null)
      setError('')
    }
  }, [open, certificate])

  const handleSubmit = async () => {
    if (!certType.trim()) {
      setError(lang === 'pt' ? 'Tipo de certificado é obrigatório' : 'Certificate type is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data: Record<string, any> = {
        certificate_type: certType.trim(),
        certificate_number: certNumber.trim(),
        expiry_date: expiry || undefined,
        user_id: userId,
        company_id: selectedCompanyId || undefined,
      }
      if (file) data.file = file

      if (certificate) {
        await updateCertificate(certificate.id, data)
      } else {
        await createCertificate(data)
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      setError(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {certificate
              ? lang === 'pt'
                ? 'Editar Certificado'
                : 'Edit Certificate'
              : lang === 'pt'
                ? 'Adicionar Certificado'
                : 'Add Certificate'}
          </DialogTitle>
          <DialogDescription>
            {lang === 'pt'
              ? 'Informações do certificado profissional'
              : 'Professional certificate information'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label className="text-white/80">{lang === 'pt' ? 'Tipo' : 'Type'}</Label>
            <Input
              value={certType}
              onChange={(e) => setCertType(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
              placeholder="NR-13, Qualificação de Soldador..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">{lang === 'pt' ? 'Número' : 'Number'}</Label>
            <Input
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">{lang === 'pt' ? 'Validade' : 'Expiry Date'}</Label>
            <Input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">{lang === 'pt' ? 'Arquivo' : 'File'}</Label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {lang === 'pt' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? '...' : lang === 'pt' ? 'Salvar' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
