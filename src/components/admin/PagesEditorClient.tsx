'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PageItem {
  id: string;
  slug: string;
  translations: { language: string; title: string; contentHtml: string }[];
}

export function PagesEditorClient({ pages }: { pages: PageItem[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(pages[0]?.id || '');
  const [lang, setLang] = useState<'en' | 'my'>('en');

  const currentPage = pages.find((p) => p.id === selectedId);
  const currentTr = currentPage?.translations.find((t) => t.language === lang);

  const [title, setTitle] = useState(currentTr?.title || '');
  const [contentHtml, setContentHtml] = useState(currentTr?.contentHtml || '');
  const [saved, setSaved] = useState(false);

  function selectPage(pid: string, language: 'en' | 'my') {
    setSelectedId(pid);
    setLang(language);
    setSaved(false);
    const p = pages.find((x) => x.id === pid);
    const tr = p?.translations.find((t) => t.language === language);
    setTitle(tr?.title || '');
    setContentHtml(tr?.contentHtml || '');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: selectedId, language: lang, title, contentHtml }),
    });
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-bg-card p-6">
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedId}
          onChange={(e) => selectPage(e.target.value, lang)}
          className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2 text-sm"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>{p.slug}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => selectPage(selectedId, 'en')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold ${lang === 'en' ? 'bg-violet-600 text-white' : 'bg-bg-secondary'}`}
        >
          English (EN)
        </button>
        <button
          type="button"
          onClick={() => selectPage(selectedId, 'my')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold ${lang === 'my' ? 'bg-violet-600 text-white' : 'bg-bg-secondary'}`}
        >
          Myanmar (MY)
        </button>
      </div>

      <form onSubmit={save} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page Title"
          className="w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm"
        />
        <textarea
          rows={10}
          value={contentHtml}
          onChange={(e) => setContentHtml(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-bg-secondary p-4 font-mono text-xs"
        />
        <button type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
          Save Page ({lang.toUpperCase()})
        </button>
        {saved && <span className="ml-3 text-xs text-emerald-400">Saved!</span>}
      </form>
    </div>
  );
}
