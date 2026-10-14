import { useMemo } from 'react';
import { CalendarX } from 'lucide-react';
import { ClassCard } from './ClassCard.jsx';
import {
  WEEKDAY_NAMES,
  getCurrentTimeInTimezone,
  getCurrentDayOfWeek,
  isClassInProgress,
  DEFAULT_TIMEZONE,
} from '../../utils/dateTime.js';

/**
 * DayAgenda — single-day view showing classes in a list.
 * Used as the default mobile view and as the day-selector view.
 *
 * @param {object} props
 * @param {number} props.selectedDay - dayOfWeek 1–7
 * @param {Map<number, Array>} props.entriesByDay
 * @param {function} props.onEdit
 * @param {function} props.onDelete
 */
export function DayAgenda({ selectedDay, entriesByDay, onEdit, onDelete }) {
  const currentDay = useMemo(() => getCurrentDayOfWeek(DEFAULT_TIMEZONE), []);
  const currentTime = useMemo(() => getCurrentTimeInTimezone(DEFAULT_TIMEZONE), []);

  const entries = entriesByDay.get(selectedDay) || [];
  const dayName = WEEKDAY_NAMES[(selectedDay || 1) - 1] || '';
  const isToday = selectedDay === currentDay;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-card bg-surface border border-dashed border-border">
        <div className="w-12 h-12 rounded-full bg-[#F0EDE8] flex items-center justify-center mb-3">
          <CalendarX className="w-6 h-6 text-foreground-muted" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No Classes on {dayName}
        </h3>
        <p className="text-xs text-foreground-muted max-w-sm">
          {isToday
            ? "You have a free day today! Enjoy your break or use the time to study."
            : `There are no classes scheduled for ${dayName}. Use the "Add Class" button to schedule one.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const inProgress = isToday && isClassInProgress(entry.startTime, entry.endTime, currentTime);
        return (
          <ClassCard
            key={entry.id}
            entry={entry}
            isInProgress={inProgress}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}

export default DayAgenda;
