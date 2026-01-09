'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@wattweiser/ui';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface KPITileProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  href?: string;
  className?: string;
}

export function KPITile({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
  className,
}: KPITileProps) {
  const content = (
    <Card variant="glass" className={cn('group hover:shadow-medium transition-all cursor-pointer', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          {trend && (
            <div className={cn('text-sm flex items-center gap-1', trend.positive ? 'text-success-600' : 'text-error-600')}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
