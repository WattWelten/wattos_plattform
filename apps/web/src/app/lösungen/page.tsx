import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LösungenPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            WattWeiser
          </Link>
          <nav className="flex gap-4">
            <Link href="/lösungen">Lösungen</Link>
            <Link href="/branchen">Branchen</Link>
            <Link href="/ressourcen">Ressourcen</Link>
            <Link href="/partner">Partner</Link>
            <Link href="/kontakt">Kontakt</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-8">Unsere Lösungen</h1>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Multi-LLM-Hub</h2>
            <p className="text-gray-600 mb-4">
              Nutzen Sie verschiedene LLM-Provider (OpenAI, Anthropic, Google)
              über eine einheitliche API. Automatisches Fallback und
              Kostenoptimierung inklusive.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>OpenAI-kompatible API</li>
              <li>Multi-Provider-Support</li>
              <li>Automatisches Fallback</li>
              <li>Kosten-Tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">RAG (Retrieval-Augmented Generation)</h2>
            <p className="text-gray-600 mb-4">
              Integrieren Sie Ihr Unternehmenswissen in KI-Gespräche. Mit
              Vector-Search und automatischer Citation-Generierung.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Wissensräume verwalten</li>
              <li>Dokumente automatisch indexieren</li>
              <li>Vector-Search mit pgvector/OpenSearch</li>
              <li>Automatische Citations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Digitale Mitarbeiter (WattWorkers)</h2>
            <p className="text-gray-600 mb-4">
              Vorkonfigurierte Agenten für verschiedene Aufgabenbereiche. Mit
              LangGraph-Orchestrierung und Human-in-the-Loop.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>IT-Support Assist</li>
              <li>Sales-Assistenz</li>
              <li>Meeting-Protokollierer</li>
              <li>Marketing-Assistenz</li>
              <li>Rechts-Assistenz</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">KI-Avatare & Metaverse</h2>
            <p className="text-gray-600 mb-4">
              2D/3D-Avatare mit WebRTC, TTS/STT und browser-basiertem Metaverse.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>2D/3D-Avatare</li>
              <li>WebRTC-Integration</li>
              <li>Text-to-Speech / Speech-to-Text</li>
              <li>Metaverse-Erlebnisse</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register">
            <Button size="lg">Jetzt starten</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}


