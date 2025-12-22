'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface BarChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  bars: Array<{ key: string; name: string; color?: string }>;
  className?: string;
}

export function BarChart({ data, dataKey, bars, className }: BarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={dataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || '#0073E6'}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}


