import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function OperationalDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="glass border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-white/5">
        <CardHeader className="border-b border-white/5">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-16 w-full rounded-md" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <Card key={i} className="glass border-white/5">
            <CardHeader className="border-b border-white/5">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-start gap-2">
                  <Skeleton className="w-4 h-4 rounded mt-0.5" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-white/5">
        <CardHeader className="border-b border-white/5">
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-3 flex items-start gap-3">
                <Skeleton className="w-4 h-4 rounded mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-white/5">
        <CardHeader className="border-b border-white/5">
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="border-l-2 border-white/10 pl-3 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
