import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-accent/15 text-accent',
        variant === 'outline' && 'border border-glass-border text-muted',
        className
      )}
    >
      {children}
    </span>
  );
}
