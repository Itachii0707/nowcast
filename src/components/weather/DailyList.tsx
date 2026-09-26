/**
 * Seven day outlook with proportional high/low range bars and
 * interactive accordion expansion for in-depth day forecasting.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Droplet, Sun, Sunrise, Sunset, Wind } from "lucide-react";

import { WeatherIcon } from "./WeatherIcon";
import {
  formatDate,
  formatTemp,
  formatWeekday,
  convertTemp,
  formatHour,
  formatMinute,
  formatSpeed,
  type TemperatureUnit,
} from "@/lib/weather-format";
import type { DailyPoint } from "@/lib/weather-types";

function uvRisk(uv?: number): { label: string; badge: string } {
  if (uv == null) return { label: "N/A", badge: "bg-secondary text-foreground" };
  if (uv <= 2) return { label: "Low", badge: "bg-lime text-black" };
  if (uv <= 5) return { label: "Moderate", badge: "bg-sun text-black" };
  if (uv <= 7) return { label: "High", badge: "bg-hot text-black" };
  if (uv <= 10) return { label: "Very High", badge: "bg-destructive text-white" };
  return { label: "Extreme", badge: "bg-storm text-white" };
}

export function DailyList({ daily, unit }: { daily: DailyPoint[]; unit: TemperatureUnit }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const lows = daily.map((day) => convertTemp(day.min, unit));
  const highs = daily.map((day) => convertTemp(day.max, unit));
  const floor = Math.min(...lows);
  const ceiling = Math.max(...highs);
  const span = Math.max(1, ceiling - floor);

  const toggleDay = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="brut bg-card p-4 sm:p-6"
      aria-labelledby="daily-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="daily-heading" className="text-xl uppercase font-display tracking-tight">
          7-Day Forecast & Synoptic Outlook
        </h2>
        <span className="font-mono text-[0.65rem] font-bold uppercase text-muted-foreground hidden sm:inline">
          Click any day for details
        </span>
      </div>

      <ul className="mt-4 divide-y-3 divide-ink">
        {daily.map((day, index) => {
          const low = convertTemp(day.min, unit);
          const high = convertTemp(day.max, unit);
          const offset = ((low - floor) / span) * 100;
          const width = Math.max(6, ((high - low) / span) * 100);
          const isExpanded = expandedIndex === index;

          const sunriseTime = day.sunrise
            ? `${formatHour(day.sunrise)}:${formatMinute(day.sunrise)}`
            : null;
          const sunsetTime = day.sunset
            ? `${formatHour(day.sunset)}:${formatMinute(day.sunset)}`
            : null;
          const uv = uvRisk(day.uvMax);

          return (
            <li key={day.time} className="transition-colors">
              {/* Clickable Header Row */}
              <button
                type="button"
                onClick={() => toggleDay(index)}
                className={`w-full flex items-center gap-3 py-3 px-2 text-left transition-colors hover:bg-accent/15 cursor-pointer ${
                  isExpanded ? "bg-accent/20" : ""
                }`}
                aria-expanded={isExpanded}
                aria-controls={`day-details-${index}`}
              >
                <div className="w-20 shrink-0">
                  <p className="font-mono text-xs font-bold uppercase">
                    {index === 0 ? "Today" : formatWeekday(day.time)}
                  </p>
                  <p className="font-mono text-[0.6rem] font-bold uppercase text-muted-foreground">
                    {formatDate(day.time)}
                  </p>
                </div>

                <div className="flex w-14 shrink-0 items-center gap-1.5">
                  <WeatherIcon group={day.condition.group} className="size-6 shrink-0" still />
                  {day.pop > 10 ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[0.6rem] font-bold text-rain">
                      <Droplet className="size-2.5" strokeWidth={3} aria-hidden="true" />
                      {day.pop}%
                    </span>
                  ) : null}
                </div>

                <p className="w-10 shrink-0 text-right font-mono text-xs font-bold text-foreground/80">
                  {formatTemp(day.min, unit)}
                </p>

                <div
                  className="brut-flat relative h-3 flex-1 bg-secondary"
                  role="img"
                  aria-label={`${day.condition.label}, low ${formatTemp(day.min, unit)}, high ${formatTemp(day.max, unit)}`}
                >
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5, delay: index * 0.04 }}
                    className="absolute inset-y-0 bg-accent"
                    style={{ left: `${offset}%` }}
                  />
                </div>

                <p className="w-10 shrink-0 font-mono text-xs font-bold">
                  {formatTemp(day.max, unit)}
                </p>

                <div className="shrink-0 pl-1 text-muted-foreground">
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="size-4" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </button>

              {/* Expandable Synoptic Drawer */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    id={`day-details-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t-2 border-dashed border-ink/40 bg-card/60 p-4 mx-2 mb-3 mt-1 brut-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-ink/20">
                        <span className="font-mono text-xs font-bold uppercase tracking-tight text-foreground">
                          Condition:{" "}
                          <span className="text-foreground font-black underline decoration-accent underline-offset-4">
                            {day.condition.label}
                          </span>
                        </span>
                        <span className="font-mono text-[0.65rem] font-bold uppercase text-muted-foreground">
                          Expected range: {formatTemp(day.min, unit)} to {formatTemp(day.max, unit)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
                        {/* Rain pop & volume */}
                        <div className="bg-card p-2 border-2 border-ink">
                          <p className="text-[0.6rem] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Droplet className="size-3 text-rain" strokeWidth={2.5} /> Rain Chance
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {day.pop}%{" "}
                            {day.precipSum != null && day.precipSum > 0
                              ? `(${day.precipSum.toFixed(1)} mm)`
                              : ""}
                          </p>
                        </div>

                        {/* UV Index */}
                        <div className="bg-card p-2 border-2 border-ink">
                          <p className="text-[0.6rem] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Sun className="size-3 text-sun" strokeWidth={2.5} /> Max UV
                          </p>
                          <p className="mt-1 font-bold">
                            {day.uvMax != null ? (
                              <span
                                className={`inline-block px-1.5 py-0.5 text-[0.65rem] font-black uppercase ${uv.badge}`}
                              >
                                {day.uvMax.toFixed(1)} · {uv.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Moderate</span>
                            )}
                          </p>
                        </div>

                        {/* Peak Wind */}
                        <div className="bg-card p-2 border-2 border-ink">
                          <p className="text-[0.6rem] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Wind className="size-3 text-foreground" strokeWidth={2.5} /> Peak Wind
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {day.windMax != null ? formatSpeed(day.windMax, unit) : "Calm"}
                          </p>
                        </div>

                        {/* Sun Times */}
                        <div className="bg-card p-2 border-2 border-ink">
                          <p className="text-[0.6rem] font-bold uppercase text-muted-foreground flex items-center gap-1">
                            <Sunrise className="size-3 text-sun" strokeWidth={2.5} /> Sun Window
                          </p>
                          <p className="mt-1 font-bold text-foreground text-[0.7rem]">
                            {sunriseTime && sunsetTime
                              ? `${sunriseTime} - ${sunsetTime}`
                              : "Normal daylight"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
