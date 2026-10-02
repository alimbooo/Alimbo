import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { getMenu } from '@/lib/content';
import { MobileMenu } from './mobile-menu';
import { Icon } from '@/src/icons';

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
  const rawFooter = typeof site.footerText === 'string' && site.footerText.trim() !== ''
    ? site.footerText
    : `© ${new Date().getFullYear()} ${String(site.name)}`;
  const footerText = rawFooter.replace(/\.?\s*همه حقوق محفوظ است\.?/g, '').trim();

  const telegramUrl = (site.hero as any)?.telegram || (site.socials as any)?.telegram || 'https://t.me/alimbooo';

  return (
    <footer className="border-t border-[var(--border)] py-6">
      <div className="container flex flex-col gap-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>{footerText}</span>
        {telegramUrl && (
          <div className="flex items-center gap-3">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs font-medium text-[var(--foreground)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-xs group"
              title="ارتباط با من در تلگرام"
            >
              <Icon name="telegram" width="16" height="16" className="text-[#2AABEE] group-hover:scale-110 transition-transform" />
              <span>ارتباط با من</span>
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
