'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lazy-Loading Wrapper für schwere Komponenten
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
) {
  return dynamic(importFn, {
    loading: () => fallback || <Skeleton className="h-32 w-full" />,
    ssr: false,
  });
}

/**
 * Lazy-Load Command Palette (nur wenn geöffnet)
 */
export const LazyCommandPalette = dynamic(
  () => import('@/components/chat/command-palette').then((mod) => ({ default: mod.CommandPalette })),
  {
    ssr: false,
  },
);

/**
 * Lazy-Load Chat Sidebar
 */
export const LazyChatSidebar = dynamic(
  () => import('@/components/chat/chat-sidebar').then((mod) => ({ default: mod.ChatSidebar })),
  {
    loading: () => <Skeleton className="h-full w-64" />,
    ssr: false,
  },
);


