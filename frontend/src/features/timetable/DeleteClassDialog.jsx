import { useState, useId } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatTime, WEEKDAY_NAMES } from '../../utils/dateTime.js';

/**
 * DeleteClassDialog — confirmation modal before deleting a timetable entry.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onConfirm - async () => void
 * @param {object|null} [props.entry] - The entry to delete
 */
export function DeleteClassDialog({ isOpen, onClose, onConfirm, entry = null }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();

  if (!isOpen || !entry) return null;

  const dayName = WEEKDAY_NAMES[(entry.dayOfWeek || 1) - 1] || 'Unknown';
  const formattedStart = formatTime(entry.startTime);
  const formattedEnd = formatTime(entry.endTime);

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete class. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div className="relative w-full max-w-sm bg-surface rounded-card border border-border shadow-lg p-6 space-y-4 animate-in">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-error-soft flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-error" />
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            Delete Class
          </h2>
          <p className="text-sm text-foreground-muted">
            Are you sure you want to remove <strong className="text-foreground">{entry.subject}</strong> from your timetable?
          </p>
          <p className="text-xs text-foreground-muted">
            {dayName}, {formattedStart} – {formattedEnd}
            {entry.room && ` · ${entry.room}`}
          </p>
          <p className="text-xs text-foreground-muted">
            This will permanently remove this class from your schedule.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3 rounded-control bg-error-soft border border-[#FECDCA] text-xs text-error font-medium"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleConfirm}
            isLoading={deleting}
            leftIcon={Trash2}
          >
            Delete Class
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteClassDialog;
