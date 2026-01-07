/**
 * KPI Card Component
 * 
 * Apple Design: Elegant, minimalist KPI display with smooth animations
 */

'use client';

import { AppleCard } from '@wattweiser/ui';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className = '',
}: KPICardProps) {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-error-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className={`${className} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <AppleCard
        variant="elevated"
        padding="lg"
        className="h-full hover:shadow-xl transition-shadow duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
              {change && (
                <span
                  className={`text-sm font-semibold ${trendColors[change.trend]}`}
                >
                  {trendIcons[change.trend]} {Math.abs(change.value)}%
                </span>
              )}
            </div>
            {change && (
              <p className="text-xs text-gray-500 mt-1">{change.label}</p>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary-50 rounded-xl">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-4">{description}</p>
        )}
      </AppleCard>
    </div>
  );
}

