import { Inbox } from 'lucide-react';
import Button from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  actionLabel,
  onAction,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-card bg-surface border border-dashed border-border ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary mb-3">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-foreground-muted max-w-sm mb-5">
        {description}
      </p>

      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
