import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" role="status" aria-label="Loading dashboard">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Next Class Skeleton */}
          <Card>
            <CardHeader className="border-b border-border/60 pb-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Today Schedule Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Preview Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
