import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Maximize2,
  Minimize2,
  MousePointerClick,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Ticket,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AdRotator } from "@/components/AdRotator";
import { useGame, useSettings } from "@/hooks/useBingoStore";
import { emptyGame, letterFor, statusOf } from "@/lib/bingo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bingo — Telão de Sorteio Offline" },
      {
        name: "description",
        content:
          "Telão de bingo offline: sorteio de bolas, controle de cartelas vendidas e anúncios personalizados para projeção em datashow.",
      },
      { property: "og:title", content: "Bingo — Telão de Sorteio Offline" },
      {
        property: "og:description",
        content: "Sorteio, cartelas e anúncios em um app de bingo que funciona sem internet.",
      },
    ],
  }),
  component: Telao,
});

function Telao() {
  const { settings } = useSettings();
  const { game, setGame } = useGame();
  const [sound, setSound] = useState(true);
  const [full, setFull] = useState(false);

  const total = settings.range;
  const drawn = game.drawn;
  const last = drawn[drawn.length - 1];
  const drawnSet = useMemo(() => new Set(drawn), [drawn]);

  const speak = useCallback(
    (n: number) => {
      if (!sound || typeof window === "undefined" || !window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(`${letterFor(n, settings.range)} ${n}`);
      u.lang = "pt-BR";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [sound, settings.range],
  );

  const draw = useCallback(() => {
    const remaining: number[] = [];
    for (let n = 1; n <= total; n++) if (!drawnSet.has(n)) remaining.push(n);
    if (remaining.length === 0) return;
    const n = remaining[Math.floor(Math.random() * remaining.length)]!;
    setGame((g) => ({ ...g, drawn: [...g.drawn, n] }));
    speak(n);
  }, [total, drawnSet, setGame, speak]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        draw();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draw]);

  const toggleFull = async () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setFull(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFull(false);
    }
  };

  const stats = useMemo(() => {
    const list = game.cards.map((c) => statusOf(c, drawn));
    return {
      bingo: list.filter((s) => s.missing === 0),
      um: list.filter((s) => s.missing === 1),
      dois: list.filter((s) => s.missing === 2),
      tres: list.filter((s) => s.missing === 3),
      totalCards: list.length,
    };
  }, [game.cards, drawn]);

  const manual = settings.drawMode === "externo";

  const toggle = useCallback(
    (n: number) => {
      if (!manual) return;
      setGame((g) =>
        g.drawn.includes(n) ? { ...g, drawn: g.drawn.filter((x) => x !== n) } : { ...g, drawn: [...g.drawn, n] },
      );
      if (!drawnSet.has(n)) speak(n);
    },
    [manual, setGame, drawnSet, speak],
  );

  return (
    <div className="flex min-h-screen flex-col gap-3 p-3 lg:p-5">
      <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-4">
          {settings.logoDataUrl ? (
            <img
              src={settings.logoDataUrl}
              alt="Logo do bingo"
              className="h-14 w-auto max-w-40 object-contain"
            />
          ) : null}
          <div>
            <h1 className="text-4xl leading-none text-primary lg:text-5xl">{settings.bingoName}</h1>
            <p className="text-sm text-muted-foreground">{settings.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {manual ? (
            <span className="btn-ghost">
              <MousePointerClick className="size-4" /> Sorteio externo: clique no número
            </span>
          ) : (
            <button onClick={draw} className="btn-main">
              <Play className="size-5" /> Sortear <span className="opacity-60">(espaço)</span>
            </button>
          )}
          <button
            onClick={() => setGame((g) => ({ ...g, drawn: [], startedAt: Date.now() }))}
            className="btn-ghost"
          >
            <RotateCcw className="size-4" /> Novo jogo
          </button>
          <button
            onClick={() => {
              if (confirm("Limpar sorteio e todas as cartelas vendidas?")) setGame(emptyGame());
            }}
            className="btn-ghost"
          >
            <Trash2 className="size-4" /> Limpar tudo
          </button>
          <button onClick={() => setSound((s) => !s)} className="btn-ghost" title="Locução">
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <button onClick={toggleFull} className="btn-ghost" title="Tela cheia">
            {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <Link to="/cartelas" className="btn-ghost">
            <Ticket className="size-4" /> Cartelas
          </Link>
          <Link to="/config" className="btn-ghost">
            <SettingsIcon className="size-4" /> Configurações
          </Link>
        </div>
      </header>

      <main className="grid flex-1 gap-3 xl:grid-cols-[minmax(320px,26rem)_1fr]">
        <section className="flex flex-col gap-3">
          <div className="panel flex flex-col items-center justify-center gap-4 px-5 py-8">
            {last ? (
              <div
                key={last + "-" + drawn.length}
                className="ball-gold animate-ball-in flex size-52 flex-col items-center justify-center rounded-full lg:size-64"
              >
                {settings.range === 75 && (
                  <span className="font-display text-3xl opacity-70">
                    {letterFor(last, settings.range)}
                  </span>
                )}
                <span className="font-display text-8xl leading-none lg:text-9xl">{last}</span>
              </div>
            ) : (
              <div className="flex size-52 items-center justify-center rounded-full border-4 border-dashed border-border text-center text-muted-foreground lg:size-64">
                Aguardando
                <br />o 1º sorteio
              </div>
            )}
            <p className="text-sm tracking-widest text-muted-foreground uppercase">
              {drawn.length} de {total} bolas sorteadas
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {drawn
                .slice(-6, -1)
                .reverse()
                .map((n) => (
                  <span
                    key={n}
                    className="font-display flex size-12 items-center justify-center rounded-full bg-secondary text-2xl"
                  >
                    {n}
                  </span>
                ))}
            </div>
          </div>

          <div className="panel px-5 py-4">
            <h2 className="mb-3 text-2xl text-primary">Status das cartelas</h2>
            {stats.totalCards === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma cartela registrada. Cadastre as cartelas vendidas na aba Cartelas.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="BINGO!" value={stats.bingo.length} tone="success" />
                <Stat label="Falta 1 (pifado)" value={stats.um.length} tone="warning" />
                <Stat label="Faltam 2" value={stats.dois.length} tone="muted" />
                <Stat label="Faltam 3" value={stats.tres.length} tone="muted" />
                <div className="col-span-2 text-sm text-muted-foreground">
                  {stats.totalCards} cartelas vendidas
                </div>
                {(stats.bingo.length > 0 || stats.um.length > 0) && (
                  <div className="col-span-2 rounded-xl bg-secondary/70 p-2 text-left text-sm">
                    {stats.bingo.length > 0 && (
                      <p>
                        <b className="text-success">BINGO:</b>{" "}
                        {stats.bingo
                          .map((s) => `#${s.card.code}${s.card.owner ? " " + s.card.owner : ""}`)
                          .join(", ")}
                      </p>
                    )}
                    {stats.um.length > 0 && (
                      <p>
                        <b className="text-warning">Pifados:</b>{" "}
                        {stats.um
                          .map((s) => `#${s.card.code} (falta ${s.missingNumbers[0]})`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {settings.adsEnabled && (
            <div className="h-36">
              <AdRotator ads={settings.ads} autoplay={settings.adsAutoplay} compact />
            </div>
          )}
        </section>

        <section className="panel p-4">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${settings.range === 75 ? 15 : 10}, minmax(0,1fr))` }}
          >
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
              const hit = drawnSet.has(n);
              return (
                <div
                  key={n}
                  className={`font-display flex aspect-square items-center justify-center rounded-lg text-2xl transition-all lg:text-4xl ${
                    hit
                      ? "ball-gold scale-105"
                      : "bg-secondary/60 text-muted-foreground/70"
                  } ${n === last ? "ring-4 ring-accent" : ""}`}
                >
                  {n}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="panel px-5 py-2 text-center text-sm text-muted-foreground">
        {settings.footer}
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "muted";
}) {
  const tones = {
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    muted: "bg-secondary text-foreground",
  } as const;
  return (
    <div className={`rounded-xl px-3 py-2 ${tones[tone]}`}>
      <p className="font-display text-4xl leading-none">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}
