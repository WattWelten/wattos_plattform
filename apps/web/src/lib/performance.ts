/**
 * Performance Utilities
 * Hilfsfunktionen für Performance-Monitoring und Optimierung
 */

import React from 'react';

/**
 * Debounce Function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle Function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Intersection Observer Hook für Lazy-Loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  if (typeof window === 'undefined') {
    return false;
  }

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setIsIntersecting(entry.isIntersecting);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Preload Resource
 */
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Prefetch Route
 */
export function prefetchRoute(href: string) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }
}

/**
 * Get Capped Device Pixel Ratio
 * Desktop ≤2.0, Mobile ≤1.5
 */
export function getCappedDPR(): number {
  if (typeof window === 'undefined') {
    return 1;
  }
  const dpr = window.devicePixelRatio || 1;
  const isMobile = window.innerWidth < 768;
  return isMobile ? Math.min(dpr, 1.5) : Math.min(dpr, 2.0);
}
