import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useGame, useSettings } from "@/hooks/useBingoStore";
import { generateCards, letterFor, statusOf, uid, type Card } from "@/lib/bingo";

export const Route = createFileRoute("/cartelas")({
  head: () => ({
    meta: [
      { title: "Cartelas Vendidas — Controle do Bingo" },
      {
        name: "description",
        content:
          "Cadastre cartelas vendidas, acompanhe números marcados e veja quem está pifado ou fez bingo.",
      },
      { property: "og:title", content: "Cartelas Vendidas — Controle do Bingo" },
      {
        property: "og:description",
        content: "Controle de cartelas vendidas com contagem de números marcados e faltantes.",
      },
    ],
  }),
  component: Cartelas,
});

function Cartelas() {
  const { settings } = useSettings();
  const { game, setGame } = useGame();
  const [qty, setQty] = useState(10);
  const [filter, setFilter] = useState("");
  const [manual, setManual] = useState("");

  const list = useMemo(() => {
    const all = game.cards.map((c) => statusOf(c, game.drawn));
    all.sort((a, b) => a.missing - b.missing);
    const q = filter.trim().toLowerCase();
    return q
      ? all.filter(
          (s) => s.card.code.includes(q) || s.card.owner.toLowerCase().includes(q),
        )
      : all;
  }, [game, filter]);

  const addGenerated = () =>
    setGame((g) => ({
      ...g,
      cards: [...g.cards, ...generateCards(Math.max(1, qty), settings.range, g.cards.length)],
    }));

  const addManual = () => {
    const nums = Array.from(
      new Set(
        manual
          .split(/[^0-9]+/)
          .map((s) => parseInt(s, 10))
          .filter((n) => Number.isFinite(n) && n >= 1 && n <= settings.range),
      ),
    ).sort((a, b) => a - b);
    if (nums.length === 0) return;
    const card: Card = {
      id: uid(),
      code: String(game.cards.length + 1).padStart(4, "0"),
      owner: "",
      numbers: nums,
    };
    setGame((g) => ({ ...g, cards: [...g.cards, card] }));
    setManual("");
  };

  const update = (id: string, patch: Partial<Card>) =>
    setGame((g) => ({
      ...g,
      cards: g.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 lg:p-6">
      <header className="panel flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div>
          <h1 className="text-4xl text-primary">Cartelas vendidas</h1>
          <p className="text-sm text-muted-foreground">
            {game.cards.length} cartelas · {game.drawn.length} bolas sorteadas
          </p>
        </div>
        <Link to="/" className="btn-ghost">
          <ArrowLeft className="size-4" /> Voltar ao telão
        </Link>
      </header>

      <section className="panel grid gap-4 p-5 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-2xl text-primary">Gerar cartelas automáticas</h2>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="field w-28"
            />
            <button onClick={addGenerated} className="btn-main">
              <Plus className="size-4" /> Gerar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cada cartela recebe {settings.range === 75 ? 24 : 15} números do intervalo 1–
            {settings.range}.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl text-primary">Cadastrar cartela existente</h2>
          <textarea
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Digite os números separados por espaço ou vírgula"
            className="field h-20 w-full"
          />
          <button onClick={addManual} className="btn-ghost">
            <Plus className="size-4" /> Adicionar cartela
          </button>
        </div>
      </section>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Buscar por código ou nome do comprador"
        className="field w-full"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <article
            key={s.card.id}
            className={`panel space-y-3 p-4 ${
              s.missing === 0
                ? "ring-2 ring-success"
                : s.missing === 1
                  ? "ring-2 ring-warning"
                  : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-3xl text-primary">#{s.card.code}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  s.missing === 0
                    ? "bg-success/20 text-success"
                    : s.missing === 1
                      ? "bg-warning/20 text-warning"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {s.missing === 0
                  ? "BINGO!"
                  : s.missing === 1
                    ? "Pifado — falta 1"
                    : `Faltam ${s.missing}`}
              </span>
            </div>
            <input
              value={s.card.owner}
              onChange={(e) => update(s.card.id, { owner: e.target.value })}
              placeholder="Nome do comprador"
              className="field w-full"
            />
            <div className="flex flex-wrap gap-1">
              {s.card.numbers.map((n) => {
                const hit = game.drawn.includes(n);
                return (
                  <span
                    key={n}
                    className={`flex size-9 items-center justify-center rounded-md text-sm font-semibold ${
                      hit ? "ball-gold" : "bg-secondary/70 text-muted-foreground"
                    }`}
                    title={`${letterFor(n, settings.range)} ${n}`}
                  >
                    {n}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {s.marked}/{s.total} marcados
              </span>
              <button
                onClick={() =>
                  setGame((g) => ({ ...g, cards: g.cards.filter((c) => c.id !== s.card.id) }))
                }
                className="btn-ghost !px-2 !py-1"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <footer className="panel px-5 py-2 text-center text-sm text-muted-foreground">
        {settings.footer}
      </footer>
    </div>
  );
}
