import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const appleButtonVariants = cva(
  'apple-button inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'apple-button-primary text-white hover:bg-primary-600',
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
        ghost: 'text-primary-500 hover:bg-primary-50',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive: 'bg-error-500 text-white hover:bg-error-600',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        default: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface AppleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof appleButtonVariants> {
  asChild?: boolean;
}

const AppleButton = React.forwardRef<HTMLButtonElement, AppleButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(appleButtonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);

AppleButton.displayName = 'AppleButton';

export { AppleButton, appleButtonVariants };

