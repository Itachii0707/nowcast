/**
 * Live local clock for the active location plus a day-progress arc.
 *
 * Payload timestamps are "display epochs" (already shifted into the location's
 * local time), so the location's offset is simply `fetchedAt - realNow` at the
 * moment the data landed. We round it to the nearest 15 minutes because real
 * world offsets come in quarter-hour steps.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Clock, MoonStar, Sunrise, Sunset } from "lucide-react";

import { SkyArc } from "@/components/weather/SkyArc";
import { formatClock, formatDate, formatWeekday } from "@/lib/weather-format";
import type { CurrentWeather } from "@/lib/weather-types";

const QUARTER = 15 * 60 * 1000;

interface LocalClockProps {
  fetchedAt: number;
  timezoneOffset?: number;
  current: CurrentWeather;
  place: string;
}

export function LocalClock({ fetchedAt, timezoneOffset, current, place }: LocalClockProps) {
  const offset = useMemo(
    () =>
      timezoneOffset != null
        ? timezoneOffset * 1000
        : Math.round((fetchedAt - Date.now()) / QUARTER) * QUARTER,
    [fetchedAt, timezoneOffset],
  );

  // Start from the payload instant so SSR and first paint agree, then tick.
  const [localNow, setLocalNow] = useState(fetchedAt);

  useEffect(() => {
    const tick = () => setLocalNow(Date.now() + offset);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [offset]);

  const seconds = Math.floor(localNow / 1000) % 60;

  const nextEvent =
    localNow < current.sunrise
      ? {
          label: "Sunrise in",
          at: current.sunrise,
          icon: <Sunrise className="size-4" strokeWidth={3} aria-hidden="true" />,
        }
      : localNow < current.sunset
        ? {
            label: "Sunset in",
            at: current.sunset,
            icon: <Sunset className="size-4" strokeWidth={3} aria-hidden="true" />,
          }
        : {
            label: "Sunrise in",
            at: current.sunrise + 86400000,
            icon: <MoonStar className="size-4" strokeWidth={3} aria-hidden="true" />,
          };

  const remaining = Math.max(0, nextEvent.at - localNow);
  const hrs = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 230, damping: 24 }}
      className="brut bg-card p-5 sm:p-6"
      aria-labelledby="clock-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2
            id="clock-heading"
            className="inline-flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground"
          >
            <Clock className="size-3.5" strokeWidth={3} aria-hidden="true" />
            Local time · {place}
          </h2>
          <p className="mt-2 flex items-baseline gap-1 font-display text-5xl leading-none tracking-tighter sm:text-6xl">
            <span suppressHydrationWarning>{formatClock(localNow)}</span>
            <span
              suppressHydrationWarning
              className="font-mono text-lg font-bold text-muted-foreground"
            >
              :{String(seconds).padStart(2, "0")}
            </span>
            <span
              aria-hidden="true"
              className="ml-1 inline-block size-2 rounded-full bg-accent"
              style={{ animation: "beat 1s steps(1, end) infinite" }}
            />
          </p>
          <p
            suppressHydrationWarning
            className="mt-1 font-mono text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground"
          >
            {formatWeekday(localNow)} · {formatDate(localNow)}
          </p>
        </div>

        <div className="brut-flat inline-flex items-center gap-2 bg-secondary px-4 py-3 font-mono text-[0.7rem] font-bold uppercase">
          {nextEvent.icon}
          <span suppressHydrationWarning>
            {nextEvent.label} {hrs > 0 ? `${hrs}h ` : ""}
            {mins}m
          </span>
        </div>
      </div>

      {/* Sun path arc (day) / moon phase (night) */}
      <SkyArc current={current} localNow={localNow} />
    </motion.section>
  );
}
