'use client';

import Link from 'next/link';

export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="skip-link"
      aria-label="Zum Hauptinhalt springen"
    >
      Zum Hauptinhalt springen
    </Link>
  );
}

