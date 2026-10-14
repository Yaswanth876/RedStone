const variantStyles = {
  primary: 'bg-primary-soft text-primary border-[#F2D7D4]',
  success: 'bg-[#EAF5EF] text-success border-[#C9E7D6]',
  warning: 'bg-[#FEF6E7] text-warning border-[#F9E2B6]',
  error: 'bg-[#FEE4E2] text-error border-[#FECDCA]',
  info: 'bg-[#EBF3FB] text-info border-[#C7DFF5]',
  neutral: 'bg-[#F0EDE8] text-foreground-muted border-border',
};

const dotStyles = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  neutral: 'bg-foreground-muted',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeClass} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotStyles[variant] || dotStyles.neutral
          }`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
