/**
 * Widget Interfaces für Type-Safety
 */

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  [key: string]: any;
}

export interface Widget {
  id: string;
  type: string;
  name: string;
  config?: WidgetConfig;
  position?: WidgetPosition;
  dashboardId?: string;
  characterId?: string;
  createdAt: Date;
  updatedAt?: Date;
}
