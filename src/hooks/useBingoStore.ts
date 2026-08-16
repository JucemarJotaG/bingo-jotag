import { useCallback, useEffect, useState } from "react";
import {
  GAME_KEY,
  SETTINGS_KEY,
  defaultSettings,
  emptyGame,
  loadGame,
  loadSettings,
  type GameState,
  type Settings,
} from "@/lib/bingo";

const EVT = "bingo-store-change";

function useLocal<T>(key: string, initial: T, loader: () => T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(loader());
    setReady(true);
    const sync = () => setValue(loader());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
          window.dispatchEvent(new Event(EVT));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key],
  );

  return { value, setValue: update, ready };
}

export function useSettings() {
  const { value, setValue, ready } = useLocal<Settings>(SETTINGS_KEY, defaultSettings, loadSettings);
  return { settings: value, setSettings: setValue, ready };
}

export function useGame() {
  const { value, setValue, ready } = useLocal<GameState>(GAME_KEY, emptyGame(), loadGame);
  return { game: value, setGame: setValue, ready };
}
