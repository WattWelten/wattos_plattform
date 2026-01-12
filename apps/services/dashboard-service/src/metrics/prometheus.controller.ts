/**
 * Prometheus Metrics Controller
 * 
 * Exportiert KPI-Metriken im Prometheus-Format
 * Endpoint: GET /metrics
 */

import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { KpiService } from '../analytics/kpi.service';
import { PrismaService } from '@wattweiser/db';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard, Roles, RoleType } from '../auth/guards/rbac.guard';

// Optional: Swagger Decorators (nur wenn @nestjs/swagger installiert ist)
let ApiTags: any, ApiOperation: any, ApiBearerAuth: any, ApiResponse: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiTags = swagger.ApiTags;
  ApiOperation = swagger.ApiOperation;
  ApiBearerAuth = swagger.ApiBearerAuth;
  ApiResponse = swagger.ApiResponse;
} catch {
  // @nestjs/swagger nicht installiert - Decorators werden ignoriert
  ApiTags = () => () => {};
  ApiOperation = () => () => {};
  ApiBearerAuth = () => () => {};
  ApiResponse = () => () => {};
}

@ApiTags('prometheus')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PrometheusController {
  private readonly logger = new Logger(PrometheusController.name);

  constructor(
    private readonly kpiService: KpiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Prometheus Metrics Export
   * GET /metrics
   * 
   * Gibt KPI-Metriken im Prometheus-Format zurück
   * Format: metric_name{label="value"} metric_value
   */
  @Get()
  @Roles(RoleType.ADMIN, RoleType.EDITOR)
  @ApiOperation({ 
    summary: 'Export Prometheus metrics', 
    description: 'Exports KPI metrics for all tenants in Prometheus format. Metrics include answered queries, self-service rate, CSAT, latency, and more. Each metric is labeled with tenant_id, tenant_slug, and tenant_name. KPIs are fetched in parallel with a 30s timeout per tenant.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Prometheus metrics in text format',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: '# HELP wattweiser_kpi_answered Total number of answered queries\n# TYPE wattweiser_kpi_answered counter\nwattweiser_kpi_answered{tenant_id="123",tenant_slug="test",tenant_name="Test Tenant"} 100\n',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions (requires ADMIN or EDITOR role)' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMetrics(): Promise<string> {
    this.logger.debug('Prometheus metrics requested');

    try {
      // Hole alle Tenants
      const tenants = await this.prisma.client.tenant.findMany({
        select: { id: true, name: true, slug: true },
      });

      const metrics: string[] = [];

      // Header-Kommentar
      metrics.push('# HELP wattweiser_kpi_answered Total number of answered queries');
      metrics.push('# TYPE wattweiser_kpi_answered counter');
      metrics.push('# HELP wattweiser_kpi_self_service_rate Self-service rate (0-1)');
      metrics.push('# TYPE wattweiser_kpi_self_service_rate gauge');
      metrics.push('# HELP wattweiser_kpi_fully_solved Total number of fully solved queries');
      metrics.push('# TYPE wattweiser_kpi_fully_solved counter');
      metrics.push('# HELP wattweiser_kpi_time_saved_hours Time saved in hours');
      metrics.push('# TYPE wattweiser_kpi_time_saved_hours gauge');
      metrics.push('# HELP wattweiser_kpi_fte_saved FTE saved');
      metrics.push('# TYPE wattweiser_kpi_fte_saved gauge');
      metrics.push('# HELP wattweiser_kpi_after_hours_percent Percentage of queries outside office hours');
      metrics.push('# TYPE wattweiser_kpi_after_hours_percent gauge');
      metrics.push('# HELP wattweiser_kpi_coverage_rate Coverage rate (0-100)');
      metrics.push('# TYPE wattweiser_kpi_coverage_rate gauge');
      metrics.push('# HELP wattweiser_kpi_p95_latency_ms P95 latency in milliseconds');
      metrics.push('# TYPE wattweiser_kpi_p95_latency_ms gauge');
      metrics.push('# HELP wattweiser_kpi_csat Customer satisfaction score (1-5)');
      metrics.push('# TYPE wattweiser_kpi_csat gauge');
      metrics.push('');

      // Hole KPIs für jeden Tenant parallel (7d Range)
      const tenantKpiPromises = tenants.map(async (tenant) => {
        try {
          // Timeout-Handling: max 30s pro Tenant
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 30000);
          });

          const kpiPromise = this.kpiService.getKpis(tenant.id, '7d');
          const kpis = await Promise.race([kpiPromise, timeoutPromise]);

          return { tenant, kpis };
        } catch (error) {
          this.logger.warn(`Failed to get KPIs for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return null;
        }
      });

      // Warte auf alle Tenant-KPIs parallel
      const tenantKpis = await Promise.all(tenantKpiPromises);

      // Erstelle Metriken für erfolgreiche Tenant-KPIs
      for (const tenantKpi of tenantKpis) {
        if (!tenantKpi) continue;

        const { tenant, kpis } = tenantKpi;

        // Prometheus-Format: metric_name{label="value"} metric_value
        metrics.push(`wattweiser_kpi_answered{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.answered}`);
        metrics.push(`wattweiser_kpi_self_service_rate{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.selfServiceRate}`);
        metrics.push(`wattweiser_kpi_fully_solved{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.fullySolved}`);
        metrics.push(`wattweiser_kpi_time_saved_hours{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.timeSavedHours}`);
        metrics.push(`wattweiser_kpi_fte_saved{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.fteSaved}`);
        metrics.push(`wattweiser_kpi_after_hours_percent{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.afterHoursPercent}`);
        metrics.push(`wattweiser_kpi_coverage_rate{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.coverageRate}`);
        metrics.push(`wattweiser_kpi_p95_latency_ms{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.p95LatencyMs}`);
        metrics.push(`wattweiser_kpi_csat{tenant_id="${tenant.id}",tenant_slug="${tenant.slug}",tenant_name="${this.escapeLabel(tenant.name)}"} ${kpis.csat}`);
      }

      // Cache-Metriken hinzufügen
      metrics.push('');
      metrics.push('# HELP wattweiser_kpi_cache_hit_rate Cache hit rate (0-1)');
      metrics.push('# TYPE wattweiser_kpi_cache_hit_rate gauge');
      metrics.push('# HELP wattweiser_kpi_cache_hits Total cache hits');
      metrics.push('# TYPE wattweiser_kpi_cache_hits counter');
      metrics.push('# HELP wattweiser_kpi_cache_misses Total cache misses');
      metrics.push('# TYPE wattweiser_kpi_cache_misses counter');
      metrics.push('# HELP wattweiser_kpi_view_fallbacks Total view fallbacks to direct queries');
      metrics.push('# TYPE wattweiser_kpi_view_fallbacks counter');
      metrics.push('# HELP wattweiser_kpi_query_duration_ms Query duration in milliseconds');
      metrics.push('# TYPE wattweiser_kpi_query_duration_ms histogram');
      metrics.push('');

      const cacheMetrics = this.kpiService.getCacheMetrics();
      metrics.push(`wattweiser_kpi_cache_hit_rate ${cacheMetrics.cacheHitRate}`);
      metrics.push(`wattweiser_kpi_cache_hits ${cacheMetrics.cacheHits}`);
      metrics.push(`wattweiser_kpi_cache_misses ${cacheMetrics.cacheMisses}`);
      metrics.push(`wattweiser_kpi_view_fallbacks ${cacheMetrics.viewFallbacks}`);

      // Query-Dauer-Metriken (pro KPI-Methode)
      for (const [method, stats] of Object.entries(cacheMetrics.queryDurations)) {
        metrics.push(`wattweiser_kpi_query_duration_ms{method="${method}",quantile="avg"} ${stats.avg}`);
        metrics.push(`wattweiser_kpi_query_duration_ms{method="${method}",quantile="p50"} ${stats.p50}`);
        metrics.push(`wattweiser_kpi_query_duration_ms{method="${method}",quantile="p95"} ${stats.p95}`);
        metrics.push(`wattweiser_kpi_query_duration_ms{method="${method}",quantile="p99"} ${stats.p99}`);
        metrics.push(`wattweiser_kpi_query_duration_ms_count{method="${method}"} ${stats.count}`);
      }

      return metrics.join('\n') + '\n';
    } catch (error) {
      this.logger.error(`Failed to generate Prometheus metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Escape Label-Werte für Prometheus (alle Sonderzeichen)
   * Prometheus Labels müssen escaped werden: \n, \r, \t, \, "
   */
  private escapeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')  // Backslash zuerst escapen
      .replace(/"/g, '\\"')    // Anführungszeichen
      .replace(/\n/g, '\\n')   // Newline
      .replace(/\r/g, '\\r')   // Carriage Return
      .replace(/\t/g, '\\t');  // Tab
  }
}
