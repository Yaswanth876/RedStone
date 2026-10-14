import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { WEEKDAY_NAMES, formatTime } from '../../utils/dateTime.js';

/**
 * ExtractionSummary — displays parsed candidate timetable entries, warnings, and handoff actions.
 *
 * @param {object} props
 * @param {Array} props.entries - Extracted candidate entries
 * @param {Array} props.warnings - Backend extraction warnings
 * @param {string} props.filename - Name of processed document
 * @param {function} props.onReview - Triggers handoff to Module 5 review workflow
 * @param {function} props.onReset - Triggers uploading another file
 */
export function ExtractionSummary({
  entries = [],
  warnings = [],
  filename,
  onReview,
  onReset,
}) {
  const count = entries.length;
  const warningsCount = warnings.length;
  const isPartial = count > 0 && warningsCount > 0;
  const isEmpty = count === 0;

  // Case 1: Zero recognizable classes extracted
  if (isEmpty) {
    return (
      <div
        role="region"
        aria-label="Extraction results"
        className="p-6 sm:p-8 rounded-card border border-[#F9E2B6] bg-[#FEF6E7]/50 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FEF6E7] text-warning flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-foreground">
              No Classes Recognized from &quot;{filename}&quot;
            </h4>
            <p className="text-xs sm:text-sm text-foreground-muted">
              We parsed the file, but could not detect structured weekly routine columns (e.g. Subject, Day of Week, Start Time, and End Time).
            </p>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="p-3.5 rounded-control bg-surface border border-[#F9E2B6] space-y-2">
            <p className="text-xs font-semibold text-warning">Parser Observations:</p>
            <ul className="text-xs text-foreground-muted space-y-1 list-disc list-inside">
              {warnings.map((w, idx) => (
                <li key={idx}>{typeof w === 'string' ? w : w.message || JSON.stringify(w)}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onReset}
            leftIcon={RefreshCw}
          >
            Try Another Document
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => {
              window.location.href = '/timetable';
            }}
            leftIcon={Calendar}
          >
            Enter Classes Manually
          </Button>
        </div>
      </div>
    );
  }

  // Case 2: Classes extracted (either clean or with warnings)
  return (
    <div
      role="region"
      aria-label="Extraction results"
      className="space-y-6"
    >
      {/* Overview Banner */}
      <div
        className={`p-5 sm:p-6 rounded-card border space-y-4 ${
          isPartial
            ? 'bg-[#FEF6E7]/40 border-[#F9E2B6]'
            : 'bg-[#EBF7EE]/40 border-[#CDEED5]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isPartial
                  ? 'bg-[#FEF6E7] text-warning'
                  : 'bg-[#EBF7EE] text-success'
              }`}
            >
              {isPartial ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            <div>
              <h4 className="text-base font-semibold text-foreground">
                {count} {count === 1 ? 'Class' : 'Classes'} Extracted
              </h4>
              <p className="text-xs text-foreground-muted">
                From {filename}. Candidates are ready for your verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isPartial ? 'warning' : 'success'} size="md">
              {isPartial ? `${warningsCount} Warnings` : 'Clean Extraction'}
            </Badge>
          </div>
        </div>

        {/* Security / Non-permanent note */}
        <div className="flex items-center gap-2 text-[11px] text-foreground-muted pt-2 border-t border-border/60">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            These classes are candidates in staging. They will <strong>not</strong> be added to your permanent timetable until you confirm them in the review step.
          </span>
        </div>
      </div>

      {/* Warnings List (if any) */}
      {warningsCount > 0 && (
        <div className="p-4 rounded-control bg-[#FEF6E7] border border-[#F9E2B6] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span>Extraction Warnings ({warningsCount})</span>
          </div>
          <ul className="text-xs text-foreground-muted space-y-1 list-disc list-inside">
            {warnings.map((w, idx) => (
              <li key={idx}>
                {typeof w === 'string'
                  ? w
                  : `${w.row ? `Row ${w.row}: ` : ''}${w.message}${
                      w.details ? ` (${w.details.map((d) => d.message || d.path?.join('.')).join(', ')})` : ''
                    }`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Candidates Preview Table */}
      <div className="rounded-card border border-border bg-surface overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-border bg-[#FAF9F6] flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Candidate Classes Preview
          </h5>
          <span className="text-xs text-foreground-muted font-medium">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-[#FAF9F6]/50 text-foreground-muted font-medium">
              <tr>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Room</th>
                <th className="py-2.5 px-3">Faculty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground">
              {entries.map((entry, idx) => {
                const dayName = WEEKDAY_NAMES[(entry.dayOfWeek || 1) - 1] || `Day ${entry.dayOfWeek}`;
                const timeStr = `${formatTime(entry.startTime)} – ${formatTime(entry.endTime)}`;

                return (
                  <tr key={idx} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {entry.subject || <span className="text-error italic">Missing</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#EAE6DE] text-foreground font-medium text-[11px]">
                        {dayName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-foreground-muted whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{timeStr}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-foreground-muted">
                      {entry.room ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{entry.room}</span>
                        </div>
                      ) : (
                        <span className="text-foreground-muted/60">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-foreground-muted">
                      {entry.faculty ? (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 shrink-0" />
                          <span>{entry.faculty}</span>
                        </div>
                      ) : (
                        <span className="text-foreground-muted/60">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Primary Next Action: Handoff to Module 5 */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onReset}
          leftIcon={RefreshCw}
        >
          Upload Different File
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onReview}
          rightIcon={ArrowRight}
        >
          Review Timetable ({count})
        </Button>
      </div>
    </div>
  );
}

export default ExtractionSummary;
