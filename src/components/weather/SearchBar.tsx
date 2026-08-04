/**
 * Search input with a location button and unit / theme controls.
 */

import { useState } from "react";
import { Loader2, MapPin, Moon, Search, Sun } from "lucide-react";

import type { TemperatureUnit } from "@/lib/weather-format";

interface SearchBarProps {
  unit: TemperatureUnit;
  dark: boolean;
  locating: boolean;
  onSearch: (query: string) => void;
  onLocate: () => void;
  onToggleUnit: () => void;
  onToggleTheme: () => void;
}

export function SearchBar({
  unit,
  dark,
  locating,
  onSearch,
  onLocate,
  onToggleUnit,
  onToggleTheme,
}: SearchBarProps) {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (query) onSearch(query);
      }}
      role="search"
    >
      <div className="brut flex flex-1 items-center gap-2 bg-card px-3 py-2">
        <Search className="size-5 shrink-0" strokeWidth={3} aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="City, region or airport…"
          aria-label="Search for a city, region or airport"
          className="w-full bg-transparent py-1 font-mono text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="brut-sm brut-press bg-accent px-3 py-1.5 font-mono text-xs font-bold uppercase text-accent-foreground"
        >
          Go
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onLocate}
          aria-label="Use my current location"
          className="brut-sm brut-press inline-flex items-center gap-2 bg-lime px-3 py-2.5 font-mono text-xs font-bold uppercase text-ink"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={3} aria-hidden="true" />
          ) : (
            <MapPin className="size-4" strokeWidth={3} aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Locate</span>
        </button>

        <button
          type="button"
          onClick={onToggleUnit}
          aria-label={`Switch to ${unit === "C" ? "Fahrenheit" : "Celsius"}`}
          aria-pressed={unit === "F"}
          className="brut-sm brut-press bg-card px-3 py-2.5 font-mono text-xs font-bold uppercase"
        >
          <span className={unit === "C" ? "text-foreground" : "text-muted-foreground"}>°C</span>
          <span className="px-1 text-muted-foreground">/</span>
          <span className={unit === "F" ? "text-foreground" : "text-muted-foreground"}>°F</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={dark}
          className="brut-sm brut-press inline-flex items-center bg-card p-2.5"
        >
          {dark ? (
            <Sun className="size-4" strokeWidth={3} aria-hidden="true" />
          ) : (
            <Moon className="size-4" strokeWidth={3} aria-hidden="true" />
          )}
        </button>
      </div>
    </form>
  );
}
