import { Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WEEKDAY_NAMES } from '../../utils/dateTime.js';

/**
 * ReviewEntryRow — accessible desktop table row for inspecting and editing a candidate class.
 *
 * @param {object} props
 * @param {object} props.entry - The candidate row object
 * @param {object} props.status - Validation status object { isValid, errors, warnings, hasConflict, isDuplicate }
 * @param {function} props.onChange - (field, value) => void
 * @param {function} props.onRemove - () => void
 * @param {boolean} [props.disabled=false]
 */
export function ReviewEntryRow({
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
    <tr
      className={`border-b transition-colors ${
        hasErrors
          ? 'bg-[#FEE4E2]/20 border-[#FECDCA]/70'
          : status.hasConflict
          ? 'bg-[#FEF6E7]/30 border-[#F9E2B6]'
          : 'border-border/60 hover:bg-[#FAF9F6]'
      }`}
    >
      {/* 1. Day of Week */}
      <td className="py-2.5 px-3 align-top w-36">
        <select
          value={entry.dayOfWeek || 1}
          disabled={disabled}
          onChange={(e) => onChange('dayOfWeek', Number(e.target.value))}
          className={`w-full py-1.5 px-2 text-xs rounded-control bg-surface border focus:outline-none focus:ring-1 ${
            errors.dayOfWeek
              ? 'border-error focus:ring-error text-error'
              : 'border-border focus:border-primary focus:ring-primary text-foreground'
          }`}
          aria-label="Day of week"
        >
          {WEEKDAY_NAMES.map((name, i) => (
            <option key={i + 1} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        {errors.dayOfWeek && (
          <p className="text-[10px] text-error mt-1">{errors.dayOfWeek}</p>
        )}
      </td>

      {/* 2. Subject Name */}
      <td className="py-2.5 px-3 align-top min-w-[180px]">
        <input
          type="text"
          value={entry.subject || ''}
          placeholder="e.g. Data Structures"
          disabled={disabled}
          onChange={(e) => onChange('subject', e.target.value)}
          className={`w-full py-1.5 px-2.5 text-xs rounded-control bg-surface border focus:outline-none focus:ring-1 ${
            errors.subject
              ? 'border-error focus:ring-error text-error'
              : 'border-border focus:border-primary focus:ring-primary text-foreground font-medium'
          }`}
          aria-label="Subject name"
        />
        {errors.subject && (
          <p className="text-[10px] text-error mt-1">{errors.subject}</p>
        )}
        {warnings.length > 0 && !errors.subject && (
          <p className="text-[10px] text-warning mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{warnings[0]}</span>
          </p>
        )}
      </td>

      {/* 3. Start Time */}
      <td className="py-2.5 px-2 align-top w-28">
        <input
          type="time"
          value={entry.startTime || '09:00'}
          disabled={disabled}
          onChange={(e) => onChange('startTime', e.target.value)}
          className={`w-full py-1.5 px-2 text-xs rounded-control bg-surface border focus:outline-none focus:ring-1 ${
            errors.startTime
              ? 'border-error focus:ring-error text-error'
              : 'border-border focus:border-primary focus:ring-primary text-foreground'
          }`}
          aria-label="Start time"
        />
        {errors.startTime && (
          <p className="text-[10px] text-error mt-1">{errors.startTime}</p>
        )}
      </td>

      {/* 4. End Time */}
      <td className="py-2.5 px-2 align-top w-28">
        <input
          type="time"
          value={entry.endTime || '10:00'}
          disabled={disabled}
          onChange={(e) => onChange('endTime', e.target.value)}
          className={`w-full py-1.5 px-2 text-xs rounded-control bg-surface border focus:outline-none focus:ring-1 ${
            errors.endTime
              ? 'border-error focus:ring-error text-error'
              : 'border-border focus:border-primary focus:ring-primary text-foreground'
          }`}
          aria-label="End time"
        />
        {errors.endTime && (
          <p className="text-[10px] text-error mt-1">{errors.endTime}</p>
        )}
      </td>

      {/* 5. Room */}
      <td className="py-2.5 px-2 align-top w-32">
        <input
          type="text"
          value={entry.room || ''}
          placeholder="Room / Hall"
          disabled={disabled}
          onChange={(e) => onChange('room', e.target.value)}
          className={`w-full py-1.5 px-2 text-xs rounded-control bg-surface border focus:outline-none focus:ring-1 ${
            errors.room
              ? 'border-error focus:ring-error text-error'
              : 'border-border focus:border-primary focus:ring-primary text-foreground'
          }`}
          aria-label="Room or classroom"
        />
        {errors.room && (
          <p className="text-[10px] text-error mt-1">{errors.room}</p>
        )}
      </td>

      {/* 6. Faculty */}
      <td className="py-2.5 px-2 align-top w-36">
        <input
          type="text"
          value={entry.faculty || ''}
          placeholder="Instructor"
          disabled={disabled}
          onChange={(e) => onChange('faculty', e.target.value)}
          className={`w-full py-1.5 px-2 text-xs rounded-control bg-surface border focus:outline-none focus:ring-1 ${
            errors.faculty
              ? 'border-error focus:ring-error text-error'
              : 'border-border focus:border-primary focus:ring-primary text-foreground'
          }`}
          aria-label="Faculty or instructor"
        />
        {errors.faculty && (
          <p className="text-[10px] text-error mt-1">{errors.faculty}</p>
        )}
      </td>

      {/* 7. Status & Actions */}
      <td className="py-2.5 px-3 align-top text-right w-24">
        <div className="flex items-center justify-end gap-2 pt-1">
          {hasErrors ? (
            <span title="Needs correction" className="text-error">
              <AlertCircle className="w-4 h-4" />
            </span>
          ) : status.hasConflict ? (
            <span title="Time overlap conflict" className="text-warning">
              <AlertTriangle className="w-4 h-4" />
            </span>
          ) : (
            <span title="Valid entry" className="text-[#1E7B34]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="p-1.5 rounded-control text-foreground-muted hover:text-error hover:bg-[#FEE4E2]/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-error"
            title="Remove class"
            aria-label={`Remove ${entry.subject || 'entry'}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default ReviewEntryRow;
