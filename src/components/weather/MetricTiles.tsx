/**
 * Metric tiles: humidity, wind, visibility, pressure, UV, sun times.
 */

import { motion } from "motion/react";
import { Droplets, Eye, Gauge, Navigation, Sunrise, Sunset, Wind } from "lucide-react";
import type { ReactNode } from "react";

import {
  formatClock,
  formatVisibility,
  formatWind,
  uvLabel,
  windDirection,
  type TemperatureUnit,
} from "@/lib/weather-format";
import type { CurrentWeather } from "@/lib/weather-types";

interface TileProps {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
  accent: string;
  index: number;
}

function Tile({ label, value, detail, icon, accent, index }: TileProps) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, type: "spring", stiffness: 240, damping: 24 }}
      className="brut bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <span className={`brut-flat inline-flex size-8 items-center justify-center ${accent}`}>
          {icon}
        </span>
        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 font-display text-2xl leading-none">{value}</p>
      {detail && (
        <p className="mt-1 font-mono text-[0.65rem] font-bold uppercase text-muted-foreground">
          {detail}
        </p>
      )}
    </motion.li>
  );
}

export function MetricTiles({
  current,
  unit,
}: {
  current: CurrentWeather;
  unit: TemperatureUnit;
}) {
  return (
    <section aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className="sr-only">
        Current conditions detail
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <Tile
          index={0}
          label="Humidity"
          value={`${Math.round(current.humidity)}%`}
          detail={current.humidity > 70 ? "Muggy air" : "Comfortable"}
          accent="bg-rain text-ink"
          icon={<Droplets className="size-4" strokeWidth={3} aria-hidden="true" />}
        />
        <Tile
          index={1}
          label="Wind"
          value={formatWind(current.windSpeed, unit)}
          detail={`From ${windDirection(current.windDeg)} · ${Math.round(current.windDeg)}°`}
          accent="bg-lime text-ink"
          icon={
            <span
              className="inline-flex"
              style={{ transform: `rotate(${current.windDeg + 180}deg)` }}
            >
              <Navigation className="size-4" strokeWidth={3} aria-hidden="true" />
            </span>
          }
        />
        <Tile
          index={2}
          label="Visibility"
          value={formatVisibility(current.visibility, unit)}
          detail={current.visibility >= 9000 ? "Clear sightlines" : "Reduced"}
          accent="bg-fog text-ink"
          icon={<Eye className="size-4" strokeWidth={3} aria-hidden="true" />}
        />
        <Tile
          index={3}
          label="Pressure"
          value={`${current.pressure} hPa`}
          detail={current.pressure > 1013 ? "High / settled" : "Low / unsettled"}
          accent="bg-storm text-ink"
          icon={<Gauge className="size-4" strokeWidth={3} aria-hidden="true" />}
        />
        <Tile
          index={4}
          label="UV index"
          value={current.uvIndex.toFixed(1)}
          detail={uvLabel(current.uvIndex)}
          accent="bg-hot text-ink"
          icon={<Wind className="size-4" strokeWidth={3} aria-hidden="true" />}
        />
        <Tile
          index={5}
          label="Sunrise"
          value={formatClock(current.sunrise)}
          detail="Local time"
          accent="bg-sun text-ink"
          icon={<Sunrise className="size-4" strokeWidth={3} aria-hidden="true" />}
        />
        <Tile
          index={6}
          label="Sunset"
          value={formatClock(current.sunset)}
          detail="Local time"
          accent="bg-night text-ink"
          icon={<Sunset className="size-4" strokeWidth={3} aria-hidden="true" />}
        />
        <Tile
          index={7}
          label="Daylight"
          value={`${Math.max(0, Math.round((current.sunset - current.sunrise) / 3600000))} hrs`}
          detail={current.isDay ? "Currently daytime" : "Currently night"}
          accent="bg-accent text-accent-foreground"
          icon={<Sunrise className="size-4" strokeWidth={3} aria-hidden="true" />}
        />
      </ul>
    </section>
  );
}
