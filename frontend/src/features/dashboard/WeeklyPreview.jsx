import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatTime } from '../../utils/dateTime.js';

export function WeeklyPreview({ week = [], currentDayOfWeek = 1 }) {
  const activeDays = week.filter((day) => day.count > 0);
  const displayDays = week.length > 0 ? week : [];

  return (
    <Card className="shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>
            {activeDays.length > 0
              ? `${activeDays.length} active day${activeDays.length === 1 ? '' : 's'} scheduled`
              : 'Monday through Sunday routine'}
          </CardDescription>
        </div>
        <CalendarDays className="w-4 h-4 text-primary shrink-0" />
      </CardHeader>

      <CardContent className="space-y-3">
        {displayDays.length === 0 ? (
          <p className="text-xs text-foreground-muted py-4 text-center">
            No weekly data available.
          </p>
        ) : (
          displayDays.map((day) => {
            const isToday = day.dayOfWeek === currentDayOfWeek;
            const hasClasses = day.count > 0;

            return (
              <div
                key={day.dayOfWeek}
                className={`p-3 rounded-control border transition-all ${
                  isToday
                    ? 'border-primary bg-primary-soft/20 shadow-none'
                    : 'border-border bg-surface hover:bg-[#FAF9F6]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {day.weekday}
                    </span>
                    {isToday && (
                      <Badge variant="primary" size="sm" dot>
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-foreground-muted">
                    {day.count} {day.count === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {hasClasses ? (
                  <div className="space-y-1">
                    {day.classes.map((cls) => (
                      <div
                        key={cls.id || `${cls.subject}-${cls.startTime}`}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface border border-border/60"
                      >
                        <span className="font-medium text-foreground truncate max-w-[65%]" title={cls.subject}>
                          {cls.subject}
                        </span>
                        <span className="text-foreground-muted text-[11px] shrink-0 font-mono">
                          {formatTime(cls.startTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-foreground-muted italic py-0.5">
                    No classes scheduled
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/60 bg-[#FAF9F6]">
        <Link to="/timetable" className="w-full">
          <Button variant="outline" size="sm" className="w-full" rightIcon={ArrowRight}>
            Open Full Timetable View
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default WeeklyPreview;
