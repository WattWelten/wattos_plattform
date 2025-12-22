'use client';

import { useEffect, useCallback } from 'react';

/**
 * Hook für Keyboard-Navigation
 * Unterstützt Tab, Enter, Escape, Arrow Keys
 */
export function useKeyboardNavigation() {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Escape: Schließe Modals/Dropdowns
    if (event.key === 'Escape') {
      const modals = document.querySelectorAll('[role="dialog"]');
      if (modals.length > 0) {
        const lastModal = modals[modals.length - 1] as HTMLElement;
        const closeButton = lastModal.querySelector('[aria-label*="schließen"], [aria-label*="close"]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      }
    }

    // Enter auf Buttons/Links
    if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'BUTTON') {
      // Standard-Verhalten ist ausreichend
      return;
    }

    // Arrow Keys für Navigation in Listen
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const target = event.target as HTMLElement;
      if (target.getAttribute('role') === 'listbox' || target.tagName === 'SELECT') {
        // Standard-Verhalten ist ausreichend
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

