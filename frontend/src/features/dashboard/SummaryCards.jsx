import { Calendar, Clock, CheckCircle2, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatTime, getNextScheduledDay } from '../../utils/dateTime.js';

export function SummaryCards({
  todayClasses = [],
  remainingClasses = [],
  inProgressClass = null,
  nextUpcomingClass = null,
  week = [],
  currentDayOfWeek = 1,
}) {
  const totalClasses = todayClasses.length;
  const remainingCount = remainingClasses.length;
  const nextDay = getNextScheduledDay(week, currentDayOfWeek);

  return (
    <section aria-labelledby="summary-cards-heading">
      <h2 id="summary-cards-heading" className="sr-only">
        Daily Schedule Summary
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Classes Count */}
        <Card className="hover:border-[#CDC8BF] transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Today&apos;s Classes
              </span>
              <Badge variant={totalClasses > 0 ? 'primary' : 'neutral'} size="sm">
                {totalClasses > 0 ? 'Scheduled' : 'Free day'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {totalClasses}
              </div>
              <p className="text-xs text-foreground-muted">
                {totalClasses === 1
                  ? '1 session scheduled'
                  : totalClasses > 1
                  ? `${totalClasses} sessions scheduled`
                  : 'No classes on schedule'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Classes Remaining Today */}
        <Card className="hover:border-[#CDC8BF] transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                Classes Remaining
              </span>
              <Badge
                variant={
                  totalClasses > 0 && remainingCount === 0
                    ? 'success'
                    : inProgressClass
                    ? 'warning'
                    : 'neutral'
                }
                size="sm"
              >
                {totalClasses > 0 && remainingCount === 0
                  ? 'Completed'
                  : inProgressClass
                  ? 'Active now'
                  : 'Pending'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {remainingCount}
              </div>
              <p className="text-xs text-foreground-muted">
                {inProgressClass
                  ? `${remainingCount} remaining (1 in progress)`
                  : remainingCount > 0
                  ? `${remainingCount} session${remainingCount === 1 ? '' : 's'} left today`
                  : totalClasses > 0
                  ? 'All classes completed for today'
                  : 'No classes scheduled today'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Next Class */}
        <Card className="hover:border-[#CDC8BF] transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Next Class
              </span>
              <Badge
                variant={inProgressClass ? 'warning' : nextUpcomingClass ? 'primary' : 'neutral'}
                size="sm"
              >
                {inProgressClass ? 'In Progress' : nextUpcomingClass ? 'Up Next' : 'Done'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate" title={inProgressClass?.subject || nextUpcomingClass?.subject || 'None remaining'}>
                {inProgressClass?.subject || nextUpcomingClass?.subject || 'None remaining'}
              </div>
              <p className="text-xs text-foreground-muted truncate">
                {inProgressClass
                  ? `Until ${formatTime(inProgressClass.endTime)}${inProgressClass.room ? ` • ${inProgressClass.room}` : ''}`
                  : nextUpcomingClass
                  ? `Starts ${formatTime(nextUpcomingClass.startTime)}${nextUpcomingClass.room ? ` • ${nextUpcomingClass.room}` : ''}`
                  : 'No more classes today'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Next Scheduled Class Day */}
        <Card className="hover:border-[#CDC8BF] transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                Next Class Day
              </span>
              <Badge variant={nextDay?.isTomorrow ? 'primary' : 'neutral'} size="sm">
                {nextDay?.isTomorrow ? 'Tomorrow' : nextDay ? 'Scheduled' : 'None'}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {nextDay ? (nextDay.isTomorrow ? 'Tomorrow' : nextDay.weekday) : 'None scheduled'}
              </div>
              <p className="text-xs text-foreground-muted">
                {nextDay
                  ? `${nextDay.count} session${nextDay.count === 1 ? '' : 's'} on ${nextDay.weekday}`
                  : 'No classes in weekly schedule'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default SummaryCards;
