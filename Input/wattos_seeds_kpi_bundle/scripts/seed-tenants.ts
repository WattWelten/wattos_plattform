import fs from 'node:fs'; import path from 'node:path'; import yaml from 'js-yaml'; import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();
function loadYaml(p: string): any { return yaml.load(fs.readFileSync(p, 'utf8')); }
function loadCSV(p: string): { email: string; role: string; name: string }[] {
  const raw = fs.readFileSync(p, 'utf8').trim().split(/\r?\n/);
  const [header, ...rows] = raw; const idx = header.split(',').map((s) => s.trim());
  return rows.map((r) => { const cols = r.split(',').map((s) => s.trim()); const o:any = {}; idx.forEach((k, i) => o[k]=cols[i]); return o; });
}
async function ensureTenant(slug: string, name: string, vertical: string) { return prisma.tenant.upsert({ where: { slug }, update: { name, vertical }, create: { slug, name, vertical } }); }
async function ensureUser(email: string, name: string) { return prisma.user.upsert({ where: { email }, update: { name }, create: { email, name } }); }
async function ensureMembership(tenantId: string, userId: string, role: Role) { return prisma.membership.upsert({ where: { tenantId_userId: { tenantId, userId } }, update: { role }, create: { tenantId, userId, role } }); }
async function run() {
  const slugs = ['musterlandkreis','musterschule','musterkmu','musterklinik'];
  for (const slug of slugs) {
    const cfg = loadYaml(path.resolve(`configs/tenants/${slug}.yaml`));
    const tenant = await ensureTenant(cfg.tenant.slug, cfg.tenant.name, cfg.tenant.vertical);
    const users = loadCSV(path.resolve(`seeds/tenants/${slug}/users.csv`));
    for (const u of users) { const user = await ensureUser(u.email, u.name); await ensureMembership(tenant.id, user.id, (u.role as Role)); }
    const spaces = loadYaml(path.resolve(`seeds/tenants/${slug}/knowledge_spaces.yaml`));
    for (const s of spaces) { await prisma.knowledgeSpace.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: s.name } }, update: { purpose: s.purpose }, create: { tenantId: tenant.id, name: s.name, purpose: s.purpose } }); }
    const srcs = loadYaml(path.resolve(`seeds/tenants/${slug}/sources.yaml`));
    const firstSpace = await prisma.knowledgeSpace.findFirst({ where: { tenantId: tenant.id } });
    for (const src of srcs) { await prisma.source.create({ data: { tenantId: tenant.id, spaceId: firstSpace!.id, type: src.type, config: src.config, status: 'active' } }); }
    const docPath = path.resolve(`seeds/tenants/${slug}/docs/seed.md`);
    await prisma.document.create({ data: { tenantId: tenant.id, spaceId: firstSpace!.id, title: 'seed.md', mime: 'text/markdown', url: docPath, sizeBytes: fs.statSync(docPath).size } });
    console.log('Seeded tenant:', slug);
  } await prisma.$disconnect();
} run().catch((e) => { console.error(e); process.exit(1); });
