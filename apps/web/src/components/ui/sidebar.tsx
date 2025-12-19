'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined,
);

export function Sidebar({ children, className }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        className={cn(
          'flex flex-col border-r bg-gray-50 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          className,
        )}
      >
        {children}
      </aside>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within Sidebar');
  }
  return context;
}

export function SidebarHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b p-4',
        className,
      )}
    >
      {!collapsed && <div className="flex-1">{children}</div>}
      <SidebarToggle />
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav className={cn('flex-1 space-y-1 p-4', className)}>{children}</nav>
  );
}

export function SidebarFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-t p-4', className)}>{children}</div>
  );
}

export function SidebarToggle() {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <button
      onClick={() => setCollapsed(!collapsed)}
      className="rounded-md p-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label={collapsed ? 'Sidebar erweitern' : 'Sidebar minimieren'}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </button>
  );
}

export function SidebarItem({
  children,
  active,
  className,
  ...props
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { collapsed } = useSidebar();

  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-700 hover:bg-gray-200',
        collapsed && 'justify-center',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}


