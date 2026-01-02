import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { DataAggregationService } from './data-aggregation.service';
import { TargetGroupService } from './target-group.service';
import { PersonasService } from '../personas/personas.service';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataAggregationService: DataAggregationService,
    private readonly targetGroupService: TargetGroupService,
    private readonly personasService: PersonasService,
  ) {}

  /**
   * Analyse starten
   */
  async createAnalysis(tenantId: string, dto: CreateAnalysisDto) {
    try {
      // Analyse in DB erstellen
      const analysis = await this.prisma.client.customerAnalysis.create({
        data: {
          tenantId,
          customerType: dto.customerType,
          analysisType: dto.analysisType || 'initial',
          status: 'running',
          metadata: dto.metadata || {},
        },
      });

      this.logger.log(`Analysis ${analysis.id} started for tenant ${tenantId}`);

      // Asynchron: Daten aggregieren und analysieren
      this.runAnalysis(analysis.id, tenantId, dto).catch((error) => {
        this.logger.error(`Analysis ${analysis.id} failed: ${error.message}`);
        this.prisma.client.customerAnalysis.update({
          where: { id: analysis.id },
          data: { status: 'failed', metadata: { error: error.message } },
        });
      });

      return analysis;
    } catch (error: any) {
      this.logger.error(`Failed to create analysis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyse ausführen
   */
  private async runAnalysis(analysisId: string, tenantId: string, dto: CreateAnalysisDto) {
    try {
      // 1. Daten aggregieren
      const aggregatedData = await this.dataAggregationService.aggregateAllData(
        tenantId,
        dto.dataSources,
      );

      // 2. Zielgruppen identifizieren
      const targetGroups = await this.targetGroupService.identifyTargetGroups(
        analysisId,
        aggregatedData,
      );

      // 3. Personas automatisch generieren für alle Target Groups
      let personasCount = 0;
      if (targetGroups.length > 0) {
        try {
          const personas = await this.personasService.generatePersonas(analysisId);
          personasCount = personas.length;
          this.logger.log(`Generated ${personasCount} personas for analysis ${analysisId}`);
        } catch (error: any) {
          this.logger.warn(`Persona generation failed (non-critical): ${error.message}`);
          // Persona-Generierung ist nicht kritisch, Analyse kann trotzdem fortgesetzt werden
        }
      }

      // 4. Analyse als abgeschlossen markieren
      await this.prisma.client.customerAnalysis.update({
        where: { id: analysisId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            targetGroupsCount: targetGroups.length,
            personasCount,
            dataSources: dto.dataSources,
          },
        },
      });

      this.logger.log(`Analysis ${analysisId} completed with ${targetGroups.length} target groups`);
    } catch (error: any) {
      this.logger.error(`Analysis ${analysisId} failed: ${error.message}`);
      await this.prisma.client.customerAnalysis.update({
        where: { id: analysisId },
        data: { status: 'failed', metadata: { error: error.message } },
      });
      throw error;
    }
  }

  /**
   * Analyse-Status abrufen
   */
  async getAnalysis(id: string) {
    const analysis = await this.prisma.client.customerAnalysis.findUnique({
      where: { id },
      include: {
        targetGroups: true,
        personas: true,
        agentGenerations: true,
      },
    });

    if (!analysis) {
      throw new NotFoundException(`Analysis ${id} not found`);
    }

    return analysis;
  }

  /**
   * Vollständiger Report
   */
  async getAnalysisReport(id: string) {
    const analysis = await this.getAnalysis(id);

    return {
      ...analysis,
      summary: {
        targetGroupsCount: analysis.targetGroups.length,
        personasCount: analysis.personas.length,
        agentGenerationsCount: analysis.agentGenerations.length,
        status: analysis.status,
      },
    };
  }
}

