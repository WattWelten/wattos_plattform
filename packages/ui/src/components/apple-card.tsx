import * as React from 'react';
import { cn } from '../lib/utils';

export interface AppleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantMap = {
  default: 'apple-card',
  elevated: 'apple-card shadow-lg',
  outlined: 'bg-white border-2 border-gray-200 rounded-xl',
};

export const AppleCard = React.forwardRef<HTMLDivElement, AppleCardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(variantMap[variant], paddingMap[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

AppleCard.displayName = 'AppleCard';

