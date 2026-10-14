import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

export function TimetableSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" role="status" aria-label="Loading timetable">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* View Switcher & Day Navigation Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-control" />
          <Skeleton className="h-9 w-28 rounded-control" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-8 w-14 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Main Timetable Content Skeleton */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className="space-y-3">
                <Skeleton className="h-6 w-full rounded" />
                <Skeleton className="h-24 w-full rounded-control" />
                <Skeleton className="h-20 w-full rounded-control" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TimetableSkeleton;
