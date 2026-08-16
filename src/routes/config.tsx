import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus, Plus, Trash2 } from "lucide-react";
import { AdSlide } from "@/components/AdRotator";
import { useSettings } from "@/hooks/useBingoStore";
import { defaultSettings, uid, type Ad, type AdLayout, type BallRange } from "@/lib/bingo";

export const Route = createFileRoute("/config")({
  head: () => ({
    meta: [
      { title: "Central de Configuração — Bingo Offline" },
      {
        name: "description",
        content:
          "Configure nome do bingo, logo, intervalo de bolas e todos os anúncios exibidos no telão.",
      },
      { property: "og:title", content: "Central de Configuração — Bingo Offline" },
      {
        property: "og:description",
        content: "Parâmetros do bingo, logos de empresas e rotação de anúncios no telão.",
      },
    ],
  }),
  component: Config,
});

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Config() {
  const { settings, setSettings } = useSettings();

  const patchAd = (id: string, patch: Partial<Ad>) =>
    setSettings((s) => ({ ...s, ads: s.ads.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 lg:p-6">
      <header className="panel flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div>
          <h1 className="text-4xl text-primary">Central de configuração</h1>
          <p className="text-sm text-muted-foreground">
            Tudo é salvo no próprio aparelho — funciona sem internet.
          </p>
        </div>
        <Link to="/" className="btn-ghost">
          <ArrowLeft className="size-4" /> Voltar ao telão
        </Link>
      </header>

      <section className="panel grid gap-4 p-5 md:grid-cols-2">
        <h2 className="text-2xl text-primary md:col-span-2">Identidade do bingo</h2>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Nome do bingo</span>
          <input
            value={settings.bingoName}
            onChange={(e) => setSettings((s) => ({ ...s, bingoName: e.target.value }))}
            className="field w-full"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Frase / subtítulo</span>
          <input
            value={settings.subtitle}
            onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value }))}
            className="field w-full"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Logo do evento</span>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const dataUrl = await readFile(f);
                setSettings((s) => ({ ...s, logoDataUrl: dataUrl }));
              }}
              className="field w-full text-sm"
            />
            {settings.logoDataUrl && (
              <img src={settings.logoDataUrl} alt="Logo" className="h-12 w-auto object-contain" />
            )}
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Intervalo de bolas</span>
          <select
            value={settings.range}
            onChange={(e) =>
              setSettings((s) => ({ ...s, range: Number(e.target.value) as BallRange }))
            }
            className="field w-full"
          >
            <option value={75}>1 a 75 (B-I-N-G-O, 24 números por cartela)</option>
            <option value={90}>1 a 90 (15 números por cartela)</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm text-muted-foreground">Mensagem do rodapé</span>
          <input
            value={settings.footer}
            onChange={(e) => setSettings((s) => ({ ...s, footer: e.target.value }))}
            className="field w-full"
          />
        </label>
      </section>

      <section className="panel grid gap-4 p-5 md:grid-cols-2">
        <h2 className="text-2xl text-primary md:col-span-2">Telão e sorteio</h2>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Layout do painel de números</span>
          <select
            value={settings.boardLayout}
            onChange={(e) =>
              setSettings((s) => ({ ...s, boardLayout: e.target.value as BoardLayout }))
            }
            className="field w-full"
          >
            <option value="cartela">Estilo cartela (linhas B-I-N-G-O)</option>
            <option value="grade">Grade compacta</option>
            <option value="faixas">Faixas de 10 em 10</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Modo de sorteio</span>
          <select
            value={settings.drawMode}
            onChange={(e) => setSettings((s) => ({ ...s, drawMode: e.target.value as DrawMode }))}
            className="field w-full"
          >
            <option value="app">O app sorteia (botão / tecla espaço)</option>
            <option value="externo">Sorteio externo (clico no número no telão)</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm text-muted-foreground">
            Tamanho da bola e da letra sorteada: {Math.round(settings.ballScale * 100)}%
          </span>
          <input
            type="range"
            min={0.7}
            max={1.8}
            step={0.05}
            value={settings.ballScale}
            onChange={(e) => setSettings((s) => ({ ...s, ballScale: Number(e.target.value) }))}
            className="w-full"
          />
        </label>
      </section>

      <section className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl text-primary">Anúncios e propagandas</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.adsEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, adsEnabled: e.target.checked }))}
              />
              Exibir no telão
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.adsAutoplay}
                onChange={(e) => setSettings((s) => ({ ...s, adsAutoplay: e.target.checked }))}
              />
              Carrossel automático
            </label>
            <button
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  ads: [
                    ...s.ads,
                    {
                      id: uid(),
                      title: "Novo anúncio",
                      subtitle: "",
                      layout: "split",
                      duration: 8,
                      enabled: true,
                    },
                  ],
                }))
              }
              className="btn-main"
            >
              <Plus className="size-4" /> Novo anúncio
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {settings.ads.map((ad) => (
            <article key={ad.id} className="space-y-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ad.enabled}
                    onChange={(e) => patchAd(ad.id, { enabled: e.target.checked })}
                  />
                  Ativo
                </label>
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, ads: s.ads.filter((a) => a.id !== ad.id) }))
                  }
                  className="btn-ghost !px-2 !py-1"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <input
                value={ad.title}
                onChange={(e) => patchAd(ad.id, { title: e.target.value })}
                placeholder="Título / nome da empresa"
                className="field w-full"
              />
              <input
                value={ad.subtitle}
                onChange={(e) => patchAd(ad.id, { subtitle: e.target.value })}
                placeholder="Texto do anúncio"
                className="field w-full"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={ad.layout}
                  onChange={(e) => patchAd(ad.id, { layout: e.target.value as AdLayout })}
                  className="field"
                >
                  <option value="split">Layout: logo + texto</option>
                  <option value="full">Layout: imagem cheia</option>
                  <option value="banner">Layout: faixa</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="number"
                    min={2}
                    value={ad.duration}
                    onChange={(e) => patchAd(ad.id, { duration: Number(e.target.value) })}
                    className="field w-20"
                  />
                  segundos
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImagePlus className="size-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) patchAd(ad.id, { imageDataUrl: await readFile(f) });
                  }}
                  className="field w-full text-xs"
                />
              </label>
              <div className="panel h-28 overflow-hidden">
                <AdSlide ad={ad} compact />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm text-muted-foreground">
          Restaurar todos os parâmetros para o padrão de fábrica.
        </p>
        <button
          onClick={() => {
            if (confirm("Restaurar configurações padrão?")) setSettings(defaultSettings);
          }}
          className="btn-ghost"
        >
          Restaurar padrão
        </button>
      </section>

      <footer className="panel px-5 py-2 text-center text-sm text-muted-foreground">
        {settings.footer}
      </footer>
    </div>
  );
}
