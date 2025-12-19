import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { HitlService } from './hitl.service';

@Controller('hitl')
export class HitlController {
  constructor(private readonly hitlService: HitlService) {}

  @Post('approvals/:approvalId/approve')
  async approve(@Param('approvalId') approvalId: string, @Body() body: { approverId: string }) {
    return this.hitlService.approve(approvalId, body.approverId);
  }

  @Post('approvals/:approvalId/reject')
  async reject(
    @Param('approvalId') approvalId: string,
    @Body() body: { approverId: string; reason?: string },
  ) {
    return this.hitlService.reject(approvalId, body.approverId, body.reason);
  }
}


