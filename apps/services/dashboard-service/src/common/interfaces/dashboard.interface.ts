/**
 * Dashboard Interfaces für Type-Safety
 */

export interface DashboardLayout {
  widgets: Array<{
    id: string;
    type: string;
    position: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    config?: Record<string, any>;
  }>;
}

export interface DashboardConfig {
  theme?: string;
  refreshInterval?: number;
  [key: string]: any;
}

export interface Dashboard {
  id: string;
  name: string;
  layout?: DashboardLayout;
  config?: DashboardConfig;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
