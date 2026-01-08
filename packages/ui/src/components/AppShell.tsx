import * as React from 'react';
import { cn } from '../lib/utils';

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarCollapsed?: boolean;
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, header, sidebar, footer, sidebarCollapsed = false, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex h-screen w-full flex-col overflow-hidden', className)} {...props}>
        {header && (
          <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-6">
            {header}
          </header>
        )}
        <div className="flex flex-1 overflow-hidden">
          {sidebar && (
            <aside
              className={cn(
                'flex shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300',
                sidebarCollapsed ? 'w-16' : 'w-64'
              )}
            >
              {sidebar}
            </aside>
          )}
          <main className="flex flex-1 flex-col overflow-auto bg-gray-50">{children}</main>
        </div>
        {footer && (
          <footer className="flex h-16 shrink-0 items-center border-t border-gray-200 bg-white px-6">
            {footer}
          </footer>
        )}
      </div>
    );
  }
);

AppShell.displayName = 'AppShell';

export { AppShell };
