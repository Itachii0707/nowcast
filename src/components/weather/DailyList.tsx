/**
 * Seven day outlook with proportional high/low range bars.
 */

import { motion } from "motion/react";

import { WeatherIcon } from "./WeatherIcon";
import {
  formatDate,
  formatTemp,
  formatWeekday,
  convertTemp,
  type TemperatureUnit,
} from "@/lib/weather-format";
import type { DailyPoint } from "@/lib/weather-types";

export function DailyList({
  daily,
  unit,
}: {
  daily: DailyPoint[];
  unit: TemperatureUnit;
}) {
  const lows = daily.map((day) => convertTemp(day.min, unit));
  const highs = daily.map((day) => convertTemp(day.max, unit));
  const floor = Math.min(...lows);
  const ceiling = Math.max(...highs);
  const span = Math.max(1, ceiling - floor);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="brut bg-card p-6"
      aria-labelledby="daily-heading"
    >
      <h2 id="daily-heading" className="text-xl uppercase">
        7-day outlook
      </h2>

      <ul className="mt-4 divide-y-3 divide-ink">
        {daily.map((day, index) => {
          const low = convertTemp(day.min, unit);
          const high = convertTemp(day.max, unit);
          const offset = ((low - floor) / span) * 100;
          const width = Math.max(6, ((high - low) / span) * 100);

          return (
            <li key={day.time} className="flex items-center gap-3 py-3">
              <div className="w-20 shrink-0">
                <p className="font-mono text-xs font-bold uppercase">
                  {index === 0 ? "Today" : formatWeekday(day.time)}
                </p>
                <p className="font-mono text-[0.6rem] font-bold uppercase text-muted-foreground">
                  {formatDate(day.time)}
                </p>
              </div>

              <WeatherIcon group={day.condition.group} className="size-6 shrink-0" still />

              <p className="w-10 shrink-0 text-right font-mono text-xs font-bold text-muted-foreground">
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
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
