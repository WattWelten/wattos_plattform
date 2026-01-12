#!/usr/bin/env tsx
/**
 * Erstellt Test-User für Login-Tests
 */

import 'dotenv/config';
import { PrismaClient, RoleType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://wattos:wattos_dev_password@localhost:5432/wattos_plattform';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Creating test user...\n');
  
  // Finde oder erstelle einen Tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: 'default',
        name: 'Default Tenant',
        settings: {},
      },
    });
    console.log('✅ Created default tenant:', tenant.name);
  } else {
    console.log('✅ Using existing tenant:', tenant.name);
  }
  
  // Erstelle oder aktualisiere User
  const user = await prisma.user.upsert({
    where: { email: 'admin@wattweiser.com' },
    update: {},
    create: {
      email: 'admin@wattweiser.com',
      tenantId: tenant.id,
      keycloakId: 'admin-wattweiser-keycloak-id',
    },
  });
  
  console.log('✅ User created/updated:', user.email);
  console.log('\n✅ Test user ready: admin@wattweiser.com');
  console.log('   (Rolle wird für Mock-Login nicht benötigt)');
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
