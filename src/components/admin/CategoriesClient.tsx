'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CategoriesClient({
  categories,
}: {
  categories: { id: string; slug: string; nameEn: string; nameMy: string; isEnabled: boolean }[];
}) {
  const router = useRouter();
  const [nameEn, setNameEn] = useState('');
  const [nameMy, setNameMy] = useState('');

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameEn, nameMy }),
    });
    setNameEn('');
    setNameMy('');
    router.refresh();
  }

  async function toggle(id: string, isEnabled: boolean) {
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE', id, isEnabled }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={addCategory} className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-bg-card p-6 sm:grid-cols-3">
        <input
          required
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Category Name (English)"
          className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white"
        />
        <input
          required
          value={nameMy}
          onChange={(e) => setNameMy(e.target.value)}
          placeholder="အမျိုးအစား အမည် (မြန်မာ)"
          className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white"
        />
        <button type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
          + Add Category
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">English</th>
              <th className="px-4 py-3">Myanmar</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.nameEn}</td>
                <td className="px-4 py-3">{c.nameMy}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{c.slug}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle(c.id, !c.isEnabled)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      c.isEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {c.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
