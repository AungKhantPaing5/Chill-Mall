'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdsClient({
  settings,
  placements,
}: {
  settings: { adsEnabled: boolean; adsenseEnabled: boolean; adsensePublisherId: string | null; adsenseClientId: string | null } | null;
  placements: { id: string; slotKey: string; name: string; isEnabled: boolean }[];
}) {
  const router = useRouter();
  const [adsEnabled, setAdsEnabled] = useState(Boolean(settings?.adsEnabled));
  const [adsenseEnabled, setAdsenseEnabled] = useState(Boolean(settings?.adsenseEnabled));
  const [adsensePublisherId, setAdsensePublisherId] = useState(settings?.adsensePublisherId || '');
  const [adsenseClientId, setAdsenseClientId] = useState(settings?.adsenseClientId || '');
  const [saved, setSaved] = useState(false);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adsEnabled, adsenseEnabled, adsensePublisherId, adsenseClientId }),
    });
    setSaved(true);
    router.refresh();
  }

  async function togglePlacement(id: string, isEnabled: boolean) {
    await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_PLACEMENT', id, isEnabled }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        Revenue reporting is not connected. Configure authorized AdSense Reporting API credentials to view live earnings.
      </div>

      <form onSubmit={saveSettings} className="space-y-4 rounded-2xl border border-white/10 bg-bg-card p-6">
        <h2 className="font-bold">Google AdSense Configuration</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={adsEnabled} onChange={(e) => setAdsEnabled(e.target.checked)} />
          Enable Advertisements Globally
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={adsenseEnabled} onChange={(e) => setAdsenseEnabled(e.target.checked)} />
          Enable Google AdSense
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            value={adsensePublisherId}
            onChange={(e) => setAdsensePublisherId(e.target.value)}
            placeholder="Publisher ID (pub-xxxxxxxxxxxxxxxx)"
            className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm"
          />
          <input
            value={adsenseClientId}
            onChange={(e) => setAdsenseClientId(e.target.value)}
            placeholder="Ad Client ID (ca-pub-xxxxxxxxxxxxxxxx)"
            className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm"
          />
        </div>
        <button type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
          Save Ad Settings
        </button>
        {saved && <span className="ml-3 text-xs text-emerald-400">Saved!</span>}
      </form>

      <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
        <h2 className="mb-4 font-bold">Ad Placements</h2>
        <div className="space-y-3">
          {placements.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-bg-secondary p-4">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-400">Slot: {p.slotKey}</div>
              </div>
              <button
                onClick={() => togglePlacement(p.id, !p.isEnabled)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  p.isEnabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {p.isEnabled ? 'Active' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
