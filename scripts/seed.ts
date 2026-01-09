#!/usr/bin/env tsx
/**
 * Seed Script für Demo-Daten
 * Erstellt Demo-Users, Rollen, Knowledge Spaces und Sample-Content für Top-5-Demos
 */

// Direct import from Prisma Client (workspace packages not needed for seed script)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Top-5-Demos basierend auf Plan
const DEMOS = [
  {
    name: 'Bürger-Service',
    slug: 'buerger-service',
    description: 'KI-Assistent für Bürgeranfragen und Verwaltungsservices',
    sampleContent: [
      {
        fileName: 'buergeramt-faq.md',
        content: `# Bürgeramt FAQ

## Öffnungszeiten
Das Bürgeramt ist montags bis freitags von 8:00 bis 18:00 Uhr geöffnet.

## Terminvereinbarung
Termine können online über unser Portal oder telefonisch vereinbart werden.

## Ausweisdokumente
Für die Beantragung eines neuen Personalausweises benötigen Sie:
- Gültiges Ausweisdokument oder Reisepass
- Aktuelles Passfoto
- Gebühr von 37,00 EUR

## Meldebescheinigung
Eine Meldebescheinigung erhalten Sie gegen Vorlage eines gültigen Ausweises.
Die Gebühr beträgt 5,00 EUR.`,
      },
      {
        fileName: 'wohnsitz-anmeldung.md',
        content: `# Wohnsitzanmeldung

## Anmeldung bei der Stadt
Wenn Sie in unsere Stadt ziehen, müssen Sie sich innerhalb von 14 Tagen anmelden.

## Benötigte Unterlagen
- Personalausweis oder Reisepass
- Mietvertrag oder Eigentumsnachweis
- Bei Familien: Geburtsurkunden der Kinder

## Kosten
Die Anmeldung ist kostenlos.`,
      },
    ],
  },
  {
    name: 'Stadt-Marketing',
    slug: 'stadt-marketing',
    description: 'Marketing-Assistent für Stadtverwaltung und Tourismus',
    sampleContent: [
      {
        fileName: 'tourismus-highlights.md',
        content: `# Tourismus-Highlights unserer Stadt

## Sehenswürdigkeiten
- Historisches Rathaus aus dem 15. Jahrhundert
- Stadtmuseum mit regionaler Geschichte
- Schlosspark mit botanischem Garten
- Altstadt mit Fachwerkhäusern

## Veranstaltungen
- Stadtfest: Jedes Jahr im August
- Weihnachtsmarkt: Vom 1. Advent bis Heiligabend
- Kulturwoche: Im Frühjahr mit Konzerten und Ausstellungen

## Gastronomie
Unsere Stadt bietet eine vielfältige Gastronomieszene mit regionalen Spezialitäten.`,
      },
      {
        fileName: 'stadtmarketing-strategie.md',
        content: `# Stadtmarketing-Strategie 2026

## Ziele
- Steigerung der Übernachtungszahlen um 15%
- Erhöhung der Bekanntheit der Stadt
- Attraktivität für neue Einwohner steigern

## Zielgruppen
- Familien mit Kindern
- Senioren
- Geschäftsreisende
- Tagestouristen`,
      },
    ],
  },
  {
    name: 'Schul-FAQ',
    slug: 'schul-faq',
    description: 'FAQ-Assistent für Schulen und Eltern',
    sampleContent: [
      {
        fileName: 'schulanmeldung.md',
        content: `# Schulanmeldung

## Anmeldefristen
Die Anmeldung für das neue Schuljahr erfolgt vom 1. bis 15. März.

## Benötigte Unterlagen
- Geburtsurkunde des Kindes
- Impfpass
- Meldebescheinigung
- Sorgerechtsbescheid (falls zutreffend)

## Schulbezirke
Die Zuweisung erfolgt nach Schulbezirken. Ausnahmen sind möglich bei besonderen Gründen.`,
      },
      {
        fileName: 'ferienzeiten.md',
        content: `# Ferienzeiten 2026

## Herbstferien
15.10.2026 - 28.10.2026

## Weihnachtsferien
23.12.2026 - 06.01.2027

## Osterferien
03.04.2027 - 14.04.2027

## Sommerferien
24.07.2027 - 05.09.2027`,
      },
      {
        fileName: 'unterrichtszeiten.md',
        content: `# Unterrichtszeiten

## Grundschule
- Unterrichtsbeginn: 8:00 Uhr
- Unterrichtsende: 12:00 Uhr (Klasse 1-2) oder 13:00 Uhr (Klasse 3-4)
- Betreuung: Bis 16:00 Uhr möglich

## Weiterführende Schulen
- Unterrichtsbeginn: 7:45 Uhr
- Unterrichtsende: Je nach Stundenplan bis 15:30 Uhr`,
      },
    ],
  },
  {
    name: 'KMU-Kunde',
    slug: 'kmu-kunde',
    description: 'Kunden-Support-Assistent für kleine und mittlere Unternehmen',
    sampleContent: [
      {
        fileName: 'produktkatalog.md',
        content: `# Produktkatalog

## Unsere Produkte
- Büroausstattung
- IT-Lösungen
- Beratungsdienstleistungen
- Wartung und Support

## Preise
Alle Preise finden Sie in unserem Online-Shop oder kontaktieren Sie uns für ein individuelles Angebot.

## Lieferzeiten
Standardlieferung: 3-5 Werktage
Expresslieferung: 1-2 Werktage (gegen Aufpreis)`,
      },
      {
        fileName: 'support-prozess.md',
        content: `# Support-Prozess

## Kontakt
- E-Mail: support@firma.de
- Telefon: 0800-123456 (kostenlos)
- Chat: Mo-Fr 9-18 Uhr

## Reaktionszeiten
- E-Mail: Innerhalb von 24 Stunden
- Telefon: Sofort während Geschäftszeiten
- Chat: Sofort während Geschäftszeiten`,
      },
    ],
  },
  {
    name: 'KMU-Mitarbeiter',
    slug: 'kmu-mitarbeiter',
    description: 'Interne Wissensdatenbank für Mitarbeiter',
    sampleContent: [
      {
        fileName: 'arbeitszeiten.md',
        content: `# Arbeitszeiten und Urlaub

## Kernarbeitszeit
Mo-Fr: 9:00 - 15:00 Uhr (Anwesenheitspflicht)
Gleitzeit: 7:00 - 9:00 Uhr und 15:00 - 19:00 Uhr

## Urlaubsanspruch
- Vollzeit: 30 Tage pro Jahr
- Teilzeit: Pro rata

## Urlaubsantrag
Urlaubsanträge müssen mindestens 2 Wochen im Voraus gestellt werden.`,
      },
      {
        fileName: 'it-support.md',
        content: `# IT-Support

## Passwort zurücksetzen
Kontaktieren Sie den IT-Support unter it-support@firma.de oder rufen Sie die Hotline an.

## Software-Installation
Software-Installationen müssen über den IT-Support erfolgen. Bitte stellen Sie einen Antrag.

## Druckerprobleme
Bei Druckerproblemen wenden Sie sich bitte an den IT-Support.`,
      },
      {
        fileName: 'geschaeftsprozesse.md',
        content: `# Geschäftsprozesse

## Rechnungsstellung
Rechnungen werden monatlich am 1. des Folgemonats erstellt.

## Bestellprozess
Bestellungen über 500 EUR benötigen die Genehmigung des Vorgesetzten.

## Kundenkommunikation
Alle Kundenkommunikation sollte über unser CRM-System erfolgen.`,
      },
    ],
  },
] as const;

async function main() {
  console.log('🌱 Starting seed script...\n');

  try {
    // 1. Erstelle Demo-Tenant
    console.log('📦 Creating demo tenant...');
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'demo' },
      update: {},
      create: {
        name: 'Demo Tenant',
        slug: 'demo',
        settings: {
          language: 'de',
          timezone: 'Europe/Berlin',
        },
      },
    });
    console.log(`✅ Tenant created: ${tenant.id}\n`);

    // 2. Erstelle Rollen
    console.log('👥 Creating roles...');
    const roles = await Promise.all(
      ['admin', 'editor', 'viewer'].map(async (roleName) => {
    const existingRole = await prisma.role.findFirst({
      where: {
        tenantId: tenant.id,
        name: roleName,
      },
    });

    const role = existingRole || await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: roleName,
        permissions: getPermissionsForRole(roleName),
      },
    });
        console.log(`  ✅ Role created: ${roleName}`);
        return role;
      })
    );
    console.log('');

    // 3. Erstelle Demo-Users
    console.log('👤 Creating demo users...');
    const users = await Promise.all(
      [
        { email: 'admin@demo.de', role: 'admin', name: 'Admin User' },
        { email: 'editor@demo.de', role: 'editor', name: 'Editor User' },
        { email: 'viewer@demo.de', role: 'viewer', name: 'Viewer User' },
      ].map(async ({ email, role: roleName, name }) => {
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            tenantId: tenant.id,
            email,
            keycloakId: `demo-${email}`,
          },
        });

        // Weise Rolle zu
        const role = roles.find((r) => r.name === roleName);
        if (role) {
          await prisma.userRole.upsert({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: role.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              roleId: role.id,
            },
          });
        }

        console.log(`  ✅ User created: ${email} (${roleName})`);
        return user;
      })
    );
    console.log('');

    // 4. Erstelle Knowledge Spaces für Demos
    console.log('📚 Creating knowledge spaces...');
    const knowledgeSpaces = await Promise.all(
      DEMOS.map(async (demo) => {
    // Prüfe ob Knowledge Space bereits existiert
    const existing = await prisma.knowledgeSpace.findFirst({
      where: {
        tenantId: tenant.id,
        name: demo.name,
      },
    });

    const knowledgeSpace = existing || await prisma.knowledgeSpace.create({
      data: {
        tenantId: tenant.id,
        name: demo.name,
        description: demo.description,
        settings: {
          demo: true,
          slug: demo.slug,
        },
      },
    });
        console.log(`  ✅ Knowledge Space created: ${demo.name}`);
        return { ...knowledgeSpace, demo };
      })
    );
    console.log('');

    // 5. Erstelle Sample-Documents für jeden Knowledge Space
    console.log('📄 Creating sample documents...');
    let totalDocuments = 0;
    for (const knowledgeSpace of knowledgeSpaces) {
      for (const sample of knowledgeSpace.demo.sampleContent) {
        const document = await prisma.document.create({
          data: {
            knowledgeSpaceId: knowledgeSpace.id,
            fileName: sample.fileName,
            filePath: `demo/${knowledgeSpace.demo.slug}/${sample.fileName}`,
            fileType: 'text/markdown',
            fileSize: BigInt(sample.content.length),
            metadata: {
              demo: true,
              source: 'seed-script',
            },
          },
        });
        
        // Erstelle einfache Chunks ohne Embeddings (können später über RAG-Service verarbeitet werden)
        // Chunking: Einfache Aufteilung nach Absätzen
        const paragraphs = sample.content.split('\n\n').filter(p => p.trim().length > 0);
        let chunkIndex = 0;
        for (const paragraph of paragraphs) {
          if (paragraph.trim().length > 50) { // Nur Absätze mit mindestens 50 Zeichen
            const chunkId = `${document.id}-chunk-${chunkIndex}`;
            await prisma.chunk.create({
              data: {
                id: chunkId,
                documentId: document.id,
                content: paragraph.trim(),
                chunkIndex: chunkIndex++,
                metadata: {
                  demo: true,
                  source: 'seed-script',
                  fileName: sample.fileName,
                },
                // Embedding wird später über RAG-Service generiert
                embedding: null,
              },
            });
          }
        }
        
        console.log(`  ✅ Document created: ${sample.fileName} in ${knowledgeSpace.demo.name} (${chunkIndex} chunks)`);
        totalDocuments++;
      }
    }
    console.log('');

    // 6. Zähle Chunks
    const totalChunks = await prisma.chunk.count({
      where: {
        document: {
          knowledgeSpace: {
            tenantId: tenant.id,
          },
        },
      },
    });

    console.log('✅ Seed script completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - 1 Tenant`);
    console.log(`  - ${roles.length} Roles`);
    console.log(`  - ${users.length} Users`);
    console.log(`  - ${knowledgeSpaces.length} Knowledge Spaces`);
    console.log(`  - ${totalDocuments} Documents`);
    console.log(`  - ${totalChunks} Chunks (ohne Embeddings - können später über RAG-Service verarbeitet werden)`);
    console.log('\n💡 Tip: Um Embeddings zu generieren, verwenden Sie den RAG-Service Ingestion-Endpoint.');
  } catch (error) {
    console.error('❌ Seed script failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getPermissionsForRole(roleName: string): any[] {
  switch (roleName) {
    case 'admin':
      return [
        { resource: '*', action: '*' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'update' },
        { resource: 'users', action: 'delete' },
        { resource: 'knowledge-spaces', action: '*' },
        { resource: 'agents', action: '*' },
      ];
    case 'editor':
      return [
        { resource: 'knowledge-spaces', action: 'read' },
        { resource: 'knowledge-spaces', action: 'update' },
        { resource: 'documents', action: '*' },
        { resource: 'agents', action: 'read' },
        { resource: 'agents', action: 'update' },
      ];
    case 'viewer':
      return [
        { resource: 'knowledge-spaces', action: 'read' },
        { resource: 'documents', action: 'read' },
        { resource: 'agents', action: 'read' },
      ];
    default:
      return [];
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
