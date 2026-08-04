/**
 * Background ambience layer: pure CSS motion tuned per weather condition,
 * cross-faded whenever the condition or day/night state changes.
 *
 * Two stacked layers are kept alive at once (outgoing + incoming) so a change
 * from, say, "clear day" to "rain" dissolves instead of snapping. Each layer
 * carries its own `data-sky` attribute, which is what drives the gradient
 * tokens defined in styles.css.
 *
 * Layers per condition group:
 *  - clear (day):   rotating sun disc + sweeping light rays + heat shimmer
 *  - clear (night): twinkling stars + a drifting moon glow
 *  - clouds:        multiple parallax cloud bands
 *  - fog:           slow horizontal fog banks
 *  - rain:          clouds + slanted streaks + puddle ripples
 *  - storm:         rain + lightning flashes + a bolt
 *  - snow:          swaying flakes of mixed sizes
 *  - windy accents: gust lines for rain/storm/clouds
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { skyKey } from "@/lib/weather-format";
import type { ConditionGroup } from "@/lib/weather-types";

interface AmbienceProps {
  group: ConditionGroup;
  isDay: boolean;
}

/** Deterministic pseudo-random so SSR and client markup match exactly. */
function seeded(index: number, salt: number) {
  return ((index * 9301 + salt * 49297) % 233280) / 233280;
}

export function Ambience({ group, isDay }: AmbienceProps) {
  const reduced = useReducedMotion();
  const sky = skyKey(group, isDay);
  const layerKey = `${sky}:${group}:${isDay ? "day" : "night"}`;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Cross-fading sky + ambience stack. `mode="sync"` keeps the outgoing
          layer mounted so the two gradients overlap during the transition. */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={layerKey}
          data-sky={sky}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.9, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 sky-gradient" />
          <div className="absolute inset-0 hatch opacity-40" />
          <ConditionLayers group={group} isDay={isDay} reduced={Boolean(reduced)} />
        </motion.div>
      </AnimatePresence>

      {/* Day/night wash: a warm-to-cool sweep that fires on each change. */}
      {!reduced && (
        <AnimatePresence initial={false}>
          <motion.div
            key={`wash-${isDay ? "day" : "night"}`}
            className="absolute inset-0"
            style={{
              backgroundImage: isDay
                ? "linear-gradient(120deg, color-mix(in oklab, var(--sun) 45%, transparent), transparent 60%)"
                : "linear-gradient(300deg, color-mix(in oklab, var(--night) 55%, transparent), transparent 60%)",
            }}
            initial={{ opacity: 0.85, x: isDay ? "-30%" : "30%" }}
            animate={{ opacity: 0, x: "0%" }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        </AnimatePresence>
      )}
    </div>
  );
}

interface LayerProps {
  group: ConditionGroup;
  isDay: boolean;
  reduced: boolean;
}

/** The decorative motion for one condition/day-night combination. */
function ConditionLayers({ group, isDay, reduced }: LayerProps) {
  if (reduced) return null;

  const streaks = group === "rain" || group === "storm";
  const flakes = group === "snow";
  const clouds = group === "clouds" || group === "fog" || streaks;
  const stars = !isDay && !streaks;
  const fog = group === "fog";
  const sunny = isDay && group === "clear";

  return (
    <>
      {/* ---------------- Sunny ---------------- */}
      {sunny && (
        <>
          <div
            className="absolute -right-24 -top-24 size-[28rem] rounded-full bg-sun/40"
            style={{ animation: "spin-slow 60s linear infinite" }}
          />
          <div
            className="absolute -right-16 -top-16 size-[22rem] rounded-full border-3 border-ink/20"
            style={{ animation: "pulse-ring 6s ease-in-out infinite" }}
          />
          {Array.from({ length: 10 }).map((_, index) => (
            <span
              key={`ray-${index}`}
              className="absolute right-[6rem] top-[6rem] h-[2px] w-[30rem] origin-left bg-sun/40"
              style={{
                transform: `rotate(${index * 36}deg)`,
                animation: `ray-sweep ${7 + index}s ease-in-out ${index * -0.6}s infinite`,
              }}
            />
          ))}
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={`shimmer-${index}`}
              className="absolute size-1.5 rounded-full bg-sun/60"
              style={{
                left: `${seeded(index, 41) * 100}%`,
                top: `${30 + seeded(index, 43) * 60}%`,
                animation: `float-up ${9 + seeded(index, 47) * 7}s linear ${seeded(index, 53) * -9}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* ---------------- Night ---------------- */}
      {stars && (
        <>
          <div
            className="absolute -left-16 top-10 size-56 rounded-full border-3 border-ink/25 bg-night/50"
            style={{ animation: "moon-drift 90s ease-in-out infinite alternate" }}
          />
          {Array.from({ length: 34 }).map((_, index) => (
            <span
              key={`star-${index}`}
              className="absolute size-1 bg-ink"
              style={{
                left: `${seeded(index, 3) * 100}%`,
                top: `${seeded(index, 7) * 70}%`,
                animation: `twinkle ${3 + seeded(index, 11) * 4}s ease-in-out ${seeded(index, 5) * 3}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* ---------------- Clouds ---------------- */}
      {clouds &&
        Array.from({ length: 7 }).map((_, index) => (
          <span
            key={`cloud-${index}`}
            className="absolute h-16 w-56 rounded-full border-3 border-ink/25 bg-card/40"
            style={{
              top: `${6 + index * 12}%`,
              transform: `scale(${0.7 + seeded(index, 59) * 0.8})`,
              animation: `drift ${46 + index * 16}s linear ${index * -11}s infinite`,
            }}
          />
        ))}

      {/* ---------------- Fog ---------------- */}
      {fog &&
        Array.from({ length: 5 }).map((_, index) => (
          <span
            key={`fog-${index}`}
            className="absolute h-32 w-[140%] bg-fog/30 blur-[2px]"
            style={{
              top: `${12 + index * 18}%`,
              animation: `fog-bank ${30 + index * 9}s ease-in-out ${index * -7}s infinite alternate`,
            }}
          />
        ))}

      {/* ---------------- Rain ---------------- */}
      {streaks && (
        <>
          {Array.from({ length: 56 }).map((_, index) => (
            <span
              key={`rain-${index}`}
              className="absolute h-16 w-[2px] bg-rain/50"
              style={{
                left: `${seeded(index, 13) * 100}%`,
                transform: "rotate(12deg)",
                animation: `fall-slant ${0.8 + seeded(index, 17) * 0.7}s linear ${seeded(index, 19) * -2}s infinite`,
              }}
            />
          ))}
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={`ripple-${index}`}
              className="absolute bottom-6 size-6 rounded-full border-3 border-rain/50"
              style={{
                left: `${seeded(index, 61) * 95}%`,
                animation: `ripple ${2 + seeded(index, 67) * 1.6}s ease-out ${seeded(index, 71) * -2}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* ---------------- Snow ---------------- */}
      {flakes &&
        Array.from({ length: 42 }).map((_, index) => (
          <span
            key={`snow-${index}`}
            className="absolute rounded-full bg-ink/30"
            style={{
              left: `${seeded(index, 23) * 100}%`,
              width: `${5 + seeded(index, 37) * 7}px`,
              height: `${5 + seeded(index, 37) * 7}px`,
              animation: `snow-sway ${7 + seeded(index, 29) * 6}s linear ${seeded(index, 31) * -8}s infinite`,
            }}
          />
        ))}

      {/* ---------------- Wind gusts ---------------- */}
      {(clouds || flakes) &&
        Array.from({ length: 6 }).map((_, index) => (
          <span
            key={`gust-${index}`}
            className="absolute h-[3px] w-40 rounded-full bg-ink/15"
            style={{
              top: `${18 + seeded(index, 73) * 65}%`,
              animation: `gust ${5 + seeded(index, 79) * 5}s ease-in-out ${index * -1.7}s infinite`,
            }}
          />
        ))}

      {/* ---------------- Storm ---------------- */}
      {group === "storm" && (
        <>
          <div
            className="absolute inset-0 bg-storm/40"
            style={{ animation: "flash 7s linear infinite" }}
          />
          <svg
            className="absolute left-1/2 top-16 w-24 -translate-x-1/2 text-sun"
            viewBox="0 0 24 48"
            fill="currentColor"
            style={{ animation: "bolt 7s linear infinite" }}
          >
            <path d="M14 0 3 26h7L8 48l13-28h-8z" />
          </svg>
        </>
      )}
    </>
  );
}
