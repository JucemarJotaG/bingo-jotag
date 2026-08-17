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
import { FOOTER_TEXT, JOTAG_LOGO } from "@/lib/brand";
import {
  adSlides,
  emptyGame,
  letterFor,
  statusOf,
  type BoardLayout,
  type Settings,
} from "@/lib/bingo";

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
    if (settings.drawMode === "externo") return;
    const remaining: number[] = [];
    for (let n = 1; n <= total; n++) if (!drawnSet.has(n)) remaining.push(n);
    if (remaining.length === 0) return;
    const n = remaining[Math.floor(Math.random() * remaining.length)]!;
    setGame((g) => ({ ...g, drawn: [...g.drawn, n] }));
    speak(n);
  }, [total, drawnSet, setGame, speak, settings.drawMode]);

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
        g.drawn.includes(n)
          ? { ...g, drawn: g.drawn.filter((x) => x !== n) }
          : { ...g, drawn: [...g.drawn, n] },
      );
      if (!drawnSet.has(n)) speak(n);
    },
    [manual, setGame, drawnSet, speak],
  );

  const layout = settings.screenLayout ?? "classico";
  const animated = layout === "animado";
  const hasAds = settings.adsEnabled && adSlides(settings.ads).length > 0;
  const adsSize = settings.adsSize ?? 1;

  const ball = (
    <BallPanel settings={settings} last={last} drawn={drawn} total={total} animated={animated} />
  );
  const status =
    settings.showCardStatus !== false ? <StatusPanel stats={stats} /> : null;
  const board = (
    <section className={`panel p-3 lg:p-4 ${animated ? "board-animated" : ""}`}>
      <Board
        range={settings.range}
        layout={settings.boardLayout}
        drawnSet={drawnSet}
        last={last}
        manual={manual}
        onToggle={toggle}
      />
      {manual && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Clique no número sorteado externamente para marcá-lo. Clique de novo para desfazer.
        </p>
      )}
    </section>
  );
  const bottom = <BottomBar settings={settings} animated={animated} />;

  const ads = (style: "coluna" | "faixa" | "grande") =>
    hasAds ? (
      <div
        style={{
          height:
            style === "coluna"
              ? `${Math.round(16 * adsSize)}vh`
              : style === "faixa"
                ? `${Math.round(14 * adsSize)}vh`
                : `${Math.round(26 * adsSize)}vh`,
          minHeight: style === "grande" ? 160 : 96,
        }}
      >
        <AdRotator
          ads={settings.ads}
          autoplay={settings.adsAutoplay}
          compact={style !== "grande"}
          animated={animated}
        />
      </div>
    ) : null;

  return (
    <div
      className={`flex min-h-screen flex-col gap-3 p-3 lg:p-4 ${animated ? "stage-animated" : ""}`}
    >
      <Header
        settings={settings}
        manual={manual}
        draw={draw}
        setGame={setGame}
        sound={sound}
        setSound={setSound}
        full={full}
        toggleFull={toggleFull}
      />

      {layout === "classico" && (
        <main className="grid flex-1 gap-3 xl:grid-cols-[minmax(320px,26rem)_1fr]">
          <section className="flex flex-col gap-3">
            {ball}
            {status}
            {ads("coluna")}
          </section>
          <section className="flex min-w-0 flex-col gap-3">
            {board}
            {bottom}
          </section>
        </main>
      )}

      {layout === "lateral" && (
        <main className="grid flex-1 gap-3 xl:grid-cols-[1fr_minmax(300px,24rem)]">
          <section className="flex min-w-0 flex-col gap-3">
            {board}
            {bottom}
          </section>
          <section className="flex flex-col gap-3">
            {ball}
            {status}
            {ads("coluna")}
          </section>
        </main>
      )}

      {(layout === "cinema" || layout === "animado") && (
        <main className="flex flex-1 flex-col gap-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(280px,22rem)_1fr]">
            {ball}
            <div className="flex min-w-0 flex-col gap-3">
              {board}
              {bottom}
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_minmax(280px,22rem)]">
            {ads("grande")}
            {status}
          </div>
        </main>
      )}

      {layout === "rodape" && (
        <main className="flex flex-1 flex-col gap-3">
          <div className="grid gap-3 xl:grid-cols-[1fr_minmax(280px,22rem)]">
            {board}
            <div className="flex flex-col gap-3">
              {ball}
              {status}
            </div>
          </div>
          {bottom}
          {ads("faixa")}
        </main>
      )}

      <footer className="panel flex items-center justify-center gap-3 px-5 py-2 text-center text-sm text-muted-foreground">
        <img src={JOTAG_LOGO} alt="Jota G Tecnologia" className="h-7 w-auto object-contain" />
        <span>{FOOTER_TEXT}</span>
      </footer>
    </div>
  );
}

function Header({
  settings,
  manual,
  draw,
  setGame,
  sound,
  setSound,
  full,
  toggleFull,
}: {
  settings: Settings;
  manual: boolean;
  draw: () => void;
  setGame: (fn: (g: ReturnType<typeof emptyGame>) => ReturnType<typeof emptyGame>) => void;
  sound: boolean;
  setSound: (fn: (s: boolean) => boolean) => void;
  full: boolean;
  toggleFull: () => void;
}) {
  return (
    <header className="panel flex flex-wrap items-center justify-between gap-4 px-5 py-3">
      <div className="flex min-w-0 items-center gap-4">
        {settings.logoDataUrl ? (
          <img
            src={settings.logoDataUrl}
            alt="Logo do bingo"
            className="h-14 w-auto max-w-40 shrink-0 object-contain"
          />
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-3xl leading-none text-primary lg:text-5xl">
            {settings.bingoName}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{settings.subtitle}</p>
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
            if (confirm("Limpar sorteio e todas as cartelas vendidas?")) setGame(() => emptyGame());
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
  );
}

function BallPanel({
  settings,
  last,
  drawn,
  total,
  animated,
}: {
  settings: Settings;
  last?: number | undefined;
  drawn: number[];
  total: number;
  animated: boolean;
}) {
  const size = 16 * settings.ballScale;
  return (
    <div className="panel flex flex-col items-center justify-center gap-4 px-5 py-6">
      {last ? (
        <div
          key={last + "-" + drawn.length}
          className={`ball-gold animate-ball-in flex flex-col items-center justify-center rounded-full ${
            animated ? "ball-pulse" : ""
          }`}
          style={{
            width: `min(${size}rem, 34vh)`,
            height: `min(${size}rem, 34vh)`,
          }}
        >
          {settings.range === 75 && (
            <span
              className="font-display leading-none opacity-80"
              style={{ fontSize: `min(${4.5 * settings.ballScale}rem, 9vh)` }}
            >
              {letterFor(last, settings.range)}
            </span>
          )}
          <span
            className="font-display leading-none"
            style={{ fontSize: `min(${7.5 * settings.ballScale}rem, 16vh)` }}
          >
            {last}
          </span>
        </div>
      ) : (
        <div className="flex size-48 items-center justify-center rounded-full border-4 border-dashed border-border text-center text-muted-foreground lg:size-60">
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
  );
}

function BottomBar({ settings, animated }: { settings: Settings; animated: boolean }) {
  const bb = settings.bottomBar;
  if (!bb?.enabled || (!bb.title && !bb.text && !bb.imageDataUrl)) return null;
  return (
    <div
      className={`panel flex items-center justify-between gap-4 px-5 py-3 ${
        animated ? "ad-glow" : ""
      }`}
    >
      <div className="min-w-0">
        {bb.title && (
          <p className="font-display truncate text-3xl text-primary lg:text-5xl">{bb.title}</p>
        )}
        {bb.text && <p className="truncate text-base text-foreground lg:text-2xl">{bb.text}</p>}
      </div>
      {bb.imageDataUrl && (
        <img
          src={bb.imageDataUrl}
          alt="Patrocinador em destaque"
          className="h-16 w-auto max-w-[38%] shrink-0 object-contain lg:h-24"
        />
      )}
    </div>
  );
}

function StatusPanel({
  stats,
}: {
  stats: {
    bingo: ReturnType<typeof statusOf>[];
    um: ReturnType<typeof statusOf>[];
    dois: ReturnType<typeof statusOf>[];
    tres: ReturnType<typeof statusOf>[];
    totalCards: number;
  };
}) {
  return (
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
                  {stats.um.map((s) => `#${s.card.code} (falta ${s.missingNumbers[0]})`).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
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

const LETTERS = ["B", "I", "N", "G", "O"] as const;

function Board({
  range,
  layout,
  drawnSet,
  last,
  manual,
  onToggle,
}: {
  range: 75 | 90;
  layout: BoardLayout;
  drawnSet: Set<number>;
  last?: number | undefined;
  manual: boolean;
  onToggle: (n: number) => void;
}) {
  const cell = (n: number) => {
    const hit = drawnSet.has(n);
    return (
      <button
        key={n}
        type="button"
        onClick={() => onToggle(n)}
        disabled={!manual}
        className={`font-display flex aspect-square w-full items-center justify-center rounded-lg text-xl transition-all lg:text-3xl ${
          hit ? "ball-gold scale-105" : "bg-secondary/60 text-muted-foreground/70"
        } ${n === last ? "ring-4 ring-accent" : ""} ${manual ? "cursor-pointer hover:brightness-125" : "cursor-default"}`}
      >
        {n}
      </button>
    );
  };

  if (layout === "cartela") {
    const rows =
      range === 75
        ? LETTERS.map((l, i) => ({
            label: l,
            nums: Array.from({ length: 15 }, (_, k) => i * 15 + k + 1),
          }))
        : Array.from({ length: 9 }, (_, i) => ({
            label: `${i * 10 + 1}`,
            nums: Array.from({ length: 10 }, (_, k) => i * 10 + k + 1),
          }));
    return (
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-1.5">
            <div className="font-display flex aspect-square w-[6%] min-w-9 items-center justify-center rounded-lg bg-primary text-2xl text-primary-foreground lg:text-4xl">
              {row.label}
            </div>
            <div
              className="grid flex-1 gap-1.5"
              style={{ gridTemplateColumns: `repeat(${row.nums.length}, minmax(0,1fr))` }}
            >
              {row.nums.map(cell)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "faixas") {
    const per = 10;
    const rows = Math.ceil(range / per);
    return (
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${per}, minmax(0,1fr))` }}
          >
            {Array.from({ length: per }, (_, k) => r * per + k + 1)
              .filter((n) => n <= range)
              .map(cell)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${range === 75 ? 15 : 10}, minmax(0,1fr))` }}
    >
      {Array.from({ length: range }, (_, i) => i + 1).map(cell)}
    </div>
  );
}
