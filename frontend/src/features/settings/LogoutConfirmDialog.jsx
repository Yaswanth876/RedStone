import { useId } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';

/**
 * LogoutConfirmDialog — accessible confirmation dialog before clearing authentication session.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onConfirm
 */
export function LogoutConfirmDialog({ isOpen, onClose, onConfirm }) {
  const titleId = useId();

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-card bg-surface border border-border shadow-popover p-6 space-y-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FEE4E2] text-error flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 id={titleId} className="text-base font-semibold text-foreground">
              Log Out of RedStone?
            </h3>
            <p className="text-xs text-foreground-muted">
              Are you sure you want to end your active session? You will need to sign in again to view your timetable.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Stay Signed In
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            leftIcon={LogOut}
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmDialog;
