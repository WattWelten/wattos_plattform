import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PartnerPage() {
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
        <h1 className="text-4xl font-bold mb-8">Partner werden</h1>

        <div className="max-w-3xl mx-auto">
          <p className="text-lg text-gray-600 mb-8">
            Werden Sie Partner von WattWeiser und bieten Sie Ihren Kunden
            DSGVO-konforme KI-Lösungen an.
          </p>

          <div className="space-y-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Vorteile für Partner</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>White-Label-Lösungen</li>
                <li>Technischer Support</li>
                <li>Marketing-Materialien</li>
                <li>Attraktive Provisionen</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Partner-Anforderungen</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Erfahrung im IT-Bereich</li>
                <li>Kundenstamm in relevanten Branchen</li>
                <li>Commitment zu DSGVO-Compliance</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link href="/kontakt">
              <Button size="lg">Kontakt aufnehmen</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}


