import { Link } from 'react-router-dom';
import { Clock, MapPin, User, ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatTime } from '../../utils/dateTime.js';

export function NextClassCard({
  inProgressClass = null,
  nextUpcomingClass = null,
  nextDay = null,
  totalClassesToday = 0,
}) {
  const activeClass = inProgressClass || nextUpcomingClass;
  const isInProgress = Boolean(inProgressClass);

  // Case 1: An active class exists (either in progress or coming up next today)
  if (activeClass) {
    const formattedStartTime = formatTime(activeClass.startTime);
    const formattedEndTime = formatTime(activeClass.endTime);

    return (
      <Card
        className={`shadow-subtle transition-colors ${
          isInProgress
            ? 'border-[#C9E7D6] bg-gradient-to-r from-surface to-[#F2FAF5]'
            : 'border-primary/20 bg-gradient-to-r from-surface to-primary-soft/20'
        }`}
      >
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={isInProgress ? 'success' : 'primary'}
                dot
                size="md"
              >
                {isInProgress ? 'Happening Now' : 'Up Next Today'}
              </Badge>
              {typeof activeClass.minutesUntilStart === 'number' &&
                activeClass.minutesUntilStart > 0 &&
                !isInProgress && (
                  <span className="text-xs font-medium text-foreground-muted">
                    Starts in ~{activeClass.minutesUntilStart} min
                  </span>
                )}
            </div>
            <span
              className={`text-xs font-semibold flex items-center gap-1 ${
                isInProgress ? 'text-success' : 'text-primary'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {isInProgress ? 'Class in progress' : 'Next scheduled class'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {activeClass.subject}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted">
              {isInProgress ? 'Current session' : 'Upcoming session'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Time Slot */}
            <div className="flex items-center gap-2.5 p-3 rounded-control bg-surface border border-border">
              <Clock className={`w-4 h-4 shrink-0 ${isInProgress ? 'text-success' : 'text-primary'}`} />
              <div className="min-w-0">
                <p className="text-[11px] text-foreground-muted font-medium">Time</p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {formattedStartTime} – {formattedEndTime}
                </p>
              </div>
            </div>

            {/* Room / Location */}
            <div className="flex items-center gap-2.5 p-3 rounded-control bg-surface border border-border">
              <MapPin className={`w-4 h-4 shrink-0 ${isInProgress ? 'text-success' : 'text-primary'}`} />
              <div className="min-w-0">
                <p className="text-[11px] text-foreground-muted font-medium">Classroom</p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {activeClass.room || 'Room not assigned'}
                </p>
              </div>
            </div>

            {/* Faculty / Instructor */}
            <div className="flex items-center gap-2.5 p-3 rounded-control bg-surface border border-border">
              <User className={`w-4 h-4 shrink-0 ${isInProgress ? 'text-success' : 'text-primary'}`} />
              <div className="min-w-0">
                <p className="text-[11px] text-foreground-muted font-medium">Faculty</p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {activeClass.faculty || 'Faculty not assigned'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-surface/80 border-t border-border/60 justify-between flex-wrap gap-2">
          <span className="metadata-text">
            {isInProgress
              ? `Session scheduled until ${formattedEndTime}`
              : `Scheduled to begin at ${formattedStartTime}`}
          </span>
          <Link to="/timetable">
            <Button size="sm" variant="outline" rightIcon={ArrowRight}>
              View in Timetable
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Case 2: No more classes today
  const firstFutureClass = nextDay?.classes?.[0] || null;

  return (
    <Card className="border-border bg-surface">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="neutral" size="md">
            Schedule Complete
          </Badge>
          <span className="text-xs text-foreground-muted flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            {totalClassesToday > 0 ? 'All classes done today' : 'No classes today'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-3">
        <h3 className="text-lg sm:text-xl font-bold text-foreground">
          {totalClassesToday > 0
            ? "You're all done for today!"
            : 'No lectures scheduled for today'}
        </h3>
        <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
          {totalClassesToday > 0
            ? 'All your scheduled classes for today have concluded. You can review upcoming coursework or prepare for your next sessions.'
            : 'You have no scheduled classes on your routine for today. Enjoy your study time or check the weekly schedule.'}
        </p>

        {firstFutureClass && nextDay && (
          <div className="p-3.5 rounded-control bg-[#FAF9F6] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  Next scheduled class:{' '}
                  <span className="text-primary">{firstFutureClass.subject}</span>
                </p>
                <p className="text-[11px] text-foreground-muted">
                  {nextDay.isTomorrow ? 'Tomorrow' : nextDay.weekday} at{' '}
                  {formatTime(firstFutureClass.startTime)}
                  {firstFutureClass.room ? ` • ${firstFutureClass.room}` : ''}
                </p>
              </div>
            </div>
            <Link to="/timetable" className="shrink-0">
              <Button size="sm" variant="outline" rightIcon={ArrowRight}>
                View Week
              </Button>
            </Link>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-[#FAF9F6] justify-between flex-wrap gap-2 border-t border-border/60">
        <span className="metadata-text">
          Want to update your routine?
        </span>
        <Link to="/timetable">
          <Button size="sm" variant="secondary" rightIcon={ArrowRight}>
            Open Weekly Timetable
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default NextClassCard;
