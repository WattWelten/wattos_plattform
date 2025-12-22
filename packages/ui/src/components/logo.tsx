import React from 'react';
import { cn } from '../lib/utils';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'text';
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textSizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function Logo({ className, size = 'md', variant = 'full' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        className={cn(sizeMap[size], className)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" fill="#0073E6" />
        <path
          d="M30 50 L45 65 L70 35"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === 'text') {
    return (
      <span className={cn('font-bold text-primary-500', textSizeMap[size], className)}>
        WattWeiser
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        className={cn(sizeMap[size])}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" fill="#0073E6" />
        <path
          d="M30 50 L45 65 L70 35"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={cn('font-bold text-primary-500', textSizeMap[size])}>
        WattWeiser
      </span>
    </div>
  );
}

