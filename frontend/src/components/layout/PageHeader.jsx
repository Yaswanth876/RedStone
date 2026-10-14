export function PageHeader({
  title,
  description,
  actions,
  badge,
  className = '',
}) {
  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 sm:pb-8 border-b border-border/80 ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="page-title text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-foreground-muted max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </header>
  );
}

export default PageHeader;
