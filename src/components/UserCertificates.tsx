import { useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { CertificateDialog } from '@/components/CertificateDialog'
import { deleteCertificate, type Certificate } from '@/services/certificates'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Award, Calendar } from 'lucide-react'
import { safeFormatDate } from '@/lib/safe-data'
import { differenceInDays } from 'date-fns'

interface Props {
  userId: string
  certificates: Certificate[]
  onRefresh: () => void
}

export function UserCertificates({ userId, certificates, onRefresh }: Props) {
  const { lang } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Certificate | null>(null)

  const handleDelete = async (id: string) => {
    await deleteCertificate(id)
    onRefresh()
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Award className="w-3 h-3" />
          {lang === 'pt' ? 'Certificados' : 'Certificates'}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <div className="space-y-1.5">
        {certificates.map((cert) => {
          const days = cert.expiry_date
            ? differenceInDays(new Date(cert.expiry_date), new Date())
            : null
          return (
            <div key={cert.id} className="flex items-center gap-2 text-xs group">
              <div className="flex-1 min-w-0">
                <span className="text-white/80">{cert.certificate_type}</span>
                {cert.certificate_number && (
                  <span className="text-muted-foreground ml-1">#{cert.certificate_number}</span>
                )}
                {days !== null && (
                  <span
                    className={`ml-2 inline-flex items-center ${
                      days < 0
                        ? 'text-rose-500'
                        : days <= 30
                          ? 'text-amber-500'
                          : 'text-muted-foreground'
                    }`}
                  >
                    <Calendar className="w-2.5 h-2.5 mr-0.5" />
                    {safeFormatDate(cert.expiry_date, 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => {
                    setEditing(cert)
                    setDialogOpen(true)
                  }}
                >
                  <Pencil className="w-2.5 h-2.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 text-rose-500"
                  onClick={() => handleDelete(cert.id)}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </Button>
              </div>
            </div>
          )
        })}
        {certificates.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            {lang === 'pt' ? 'Nenhum certificado' : 'No certificates'}
          </p>
        )}
      </div>
      <CertificateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        certificate={editing}
        onSaved={onRefresh}
      />
    </div>
  )
}
