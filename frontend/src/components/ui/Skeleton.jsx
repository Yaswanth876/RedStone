export function Skeleton({ className = '', variant = 'rect', ...props }) {
  const variantStyles = {
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
    rect: 'rounded-control',
  };

  return (
    <div
      className={`animate-pulse bg-[#EFECE6] ${variantStyles[variant] || 'rounded-control'} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
