'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/outliers', label: 'Outliers' },
  { href: '/themes', label: 'Themes' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/series', label: 'Series' },
  { href: '/channels', label: 'Channels' },
  { href: '/usage', label: 'Usage' },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto text-sm">
      {LINKS.map((l) => {
        const active = path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-2 py-1 ${active ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
