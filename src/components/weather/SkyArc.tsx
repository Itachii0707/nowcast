/**
 * Sun & moon arc: shows the sun's position between sunrise and sunset during
 * the day, and the moon phase at night. Replaces the flat daylight bar.
 */

import { motion, useReducedMotion } from "motion/react";
import { Sunrise, Sunset } from "lucide-react";

import { formatClock } from "@/lib/weather-format";
import { moonPhase } from "@/lib/weather-insights";
import type { CurrentWeather } from "@/lib/weather-types";

interface SkyArcProps {
  current: CurrentWeather;
  /** Local "now" for the location, as a display epoch. */
  localNow: number;
}

/** Arc geometry in SVG user units. */
const W = 320;
const H = 130;
const R = 130;
const CX = W / 2;
const CY = H;

function pointOnArc(progress: number) {
  const angle = Math.PI * (1 - Math.min(1, Math.max(0, progress)));
  return { x: CX + Math.cos(angle) * R, y: CY - Math.sin(angle) * R };
}

export function SkyArc({ current, localNow }: SkyArcProps) {
  const reduced = useReducedMotion();
  const dayLength = Math.max(1, current.sunset - current.sunrise);
  const progress = Math.min(1, Math.max(0, (localNow - current.sunrise) / dayLength));
  const marker = pointOnArc(progress);
  const moon = moonPhase(localNow);

  return (
    <div className="mt-6">
      <div className="brut-flat relative overflow-hidden bg-secondary px-4 pb-3 pt-4">
        <svg
          viewBox={`0 0 ${W} ${H + 6}`}
          className="h-32 w-full"
          role="img"
          aria-label={`Sun path: ${Math.round(progress * 100)} percent through daylight. ${moon.label}.`}
        >
          {/* Track */}
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={3}
            strokeDasharray="8 7"
            opacity={0.45}
          />
          {/* Travelled portion */}
          <motion.path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="var(--sun)"
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={1}
            initial={{ strokeDashoffset: 1 }}
            animate={{ strokeDashoffset: 1 - progress }}
            style={{ strokeDasharray: 1 }}
            transition={{ duration: reduced ? 0 : 1.1, ease: "easeOut" }}
          />
          <line
            x1={CX - R}
            y1={CY}
            x2={CX + R}
            y2={CY}
            stroke="var(--ink)"
            strokeWidth={3}
          />
          {/* Travelling body */}
          <motion.g
            initial={false}
            animate={{ x: marker.x, y: marker.y }}
            transition={{ duration: reduced ? 0 : 1.1, ease: "easeOut" }}
          >
            <circle r={12} fill={current.isDay ? "var(--sun)" : "var(--snow)"} stroke="var(--ink)" strokeWidth={3} />
          </motion.g>
        </svg>

        {/* Moon phase badge, at night */}
        {!current.isDay && (
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="brut-flat inline-block size-6 rounded-full bg-snow"
              style={{
                backgroundImage: `linear-gradient(90deg, var(--night) ${
                  (1 - moon.illumination) * 100
                }%, var(--snow) ${(1 - moon.illumination) * 100}%)`,
              }}
            />
            <span className="font-mono text-[0.6rem] font-bold uppercase tracking-widest">
              {moon.label}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Sunrise className="size-3.5" strokeWidth={3} aria-hidden="true" />
          {formatClock(current.sunrise)}
        </span>
        <span>{current.isDay ? "Daylight" : "Night"}</span>
        <span className="inline-flex items-center gap-1">
          <Sunset className="size-3.5" strokeWidth={3} aria-hidden="true" />
          {formatClock(current.sunset)}
        </span>
      </div>
    </div>
  );
}
