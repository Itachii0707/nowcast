/**
 * Next 24 hours, as a keyboard-scrollable horizontal strip.
 */

import { motion } from "motion/react";
import { Droplet } from "lucide-react";

import { WeatherIcon } from "./WeatherIcon";
import { formatHour, formatTemp, type TemperatureUnit } from "@/lib/weather-format";
import type { HourlyPoint } from "@/lib/weather-types";

export function HourlyStrip({ hourly, unit }: { hourly: HourlyPoint[]; unit: TemperatureUnit }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="brut bg-card p-6"
      aria-labelledby="hourly-heading"
    >
      <div className="flex items-baseline justify-between">
        <h2 id="hourly-heading" className="text-xl uppercase">
          Next 24 hours
        </h2>
        <p className="font-mono text-[0.65rem] font-bold uppercase text-muted-foreground">
          Scroll →
        </p>
      </div>

      <ul
        tabIndex={0}
        aria-label="Hourly forecast, scrollable"
        className="mt-4 flex gap-3 overflow-x-auto pb-3"
      >
        {hourly.map((hour, index) => (
          <li
            key={hour.time}
            className="brut-flat brut-press flex w-24 shrink-0 flex-col items-center gap-2 bg-secondary px-2 py-3"
          >
            <p className="font-mono text-[0.7rem] font-bold uppercase">
              {index === 0 ? "Now" : `${formatHour(hour.time)}:00`}
            </p>
            <WeatherIcon group={hour.condition.group} isDay={hour.isDay} className="size-7" still />
            <p className="font-display text-lg leading-none">{formatTemp(hour.temp, unit)}</p>
            <p className="inline-flex items-center gap-1 font-mono text-[0.6rem] font-bold text-rain">
              <Droplet className="size-3" strokeWidth={3} aria-hidden="true" />
              {hour.pop}%
            </p>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
