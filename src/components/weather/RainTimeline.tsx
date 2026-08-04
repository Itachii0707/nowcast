/**
 * Rain radar timeline: the next ~2 hours of precipitation as a bar strip,
 * plus a plain-language headline. Renders nothing when the provider omits
 * short-range data.
 */

import { motion, useReducedMotion } from "motion/react";
import { Droplets } from "lucide-react";

import { formatClock } from "@/lib/weather-format";
import { summariseRain } from "@/lib/weather-insights";
import type { MinutelyPoint } from "@/lib/weather-types";

interface RainTimelineProps {
  points: MinutelyPoint[];
  /** Local display epoch for "now". */
  localNow: number;
}

export function RainTimeline({ points, localNow }: RainTimelineProps) {
  const reduced = useReducedMotion();
  if (!points.length) return null;

  const summary = summariseRain(points, localNow);
  const scale = Math.max(0.4, summary.peak);

  return (
    <section aria-labelledby="rain-heading" className="brut bg-card p-5">
      <div className="flex items-center gap-2">
        <Droplets className="size-5 text-rain" strokeWidth={3} aria-hidden="true" />
        <h2 id="rain-heading" className="font-display text-lg uppercase tracking-tight">
          Next 2 hours
        </h2>
      </div>

      <p className="mt-1 text-sm font-semibold text-muted-foreground">{summary.headline}</p>

      <div className="mt-4 flex h-24 items-end gap-1.5" role="list">
        {points.map((point, index) => {
          const height = Math.max(4, (point.precip / scale) * 100);
          return (
            <motion.div
              key={point.time}
              role="listitem"
              aria-label={`${formatClock(point.time)}: ${point.precip.toFixed(2)} millimetres`}
              className="brut-flat flex-1 origin-bottom bg-rain/70"
              initial={reduced ? false : { height: 4, opacity: 0 }}
              animate={{ height: `${height}%`, opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : index * 0.03 }}
            />
          );
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Now</span>
        <span>{summary.wet ? `Peak ${summary.peak.toFixed(2)} mm` : "Dry"}</span>
        <span>{formatClock(points[points.length - 1]!.time)}</span>
      </div>
    </section>
  );
}
