import Link from 'next/link';

export default function BranchenPage() {
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
        <h1 className="text-4xl font-bold mb-8">Branchen</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/branchen/kmu" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">KMU & Mittelstand</h2>
            <p className="text-gray-600 mb-4">
              Kosteneffiziente KI-Lösungen für kleine und mittlere Unternehmen.
              Schneller Einstieg, skalierbar.
            </p>
            <span className="text-primary-600 font-medium">Mehr erfahren →</span>
          </Link>

          <Link href="/branchen/verwaltung" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Verwaltung & Behörden</h2>
            <p className="text-gray-600 mb-4">
              DSGVO-konforme Lösungen für Behörden und öffentliche Verwaltung.
              EU-Hosting garantiert.
            </p>
            <span className="text-primary-600 font-medium">Mehr erfahren →</span>
          </Link>

          <Link href="/branchen/schule" className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold mb-4">Schulen & Bildung</h2>
            <p className="text-gray-600 mb-4">
              KI-gestützte Lernplattformen. Personalisierte Unterstützung
              für Schüler und Lehrer.
            </p>
            <span className="text-primary-600 font-medium">Mehr erfahren →</span>
          </Link>

          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Weitere Branchen</h2>
            <p className="text-gray-600 mb-4">
              Wir entwickeln maßgeschneiderte Lösungen für Ihre Branche.
            </p>
            <Link href="/kontakt" className="text-primary-600 font-medium">
              Kontakt aufnehmen →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

