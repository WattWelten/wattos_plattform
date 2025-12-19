'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Providers } from '../providers';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers locale="de" messages={{}}>
      <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h2 className="text-xl font-bold mb-6">Admin</h2>
        <nav className="space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start">
              Nutzer & Rollen
            </Button>
          </Link>
          <Link href="/admin/providers">
            <Button variant="ghost" className="w-full justify-start">
              LLM-Provider
            </Button>
          </Link>
          <Link href="/admin/knowledge-spaces">
            <Button variant="ghost" className="w-full justify-start">
              Wissensräume
            </Button>
          </Link>
          <Link href="/admin/agents">
            <Button variant="ghost" className="w-full justify-start">
              Agenten
            </Button>
          </Link>
          <Link href="/admin/audit">
            <Button variant="ghost" className="w-full justify-start">
              Audit-Logs
            </Button>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
    </Providers>
  );
}


