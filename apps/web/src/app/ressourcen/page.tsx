import Link from 'next/link';

export default function RessourcenPage() {
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
        <h1 className="text-4xl font-bold mb-8">Ressourcen</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Dokumentation</h2>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-primary-600 hover:underline">
                  API-Dokumentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-600 hover:underline">
                  Entwickler-Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-600 hover:underline">
                  Best Practices
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Blog</h2>
            <p className="text-gray-600">
              Aktuelle Artikel zu KI, DSGVO-Compliance und Best Practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Support</h2>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-primary-600 hover:underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-primary-600 hover:underline">
                  Community-Forum
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-primary-600 hover:underline">
                  Kontakt
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}


