import { forwardRef, useId } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    id,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    containerClassName = '',
    type = 'text',
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1"
        >
          {label}
          {required && <span className="text-error" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 pointer-events-none text-foreground-muted">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          aria-label={props['aria-label'] || (typeof label === 'string' ? label : undefined)}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={`w-full h-11 px-3.5 text-sm bg-surface rounded-control border transition-colors duration-150 text-foreground placeholder:text-foreground-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50 disabled:bg-[#F0EDE8]/40 disabled:cursor-not-allowed ${
            LeftIcon ? 'pl-10' : ''
          } ${RightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-error focus-visible:ring-error'
              : 'border-border hover:border-[#CDC8BF]'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3.5 pointer-events-none text-foreground-muted">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-error font-medium" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-foreground-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
