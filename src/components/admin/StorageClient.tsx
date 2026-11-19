'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function StorageClient({
  providers,
  videos,
}: {
  providers: { id: string; name: string; type: string; isDefault: boolean; bucket: string | null; localPath: string | null }[];
  videos: { id: string; title: string; storageProviderId: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('R2');
  const [endpoint, setEndpoint] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('auto');
  const [msg, setMsg] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(videos[0]?.id || '');
  const [targetProvider, setTargetProvider] = useState(providers[0]?.id || '');

  async function addProvider(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/admin/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, endpoint, bucket, region }),
    });
    setName('');
    setEndpoint('');
    setBucket('');
    router.refresh();
  }

  async function testProvider(id: string) {
    setMsg('Testing connection...');
    const res = await fetch('/api/admin/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TEST', id }),
    });
    const data = await res.json();
    setMsg(`${data.ok ? 'SUCCESS' : 'FAILED'}: ${data.message}`);
  }

  async function migrateVideo(e: React.FormEvent) {
    e.preventDefault();
    setMsg('Migrating and verifying SHA-256 checksum...');
    const res = await fetch('/api/admin/storage/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: selectedVideo, targetProviderId: targetProvider }),
    });
    const data = await res.json();
    setMsg(res.ok ? data.message : `Error: ${data.error}`);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {msg && <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-300">{msg}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {providers.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{p.name}</h3>
              <span className="rounded bg-violet-600/20 px-2 py-0.5 text-xs text-violet-300">{p.type}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{p.localPath || p.bucket || 'Configured via .env'}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => testProvider(p.id)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:border-violet-500"
              >
                Test Connection
              </button>
              {p.isDefault && <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-300">Default</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Add S3 / R2 Provider */}
      <form onSubmit={addProvider} className="space-y-4 rounded-2xl border border-white/10 bg-bg-card p-6">
        <h2 className="font-bold">Add Cloud Storage Provider (S3 / Cloudflare R2)</h2>
        <p className="text-xs text-slate-400">Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in your VPS .env file for security.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Provider Name (e.g. Cloudflare R2)" className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2 text-sm" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2 text-sm">
            <option value="R2">Cloudflare R2</option>
            <option value="S3">Amazon S3</option>
            <option value="S3_COMPATIBLE">S3-Compatible</option>
          </select>
          <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="S3 Endpoint URL" className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2 text-sm" />
          <input value={bucket} onChange={(e) => setBucket(e.target.value)} placeholder="Bucket Name" className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2 text-sm" />
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region (auto)" className="rounded-xl border border-white/10 bg-bg-secondary px-4 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
          Save Provider
        </button>
      </form>

      {/* Hybrid Migration */}
      {videos.length > 0 && providers.length > 1 && (
        <form onSubmit={migrateVideo} className="space-y-4 rounded-2xl border border-white/10 bg-bg-card p-6">
          <h2 className="font-bold">Safe Hybrid Video Storage Migration</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <select value={selectedVideo} onChange={(e) => setSelectedVideo(e.target.value)} className="rounded-xl border border-white/10 bg-bg-secondary px-3 py-2 text-sm">
              {videos.map((v) => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
            <select value={targetProvider} onChange={(e) => setTargetProvider(e.target.value)} className="rounded-xl border border-white/10 bg-bg-secondary px-3 py-2 text-sm">
              {providers.map((p) => (
                <option key={p.id} value={p.id}>Move to: {p.name}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
              Migrate & Verify
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
