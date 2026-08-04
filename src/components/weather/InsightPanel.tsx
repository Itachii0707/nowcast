/**
 * Derived "what this actually means" highlights, computed from the forecast
 * arrays. Pure presentation logic — no extra network calls.
 */

import { motion } from "motion/react";
import { CloudRain, Shirt, Sparkles, ThermometerSun } from "lucide-react";
import type { ReactNode } from "react";

import { formatHour, formatTemp, uvLabel, type TemperatureUnit } from "@/lib/weather-format";
import type { CurrentWeather, DailyPoint, HourlyPoint } from "@/lib/weather-types";

interface InsightPanelProps {
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  unit: TemperatureUnit;
}

interface Insight {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  accent: string;
}

/** Simple what-to-wear heuristic based on feels-like, wind and rain. */
function outfitAdvice(current: CurrentWeather, rainChance: number): string {
  const t = current.feelsLike;
  if (t <= 0) return "Heavy coat, hat, gloves";
  if (t <= 8) return "Warm coat and a scarf";
  if (t <= 15) return rainChance > 40 ? "Jacket plus umbrella" : "Light jacket";
  if (t <= 24) return rainChance > 40 ? "Tee and a rain shell" : "Tee and jeans";
  return current.uvIndex >= 6 ? "Light layers, sunscreen, shade" : "Light, breathable layers";
}

export function InsightPanel({ current, hourly, daily, unit }: InsightPanelProps) {
  const next12 = hourly.slice(0, 12);
  const peakRain = next12.reduce<HourlyPoint | undefined>(
    (best, point) => (!best || point.pop > best.pop ? point : best),
    undefined,
  );
  const warmest = next12.reduce<HourlyPoint | undefined>(
    (best, point) => (!best || point.temp > best.temp ? point : best),
    undefined,
  );
  const today = daily[0];
  const rainChance = peakRain?.pop ?? 0;

  const insights: Insight[] = [
    {
      label: "Rain outlook",
      value: rainChance > 0 ? `${Math.round(rainChance)}%` : "Dry",
      detail:
        rainChance > 20 && peakRain
          ? `Peak chance around ${formatHour(peakRain.time)}h`
          : "No meaningful rain in the next 12 hours",
      icon: <CloudRain className="size-4" strokeWidth={3} aria-hidden="true" />,
      accent: "bg-rain text-ink",
    },
    {
      label: "Warmest stretch",
      value: warmest ? formatTemp(warmest.temp, unit) : "—",
      detail: warmest ? `Expected near ${formatHour(warmest.time)}h` : "Awaiting hourly data",
      icon: <ThermometerSun className="size-4" strokeWidth={3} aria-hidden="true" />,
      accent: "bg-hot text-ink",
    },
    {
      label: "Today's range",
      value: today ? `${formatTemp(today.min, unit)} / ${formatTemp(today.max, unit)}` : "—",
      detail: today
        ? `${Math.round(today.max - today.min)}° swing between low and high`
        : "Awaiting daily data",
      icon: <Sparkles className="size-4" strokeWidth={3} aria-hidden="true" />,
      accent: "bg-lime text-ink",
    },
    {
      label: "What to wear",
      value: outfitAdvice(current, rainChance),
      detail: `UV ${uvLabel(current.uvIndex).toLowerCase()} · humidity ${Math.round(current.humidity)}%`,
      icon: <Shirt className="size-4" strokeWidth={3} aria-hidden="true" />,
      accent: "bg-accent text-accent-foreground",
    },
  ];

  return (
    <section aria-labelledby="insights-heading">
      <h2 id="insights-heading" className="mb-3 text-xl uppercase">
        Highlights
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight, index) => (
          <motion.li
            key={insight.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 240, damping: 24 }}
            className="brut bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`brut-flat inline-flex size-8 items-center justify-center ${insight.accent}`}
              >
                {insight.icon}
              </span>
              <p className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                {insight.label}
              </p>
            </div>
            <p className="mt-3 font-display text-xl leading-tight">{insight.value}</p>
            <p className="mt-1 font-mono text-[0.65rem] font-bold uppercase leading-relaxed text-muted-foreground">
              {insight.detail}
            </p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
