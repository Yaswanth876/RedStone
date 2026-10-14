import { Link } from 'react-router-dom';
import { Clock, MapPin, User, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  formatTime,
  isClassInProgress,
  isClassCompleted,
} from '../../utils/dateTime.js';

export function TodaySchedule({
  todayClasses = [],
  currentTime = '',
  nextUpcomingClassId = null,
  formattedDate = '',
}) {
  const totalClasses = todayClasses.length;

  return (
    <Card className="shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Today&apos;s Classes</CardTitle>
          <CardDescription>
            {formattedDate ? `Chronological routine for ${formattedDate}` : 'Chronological schedule'}
          </CardDescription>
        </div>
        <Badge variant={totalClasses > 0 ? 'primary' : 'neutral'} size="sm">
          {totalClasses} {totalClasses === 1 ? 'Session' : 'Sessions'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {totalClasses === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-border rounded-control bg-[#FAF9F6]">
            <div className="w-10 h-10 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No classes scheduled for today
            </p>
            <p className="text-xs text-foreground-muted mt-1 max-w-xs mx-auto">
              Your academic routine has no sessions today. Check your weekly timetable for other days.
            </p>
            <Link to="/timetable" className="inline-block mt-3">
              <Button size="sm" variant="outline" rightIcon={ArrowRight}>
                View Timetable
              </Button>
            </Link>
          </div>
        ) : (
          todayClasses.map((item) => {
            const inProgress = isClassInProgress(item.startTime, item.endTime, currentTime);
            const isCompleted = isClassCompleted(item.endTime, currentTime);
            const isUpNext = !inProgress && !isCompleted && item.id === nextUpcomingClassId;

            let statusLabel = 'Upcoming';
            let statusVariant = 'neutral';
            let statusDot = false;

            if (inProgress) {
              statusLabel = 'In Progress';
              statusVariant = 'success';
              statusDot = true;
            } else if (isUpNext) {
              statusLabel = 'Up Next';
              statusVariant = 'primary';
              statusDot = true;
            } else if (isCompleted) {
              statusLabel = 'Completed';
              statusVariant = 'neutral';
            }

            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-control border transition-colors gap-3 ${
                  inProgress
                    ? 'bg-[#EAF5EF]/40 border-[#C9E7D6]'
                    : isUpNext
                    ? 'bg-primary-soft/30 border-primary/30'
                    : isCompleted
                    ? 'bg-[#FAF9F6] border-border/80 opacity-80'
                    : 'bg-surface border-border hover:bg-[#FAF9F6]'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-[#EAF5EF] text-success'
                        : inProgress
                        ? 'bg-success text-white'
                        : isUpNext
                        ? 'bg-primary text-white'
                        : 'bg-[#F0EDE8] text-foreground-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5 flex-wrap">
                      <span className="font-medium text-foreground">
                        {formatTime(item.startTime)} – {formatTime(item.endTime)}
                      </span>
                      {item.room && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-foreground-muted" />
                            {item.room}
                          </span>
                        </>
                      )}
                      {item.faculty && (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-foreground-muted" />
                            {item.faculty}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <Badge variant={statusVariant} size="sm" dot={statusDot}>
                    {statusLabel}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <CardFooter className="bg-[#FAF9F6] border-t border-border/60 justify-between flex-wrap gap-2">
        <span className="metadata-text">
          Showing verified timetable entries
        </span>
        <Link to="/timetable">
          <Button size="sm" variant="outline" rightIcon={ArrowRight}>
            Complete Timetable View
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default TodaySchedule;
