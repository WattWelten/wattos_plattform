'use client';

import { ReactNode } from 'react';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';

export function KeyboardNavigationProvider({ children }: { children: ReactNode }) {
  useKeyboardNavigation();
  return <>{children}</>;
}



