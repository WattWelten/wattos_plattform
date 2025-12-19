'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-load Chart Components
export const LineChart = dynamic(
  () => import('./line-chart').then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  },
);

export const BarChart = dynamic(
  () => import('./bar-chart').then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  },
);

export const PieChart = dynamic(
  () => import('./pie-chart').then((mod) => ({ default: mod.PieChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  },
);


