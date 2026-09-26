/**
 * Activity index: suitability scores derived from the current conditions,
 * shown as animated meters.
 */

import { motion, useReducedMotion } from "motion/react";
import { Activity } from "lucide-react";

import { activityScores } from "@/lib/weather-insights";
import type { TemperatureUnit } from "@/lib/weather-format";
import type { CurrentWeather } from "@/lib/weather-types";

function tone(score: number) {
  if (score >= 70) return "bg-lime";
  if (score >= 40) return "bg-sun";
  return "bg-rain";
}

export function ActivityIndex({
  current,
  unit = "C",
}: {
  current: CurrentWeather;
  unit?: TemperatureUnit;
}) {
  const reduced = useReducedMotion();
  const scores = activityScores(current, unit);

  return (
    <section aria-labelledby="activity-heading" className="brut bg-card p-5">
      <div className="flex items-center gap-2">
        <Activity className="size-5" strokeWidth={3} aria-hidden="true" />
        <h2 id="activity-heading" className="font-display text-lg uppercase tracking-tight">
          Activity index
        </h2>
      </div>

      <ul className="mt-4 space-y-4">
        {scores.map((entry, index) => (
          <li key={entry.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold uppercase tracking-wide">{entry.name}</span>
              <span className="font-mono text-xs font-bold">{entry.score}/100</span>
            </div>
            <div
              className="brut-flat mt-1.5 h-4 overflow-hidden bg-secondary"
              role="meter"
              aria-valuenow={entry.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${entry.name} suitability`}
            >
              <motion.div
                className={`h-full ${tone(entry.score)}`}
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${entry.score}%` }}
                transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : index * 0.08 }}
              />
            </div>
            <p className="mt-1 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
              {entry.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
