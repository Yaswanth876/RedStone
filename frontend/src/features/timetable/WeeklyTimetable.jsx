import { useMemo } from 'react';
import { ClassCard } from './ClassCard.jsx';
import {
  WEEKDAY_NAMES,
  getCurrentTimeInTimezone,
  getCurrentDayOfWeek,
  isClassInProgress,
  DEFAULT_TIMEZONE,
} from '../../utils/dateTime.js';

/**
 * WeeklyTimetable — desktop weekly grid view with day columns.
 *
 * Shows days 1–7 (Mon–Sun) as columns. Time labels on the left axis.
 * Each day column contains sorted ClassCards. The current day is highlighted.
 *
 * @param {object} props
 * @param {Map<number, Array>} props.entriesByDay - Day number → sorted entries
 * @param {function} props.onEdit - Called with entry for editing
 * @param {function} props.onDelete - Called with entry for deletion
 */
export function WeeklyTimetable({ entriesByDay, onEdit, onDelete }) {
  const currentDay = useMemo(() => getCurrentDayOfWeek(DEFAULT_TIMEZONE), []);
  const currentTime = useMemo(() => getCurrentTimeInTimezone(DEFAULT_TIMEZONE), []);

  // Calculate time bounds for the grid
  const { startHour, endHour } = useMemo(() => {
    let minHour = 24;
    let maxHour = 0;
    for (const [, entries] of entriesByDay) {
      for (const entry of entries) {
        const sh = parseInt(entry.startTime?.split(':')[0], 10);
        const eh = parseInt(entry.endTime?.split(':')[0], 10);
        const em = parseInt(entry.endTime?.split(':')[1], 10);
        if (!isNaN(sh)) minHour = Math.min(minHour, sh);
        if (!isNaN(eh)) maxHour = Math.max(maxHour, em > 0 ? eh + 1 : eh);
      }
    }
    // Defaults if no entries
    if (minHour >= maxHour) {
      return { startHour: 8, endHour: 18 };
    }
    return { startHour: Math.max(0, minHour), endHour: Math.min(24, maxHour) };
  }, [entriesByDay]);

  const hours = [];
  for (let h = startHour; h < endHour; h++) {
    hours.push(h);
  }

  const totalMinutes = (endHour - startHour) * 60;

  const getTopPercent = (timeStr) => {
    const [hh, mm] = timeStr.split(':').map(Number);
    const minutesSinceStart = (hh - startHour) * 60 + mm;
    return (minutesSinceStart / totalMinutes) * 100;
  };

  const getHeightPercent = (startStr, endStr) => {
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
    return (durationMinutes / totalMinutes) * 100;
  };

  const formatHour = (h) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH} ${ampm}`;
  };

  return (
    <div className="hidden md:block overflow-x-auto">
      <div className="min-w-[680px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-2" />
          {WEEKDAY_NAMES.map((name, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === currentDay;
            const dayEntries = entriesByDay.get(dayNum) || [];
            return (
              <div
                key={dayNum}
                className={`p-2 text-center border-l border-border ${
                  isToday ? 'bg-primary-soft/30' : ''
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    isToday ? 'text-primary' : 'text-foreground-muted'
                  }`}
                >
                  {name.slice(0, 3)}
                </span>
                {dayEntries.length > 0 && (
                  <span className={`ml-1.5 text-[10px] font-medium ${
                    isToday ? 'text-primary/70' : 'text-foreground-muted/60'
                  }`}>
                    {dayEntries.length}
                  </span>
                )}
                {isToday && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div
          className="grid grid-cols-[60px_repeat(7,1fr)] relative"
          style={{ minHeight: `${hours.length * 64}px` }}
        >
          {/* Hour labels */}
          <div className="relative">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 text-right pr-2 text-[10px] text-foreground-muted font-medium -translate-y-1/2"
                style={{ top: `${((h - startHour) / (endHour - startHour)) * 100}%` }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {WEEKDAY_NAMES.map((name, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === currentDay;
            const dayEntries = entriesByDay.get(dayNum) || [];

            return (
              <div
                key={dayNum}
                className={`relative border-l border-border ${
                  isToday ? 'bg-primary-soft/10' : ''
                }`}
              >
                {/* Hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: `${((h - startHour) / (endHour - startHour)) * 100}%` }}
                  />
                ))}

                {/* Class entries */}
                {dayEntries.length === 0 && isToday && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] text-foreground-muted/50 font-medium">
                      Free day
                    </span>
                  </div>
                )}

                {dayEntries.map((entry) => {
                  const top = getTopPercent(entry.startTime);
                  const height = getHeightPercent(entry.startTime, entry.endTime);
                  const inProgress = isToday && isClassInProgress(entry.startTime, entry.endTime, currentTime);

                  return (
                    <div
                      key={entry.id}
                      className="absolute left-0.5 right-0.5 z-10"
                      style={{ top: `${top}%`, height: `${Math.max(height, 3)}%` }}
                    >
                      <ClassCard
                        entry={entry}
                        isInProgress={inProgress}
                        isCompact
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WeeklyTimetable;
