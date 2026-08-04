/**
 * Hero card: place, big temperature, condition, refresh + favourite controls.
 */

import { motion } from "motion/react";
import { RotateCw, Star, Thermometer } from "lucide-react";

import { WeatherIcon } from "./WeatherIcon";
import { formatClock, formatRelative, formatTemp, type TemperatureUnit } from "@/lib/weather-format";
import type { WeatherPayload } from "@/lib/weather-types";

interface CurrentCardProps {
  weather: WeatherPayload;
  unit: TemperatureUnit;
  now: number;
  isFavorite: boolean;
  refreshing: boolean;
  onToggleFavorite: () => void;
  onRefresh: () => void;
}

export function CurrentCard({
  weather,
  unit,
  now,
  isFavorite,
  refreshing,
  onToggleFavorite,
  onRefresh,
}: CurrentCardProps) {
  const { location, current } = weather;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="brut bg-card p-6 sm:p-8"
      aria-labelledby="current-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Now · local {formatClock(weather.fetchedAt)}
          </p>
          <h1 id="current-heading" className="mt-1 text-3xl uppercase sm:text-4xl">
            {location.name}
            {location.country ? (
              <span className="ml-2 align-middle font-mono text-base font-bold text-muted-foreground">
                {location.country}
              </span>
            ) : null}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favourites" : "Save to favourites"}
            className={`brut-sm brut-press inline-flex items-center gap-2 px-3 py-2 font-mono text-xs font-bold uppercase ${
              isFavorite ? "bg-sun text-ink" : "bg-card"
            }`}
          >
            <Star
              className="size-4"
              strokeWidth={3}
              fill={isFavorite ? "currentColor" : "none"}
              aria-hidden="true"
            />
            {isFavorite ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh weather data"
            className="brut-sm brut-press inline-flex items-center gap-2 bg-card px-3 py-2 font-mono text-xs font-bold uppercase"
          >
            <RotateCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={3}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-end gap-5">
          <motion.p
            key={`${current.temp}-${unit}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="font-display text-7xl leading-none tracking-tighter sm:text-8xl"
          >
            {formatTemp(current.temp, unit)}
            <span className="align-super text-2xl">{unit}</span>
          </motion.p>
          <div className="pb-2">
            <p className="text-lg font-bold uppercase">{current.condition.label}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-muted-foreground">
              <Thermometer className="size-3.5" strokeWidth={3} aria-hidden="true" />
              Feels like {formatTemp(current.feelsLike, unit)}
            </p>
          </div>
        </div>

        <div className="brut-flat flex items-center gap-4 bg-secondary px-5 py-4">
          <WeatherIcon
            group={current.condition.group}
            isDay={current.isDay}
            className="size-14"
          />
          <div className="font-mono text-[0.7rem] font-bold uppercase leading-relaxed">
            <p>{current.isDay ? "Daytime" : "Night"}</p>
            <p className="text-muted-foreground">
              Updated {formatRelative(weather.fetchedAt, now)}
            </p>
            <p className="text-muted-foreground">via {weather.source}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
