/**
 * Tenants Controller
 * 
 * API-Endpunkte für Tenant-Verwaltung
 */

import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllTenants() {
    const tenants = await this.prisma.client.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        settings: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
    }));
  }

  @Get(':slug')
  async getTenantBySlug(@Param('slug') slug: string) {
    const tenant = await this.prisma.client.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        settings: true,
      },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${slug}`);
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    };
  }
}
