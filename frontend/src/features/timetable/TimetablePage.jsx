import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  UploadCloud,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useTimetable } from './useTimetable.js';
import { WeeklyTimetable } from './WeeklyTimetable.jsx';
import { DayAgenda } from './DayAgenda.jsx';
import { ClassForm } from './ClassForm.jsx';
import { DeleteClassDialog } from './DeleteClassDialog.jsx';
import { TimetableSkeleton } from './TimetableSkeleton.jsx';
import {
  WEEKDAY_NAMES,
  getCurrentDayOfWeek,
  DEFAULT_TIMEZONE,
} from '../../utils/dateTime.js';

export function TimetablePage() {
  useDocumentTitle('My Timetable');

  // Timetable data hook
  const {
    timetableId,
    entries,
    entriesByDay,
    isLoading,
    isError,
    error,
    totalClasses,
    refetch,
    addEntry,
    editEntry,
    removeEntry,
  } = useTimetable();

  // Active view mode: 'week' | 'day'
  const [viewMode, setViewMode] = useState('week');

  // Selected day for day agenda (1 = Monday, 7 = Sunday)
  const currentDayOfWeek = useMemo(() => getCurrentDayOfWeek(DEFAULT_TIMEZONE), []);
  const [selectedDay, setSelectedDay] = useState(() => currentDayOfWeek || 1);

  // Modal dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);

  // Success / error toast notification state
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Handler: Open Add Form
  const handleOpenAdd = useCallback((day = null) => {
    setEditingEntry(null);
    if (day) {
      setSelectedDay(day);
    }
    setIsFormOpen(true);
  }, []);

  // Handler: Open Edit Form
  const handleEdit = useCallback((entry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  }, []);

  // Handler: Open Delete Dialog
  const handleDelete = useCallback((entry) => {
    setDeletingEntry(entry);
  }, []);

  // Handler: Form Submit (Create or Update)
  const handleFormSubmit = useCallback(
    async (formData) => {
      if (editingEntry) {
        await editEntry(editingEntry.id, formData);
        setFeedback({
          type: 'success',
          message: `Updated "${formData.subject}" successfully.`,
        });
      } else {
        await addEntry(formData);
        setFeedback({
          type: 'success',
          message: `Added "${formData.subject}" to your schedule.`,
        });
      }
    },
    [editingEntry, editEntry, addEntry]
  );

  // Handler: Confirm Delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingEntry) return;
    const subject = deletingEntry.subject;
    await removeEntry(deletingEntry.id);
    setFeedback({
      type: 'success',
      message: `Deleted "${subject}" from your timetable.`,
    });
  }, [deletingEntry, removeEntry]);

  // Metrics summary
  const { activeDaysCount, todayClassesCount } = useMemo(() => {
    let activeDays = 0;
    for (let d = 1; d <= 7; d++) {
      if ((entriesByDay.get(d) || []).length > 0) {
        activeDays++;
      }
    }
    const todayList = entriesByDay.get(currentDayOfWeek) || [];
    return {
      activeDaysCount: activeDays,
      todayClassesCount: todayList.length,
    };
  }, [entriesByDay, currentDayOfWeek]);

  // 1. Loading State
  if (isLoading) {
    return <TimetableSkeleton />;
  }

  // 2. Fatal Error State (when initial timetable load fails)
  if (isError && !timetableId && entries.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="My Timetable"
          description="Manage your weekly class timetable, course sections, and room assignments."
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
              Unable to load timetable
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted">
              {error?.message ||
                'We encountered an issue connecting to the timetable server. Please check your connection and try again.'}
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="My Timetable"
        description="Manage your weekly routine, lecture timings, classroom locations, and faculty."
        badge={
          <Badge variant={totalClasses > 0 ? 'primary' : 'neutral'} size="sm">
            {totalClasses > 0
              ? `${totalClasses} ${totalClasses === 1 ? 'Class' : 'Classes'}`
              : 'Empty Schedule'}
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
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => handleOpenAdd(selectedDay)}
            >
              Add Class
            </Button>
          </div>
        }
      />

      {/* Floating Feedback Notification */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between p-3.5 rounded-control text-xs font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-[#EBF7EE] border border-[#CDEED5] text-[#1E7B34]'
              : 'bg-[#FEE4E2] border border-[#FECDCA] text-error'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 font-semibold focus-visible:outline-none"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Non-fatal error banner */}
      {isError && totalClasses > 0 && (
        <div
          role="alert"
          className="flex items-center justify-between p-3.5 rounded-control bg-[#FEF6E7] border border-[#F9E2B6] text-warning text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not synchronize recent changes. Displaying cached schedule.</span>
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

      {/* Case A: Completely Empty Timetable */}
      {totalClasses === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Calendar}
              title="No Classes Scheduled Yet"
              description="Your weekly timetable is currently empty. Get started by manually adding your classes or uploading your institution's schedule document."
              action={
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={Plus}
                    onClick={() => handleOpenAdd(currentDayOfWeek)}
                  >
                    Add Your First Class
                  </Button>
                  <Link to="/import">
                    <Button variant="outline" size="md" leftIcon={UploadCloud}>
                      Import Document
                    </Button>
                  </Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        /* Case B: Populated Timetable */
        <>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground-muted">Total Classes</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{totalClasses}</p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">Across the full week</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground-muted">Active Days</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    {activeDaysCount} <span className="text-sm font-normal text-foreground-muted">/ 7</span>
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    {7 - activeDaysCount > 0 ? `${7 - activeDaysCount} free days` : 'Busy all week'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#EBF7EE] text-[#1E7B34] flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground-muted">Today&apos;s Classes</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    {todayClassesCount}
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    {todayClassesCount > 0
                      ? `${WEEKDAY_NAMES[currentDayOfWeek - 1]} routine`
                      : 'No classes scheduled today'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#FAF5E6] text-[#B58500] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timetable Container */}
          <Card>
            <CardHeader className="border-b border-border/70 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* View Switcher Tabs (Desktop) */}
                <div className="flex items-center p-1 rounded-control bg-[#F4F1EA] w-fit">
                  <button
                    type="button"
                    onClick={() => setViewMode('week')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-semibold transition-all ${
                      viewMode === 'week'
                        ? 'bg-surface text-foreground shadow-subtle'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Weekly Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('day')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-semibold transition-all ${
                      viewMode === 'day'
                        ? 'bg-surface text-foreground shadow-subtle'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Day Agenda</span>
                  </button>
                </div>

                {/* Day Navigation Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {WEEKDAY_NAMES.map((name, idx) => {
                    const dayNum = idx + 1;
                    const isSelected = selectedDay === dayNum;
                    const isToday = currentDayOfWeek === dayNum;
                    const count = (entriesByDay.get(dayNum) || []).length;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => {
                          setSelectedDay(dayNum);
                          if (viewMode !== 'day') {
                            // On mobile or when user clicks a day pill, switch to Day view
                            setViewMode('day');
                          }
                        }}
                        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                          isSelected && viewMode === 'day'
                            ? 'bg-primary text-white shadow-subtle'
                            : isToday
                            ? 'bg-primary-soft text-primary hover:bg-primary-soft/80'
                            : 'bg-surface border border-border text-foreground hover:bg-[#F7F5F0]'
                        }`}
                        title={`${name} (${count} classes)`}
                      >
                        <span>{name.slice(0, 3)}</span>
                        {count > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                              isSelected && viewMode === 'day'
                                ? 'bg-white/20 text-white'
                                : isToday
                                ? 'bg-primary/20 text-primary'
                                : 'bg-[#EAE6DE] text-foreground-muted'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {viewMode === 'week' ? (
                <>
                  {/* Desktop Weekly Grid */}
                  <WeeklyTimetable
                    entriesByDay={entriesByDay}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />

                  {/* Fallback for Mobile Screen in Week Mode (WeeklyTimetable has hidden md:block) */}
                  <div className="md:hidden space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-semibold text-foreground">
                          {WEEKDAY_NAMES[selectedDay - 1]} Schedule
                        </h3>
                        <p className="text-xs text-foreground-muted">
                          {(entriesByDay.get(selectedDay) || []).length} classes scheduled
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={Plus}
                        onClick={() => handleOpenAdd(selectedDay)}
                      >
                        Add Class
                      </Button>
                    </div>

                    <DayAgenda
                      selectedDay={selectedDay}
                      entriesByDay={entriesByDay}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                </>
              ) : (
                /* Day View */
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {WEEKDAY_NAMES[selectedDay - 1]}
                        </h3>
                        {selectedDay === currentDayOfWeek && (
                          <Badge variant="primary" size="sm">
                            Today
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {(entriesByDay.get(selectedDay) || []).length} classes scheduled
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={Plus}
                      onClick={() => handleOpenAdd(selectedDay)}
                    >
                      Add Class
                    </Button>
                  </div>

                  <DayAgenda
                    selectedDay={selectedDay}
                    entriesByDay={entriesByDay}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Class Create / Edit Modal */}
      <ClassForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        entry={editingEntry}
        initialDay={selectedDay}
      />

      {/* Delete Confirmation Modal */}
      <DeleteClassDialog
        isOpen={Boolean(deletingEntry)}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleConfirmDelete}
        entry={deletingEntry}
      />
    </div>
  );
}

export default TimetablePage;
