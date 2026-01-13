import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { ConditionalAuthGuard } from '../auth/guards/conditional-auth.guard';

@ApiTags('proxy')
@ApiExcludeController()
@Controller()
export class ProxyController {
  constructor(private proxyService: ProxyService) {}

  @All('chat/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyChat(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('chat');
    middleware(req, res, () => {});
  }

  @All('rag/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyRag(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('rag');
    middleware(req, res, () => {});
  }

  @All('agents/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyAgent(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('agent');
    middleware(req, res, () => {});
  }

  @All('v1/agents/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyV1Agents(@Req() req: Request, @Res() res: Response) {
    // Route /api/v1/agents/* zu agent-service (für Avatar-Endpunkte)
    const middleware = this.proxyService.getProxyMiddleware('agent');
    middleware(req, res, () => {});
  }

  @All('tools/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyTool(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('tool');
    middleware(req, res, () => {});
  }

  @All('summary/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxySummary(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('summary');
    middleware(req, res, () => {});
  }

  @All('feedback/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyFeedback(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('feedback');
    middleware(req, res, () => {});
  }

  @All('admin/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyAdmin(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('admin');
    middleware(req, res, () => {});
  }

  @All('avatar/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyAvatar(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('avatar');
    middleware(req, res, () => {});
  }

  @All('metaverse/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyMetaverse(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('metaverse');
    middleware(req, res, () => {});
  }

  @All('ingestion/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyIngestion(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('ingestion');
    middleware(req, res, () => {});
  }

  @All('parsing/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyParsing(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('parsing');
    middleware(req, res, () => {});
  }

  @All('v1/characters/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyCharacters(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('character');
    middleware(req, res, () => {});
  }

  @All('v1/conversations/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyConversations(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('chat');
    middleware(req, res, () => {});
  }

  @All('v1/artifacts/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyArtifacts(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('character');
    middleware(req, res, () => {});
  }

  @All('db/*path')
  async proxyDb(@Req() req: Request, @Res() res: Response) {
    // DB-Endpunkte für interne Services (ohne Auth für Python-Services)
    const middleware = this.proxyService.getProxyMiddleware('admin');
    middleware(req, res, () => {});
  }

  @All('analytics/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    // Route analytics/* zu dashboard-service (für KPI-Endpoints)
    const middleware = this.proxyService.getProxyMiddleware('analytics');
    middleware(req, res, () => {});
  }

  @All('dashboard/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyDashboard(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('dashboard');
    middleware(req, res, () => {});
  }

  @All('crawler/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyCrawler(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('crawler');
    middleware(req, res, () => {});
  }

  @All('voice/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyVoice(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('voice');
    middleware(req, res, () => {});
  }

  @All('v1/avatars/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyV1Avatars(@Req() req: Request, @Res() res: Response) {
    // Route /api/v1/avatars/* zu avatar-service
    const middleware = this.proxyService.getProxyMiddleware('avatar');
    middleware(req, res, () => {});
  }

  @All('v1/videos/*path')
  @UseGuards(ConditionalAuthGuard)
  async proxyV1Videos(@Req() req: Request, @Res() res: Response) {
    // Route /api/v1/videos/* zu video-service
    const middleware = this.proxyService.getProxyMiddleware('video');
    middleware(req, res, () => {});
  }
}
