import { CheckCircle2, AlertCircle, AlertTriangle, Layers } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

/**
 * ReviewSummaryBar — dynamic metrics bar updating as users edit and remove rows.
 *
 * @param {object} props
 * @param {number} props.totalCount
 * @param {number} props.validCount
 * @param {number} props.invalidCount
 * @param {number} props.conflictCount
 * @param {number} props.duplicateCount
 * @param {boolean} props.hasBlockingErrors
 */
export function ReviewSummaryBar({
  totalCount,
  validCount,
  invalidCount,
  conflictCount,
  duplicateCount = 0,
  hasBlockingErrors,
}) {
  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-surface">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-foreground-muted">Total Candidates</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">{totalCount}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#FAF9F6] text-foreground-muted flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-foreground-muted">Valid &amp; Ready</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1E7B34] mt-0.5">{validCount}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#EBF7EE] text-[#1E7B34] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-foreground-muted">Need Correction</p>
              <p
                className={`text-xl sm:text-2xl font-bold mt-0.5 ${
                  invalidCount > 0 ? 'text-error' : 'text-foreground'
                }`}
              >
                {invalidCount}
              </p>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                invalidCount > 0
                  ? 'bg-[#FEE4E2] text-error'
                  : 'bg-[#FAF9F6] text-foreground-muted'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-foreground-muted">Conflicts / Duplicates</p>
              <p
                className={`text-xl sm:text-2xl font-bold mt-0.5 ${
                  conflictCount + duplicateCount > 0 ? 'text-warning' : 'text-foreground'
                }`}
              >
                {conflictCount + duplicateCount}
              </p>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                conflictCount > 0
                  ? 'bg-[#FEF6E7] text-warning'
                  : 'bg-[#FAF9F6] text-foreground-muted'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advisory Status Alert */}
      {hasBlockingErrors && (
        <div
          role="alert"
          className="p-3.5 rounded-control bg-[#FEF6E7] border border-[#F9E2B6] text-xs text-foreground flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning shrink-0" />
            <span>
              {invalidCount > 0
                ? `${invalidCount} row${invalidCount === 1 ? '' : 's'} contain invalid or missing fields.`
                : `${conflictCount} row${conflictCount === 1 ? '' : 's'} have overlapping class times on the same day.`}
              {' '}Please correct them before saving.
            </span>
          </div>
          <Badge variant="warning" size="sm">
            Save Blocked
          </Badge>
        </div>
      )}
    </div>
  );
}

export default ReviewSummaryBar;
