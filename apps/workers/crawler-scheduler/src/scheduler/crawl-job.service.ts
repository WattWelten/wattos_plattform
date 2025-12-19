import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';

/**
 * Crawl Job Service
 * 
 * Verwaltet Crawl-Jobs in der Datenbank
 */
@Injectable()
export class CrawlJobService {
  private readonly logger = new Logger(CrawlJobService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Aktive Jobs abrufen
   */
  async getActiveJobs() {
    return this.prisma.crawlJob.findMany({
      where: {
        status: 'active',
      },
      orderBy: {
        nextRunAt: 'asc',
      },
    });
  }

  /**
   * Fällige Jobs abrufen
   */
  async getDueJobs() {
    const now = new Date();
    return this.prisma.crawlJob.findMany({
      where: {
        status: 'active',
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: {
        nextRunAt: 'asc',
      },
    });
  }

  /**
   * Job abrufen
   */
  async getJob(jobId: string) {
    return this.prisma.crawlJob.findUnique({
      where: { id: jobId },
    });
  }

  /**
   * Job-Status aktualisieren
   */
  async updateJobStatus(
    jobId: string,
    status: 'active' | 'paused' | 'error' | 'running',
    updates?: {
      lastRunAt?: Date;
      nextRunAt?: Date;
    },
  ) {
    return this.prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status,
        ...(updates?.lastRunAt && { lastRunAt: updates.lastRunAt }),
        ...(updates?.nextRunAt && { nextRunAt: updates.nextRunAt }),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Job erstellen
   */
  async createJob(data: {
    tenantId: string;
    characterId?: string;
    urls: string[];
    schedule: string;
    config?: Record<string, unknown>;
  }) {
    const nextRunAt = this.calculateNextRun(data.schedule);
    
    return this.prisma.crawlJob.create({
      data: {
        tenantId: data.tenantId,
        characterId: data.characterId,
        urls: data.urls,
        schedule: data.schedule,
        nextRunAt,
        config: data.config || {},
        status: 'active',
      },
    });
  }

  /**
   * Nächsten Ausführungszeitpunkt berechnen
   */
  private calculateNextRun(schedule: string): Date {
    // Einfache Implementierung: Standardmäßig nächster Tag um 5:00 Uhr
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(5, 0, 0, 0);
    return nextRun;
  }
}

