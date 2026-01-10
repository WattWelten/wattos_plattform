#!/usr/bin/env tsx
/**
 * Seed Script für Multi-Tenant Demo-Daten
 * 
 * Erstellt 4 Demo-Tenants:
 * - musterlandkreis (public)
 * - musterschule (public)
 * - musterkmu (kmu)
 * - musterklinik (health)
 * 
 * Für jeden Tenant:
 * - Tenant mit Config
 * - Users mit Rollen (ADMIN/EDITOR/VIEWER)
 * - Knowledge Spaces
 * - Sources
 * - Sample Documents
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PrismaClient, RoleType } from '@prisma/client';

// Prisma 7.2.0+: DATABASE_URL wird automatisch aus Umgebungsvariablen gelesen
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const prisma = new PrismaClient({
  adapter: {
    provider: 'postgres',
    url: databaseUrl,
  },
});

/**
 * Lade YAML-Datei
 */
function loadYaml(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (error) {
    console.error(`Failed to load YAML from ${filePath}:`, error);
    return null;
  }
}

/**
 * Lade CSV-Datei
 */
function loadCSV(filePath: string): UserRow[] {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return [];

    const [header, ...rows] = lines;
    const idx = header.split(',').map((s) => s.trim());

    return rows.map((r) => {
      const cols = r.split(',').map((s) => s.trim());
      const obj: Partial<UserRow> = {};
      idx.forEach((k, i) => {
        if (k === 'email' || k === 'role' || k === 'name') {
          obj[k as keyof UserRow] = cols[i] as string;
        }
      });
      return obj as UserRow;
    });
  } catch (error) {
    console.error(`Failed to load CSV from ${filePath}:`, error);
    return [];
  }
}

/**
 * Erstelle oder aktualisiere Tenant
 */
async function ensureTenant(
  slug: string,
  name: string,
  vertical: string,
  configPath?: string,
) {
  let settings: Record<string, unknown> = {};

  // Lade Config aus YAML falls vorhanden
  if (configPath && fs.existsSync(configPath)) {
    const config = loadYaml(configPath);
    if (config) {
      settings = {
        branding: config.branding,
        officeHours: config.officeHours,
        metrics: config.metrics,
        ui: config.ui,
      };
    }
  }

  return prisma.tenant.upsert({
    where: { slug },
    update: { name, settings },
    create: { slug, name, settings },
  });
}

/**
 * Erstelle oder aktualisiere User
 */
async function ensureUser(email: string, name: string, tenantId: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: {
      email,
      name,
      tenantId,
    },
  });
}

/**
 * Erstelle oder aktualisiere Role mit RoleType
 */
async function ensureRole(
  tenantId: string,
  roleType: RoleType,
  name?: string,
): Promise<string> {
  const roleName = name || roleType.toLowerCase();
  const role = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId,
        name: roleName,
      },
    },
    update: { roleType },
    create: {
      tenantId,
      name: roleName,
      roleType,
      permissions: [],
    },
  });
  return role.id;
}

/**
 * Erstelle UserRole-Verknüpfung
 */
async function ensureUserRole(userId: string, roleId: string) {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      userId,
      roleId,
    },
  });
}

/**
 * Seed einen Tenant
 */
async function seedTenant(slug: string) {
  console.log(`\n🌱 Seeding tenant: ${slug}`);

  // 1. Lade Config
  const configPath = path.resolve(`configs/tenants/${slug}.yaml`);
  const cfg = loadYaml(configPath);
  if (!cfg || !cfg.tenant) {
    console.error(`❌ Config not found or invalid for ${slug}`);
    return;
  }

  // 2. Erstelle Tenant
  const tenant = await ensureTenant(
    cfg.tenant.slug,
    cfg.tenant.name,
    cfg.tenant.vertical,
    configPath,
  );
  console.log(`  ✅ Tenant: ${tenant.name} (${tenant.id})`);

  // 3. Erstelle Rollen
  const adminRoleId = await ensureRole(tenant.id, RoleType.ADMIN);
  const editorRoleId = await ensureRole(tenant.id, RoleType.EDITOR);
  const viewerRoleId = await ensureRole(tenant.id, RoleType.VIEWER);
  console.log(`  ✅ Roles created`);

  // 4. Lade und erstelle Users
  const usersPath = path.resolve(`seeds/tenants/${slug}/users.csv`);
  const users = loadCSV(usersPath);
  for (const u of users) {
    const user = await ensureUser(u.email, u.name, tenant.id);

    // Mappe Role-String zu RoleType
    let roleId: string;
    if (u.role.toUpperCase() === 'ADMIN') {
      roleId = adminRoleId;
    } else if (u.role.toUpperCase() === 'EDITOR') {
      roleId = editorRoleId;
    } else {
      roleId = viewerRoleId;
    }

    await ensureUserRole(user.id, roleId);
    console.log(`  ✅ User: ${u.email} (${u.role})`);
  }

  // 5. Erstelle Knowledge Spaces
  const spacesPath = path.resolve(`seeds/tenants/${slug}/knowledge_spaces.yaml`);
  const spaces = loadYaml(spacesPath);
  if (Array.isArray(spaces)) {
    for (const s of spaces) {
      await prisma.knowledgeSpace.upsert({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: s.name,
          },
        },
        update: { description: s.purpose },
        create: {
          tenantId: tenant.id,
          name: s.name,
          description: s.purpose,
        },
      });
      console.log(`  ✅ Knowledge Space: ${s.name}`);
    }
  }

  // 6. Erstelle Sources
  const sourcesPath = path.resolve(`seeds/tenants/${slug}/sources.yaml`);
  const sources = loadYaml(sourcesPath);
  if (Array.isArray(sources)) {
    const firstSpace = await prisma.knowledgeSpace.findFirst({
      where: { tenantId: tenant.id },
    });

    if (firstSpace) {
      for (const src of sources as SourceRow[]) {
        await prisma.source.create({
          data: {
            tenantId: tenant.id,
            spaceId: firstSpace.id,
            type: src.type,
            config: src.config || {},
            status: 'active',
            url: src.config?.url || src.config?.path || '',
            enabled: true,
          },
        });
        console.log(`  ✅ Source: ${src.type}`);
      }
    }
  }

  // 7. Erstelle Sample Documents
  const docsPath = path.resolve(`seeds/tenants/${slug}/docs`);
  if (fs.existsSync(docsPath)) {
    const firstSpace = await prisma.knowledgeSpace.findFirst({
      where: { tenantId: tenant.id },
    });

    if (firstSpace) {
      const files = fs.readdirSync(docsPath).filter((f) =>
        /\.(md|txt|pdf)$/i.test(f),
      );

      for (const file of files) {
        const filePath = path.join(docsPath, file);
        const stats = fs.statSync(filePath);

        await prisma.document.create({
          data: {
            knowledgeSpaceId: firstSpace.id,
            fileName: file,
            filePath: filePath,
            fileType: path.extname(file).slice(1),
            fileSize: BigInt(stats.size),
            metadata: {
              source: 'seed-script',
              tenant: slug,
            },
          },
        });
        console.log(`  ✅ Document: ${file}`);
      }
    }
  }

  console.log(`  ✅ Tenant ${slug} seeded successfully`);
}

/**
 * Main
 */
async function main() {
  console.log('🌱 Starting tenant seed script...\n');

  const slugs = ['musterlandkreis', 'musterschule', 'musterkmu', 'musterklinik'];

  try {
    for (const slug of slugs) {
      await seedTenant(slug);
    }

    console.log('\n✅ All tenants seeded successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
