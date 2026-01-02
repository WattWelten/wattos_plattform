'use client';

import { cn } from '@wattweiser/ui';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({ className, size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)} role="status" aria-label={text || 'Lädt...'}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-primary-500',
          sizeClasses[size],
        )}
        aria-hidden="true"
      />
      {text && <p className="text-sm text-gray-600">{text}</p>}
      <span className="sr-only">{text || 'Lädt...'}</span>
    </div>
  );
}



