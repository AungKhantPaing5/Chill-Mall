'use client';

import { useRouter } from 'next/navigation';
import { Trash2, RefreshCw, Star } from 'lucide-react';

export function VideoActionsClient({
  videoId,
  visibility,
  isFeatured,
  status,
}: {
  videoId: string;
  visibility: string;
  isFeatured: boolean;
  status: string;
}) {
  const router = useRouter();

  async function updateVideo(payload: Record<string, unknown>) {
    await fetch(`/api/admin/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  async function deleteVideo() {
    if (!confirm('Move this video to trash?')) return;
    await fetch(`/api/admin/videos/${videoId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={visibility}
        onChange={(e) => updateVideo({ visibility: e.target.value })}
        className="rounded-lg border border-white/10 bg-bg-secondary px-2 py-1 text-xs text-white"
      >
        <option value="PUBLIC">PUBLIC</option>
        <option value="UNLISTED">UNLISTED</option>
        <option value="PRIVATE">PRIVATE</option>
        <option value="ADMIN_ONLY">ADMIN_ONLY</option>
      </select>

      <button
        onClick={() => updateVideo({ isFeatured: !isFeatured })}
        className={`rounded-lg border p-1.5 ${
          isFeatured ? 'border-amber-500/40 bg-amber-500/15 text-amber-300' : 'border-white/10 text-slate-400'
        }`}
        title="Toggle Featured"
      >
        <Star className="h-3.5 w-3.5" />
      </button>

      {status === 'FAILED' && (
        <button
          onClick={() => updateVideo({ action: 'RETRY_TRANSCODE' })}
          className="rounded-lg border border-sky-500/30 bg-sky-500/15 p-1.5 text-sky-300"
          title="Retry FFmpeg Job"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={deleteVideo}
        className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
        title="Delete Video"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
