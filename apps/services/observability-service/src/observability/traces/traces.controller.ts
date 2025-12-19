import { Controller, Get } from '@nestjs/common';
import { TracesService } from './traces.service';

/**
 * Traces Controller
 * 
 * REST API für Distributed Tracing
 */
@Controller('traces')
export class TracesController {
  constructor(private readonly tracesService: TracesService) {}

  /**
   * Trace-Informationen abrufen
   */
  @Get('info')
  getTraceInfo() {
    return this.tracesService.getTraceInfo();
  }
}


