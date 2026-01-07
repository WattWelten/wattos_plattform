import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('proxy')
@ApiExcludeController()
@Controller()
export class ProxyController {
  constructor(private proxyService: ProxyService) {}

  @All('chat/*')
  @UseGuards(JwtAuthGuard)
  async proxyChat(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('chat');
    middleware(req, res, () => {});
  }

  @All('rag/*')
  @UseGuards(JwtAuthGuard)
  async proxyRag(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('rag');
    middleware(req, res, () => {});
  }

  @All('agents/*')
  @UseGuards(JwtAuthGuard)
  async proxyAgent(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('agent');
    middleware(req, res, () => {});
  }

  @All('tools/*')
  @UseGuards(JwtAuthGuard)
  async proxyTool(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('tool');
    middleware(req, res, () => {});
  }

  @All('summary/*')
  @UseGuards(JwtAuthGuard)
  async proxySummary(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('summary');
    middleware(req, res, () => {});
  }

  @All('feedback/*')
  @UseGuards(JwtAuthGuard)
  async proxyFeedback(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('feedback');
    middleware(req, res, () => {});
  }

  @All('admin/*')
  @UseGuards(JwtAuthGuard)
  async proxyAdmin(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('admin');
    middleware(req, res, () => {});
  }

  @All('avatar/*')
  @UseGuards(JwtAuthGuard)
  async proxyAvatar(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('avatar');
    middleware(req, res, () => {});
  }

  @All('metaverse/*')
  @UseGuards(JwtAuthGuard)
  async proxyMetaverse(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('metaverse');
    middleware(req, res, () => {});
  }

  @All('ingestion/*')
  @UseGuards(JwtAuthGuard)
  async proxyIngestion(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('ingestion');
    middleware(req, res, () => {});
  }

  @All('parsing/*')
  @UseGuards(JwtAuthGuard)
  async proxyParsing(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('parsing');
    middleware(req, res, () => {});
  }

  @All('v1/characters/*')
  @UseGuards(JwtAuthGuard)
  async proxyCharacters(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('character');
    middleware(req, res, () => {});
  }

  @All('v1/conversations/*')
  @UseGuards(JwtAuthGuard)
  async proxyConversations(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('chat');
    middleware(req, res, () => {});
  }

  @All('v1/artifacts/*')
  @UseGuards(JwtAuthGuard)
  async proxyArtifacts(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('character');
    middleware(req, res, () => {});
  }

  @All('db/*')
  async proxyDb(@Req() req: Request, @Res() res: Response) {
    // DB-Endpunkte für interne Services (ohne Auth für Python-Services)
    const middleware = this.proxyService.getProxyMiddleware('admin');
    middleware(req, res, () => {});
  }

  @All('analytics/*')
  @UseGuards(JwtAuthGuard)
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('customer-intelligence');
    middleware(req, res, () => {});
  }

  @All('crawler/*')
  @UseGuards(JwtAuthGuard)
  async proxyCrawler(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('crawler');
    middleware(req, res, () => {});
  }

  @All('voice/*')
  @UseGuards(JwtAuthGuard)
  async proxyVoice(@Req() req: Request, @Res() res: Response) {
    const middleware = this.proxyService.getProxyMiddleware('voice');
    middleware(req, res, () => {});
  }
}
