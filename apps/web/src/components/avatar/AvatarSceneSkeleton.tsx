'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Avatar Scene Skeleton
 * 
 * Loading-State für Avatar Scene
 */
export function AvatarSceneSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

