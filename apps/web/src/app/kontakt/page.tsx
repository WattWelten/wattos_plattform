'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function KontaktPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Form submission
    console.log('Form submitted:', formData);
  };

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
        <h1 className="text-4xl font-bold mb-8">Kontakt</h1>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Nachricht
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full">
              Absenden
            </Button>
          </form>

          <div className="mt-12 text-center text-gray-600">
            <p>Oder kontaktieren Sie uns direkt:</p>
            <p className="mt-2">E-Mail: kontakt@wattweiser.de</p>
            <p>Telefon: +49 (0) XXX XXX XXX</p>
          </div>
        </div>
      </main>
    </div>
  );
}


