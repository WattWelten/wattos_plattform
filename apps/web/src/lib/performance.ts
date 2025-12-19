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

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
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
 * Device Pixel Ratio Cap
 * Desktop: max 2.0, Mobile: max 1.5
 */
export function getCappedDPR(): number {
  if (typeof window === 'undefined') return 1;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
  
  const nativeDPR = window.devicePixelRatio || 1;
  const maxDPR = isMobile ? 1.5 : 2.0;
  
  return Math.min(nativeDPR, maxDPR);
}

/**
 * Web Vitals Metrics
 */
export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

/**
 * Web Vitals Hook
 */
export function useWebVitals(onReport?: (metrics: WebVitalsMetrics) => void) {
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const metrics: WebVitalsMetrics = {};

    // LCP - Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        if (onReport) onReport({ ...metrics });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Browser doesn't support LCP
    }

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metrics.fid = entry.processingStart - entry.startTime;
          if (onReport) onReport({ ...metrics });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Browser doesn't support FID
    }

    // CLS - Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            metrics.cls = clsValue;
            if (onReport) onReport({ ...metrics });
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Browser doesn't support CLS
    }

    // FCP - First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
            if (onReport) onReport({ ...metrics });
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Browser doesn't support FCP
    }
  }, [onReport]);
}
