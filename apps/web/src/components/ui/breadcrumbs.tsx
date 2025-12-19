import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="flex items-center hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Startseite</span>
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}


