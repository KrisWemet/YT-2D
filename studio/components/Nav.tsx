import Link from 'next/link';
import { NavLinks } from './NavLinks';

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <Link href="/outliers" className="shrink-0 font-bold">
          WQL<span className="text-muted"> Studio</span>
        </Link>
        <NavLinks />
        <form action="/auth/signout" method="post" className="ml-auto">
          <button className="text-sm text-muted hover:text-fg" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
