/**
 * Persisted user preferences: unit, dark mode, favourites and recent searches.
 *
 * All reads happen inside effects so SSR and the first client render agree.
 */

import { useCallback, useEffect, useState } from "react";

import type { SavedPlace } from "@/lib/weather-types";
import type { TemperatureUnit } from "@/lib/weather-format";

const KEYS = {
  unit: "atmosphere:unit",
  theme: "atmosphere:theme",
  favorites: "atmosphere:favorites",
  recents: "atmosphere:recents",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); preferences just won't stick.
  }
}

/** Same place? Compare on rounded coordinates so tiny drift doesn't duplicate. */
export function samePlace(a: SavedPlace, b: SavedPlace): boolean {
  return a.lat.toFixed(2) === b.lat.toFixed(2) && a.lon.toFixed(2) === b.lon.toFixed(2);
}

export function useWeatherPrefs() {
  const [unit, setUnit] = useState<TemperatureUnit>("C");
  const [dark, setDark] = useState(true);
  const [favorites, setFavorites] = useState<SavedPlace[]>([]);
  const [recents, setRecents] = useState<SavedPlace[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on the client.
  useEffect(() => {
    setUnit(readJson<TemperatureUnit>(KEYS.unit, "C"));
    setDark(readJson<boolean>(KEYS.theme, true));
    setFavorites(readJson<SavedPlace[]>(KEYS.favorites, []));
    setRecents(readJson<SavedPlace[]>(KEYS.recents, []));
    setHydrated(true);
  }, []);

  // Reflect the theme on <html> and persist it.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", dark);
    writeJson(KEYS.theme, dark);
  }, [dark, hydrated]);

  useEffect(() => {
    if (hydrated) writeJson(KEYS.unit, unit);
  }, [unit, hydrated]);

  useEffect(() => {
    if (hydrated) writeJson(KEYS.favorites, favorites);
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated) writeJson(KEYS.recents, recents);
  }, [recents, hydrated]);

  const toggleUnit = useCallback(() => {
    setUnit((current) => (current === "C" ? "F" : "C"));
  }, []);

  const toggleTheme = useCallback(() => setDark((current) => !current), []);

  const toggleFavorite = useCallback((place: SavedPlace) => {
    setFavorites((current) =>
      current.some((entry) => samePlace(entry, place))
        ? current.filter((entry) => !samePlace(entry, place))
        : [place, ...current].slice(0, 8),
    );
  }, []);

  const removeFavorite = useCallback((place: SavedPlace) => {
    setFavorites((current) => current.filter((entry) => !samePlace(entry, place)));
  }, []);

  const pushRecent = useCallback((place: SavedPlace) => {
    setRecents((current) =>
      [place, ...current.filter((entry) => !samePlace(entry, place))].slice(0, 6),
    );
  }, []);

  const removeRecent = useCallback((place: SavedPlace) => {
    setRecents((current) => current.filter((entry) => !samePlace(entry, place)));
  }, []);

  const clearRecents = useCallback(() => setRecents([]), []);

  return {
    unit,
    dark,
    favorites,
    recents,
    hydrated,
    toggleUnit,
    toggleTheme,
    toggleFavorite,
    removeFavorite,
    pushRecent,
    removeRecent,
    clearRecents,
  };
}
