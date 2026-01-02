'use client';

import React from 'react';

/**
 * Avatar Scene Skeleton
 * Loading placeholder for Avatar Scene
 */
export function AvatarSceneSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading Avatar...</p>
      </div>
    </div>
  );
}


