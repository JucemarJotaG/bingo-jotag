export type BallRange = 75 | 90;

export type AdLayout = "full" | "split" | "banner";

export interface Ad {
  id: string;
  title: string;
  subtitle: string;
  imageDataUrl?: string;
  layout: AdLayout;
  duration: number; // segundos
  enabled: boolean;
}

export interface Settings {
  bingoName: string;
  subtitle: string;
  logoDataUrl?: string;
  range: BallRange;
  adsEnabled: boolean;
  adsAutoplay: boolean;
  showAdOnDraw: boolean;
  ads: Ad[];
  footer: string;
}

export interface Card {
  id: string;
  code: string;
  owner: string;
  numbers: number[];
}

export interface GameState {
  drawn: number[];
  cards: Card[];
  startedAt: number;
}

export const SETTINGS_KEY = "bingo.settings.v1";
export const GAME_KEY = "bingo.game.v1";

export const defaultSettings: Settings = {
  bingoName: "Bingo da Sorte",
  subtitle: "Boa sorte a todos!",
  range: 75,
  adsEnabled: true,
  adsAutoplay: true,
  showAdOnDraw: false,
  footer: "Desenvolvido por: Jucemar - Jota G Tecnologia",
  ads: [
    {
      id: "ad-1",
      title: "Sua empresa aqui",
      subtitle: "Configure seus anúncios na central de configuração",
      layout: "split",
      duration: 8,
      enabled: true,
    },
  ],
};

export const emptyGame = (): GameState => ({ drawn: [], cards: [], startedAt: Date.now() });

export const uid = () => Math.random().toString(36).slice(2, 10);

export function letterFor(n: number, range: BallRange): string {
  if (range === 90) return "";
  if (n <= 15) return "B";
  if (n <= 30) return "I";
  if (n <= 45) return "N";
  if (n <= 60) return "G";
  return "O";
}

function pick(from: number, to: number, count: number, used: Set<number>): number[] {
  const out: number[] = [];
  while (out.length < count) {
    const n = from + Math.floor(Math.random() * (to - from + 1));
    if (used.has(n)) continue;
    used.add(n);
    out.push(n);
  }
  return out;
}

/** Gera os números de uma cartela: 24 números (1-75) ou 15 números (1-90). */
export function generateCardNumbers(range: BallRange): number[] {
  const used = new Set<number>();
  if (range === 75) {
    const cols = [
      pick(1, 15, 5, used),
      pick(16, 30, 5, used),
      pick(31, 45, 4, used),
      pick(46, 60, 5, used),
      pick(61, 75, 5, used),
    ];
    return cols.flat().sort((a, b) => a - b);
  }
  return pick(1, 90, 15, used).sort((a, b) => a - b);
}

export function generateCards(qty: number, range: BallRange, startIndex: number): Card[] {
  return Array.from({ length: qty }, (_, i) => ({
    id: uid(),
    code: String(startIndex + i + 1).padStart(4, "0"),
    owner: "",
    numbers: generateCardNumbers(range),
  }));
}

export interface CardStatus {
  card: Card;
  marked: number;
  total: number;
  missing: number;
  missingNumbers: number[];
}

export function statusOf(card: Card, drawn: number[]): CardStatus {
  const set = new Set(drawn);
  const missingNumbers = card.numbers.filter((n) => !set.has(n));
  return {
    card,
    marked: card.numbers.length - missingNumbers.length,
    total: card.numbers.length,
    missing: missingNumbers.length,
    missingNumbers,
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as Settings) };
  } catch {
    return defaultSettings;
  }
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return emptyGame();
    return { ...emptyGame(), ...(JSON.parse(raw) as GameState) };
  } catch {
    return emptyGame();
  }
}
