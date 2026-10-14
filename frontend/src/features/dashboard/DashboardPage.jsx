import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  UploadCloud,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../auth/useAuth.js';
import { useDashboard } from './useDashboard.js';
import { DashboardSkeleton } from './DashboardSkeleton.jsx';
import { SummaryCards } from './SummaryCards.jsx';
import { NextClassCard } from './NextClassCard.jsx';
import { TodaySchedule } from './TodaySchedule.jsx';
import { WeeklyPreview } from './WeeklyPreview.jsx';
import {
  formatDate,
  getCurrentTimeInTimezone,
  getCurrentDayOfWeek,
  getGreeting,
  isClassInProgress,
  getRemainingClasses,
  getNextScheduledDay,
  DEFAULT_TIMEZONE,
} from '../../utils/dateTime.js';

export function DashboardPage() {
  useDocumentTitle('Dashboard');

  const { user } = useAuth();
  const timezone = DEFAULT_TIMEZONE;
  const { data, isLoading, isError, error, refetch } = useDashboard({ timezone });

  // Compute local context in target timezone
  const currentTime = useMemo(() => getCurrentTimeInTimezone(timezone), [timezone]);
  const currentDayOfWeek = useMemo(() => getCurrentDayOfWeek(timezone), [timezone]);

  // Formatted date and personalized academic greeting
  const { greeting, formattedDate } = useMemo(() => {
    const timeGreeting = getGreeting(timezone);
    const firstName = user?.name?.trim() ? user.name.trim().split(' ')[0] : null;
    const title = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
    const dateStr = formatDate(new Date(), undefined, timezone);

    return {
      greeting: title,
      formattedDate: dateStr,
    };
  }, [user?.name, timezone]);

  // Derive schedule states from real backend data
  const {
    hasTimetable,
    isScheduleEmpty,
    todayClasses,
    remainingClasses,
    inProgressClass,
    nextUpcomingClass,
    nextDay,
  } = useMemo(() => {
    if (!data) {
      return {
        hasTimetable: false,
        isScheduleEmpty: true,
        todayClasses: [],
        remainingClasses: [],
        inProgressClass: null,
        nextUpcomingClass: null,
        nextDay: null,
      };
    }

    const classes = data.today?.classes || [];
    const remaining = getRemainingClasses(classes, currentTime);
    const inProgress = classes.find((c) => isClassInProgress(c.startTime, c.endTime, currentTime)) || null;

    // Use backend nextClass if available, or find first upcoming class starting after currentTime
    const upNext =
      data.nextClass ||
      classes.find((c) => c.startTime > currentTime && c.id !== inProgress?.id) ||
      null;

    const nextScheduledDay = getNextScheduledDay(data.week || [], currentDayOfWeek);

    return {
      hasTimetable: Boolean(data.hasTimetable),
      isScheduleEmpty: Boolean(data.isEmpty),
      todayClasses: classes,
      remainingClasses: remaining,
      inProgressClass: inProgress,
      nextUpcomingClass: upNext,
      nextDay: nextScheduledDay,
    };
  }, [data, currentTime, currentDayOfWeek]);

  // 1. Loading State
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 2. Full Error State (when no previous data loaded)
  if (isError && !data) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title={greeting}
          description={`Today is ${formattedDate}.`}
        />

        <div
          role="alert"
          className="p-6 sm:p-8 rounded-card border border-[#FECDCA] bg-[#FEE4E2]/40 text-center space-y-4 max-w-lg mx-auto"
        >
          <div className="w-12 h-12 rounded-full bg-[#FEE4E2] text-error mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Unable to load your schedule
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted">
              {error?.message || 'We encountered an issue connecting to the timetable server. Please check your connection and try again.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={refetch}
            leftIcon={RefreshCw}
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // 3. Render Dashboard Content
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title={greeting}
        description={`Today is ${formattedDate}. Here is your academic routine and schedule summary.`}
        badge={
          <Badge variant="primary" size="sm">
            Active Semester
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/import">
              <Button
                variant="outline"
                size="md"
                leftIcon={UploadCloud}
              >
                Import Timetable
              </Button>
            </Link>
            <Link to="/timetable">
              <Button
                variant="primary"
                size="md"
                leftIcon={Calendar}
              >
                View Timetable
              </Button>
            </Link>
          </div>
        }
      />

      {/* Partial / Non-fatal error banner if background refresh fails */}
      {isError && data && (
        <div
          role="alert"
          className="flex items-center justify-between p-3.5 rounded-control bg-[#FEF6E7] border border-[#F9E2B6] text-warning text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not refresh recent updates. Showing last loaded schedule.</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="underline font-semibold hover:text-[#7A5000] focus-visible:outline-none"
          >
            Retry
          </button>
        </div>
      )}

      {/* Case A: Empty Timetable State (user hasn't uploaded or created a timetable yet) */}
      {!hasTimetable || isScheduleEmpty ? (
        <div className="space-y-6">
          <EmptyState
            icon={UploadCloud}
            title="No Timetable Added Yet"
            description="You haven't uploaded or created a semester timetable. Import your course schedule document or build one to see your daily classes and routine here."
            action={
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link to="/import">
                  <Button variant="primary" size="md" leftIcon={UploadCloud}>
                    Import Timetable
                  </Button>
                </Link>
                <Link to="/timetable">
                  <Button variant="outline" size="md" leftIcon={Calendar}>
                    View Timetable
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        /* Case B: Populated Timetable */
        <>
          {/* Summary Metric Cards */}
          <SummaryCards
            todayClasses={todayClasses}
            remainingClasses={remainingClasses}
            inProgressClass={inProgressClass}
            nextUpcomingClass={nextUpcomingClass}
            week={data.week || []}
            currentDayOfWeek={currentDayOfWeek}
          />

          {/* Main Content Grid: Hero Next Class + Today's Schedule + Weekly Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Next Class Hero & Today's Detailed Schedule */}
            <div className="lg:col-span-2 space-y-6">
              <NextClassCard
                inProgressClass={inProgressClass}
                nextUpcomingClass={nextUpcomingClass}
                nextDay={nextDay}
                totalClassesToday={todayClasses.length}
              />

              <TodaySchedule
                todayClasses={todayClasses}
                currentTime={currentTime}
                nextUpcomingClassId={nextUpcomingClass?.id}
                formattedDate={formattedDate}
              />
            </div>

            {/* Right Column: Weekly Schedule Overview & Shortcuts */}
            <div className="space-y-6">
              <WeeklyPreview
                week={data.week || []}
                currentDayOfWeek={currentDayOfWeek}
              />

              {/* Quick Actions Shortcuts */}
              <Card className="bg-[#FAF9F6]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <Link
                    to="/import"
                    className="flex items-center justify-between p-2.5 rounded-control bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-primary" />
                      <span>Upload Timetable Document</span>
                    </div>
                    <span className="text-foreground-muted text-[11px]">→</span>
                  </Link>

                  <Link
                    to="/timetable"
                    className="flex items-center justify-between p-2.5 rounded-control bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>Manage Timetable Routine</span>
                    </div>
                    <span className="text-foreground-muted text-[11px]">→</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center justify-between p-2.5 rounded-control bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Preferences &amp; Profile</span>
                    </div>
                    <span className="text-foreground-muted text-[11px]">→</span>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
