'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle2 } from 'lucide-react';

interface OptionItem {
  id: string;
  name: string;
}

export function VideoUploadForm({
  categories,
  providers,
}: {
  categories: OptionItem[];
  providers: OptionItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [storageProviderId, setStorageProviderId] = useState(providers[0]?.id || '');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file.');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('categoryId', categoryId);
    formData.append('visibility', visibility);
    formData.append('storageProviderId', storageProviderId);
    formData.append('tags', tags);
    formData.append('isFeatured', String(isFeatured));
    formData.append('seoTitle', seoTitle);
    formData.append('seoDescription', seoDescription);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos');
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        router.push('/admin/videos');
        router.refresh();
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || 'Upload failed');
        } catch {
          setError('Upload failed');
        }
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError('Network error during upload.');
    };
    xhr.send(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-bg-card p-6 lg:p-8">
      {error && <div className="rounded-xl bg-red-500/15 p-4 text-sm text-red-400">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-200">Video File (MP4 / MOV / WebM) *</label>
        <input
          type="file"
          accept="video/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-2 block w-full rounded-xl border border-white/10 bg-bg-secondary p-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-200">Video Title *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cyberpunk Tokyo 2099 — AI Short Film"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white"
          >
            <option value="PUBLIC">PUBLIC (Anyone can watch)</option>
            <option value="UNLISTED">UNLISTED (Only via secret share link)</option>
            <option value="PRIVATE">PRIVATE (Permitted users only)</option>
            <option value="ADMIN_ONLY">ADMIN_ONLY (Admins only)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200">Storage Provider</label>
          <select
            value={storageProviderId}
            onChange={(e) => setStorageProviderId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200">Description</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-200">Tags (comma separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ai-cinema, cyberpunk, sora, kling"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200">SEO Title (Optional)</label>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-bg-secondary px-4 py-2.5 text-sm text-white"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-bg-secondary text-violet-600"
        />
        Feature this video on Homepage
      </label>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Uploading to server...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-secondary">
            <div className="h-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading & Queuing FFmpeg...' : 'Upload & Process Video'}
        </button>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Auto-labeled as AI-Generated Content
        </span>
      </div>
    </form>
  );
}
