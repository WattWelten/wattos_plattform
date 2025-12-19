'use client';

import { useState, useEffect } from 'react';
import { useWebVitals, WebVitalsMetrics } from '@/lib/performance';

/**
 * Web Vitals Overlay Component
 * 
 * Zeigt Core Web Vitals Metriken in Dev-Mode an
 */
export function WebVitalsOverlay({ enabled = false }: { enabled?: boolean }) {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({});
  const [visible, setVisible] = useState(false);

  useWebVitals((newMetrics) => {
    setMetrics((prev) => ({ ...prev, ...newMetrics }));
  });

  // Toggle mit 'v' Key
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'v' && e.ctrlKey) {
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled]);

  if (!enabled || !visible) return null;

  const getScore = (value: number | undefined, thresholds: { good: number; poor: number }) => {
    if (!value) return 'N/A';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const lcpScore = getScore(metrics.lcp, { good: 2500, poor: 4000 });
  const fidScore = getScore(metrics.fid, { good: 100, poor: 300 });
  const clsScore = getScore(metrics.cls, { good: 0.1, poor: 0.25 });
  const fcpScore = getScore(metrics.fcp, { good: 1800, poor: 3000 });

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 min-w-[200px]">
      <div className="font-bold mb-2">Web Vitals (Ctrl+V)</div>
      <div className="space-y-1">
        <div>
          LCP:{' '}
          <span className={lcpScore === 'good' ? 'text-green-400' : lcpScore === 'poor' ? 'text-red-400' : 'text-yellow-400'}>
            {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
          </span>
        </div>
        <div>
          FID:{' '}
          <span className={fidScore === 'good' ? 'text-green-400' : fidScore === 'poor' ? 'text-red-400' : 'text-yellow-400'}>
            {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
          </span>
        </div>
        <div>
          CLS:{' '}
          <span className={clsScore === 'good' ? 'text-green-400' : clsScore === 'poor' ? 'text-red-400' : 'text-yellow-400'}>
            {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div>
          FCP:{' '}
          <span className={fcpScore === 'good' ? 'text-green-400' : fcpScore === 'poor' ? 'text-red-400' : 'text-yellow-400'}>
            {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

