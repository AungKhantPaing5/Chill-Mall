'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Video,
  Upload,
  FolderTree,
  HardDrive,
  Megaphone,
  Users,
  BarChart3,
  FileText,
  DatabaseBackup,
  LogOut,
  Globe,
  ExternalLink,
  Shield,
} from 'lucide-react';

const navItems = [
  { href: '/admin', labelEn: 'Overview', labelMy: 'အကျဉ်းချုပ်', icon: LayoutDashboard },
  { href: '/admin/videos', labelEn: 'Video Management', labelMy: 'ဗီဒီယို စီမံခန့်ခွဲမှု', icon: Video },
  { href: '/admin/videos/upload', labelEn: 'Upload Video', labelMy: 'ဗီဒီယို တင်ရန်', icon: Upload },
  { href: '/admin/categories', labelEn: 'Categories', labelMy: 'အမျိုးအစားများ', icon: FolderTree },
  { href: '/admin/storage', labelEn: 'Hybrid Storage', labelMy: 'Storage စီမံခန့်ခွဲမှု', icon: HardDrive },
  { href: '/admin/ads', labelEn: 'AdSense & Ads', labelMy: 'AdSense နှင့် ကြော်ငြာ', icon: Megaphone },
  { href: '/admin/users', labelEn: 'User Management', labelMy: 'အသုံးပြုသူများ', icon: Users },
  { href: '/admin/analytics', labelEn: 'Analytics', labelMy: 'စာရင်းအင်းများ', icon: BarChart3 },
  { href: '/admin/pages', labelEn: 'CMS & Legal Pages', labelMy: 'စာမျက်နှာများ', icon: FileText },
  { href: '/admin/backup', labelEn: 'Backup & Restore', labelMy: 'Backup နှင့် Restore', icon: DatabaseBackup },
];

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  async function toggleLanguage() {
    const next = locale === 'en' ? 'my' : 'en';
    await fetch('/api/language', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <aside className="w-full border-b border-white/10 bg-bg-secondary lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r flex flex-col justify-between z-40">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link href="/admin" className="flex items-center gap-2 font-bold tracking-wider">
            <Shield className="h-5 w-5 text-violet-500" />
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              CHILL MALL
            </span>
          </Link>
          <span className="rounded bg-violet-600/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
            ADMIN
          </span>
        </div>

        <nav className="flex flex-wrap gap-1 p-3 lg:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{locale === 'my' ? item.labelMy : item.labelEn}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-4 space-y-2">
        <div className="truncate px-2 text-xs text-slate-400">{userEmail}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-bg-card py-2 text-xs text-slate-200 hover:border-violet-500"
          >
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            {locale === 'en' ? 'မြန်မာ' : 'EN'}
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center rounded-lg border border-white/10 bg-bg-card p-2 text-slate-300 hover:border-violet-500"
            title="Open Public Site"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
