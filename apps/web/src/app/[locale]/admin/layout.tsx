'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Link, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useParams } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || 'de';

  return (
    <AuthGuard requiredRoles={['admin']} requireAnyRole={false}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-gray-50 p-4">
          <h2 className="text-xl font-bold mb-6">Admin</h2>
          <nav className="space-y-2">
            <Link href="/admin/dashboard" locale={locale}>
              <Button variant="ghost" className="w-full justify-start">
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/users" locale={locale}>
              <Button variant="ghost" className="w-full justify-start">
                Nutzer & Rollen
              </Button>
            </Link>
            <Link href="/admin/providers" locale={locale}>
              <Button variant="ghost" className="w-full justify-start">
                LLM-Provider
              </Button>
            </Link>
            <Link href="/admin/knowledge-spaces" locale={locale}>
              <Button variant="ghost" className="w-full justify-start">
                Wissensräume
              </Button>
            </Link>
            <Link href="/admin/agents" locale={locale}>
              <Button variant="ghost" className="w-full justify-start">
                Agenten
              </Button>
            </Link>
            <Link href="/admin/audit" locale={locale}>
              <Button variant="ghost" className="w-full justify-start">
                Audit-Logs
              </Button>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

