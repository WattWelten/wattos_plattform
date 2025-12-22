'use client';

import { Logo } from '@wattweiser/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@wattweiser/ui';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuthContext } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Users,
  Settings,
  Flag,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Tenants', href: '/tenants', icon: Users },
  { name: 'Ops', href: '/ops', icon: Settings },
  { name: 'Flags', href: '/flags', icon: Flag },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  return (
    <AuthGuard requiredRoles={['admin', 'superadmin']}>
      <a href="#main-content" className="skip-link">
        Zum Hauptinhalt springen
      </a>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col" aria-label="Hauptnavigation">
          <div className="p-6 border-b border-gray-200">
            <Logo size="md" />
          </div>
          <nav className="flex-1 p-4 space-y-1" aria-label="Seitennavigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="mb-2 px-4 py-2 text-sm text-gray-600">
              {user?.email}
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Abmelden"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              Abmelden
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main id="main-content" className="flex-1 overflow-y-auto" role="main" tabIndex={-1}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}

