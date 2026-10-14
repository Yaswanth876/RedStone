import { useId } from 'react';
import { ClipboardCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';

/**
 * ConfirmImportDialog — explicit confirmation modal before permanent timetable creation.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onConfirm - async () => void
 * @param {number} props.count - Number of valid entries to be saved
 * @param {number} [props.warningCount=0] - Number of non-blocking warnings
 * @param {boolean} [props.isSaving=false]
 * @param {string|null} [props.error=null]
 */
export function ConfirmImportDialog({
  isOpen,
  onClose,
  onConfirm,
  count,
  warningCount = 0,
  isSaving = false,
  error = null,
}) {
  const titleId = useId();

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isSaving) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-md rounded-card bg-surface border border-border shadow-popover p-6 space-y-5 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 id={titleId} className="text-base sm:text-lg font-semibold text-foreground">
              Confirm Timetable Import
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted">
              You are about to permanently save <strong>{count} {count === 1 ? 'class' : 'classes'}</strong> to your active timetable.
            </p>
          </div>
        </div>

        {/* Warning callout if warnings exist */}
        {warningCount > 0 && (
          <div className="p-3.5 rounded-control bg-[#FEF6E7] border border-[#F9E2B6] text-xs text-foreground flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-warning">Notice:</span>
              <p className="text-foreground-muted">
                {warningCount} potential duplicate or advisory items are present in this batch.
              </p>
            </div>
          </div>
        )}

        {/* Error message from server rejection */}
        {error && (
          <div className="p-3.5 rounded-control bg-[#FEE4E2] border border-[#FECDCA] text-xs text-error flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Import rejected by server</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="text-[11px] text-foreground-muted bg-[#FAF9F6] p-3 rounded-control border border-border/60">
          This operation is atomic. All {count} classes will be written together in a single transaction.
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSaving}
            disabled={isSaving || count === 0}
            onClick={onConfirm}
            leftIcon={ClipboardCheck}
          >
            {isSaving ? 'Saving to Database...' : 'Confirm & Save Classes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmImportDialog;
