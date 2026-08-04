/**
 * Background ambience layer: pure CSS motion tuned per weather condition.
 * Purely decorative, so it is hidden from assistive tech.
 */

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
  const streaks = group === "rain" || group === "storm";
  const flakes = group === "snow";
  const clouds = group === "clouds" || group === "fog" || streaks;
  const stars = !isDay && !streaks;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 sky-gradient" />
      <div className="absolute inset-0 hatch opacity-40" />

      {isDay && group === "clear" && (
        <div
          className="absolute -right-24 -top-24 size-[28rem] rounded-full bg-sun/40"
          style={{ animation: "spin-slow 60s linear infinite" }}
        />
      )}

      {stars &&
        Array.from({ length: 26 }).map((_, index) => (
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

      {clouds &&
        Array.from({ length: 5 }).map((_, index) => (
          <span
            key={`cloud-${index}`}
            className="absolute h-16 w-56 rounded-full border-3 border-ink/25 bg-card/40"
            style={{
              top: `${8 + index * 15}%`,
              animation: `drift ${50 + index * 18}s linear ${index * -12}s infinite`,
            }}
          />
        ))}

      {streaks &&
        Array.from({ length: 40 }).map((_, index) => (
          <span
            key={`rain-${index}`}
            className="absolute h-16 w-[2px] bg-rain/50"
            style={{
              left: `${seeded(index, 13) * 100}%`,
              animation: `fall ${0.9 + seeded(index, 17) * 0.8}s linear ${seeded(index, 19) * -2}s infinite`,
            }}
          />
        ))}

      {flakes &&
        Array.from({ length: 30 }).map((_, index) => (
          <span
            key={`snow-${index}`}
            className="absolute size-2 rounded-full bg-ink/30"
            style={{
              left: `${seeded(index, 23) * 100}%`,
              animation: `fall ${6 + seeded(index, 29) * 5}s linear ${seeded(index, 31) * -6}s infinite`,
            }}
          />
        ))}

      {group === "storm" && (
        <div
          className="absolute inset-0 bg-storm/40"
          style={{ animation: "flash 7s linear infinite" }}
        />
      )}
    </div>
  );
}
