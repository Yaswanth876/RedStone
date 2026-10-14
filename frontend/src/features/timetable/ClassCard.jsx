import { Clock, MapPin, User, Pencil, Trash2, Zap } from 'lucide-react';
import { formatTime } from '../../utils/dateTime.js';

/**
 * ClassCard — displays a single timetable entry with actions.
 *
 * Visually distinguishes in-progress classes and shows metadata
 * (room, faculty) when available.
 *
 * @param {object} props
 * @param {object} props.entry - Timetable entry data
 * @param {boolean} [props.isInProgress] - Whether the class is currently in progress
 * @param {boolean} [props.isCompact] - Compact mode for weekly grid
 * @param {function} [props.onEdit] - Called with entry when Edit is clicked
 * @param {function} [props.onDelete] - Called with entry when Delete is clicked
 */
export function ClassCard({
  entry,
  isInProgress = false,
  isCompact = false,
  onEdit,
  onDelete,
}) {
  const formattedStart = formatTime(entry.startTime);
  const formattedEnd = formatTime(entry.endTime);

  return (
    <div
      className={`group relative rounded-control border transition-all duration-150 ${
        isInProgress
          ? 'border-primary/60 bg-primary-soft/50 ring-1 ring-primary/20'
          : 'border-border bg-surface hover:border-primary/30 hover:shadow-subtle'
      } ${isCompact ? 'p-2.5' : 'p-3.5 sm:p-4'}`}
      role="article"
      aria-label={`${entry.subject}, ${formattedStart} to ${formattedEnd}`}
    >
      {/* In-progress indicator */}
      {isInProgress && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
          <Zap className="w-3 h-3" />
          <span>Now</span>
        </div>
      )}

      {/* Subject name */}
      <h4
        className={`font-semibold text-foreground leading-snug ${
          isCompact ? 'text-xs' : 'text-sm'
        } ${isInProgress ? 'text-primary' : ''} pr-12 line-clamp-2`}
        title={entry.subject}
      >
        {entry.subject}
      </h4>

      {/* Time range */}
      <div
        className={`flex items-center gap-1.5 text-foreground-muted mt-1.5 ${
          isCompact ? 'text-[10px]' : 'text-xs'
        }`}
      >
        <Clock className={`shrink-0 ${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        <span>
          {formattedStart} – {formattedEnd}
        </span>
      </div>

      {/* Room and faculty (non-compact only, or when available) */}
      {!isCompact && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {entry.room && (
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[140px]" title={entry.room}>
                {entry.room}
              </span>
            </div>
          )}
          {entry.faculty && (
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[140px]" title={entry.faculty}>
                {entry.faculty}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Compact-mode room/faculty */}
      {isCompact && (entry.room || entry.faculty) && (
        <div className="mt-1 text-[10px] text-foreground-muted truncate">
          {entry.room && <span>{entry.room}</span>}
          {entry.room && entry.faculty && <span> · </span>}
          {entry.faculty && <span>{entry.faculty}</span>}
        </div>
      )}

      {/* Actions — visible on hover/focus */}
      {(onEdit || onDelete) && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-control text-foreground-muted hover:text-primary hover:bg-primary-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Edit ${entry.subject}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(entry)}
              className="p-1.5 rounded-control text-foreground-muted hover:text-error hover:bg-error-soft/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
              aria-label={`Delete ${entry.subject}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ClassCard;
