import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { BilingualText } from '@/hooks/use-i18n'

interface EvidencePreviewProps {
  checklistId: string
  filename: string
}

export function EvidencePreview({ checklistId, filename }: EvidencePreviewProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!filename) return
    const fileUrl = `${pb.baseURL}/api/files/checklists/${checklistId}/${filename}`
    let objectUrl: string | null = null
    fetch(fileUrl, { headers: { Authorization: pb.authStore.token || '' } })
      .then((res) => res.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [checklistId, filename])

  if (!url) return <Skeleton className="w-full h-32 rounded-lg" />

  const isImage = filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  if (isImage) {
    return (
      <img
        src={url}
        alt="Evidence"
        className="rounded-lg max-h-48 w-full object-contain border border-white/10"
      />
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-primary hover:underline"
    >
      <FileText className="w-4 h-4" />
      <BilingualText k="evidence.viewPdf" />
    </a>
  )
}
