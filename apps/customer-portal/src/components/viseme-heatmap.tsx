'use client';

import { useEffect, useRef } from 'react';
import type { VisemeEvent } from '@/lib/api';

interface VisemeHeatmapProps {
  events: VisemeEvent[];
  width?: number;
  height?: number;
}

export function VisemeHeatmap({
  events,
  width = 800,
  height = 200,
}: VisemeHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (events.length === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Viseme-Events', width / 2, height / 2);
      return;
    }

    // Group events by viseme type
    const visemeTypes: Array<'MBP' | 'FV' | 'TH' | 'AA'> = ['MBP', 'FV', 'TH', 'AA'];
    const colors = {
      MBP: '#0073E6',
      FV: '#10B981',
      TH: '#F59E0B',
      AA: '#EF4444',
    };

    const rowHeight = height / visemeTypes.length;
    const timeRange = Math.max(
      ...events.map((e) => e.timestamp),
    ) - Math.min(...events.map((e) => e.timestamp)) || 1;

    visemeTypes.forEach((viseme, index) => {
      const y = index * rowHeight;
      const visemeEvents = events.filter((e) => e.viseme === viseme);

      visemeEvents.forEach((event) => {
        const x = ((event.timestamp - Math.min(...events.map((e) => e.timestamp))) / timeRange) * width;
        ctx.fillStyle = colors[viseme];
        ctx.fillRect(x, y, 4, rowHeight - 2);
      });

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(viseme, 8, y + rowHeight / 2 + 4);
    });
  }, [events, width, height]);

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg"
      />
      <div className="flex gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-500 rounded"></div>
          <span>MBP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-success-500 rounded"></div>
          <span>FV</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-warning-500 rounded"></div>
          <span>TH</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-error-500 rounded"></div>
          <span>AA</span>
        </div>
      </div>
    </div>
  );
}



