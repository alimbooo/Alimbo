import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { getMenu } from '@/lib/content';
import { MobileMenu } from './mobile-menu';

export function Header({ site }: { site: Record<string, unknown> }) {
  const menu = getMenu();
  const baseMenu = menu.length > 0 ? menu : [
    { label: 'خانه', href: '/' },
    { label: 'پروژه‌ها', href: '/projects' },
    { label: 'رزومه', href: '/resume' },
  ];
  const menuItems = baseMenu.filter((item: any) => !item.hidden);

  return (
    <header className="border-b border-[var(--border)]">
      <div className="container flex items-center justify-between py-5">
        <Link href="/" className="text-lg font-black">{String(site.name)}</Link>
        <nav aria-label="ناوبری اصلی" className="hidden gap-7 text-sm text-[var(--muted)] sm:flex">
          {menuItems.map((item, i) => (
            <Link key={i} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <MobileMenu menuItems={menuItems} siteName={String(site.name)} />
        </div>
      </div>
    </header>
  );
}

export function Footer({ site }: { site: Record<string, unknown> }) {
  const footerText = typeof site.footerText === 'string'
    ? site.footerText
    : `© ${new Date().getFullYear()} ${String(site.name)}. همه حقوق محفوظ است.`;

  return (
    <footer className="border-t border-[var(--border)] py-6">
      <div className="container flex flex-col gap-3 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>{footerText}</span>
        <div className="flex gap-5"></div>
      </div>
    </footer>
  );
}
