import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-[#852520] border-transparent shadow-subtle',
  secondary:
    'bg-primary-soft text-primary hover:bg-[#f3dad7] active:bg-[#eed0cc] border-transparent',
  outline:
    'bg-surface text-foreground border-border hover:bg-[#F0EDE8] active:bg-[#EAE6DF] shadow-subtle',
  ghost:
    'bg-transparent text-foreground hover:bg-[#F0EDE8] active:bg-[#EAE6DF] border-transparent',
  danger:
    'bg-error text-white hover:bg-[#9B1E14] active:bg-[#841910] border-transparent shadow-subtle',
};

const sizeStyles = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm gap-2', // ~44px height standard
  lg: 'h-12 px-6 text-base gap-2.5', // ~48px height
  icon: 'h-11 w-11 p-0 justify-center',
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    disabled = false,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium rounded-control border transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {!isLoading && RightIcon ? (
        <RightIcon className="w-4 h-4 shrink-0" />
      ) : null}
    </button>
  );
});

export default Button;
