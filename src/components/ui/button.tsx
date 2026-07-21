import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-accent text-accent-foreground hover:opacity-90',
          variant === 'ghost' && 'text-muted hover:bg-glass-hover hover:text-foreground',
          variant === 'outline' && 'border border-glass-border bg-transparent hover:bg-glass-hover text-foreground',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:opacity-80',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-10 px-4',
          size === 'lg' && 'h-12 px-6 text-base',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
