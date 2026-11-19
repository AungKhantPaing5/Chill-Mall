'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  videoId: string;
  hlsUrl: string | null;
  mp4FallbackUrl?: string | null;
  posterUrl?: string | null;
}

export function VideoPlayer({ videoId, hlsUrl, mp4FallbackUrl, posterUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [levels, setLevels] = useState<{ index: number; height: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Report real video view event
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'VIDEO_VIEW', videoId }),
    }).catch(() => {});

    if (hlsUrl && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(hls.levels.map((l, idx) => ({ index: idx, height: l.height })));
      });
      return () => hls.destroy();
    } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    } else if (mp4FallbackUrl) {
      video.src = mp4FallbackUrl;
    }
  }, [hlsUrl, mp4FallbackUrl, videoId]);

  function changeQuality(idx: number) {
    setCurrentLevel(idx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = idx;
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      <video
        ref={videoRef}
        controls
        playsInline
        poster={posterUrl || undefined}
        className="aspect-video w-full bg-black"
      />
      {levels.length > 0 && (
        <div className="flex items-center justify-end gap-2 bg-bg-secondary px-4 py-2 text-xs text-slate-300">
          <span>Quality:</span>
          <select
            value={currentLevel}
            onChange={(e) => changeQuality(Number(e.target.value))}
            className="rounded bg-bg-card px-2 py-1 text-white border border-white/10"
          >
            <option value={-1}>Auto</option>
            {levels.map((l) => (
              <option key={l.index} value={l.index}>
                {l.height}p
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
