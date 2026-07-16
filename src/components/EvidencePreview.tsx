import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { BilingualText } from '@/hooks/use-i18n'
import { parseEvidenceFiles } from '@/services/api'

interface EvidencePreviewProps {
  checklistId: string
  filename: string
}

export function EvidencePreview({ checklistId, filename }: EvidencePreviewProps) {
  const files = parseEvidenceFiles(filename)
  const [urls, setUrls] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (files.length === 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    const objectUrls: string[] = []
    const newUrls: Record<string, string | null> = {}

    Promise.all(
      files.map(async (fname) => {
        const fileUrl = `${pb.baseURL}/api/files/checklists/${checklistId}/${fname}`
        try {
          const res = await fetch(fileUrl, {
            headers: { Authorization: pb.authStore.token || '' },
          })
          const blob = await res.blob()
          const objUrl = URL.createObjectURL(blob)
          objectUrls.push(objUrl)
          newUrls[fname] = objUrl
        } catch {
          newUrls[fname] = null
        }
      }),
    ).then(() => {
      setUrls(newUrls)
      setLoading(false)
    })

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [checklistId, filename])

  if (loading) return <Skeleton className="w-full h-32 rounded-lg" />

  if (files.length === 0) return null

  const isImage = (fname: string) => fname.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  return (
    <div className="grid grid-cols-2 gap-2">
      {files.map((fname) => {
        const url = urls[fname]
        if (!url) return null
        if (isImage(fname)) {
          return (
            <img
              key={fname}
              src={url}
              alt="Evidence"
              className="rounded-lg max-h-32 w-full object-contain border border-white/10"
            />
          )
        }
        return (
          <a
            key={fname}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline text-xs p-2 rounded border border-white/5 bg-black/20"
          >
            <FileText className="w-4 h-4" />
            <BilingualText k="evidence.viewPdf" />
          </a>
        )
      })}
    </div>
  )
}
