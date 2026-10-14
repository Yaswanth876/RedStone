import { forwardRef } from 'react';

export const Card = forwardRef(function Card(
  { className = '', children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`bg-surface rounded-card border border-border shadow-card overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = forwardRef(function CardHeader(
  { className = '', children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`p-5 sm:p-6 pb-3 sm:pb-4 flex flex-col gap-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardTitle = forwardRef(function CardTitle(
  { className = '', children, as: Component = 'h3', ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`text-lg sm:text-[19px] font-semibold text-foreground tracking-tight ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

export const CardDescription = forwardRef(function CardDescription(
  { className = '', children, ...props },
  ref
) {
  return (
    <p
      ref={ref}
      className={`text-xs sm:text-sm text-foreground-muted ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});

export const CardContent = forwardRef(function CardContent(
  { className = '', children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`p-5 sm:p-6 pt-0 sm:pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
});

export const CardFooter = forwardRef(function CardFooter(
  { className = '', children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`p-5 sm:p-6 pt-3 sm:pt-4 border-t border-border/70 flex items-center ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export default Card;
