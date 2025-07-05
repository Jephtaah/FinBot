import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ReceiptsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Area Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="max-w-md mx-auto">
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Receipts List Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-48" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 