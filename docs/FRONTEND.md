# Frontend-Dokumentation

## Übersicht

Das WattOS Frontend ist eine **Next.js 16**-basierte React-Anwendung mit TypeScript, Tailwind CSS 4 und React Three Fiber für Avatar-Rendering.

## Architektur

### Tech Stack

- **Framework**: Next.js 16.1.0 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 4.1.18
- **3D Rendering**: React Three Fiber + Three.js
- **State Management**: Zustand, React Query
- **i18n**: next-intl (Deutsch, Englisch)

### Projektstruktur

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── [locale]/     # Internationalisierte Routen
│   │   ├── admin/        # Admin-Dashboard
│   │   ├── chat/         # Chat-Interface
│   │   └── lab/          # Lab-Routen (Avatar, etc.)
│   ├── components/       # React-Komponenten
│   │   ├── avatar/       # Avatar V2 (Three.js/R3F)
│   │   ├── chat/         # Chat-Komponenten
│   │   ├── dashboard/    # Dashboard-Widgets
│   │   └── ui/           # UI-Komponenten (shadcn/ui)
│   ├── lib/              # Utilities
│   │   ├── api/          # API-Clients
│   │   ├── auth.ts       # Authentifizierung
│   │   └── performance.ts # Performance-Utils
│   ├── hooks/            # Custom Hooks
│   ├── types/            # TypeScript-Typen
│   └── messages/         # i18n-Übersetzungen
├── e2e/                  # Playwright E2E-Tests
└── public/               # Statische Assets
```

## 9:16 Layout

Das Frontend verwendet ein **9:16-Layout** für optimale Mobile-Erfahrung:

- **Desktop**: ≥45 FPS
- **Mobile**: ≥30 FPS
- **DPR-Cap**: Desktop ≤2.0, Mobile ≤1.5

## A11y-Leiste

Barrierefreiheit wird durch folgende Features gewährleistet:

- **Skip-to-Content** Links
- **ARIA-Labels** auf interaktiven Elementen
- **Keyboard-Navigation** vollständig unterstützt
- **Screen-Reader** kompatibel
- **Focus-Management** für Modals/Dialogs

## Chat-Seam

Das Chat-Interface bietet:

- **WebSocket/SSE** für Echtzeit-Kommunikation
- **Streaming-Responses** mit Chunk-Rendering
- **Citation-Support** für RAG-Quellen
- **Multi-LLM-Switching** zur Laufzeit
- **Message-History** mit Persistierung

## State-Flow

```
User Input → Chat Store (Zustand) → API Client → WebSocket → Backend
                                                              ↓
Response ← Chat Store ← API Client ← WebSocket ← Backend
```

## Performance-Optimierungen

### DPR-Cap

```typescript
import { getCappedDPR } from '@/lib/performance';

// Desktop: max 2.0, Mobile: max 1.5
const dpr = getCappedDPR();
```

### Web Vitals Monitoring

```typescript
import { WebVitalsOverlay } from '@/components/performance/WebVitalsOverlay';

// In Dev-Mode: Ctrl+V zum Toggle
<WebVitalsOverlay enabled={process.env.NODE_ENV === 'development'} />
```

### Code-Splitting

- **Route-based**: Automatisch durch Next.js App Router
- **Component-based**: `lazy()` für große Komponenten
- **Dynamic Imports**: `next/dynamic` für Avatar-Komponenten

## Avatar-Integration

### Avatar V2 (Three.js/R3F)

- **Morph-Handling**: Head/Teeth/Tongue-Lookup
- **Viseme-Support**: 15+ Visemes (AA, PP, TH, etc.)
- **Lab-Route**: `/lab/avatar` für QA-Tests
- **Performance**: DPR-Cap, Decay-Glättung (λ=12)

Siehe [AVATAR.md](./AVATAR.md) für Details.

## API-Client

Typisierte API-Clients für alle Services:

```typescript
import { createConversation, sendMessage } from '@/lib/api/conversations';
import { listCharacters } from '@/lib/api/characters';
import { createKnowledgeSpace } from '@/lib/api/knowledge-spaces';
```

## Testing

### E2E Tests (Playwright)

```bash
pnpm test:e2e          # Alle E2E-Tests
pnpm test:e2e:ui       # UI-Mode
pnpm test:smoke        # Smoke-Tests
```

### Unit Tests (Vitest)

```bash
pnpm test              # Alle Unit-Tests
pnpm test:watch        # Watch-Mode
pnpm test:coverage     # Coverage-Report
```

## Development

### Lokale Entwicklung

```bash
cd apps/web
pnpm install
pnpm dev              # Startet auf http://localhost:3000
```

### Build

```bash
pnpm build            # Production-Build
pnpm start            # Production-Server
```

## Deployment

### Vercel (Empfohlen)

1. Repository mit Vercel verbinden
2. Root Directory: `apps/web`
3. Build Command: `pnpm build`
4. Output Directory: `.next`

### Environment Variables

Siehe [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) für vollständige Liste.

**Wichtig für Frontend:**
- `NEXT_PUBLIC_API_URL` - API Gateway URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL (optional)

## Best Practices

1. **Type-Safety**: Immer TypeScript-Typen verwenden
2. **Performance**: Lazy-Loading für große Komponenten
3. **Accessibility**: ARIA-Labels, Keyboard-Navigation
4. **i18n**: Alle Texte über `next-intl`
5. **Error-Handling**: Try-Catch mit User-Feedback

