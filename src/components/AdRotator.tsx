import { useEffect, useMemo, useRef, useState } from "react";
import { adSlides, type Ad, type AdSlideItem } from "@/lib/bingo";

function Caption({ item, compact }: { item: AdSlideItem; compact?: boolean }) {
  if (!item.ad.title && !item.ad.subtitle) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 bg-background/70 px-4 py-2 backdrop-blur-sm">
      <p className={`font-display text-primary ${compact ? "text-xl" : "text-3xl"}`}>
        {item.ad.title}
      </p>
      {item.ad.subtitle && (
        <p className={`text-muted-foreground ${compact ? "text-xs" : "text-base"}`}>
          {item.ad.subtitle}
        </p>
      )}
    </div>
  );
}

export function AdSlide({
  item,
  compact = false,
  onEnded,
}: {
  item: AdSlideItem;
  compact?: boolean;
  onEnded?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const { ad, media } = item;

  useEffect(() => {
    video.current?.play().catch(() => {});
  }, [media?.src]);

  if (media?.kind === "video") {
    return (
      <div className="relative h-full w-full bg-background">
        <video
          ref={video}
          src={media.src}
          className="h-full w-full object-contain"
          autoPlay
          muted
          playsInline
          onEnded={onEnded}
        />
        <Caption item={item} compact={compact} />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <p className={`font-display text-primary ${compact ? "text-3xl" : "text-5xl"}`}>
          {ad.title}
        </p>
        <p className="text-base text-muted-foreground">{ad.subtitle}</p>
      </div>
    );
  }

  if (ad.layout === "banner") {
    return (
      <div className="flex h-full w-full items-center gap-4 px-6">
        <img src={media.src} alt={ad.title} className="h-full max-h-full object-contain py-2" />
        <div className="min-w-0">
          <p className="font-display truncate text-3xl text-primary">{ad.title}</p>
          <p className="truncate text-sm text-muted-foreground">{ad.subtitle}</p>
        </div>
      </div>
    );
  }

  if (ad.layout === "full") {
    return (
      <div className="relative h-full w-full">
        <img src={media.src} alt={ad.title} className="h-full w-full object-contain" />
        <Caption item={item} compact={compact} />
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-[auto_1fr] items-center gap-5 px-6">
      <img
        src={media.src}
        alt={ad.title}
        className="h-full max-h-full w-auto max-w-[45%] rounded-xl object-contain p-2"
      />
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
  animated = false,
}: {
  ads: Ad[];
  autoplay?: boolean;
  compact?: boolean;
  animated?: boolean;
}) {
  const slides = useMemo(() => adSlides(ads), [ads]);
  const [i, setI] = useState(0);

  const next = () => setI((p) => (slides.length ? (p + 1) % slides.length : 0));

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const current = slides[i % slides.length];
    if (current?.media?.kind === "video") return; // avança quando o vídeo terminar
    const t = setTimeout(next, current!.duration * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, slides, autoplay]);

  if (slides.length === 0) return null;
  const item = slides[i % slides.length]!;

  return (
    <div
      className={`panel relative h-full w-full overflow-hidden ${animated ? "ad-glow" : ""}`}
      onClick={next}
      role="presentation"
    >
      <div key={item.key + i} className="animate-fade-slide h-full w-full">
        <AdSlide item={item} compact={compact} onEnded={next} />
      </div>
      {slides.length > 1 && (
        <div className="absolute right-3 bottom-2 flex gap-1.5">
          {slides.map((s, idx) => (
            <span
              key={s.key}
              className={`h-1.5 rounded-full transition-all ${
                idx === i % slides.length ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
