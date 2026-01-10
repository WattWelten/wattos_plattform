#!/usr/bin/env tsx
/**
 * Setup-Verifikation Script
 * 
 * Prüft ob Multi-Tenant Setup erfolgreich war
 */

import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: {
    provider: 'postgres',
    url: databaseUrl,
  },
});

async function verifySetup() {
  console.log('🔍 Verifiziere Multi-Tenant Setup...\n');

  try {
    // 1. Prüfe Tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true, slug: true, name: true },
    });
    console.log(`✅ ${tenants.length} Tenants gefunden:`);
    tenants.forEach((t) => {
      console.log(`   - ${t.name} (${t.slug})`);
    });

    if (tenants.length < 4) {
      console.warn(`⚠️  Erwartet: 4 Tenants, gefunden: ${tenants.length}`);
    }

    // 2. Prüfe Rollen
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, roleType: true, tenantId: true },
    });
    console.log(`\n✅ ${roles.length} Rollen gefunden`);

    // 3. Prüfe Users
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    console.log(`✅ ${users.length} Users gefunden`);

    // 4. Prüfe Knowledge Spaces
    const spaces = await prisma.knowledgeSpace.findMany({
      select: { id: true, name: true, tenantId: true },
    });
    console.log(`✅ ${spaces.length} Knowledge Spaces gefunden`);

    // 5. Prüfe Sources
    const sources = await prisma.source.findMany({
      select: { id: true, type: true, tenantId: true },
    });
    console.log(`✅ ${sources.length} Sources gefunden`);

    // 6. Prüfe Documents
    const documents = await prisma.document.findMany({
      select: { id: true, fileName: true },
    });
    console.log(`✅ ${documents.length} Documents gefunden`);

    // 7. Prüfe Enums
    const enumCheck = await prisma.$queryRaw`
      SELECT typname FROM pg_type 
      WHERE typname IN ('RoleType', 'FeedbackType', 'SourceType', 'Channel')
    `;
    console.log(`✅ ${(enumCheck as any[]).length} Enums gefunden`);

    // 8. Prüfe Views
    const views = await prisma.$queryRaw`
      SELECT viewname FROM pg_views 
      WHERE viewname LIKE 'vw_kpi_%'
    `;
    console.log(`✅ ${(views as any[]).length} KPI Views gefunden`);

    console.log('\n🎉 Setup-Verifikation erfolgreich!');
  } catch (error) {
    console.error('❌ Verifikation fehlgeschlagen:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifySetup().catch((e) => {
  console.error(e);
  process.exit(1);
});
