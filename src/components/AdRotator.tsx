import { useEffect, useMemo, useState } from "react";
import type { Ad } from "@/lib/bingo";

export function AdSlide({ ad, compact = false }: { ad: Ad; compact?: boolean }) {
  if (ad.layout === "banner") {
    return (
      <div className="flex h-full w-full items-center gap-4 px-6">
        {ad.imageDataUrl ? (
          <img src={ad.imageDataUrl} alt={ad.title} className="h-full max-h-24 object-contain" />
        ) : null}
        <div className="min-w-0">
          <p className="font-display truncate text-3xl text-primary">{ad.title}</p>
          <p className="truncate text-sm text-muted-foreground">{ad.subtitle}</p>
        </div>
      </div>
    );
  }

  if (ad.layout === "full" && ad.imageDataUrl) {
    return (
      <div className="relative h-full w-full">
        <img src={ad.imageDataUrl} alt={ad.title} className="h-full w-full object-cover" />
        {(ad.title || ad.subtitle) && (
          <div className="absolute inset-x-0 bottom-0 bg-background/70 px-5 py-3 backdrop-blur-sm">
            <p className="font-display text-2xl text-primary">{ad.title}</p>
            <p className="text-sm text-muted-foreground">{ad.subtitle}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-[auto_1fr] items-center gap-5 px-6">
      {ad.imageDataUrl ? (
        <img
          src={ad.imageDataUrl}
          alt={ad.title}
          className="max-h-28 w-32 rounded-xl bg-secondary object-contain p-2"
        />
      ) : null}
      <div className="min-w-0">
        <p className={`font-display text-primary ${compact ? "text-3xl" : "text-4xl"}`}>
          {ad.title}
        </p>
        <p className="text-base text-muted-foreground">{ad.subtitle}</p>
      </div>
    </div>
  );
}

export function AdRotator({
  ads,
  autoplay = true,
  compact = false,
}: {
  ads: Ad[];
  autoplay?: boolean;
  compact?: boolean;
}) {
  const active = useMemo(() => ads.filter((a) => a.enabled), [ads]);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!autoplay || active.length === 0) return;
    const current = active[i % active.length];
    const ms = Math.max(2, current?.duration ?? 8) * 1000;
    const t = setTimeout(() => setI((p) => (p + 1) % active.length), ms);
    return () => clearTimeout(t);
  }, [i, active, autoplay]);

  const ad = active[i % active.length];
  if (!ad) return null;

  return (
    <div className="panel relative h-full w-full overflow-hidden">
      <div key={ad.id + i} className="animate-fade-slide h-full w-full">
        <AdSlide ad={ad} compact={compact} />
      </div>
      {active.length > 1 && (
        <div className="absolute right-3 bottom-2 flex gap-1.5">
          {active.map((a, idx) => (
            <span
              key={a.id}
              className={`h-1.5 rounded-full transition-all ${
                idx === i % active.length ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
