/**
 * Search input with a location button and unit / theme controls.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, MapPin, Moon, Search, Sun, Users, X } from "lucide-react";

import { searchLocations } from "@/lib/weather.functions";
import type { TemperatureUnit } from "@/lib/weather-format";
import type { PlaceSuggestion, SavedPlace } from "@/lib/weather-types";

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "📍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function formatPopulation(pop?: number): string | null {
  if (!pop || pop < 1000) return null;
  if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
  return `${Math.round(pop / 1000)}k`;
}

interface SearchBarProps {
  unit: TemperatureUnit;
  dark: boolean;
  locating: boolean;
  onSearch: (query: string) => void;
  onSelectPlace?: (place: SavedPlace) => void;
  onLocate: () => void;
  onToggleUnit: () => void;
  onToggleTheme: () => void;
}

export function SearchBar({
  unit,
  dark,
  locating,
  onSearch,
  onSelectPlace,
  onLocate,
  onToggleUnit,
  onToggleTheme,
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Press '/' anywhere to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete fetch
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const results = (await searchLocations({ data: { query: trimmed } })) as PlaceSuggestion[];
        setSuggestions(results);
        setOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (item: PlaceSuggestion) => {
    setValue(item.name);
    setOpen(false);
    if (onSelectPlace) {
      onSelectPlace({
        name: item.name,
        country: item.countryCode || item.country,
        lat: item.lat,
        lon: item.lon,
      });
    } else {
      onSearch(item.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && suggestions[selectedIndex]) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex]);
            return;
          }
          const query = value.trim();
          if (query) {
            setOpen(false);
            onSearch(query);
          }
        }}
        role="search"
      >
        <div className="brut relative flex flex-1 items-center gap-2 bg-card px-3 py-2">
          {loadingSuggestions ? (
            <Loader2
              className="size-5 shrink-0 animate-spin text-accent"
              strokeWidth={3}
              aria-hidden="true"
            />
          ) : (
            <Search className="size-5 shrink-0" strokeWidth={3} aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            type="search"
            value={value}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search city, region or airport… (Press '/' to focus)"
            aria-label="Search for a city, region or airport"
            aria-autocomplete="list"
            aria-expanded={open}
            className="w-full bg-transparent py-1 font-mono text-sm outline-none placeholder:text-muted-foreground"
          />
          {value.trim() && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setSuggestions([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" strokeWidth={3} aria-hidden="true" />
            </button>
          )}
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
            className="brut-sm brut-press inline-flex items-center gap-2 bg-lime px-3 py-2.5 font-mono text-xs font-black uppercase text-black"
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
            className="brut-sm brut-press bg-card px-3 py-2.5 font-mono text-xs font-bold uppercase transition-transform active:scale-95"
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
            className="brut-sm brut-press inline-flex items-center bg-card p-2.5 transition-transform active:rotate-45"
          >
            {dark ? (
              <Sun className="size-4 text-sun" strokeWidth={3} aria-hidden="true" />
            ) : (
              <Moon className="size-4 text-night" strokeWidth={3} aria-hidden="true" />
            )}
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="brut absolute left-0 right-0 top-full z-50 mt-2 divide-y-3 divide-ink overflow-hidden bg-card shadow-2xl sm:max-w-xl"
            role="listbox"
          >
            <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Matching locations</span>
              <span>Use ↑↓ keys + Enter</span>
            </div>
            {suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              const pop = formatPopulation(item.population);
              return (
                <button
                  key={`${item.id}-${item.lat}-${item.lon}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left font-mono transition-colors ${
                    isSelected ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base" role="img" aria-label={item.country}>
                      {getCountryFlag(item.countryCode)}
                    </span>
                    <div>
                      <span className="text-sm font-bold uppercase">{item.name}</span>
                      {item.admin1 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          · {item.admin1}
                        </span>
                      )}
                      <span className="ml-1.5 text-xs font-semibold opacity-75">
                        ({item.countryCode || item.country})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
                    {pop && (
                      <span className="brut-sm inline-flex items-center gap-1 bg-card px-1.5 py-0.5 font-bold uppercase text-foreground">
                        <Users className="size-2.5" />
                        {pop}
                      </span>
                    )}
                    <span className="hidden font-mono text-[0.6rem] sm:inline">
                      {item.lat.toFixed(1)}°, {item.lon.toFixed(1)}°
                    </span>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
