/**
 * Tenant Settings Interfaces für Type-Safety
 */

export interface TenantOfficeHours {
  open?: number;
  close?: number;
}

export interface TenantMetricsSettings {
  avgHandleTimeMin?: {
    default?: number;
    topicOverrides?: Record<string, number>;
  };
}

export interface TenantSettings {
  officeHours?: TenantOfficeHours;
  metrics?: TenantMetricsSettings;
  [key: string]: any;
}
