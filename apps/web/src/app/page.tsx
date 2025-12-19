import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">WattWeiser</div>
          <nav className="flex gap-4">
            <Link href="/lösungen">Lösungen</Link>
            <Link href="/branchen">Branchen</Link>
            <Link href="/ressourcen">Ressourcen</Link>
            <Link href="/partner">Partner</Link>
            <Link href="/kontakt">Kontakt</Link>
          </nav>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button>Registrieren</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            KI-Plattform für Ihr Unternehmen
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Modulare, DSGVO-konforme KI-Lösungen mit Multi-LLM-Support,
            RAG und Digitalen Mitarbeitern
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Jetzt starten</Button>
            </Link>
            <Link href="/lösungen">
              <Button size="lg" variant="outline">
                Mehr erfahren
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Ihre Vorteile
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">DSGVO-konform</h3>
              <p className="text-gray-600">
                Alle Daten bleiben in der EU. Vollständige Kontrolle über Ihre
                Daten.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Multi-LLM</h3>
              <p className="text-gray-600">
                Unterstützung für OpenAI, Anthropic, Google und lokale Modelle.
                Flexibel und kosteneffizient.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Digitale Mitarbeiter</h3>
              <p className="text-gray-600">
                Vorkonfigurierte Agenten für IT-Support, Sales, Marketing und
                mehr.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 WattWeiser. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}


