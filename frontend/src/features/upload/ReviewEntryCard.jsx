import { Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { WEEKDAY_NAMES } from '../../utils/dateTime.js';

/**
 * ReviewEntryCard — responsive mobile card layout for editing a candidate class.
 *
 * @param {object} props
 * @param {object} props.entry
 * @param {object} props.status
 * @param {function} props.onChange
 * @param {function} props.onRemove
 * @param {boolean} [props.disabled=false]
 */
export function ReviewEntryCard({
  entry,
  status = { isValid: true, errors: {}, warnings: [] },
  onChange,
  onRemove,
  disabled = false,
}) {
  const errors = status.errors || {};
  const warnings = status.warnings || [];
  const hasErrors = !status.isValid;

  return (
    <div
      className={`p-4 rounded-card border space-y-3 transition-colors ${
        hasErrors
          ? 'bg-[#FEE4E2]/20 border-[#FECDCA]'
          : status.hasConflict
          ? 'bg-[#FEF6E7]/30 border-[#F9E2B6]'
          : 'bg-surface border-border'
      }`}
    >
      {/* Top Header: Status and Delete */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <Badge variant="error" size="sm">
              <AlertCircle className="w-3 h-3 mr-1" />
              Needs Correction
            </Badge>
          ) : status.hasConflict ? (
            <Badge variant="warning" size="sm">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Time Overlap
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="p-1 rounded text-foreground-muted hover:text-error hover:bg-[#FEE4E2]/50 transition-colors"
          title="Remove class"
          aria-label={`Remove ${entry.subject || 'entry'}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Field: Subject */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-foreground-muted block">
          Subject Name *
        </label>
        <input
          type="text"
          value={entry.subject || ''}
          placeholder="e.g. Algorithms"
          disabled={disabled}
          onChange={(e) => onChange('subject', e.target.value)}
          className={`w-full py-1.5 px-3 text-xs rounded-control bg-surface border focus:outline-none focus:ring-1 ${
            errors.subject
              ? 'border-error focus:ring-error text-error'
              : 'border-border focus:border-primary focus:ring-primary text-foreground font-medium'
          }`}
        />
        {errors.subject && (
          <p className="text-[10px] text-error">{errors.subject}</p>
        )}
      </div>

      {/* Grid: Day & Times */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-muted block">
            Day of Week *
          </label>
          <select
            value={entry.dayOfWeek || 1}
            disabled={disabled}
            onChange={(e) => onChange('dayOfWeek', Number(e.target.value))}
            className="w-full py-1.5 px-2 text-xs rounded-control bg-surface border border-border focus:border-primary focus:ring-primary text-foreground"
          >
            {WEEKDAY_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          {errors.dayOfWeek && (
            <p className="text-[10px] text-error">{errors.dayOfWeek}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-muted block">
            Start Time *
          </label>
          <input
            type="time"
            value={entry.startTime || '09:00'}
            disabled={disabled}
            onChange={(e) => onChange('startTime', e.target.value)}
            className={`w-full py-1.5 px-2 text-xs rounded-control bg-surface border focus:outline-none ${
              errors.startTime ? 'border-error text-error' : 'border-border'
            }`}
          />
          {errors.startTime && (
            <p className="text-[10px] text-error">{errors.startTime}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-muted block">
            End Time *
          </label>
          <input
            type="time"
            value={entry.endTime || '10:00'}
            disabled={disabled}
            onChange={(e) => onChange('endTime', e.target.value)}
            className={`w-full py-1.5 px-2 text-xs rounded-control bg-surface border focus:outline-none ${
              errors.endTime ? 'border-error text-error' : 'border-border'
            }`}
          />
          {errors.endTime && (
            <p className="text-[10px] text-error">{errors.endTime}</p>
          )}
        </div>
      </div>

      {/* Grid: Room & Faculty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-muted block">
            Room (Optional)
          </label>
          <input
            type="text"
            value={entry.room || ''}
            placeholder="Room 101"
            disabled={disabled}
            onChange={(e) => onChange('room', e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-control bg-surface border border-border focus:border-primary text-foreground"
          />
          {errors.room && <p className="text-[10px] text-error">{errors.room}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground-muted block">
            Faculty (Optional)
          </label>
          <input
            type="text"
            value={entry.faculty || ''}
            placeholder="Instructor Name"
            disabled={disabled}
            onChange={(e) => onChange('faculty', e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-control bg-surface border border-border focus:border-primary text-foreground"
          />
          {errors.faculty && (
            <p className="text-[10px] text-error">{errors.faculty}</p>
          )}
        </div>
      </div>

      {/* Warnings List */}
      {warnings.length > 0 && (
        <div className="pt-1 text-[11px] text-warning flex items-start gap-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{warnings[0]}</span>
        </div>
      )}
    </div>
  );
}

export default ReviewEntryCard;
