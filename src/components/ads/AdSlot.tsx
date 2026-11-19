'use client';

interface AdSlotProps {
  slotKey: string;
  enabled: boolean;
  isPrivatePage?: boolean;
  adsenseClientId?: string | null;
  adUnitId?: string | null;
  customHtml?: string | null;
}

/**
 * Policy-compliant Ad Container:
 * - Never renders on private/restricted pages
 * - Clearly labeled as Advertisement
 * - Never overlaps video controls
 */
export function AdSlot({ slotKey, enabled, isPrivatePage, adsenseClientId, adUnitId, customHtml }: AdSlotProps) {
  if (!enabled || isPrivatePage) return null;

  return (
    <aside
      aria-label={`Advertisement ${slotKey}`}
      className="my-6 rounded-xl border border-white/10 bg-bg-secondary/60 p-3 text-center"
    >
      <div className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Advertisement</div>
      {customHtml ? (
        <div dangerouslySetInnerHTML={{ __html: customHtml }} />
      ) : adsenseClientId && adUnitId ? (
        <ins
          className="adsbygoogle block"
          data-ad-client={adsenseClientId}
          data-ad-slot={adUnitId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : null}
    </aside>
  );
}
