'use client';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ message = 'Lädt...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8" role="status" aria-label={message}>
      <div
        className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}



