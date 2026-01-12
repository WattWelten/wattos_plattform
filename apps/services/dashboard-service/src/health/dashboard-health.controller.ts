/**
 * Dashboard Health Controller
 * 
 * Erweiterte Health Check Endpoints für Dashboard-Service
 */

import { Controller, Get } from '@nestjs/common';
import { DashboardHealthService } from './dashboard-health.service';

@Controller('health')
export class DashboardHealthController {
  constructor(private readonly healthService: DashboardHealthService) {}

  /**
   * Vollständiger Health Check
   * GET /health
   * 
   * Prüft:
   * - Database
   * - Redis
   * - Cache Service
   * - KPI Views
   * - KPI Service
   */
  @Get()
  async health() {
    return this.healthService.checkHealth();
  }

  /**
   * Views Health Check
   * GET /health/views
   * 
   * Prüft ob alle erforderlichen KPI Views existieren
   */
  @Get('views')
  async views() {
    const health = await this.healthService.checkHealth();
    return health.checks.views;
  }

  /**
   * Cache Health Check
   * GET /health/cache
   * 
   * Prüft Cache-Service und gibt Metriken zurück
   */
  @Get('cache')
  async cache() {
    const health = await this.healthService.checkHealth();
    return {
      cache_service: health.checks.cache_service,
      kpi_service: health.checks.kpi_service,
    };
  }
}
