import { prisma } from '@/lib/prisma/client';

export default async function AdminBackupPage() {
  const records = await prisma.backupRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backup & Restore</h1>
          <p className="mt-1 text-sm text-slate-400">
            Export configuration/metadata snapshots safely (passwords & secrets are never included).
          </p>
        </div>
        <form action="/api/admin/backup" method="POST">
          <button type="submit" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
            Download Metadata Snapshot
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-bg-card p-5 text-xs text-slate-300 space-y-1">
        <div className="font-semibold text-white">Full VPS Backup Commands:</div>
        <div>• PostgreSQL Dump: <code>./scripts/backup/backup-db.sh</code></div>
        <div>• Media Files: Back up <code>/data/media</code> or S3/R2 bucket separately via <code>rclone</code> / <code>rsync</code>.</div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">File Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No backup records yet.</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono text-xs">{r.fileName}</td>
                  <td className="px-4 py-3 text-xs">{r.type}</td>
                  <td className="px-4 py-3 text-xs text-emerald-400">{r.status}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.createdAt.toISOString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
