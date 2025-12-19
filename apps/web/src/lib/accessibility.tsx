/**
 * Accessibility Utilities
 * Hilfsfunktionen für WCAG 2.1 AA Compliance
 */

import React from 'react';

/**
 * Generiert eine eindeutige ID für ARIA-Labels
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Keyboard Navigation Helper
 */
export function handleKeyboardNavigation(
  e: React.KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
) {
  switch (e.key) {
    case 'Enter':
    case ' ':
      if (onEnter) {
        e.preventDefault();
        onEnter();
      }
      break;
    case 'Escape':
      if (onEscape) {
        e.preventDefault();
        onEscape();
      }
      break;
    case 'ArrowUp':
      if (onArrowUp) {
        e.preventDefault();
        onArrowUp();
      }
      break;
    case 'ArrowDown':
      if (onArrowDown) {
        e.preventDefault();
        onArrowDown();
      }
      break;
  }
}

/**
 * Focus Management
 */
export function trapFocus(element: HTMLElement | null) {
  if (!element) return;

  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Skip to main content link
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md"
      aria-label="Zum Hauptinhalt springen"
    >
      Zum Hauptinhalt springen
    </a>
  );
}

/**
 * ARIA Live Region für Screen Reader
 */
export function LiveRegion({ message, priority = 'polite' }: { message: string; priority?: 'polite' | 'assertive' }) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

