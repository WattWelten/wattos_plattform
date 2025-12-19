import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MetricsDashboardService } from '../metrics/metrics-dashboard.service';
import { LogsViewerService } from '../logs/logs-viewer.service';
import { AlertsManagementService } from '../alerts/alerts-management.service';

/**
 * Realtime Gateway
 * 
 * WebSocket-Gateway für Real-time Updates
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/monitoring',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly clients: Map<string, Socket> = new Map();
  private readonly updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly metricsDashboardService: MetricsDashboardService,
    private readonly logsViewerService: LogsViewerService,
    private readonly alertsManagementService: AlertsManagementService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
    
    // Update-Interval stoppen
    const interval = this.updateIntervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(client.id);
    }
  }

  /**
   * Metrics-Updates abonnieren
   */
  @SubscribeMessage('subscribe:metrics')
  async handleSubscribeMetrics(client: Socket, payload: { tenantId?: string; timeRange?: string }) {
    this.logger.log(`Client ${client.id} subscribed to metrics`, payload);

    // Sofortige Daten senden
    const data = await this.metricsDashboardService.getDashboardOverview(
      payload.tenantId,
      payload.timeRange || '24h',
    );
    client.emit('metrics:update', data);

    // Regelmäßige Updates (alle 30 Sekunden)
    const interval = setInterval(async () => {
      try {
        const update = await this.metricsDashboardService.getDashboardOverview(
          payload.tenantId,
          payload.timeRange || '24h',
        );
        client.emit('metrics:update', update);
      } catch (error) {
        this.logger.error(`Failed to send metrics update: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 30000);

    this.updateIntervals.set(client.id, interval);
  }

  /**
   * Logs-Updates abonnieren
   */
  @SubscribeMessage('subscribe:logs')
  async handleSubscribeLogs(client: Socket, payload: { tenantId?: string; service?: string; level?: string }) {
    this.logger.log(`Client ${client.id} subscribed to logs`, payload);

    // Regelmäßige Updates (alle 10 Sekunden)
    const interval = setInterval(async () => {
      try {
        const { logs } = await this.logsViewerService.getLogs(
          payload.tenantId,
          payload.service,
          payload.level,
          undefined,
          undefined,
          50,
        );
        client.emit('logs:update', logs);
      } catch (error) {
        this.logger.error(`Failed to send logs update: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 10000);

    this.updateIntervals.set(client.id, interval);
  }

  /**
   * Alerts-Updates abonnieren
   */
  @SubscribeMessage('subscribe:alerts')
  async handleSubscribeAlerts(client: Socket, payload: { tenantId?: string; status?: string }) {
    this.logger.log(`Client ${client.id} subscribed to alerts`, payload);

    // Sofortige Daten senden
    const alerts = await this.alertsManagementService.getAlerts(
      payload.tenantId,
      payload.status,
      undefined,
      undefined,
      100,
    );
    client.emit('alerts:update', alerts);

    // Regelmäßige Updates (alle 30 Sekunden)
    const interval = setInterval(async () => {
      try {
        const update = await this.alertsManagementService.getAlerts(
          payload.tenantId,
          payload.status,
          undefined,
          undefined,
          100,
        );
        client.emit('alerts:update', update);
      } catch (error) {
        this.logger.error(`Failed to send alerts update: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 30000);

    this.updateIntervals.set(client.id, interval);
  }

  /**
   * Abonnement beenden
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket) {
    const interval = this.updateIntervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(client.id);
    }
    client.emit('unsubscribed');
  }
}

