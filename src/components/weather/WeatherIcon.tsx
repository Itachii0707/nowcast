/**
 * Animated weather glyph. Each condition group gets its own composition so the
 * icon reads at a glance and animates subtly.
 *
 * The glyph is wrapped in AnimatePresence keyed on condition + day/night, so a
 * changing condition swaps icons with a spring pop instead of a hard cut.
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Cloud, CloudFog, CloudRain, CloudSnow, Moon, Sun, Zap } from "lucide-react";

import type { ConditionGroup } from "@/lib/weather-types";

const ACCENT: Record<ConditionGroup, string> = {
  clear: "text-sun",
  clouds: "text-fog",
  rain: "text-rain",
  snow: "text-snow",
  storm: "text-storm",
  fog: "text-fog",
};

interface WeatherIconProps {
  group: ConditionGroup;
  isDay?: boolean;
  className?: string;
  /** Disable motion for dense lists. */
  still?: boolean;
}

export function WeatherIcon({
  group,
  isDay = true,
  className = "size-10",
  still = false,
}: WeatherIconProps) {
  const reduced = useReducedMotion();
  const identity = `${group}:${isDay ? "day" : "night"}`;

  return (
    <span aria-hidden="true" className="relative inline-flex">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={identity}
          className="inline-flex"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -25 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 20 }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 320, damping: 20, mass: 0.6 }
          }
        >
          <Glyph
            group={group}
            isDay={isDay}
            className={className}
            still={still || Boolean(reduced)}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** The idle (looping) animation for a single condition group. */
function Glyph({
  group,
  isDay,
  className,
  still,
}: Required<Pick<WeatherIconProps, "group" | "isDay" | "className" | "still">>) {
  const accent = ACCENT[group];

  if (group === "clear") {
    const Icon = isDay ? Sun : Moon;
    return (
      <motion.span
        className={isDay ? "inline-flex text-sun" : "inline-flex text-night dark:text-snow"}
        animate={still ? {} : isDay ? { rotate: 360 } : { scale: [1, 1.08, 1] }}
        transition={
          isDay
            ? { duration: 26, repeat: Infinity, ease: "linear" }
            : { duration: 4, repeat: Infinity }
        }
      >
        <Icon className={className} strokeWidth={2.5} />
      </motion.span>
    );
  }

  if (group === "rain" || group === "snow") {
    const Icon = group === "rain" ? CloudRain : CloudSnow;
    return (
      <motion.span
        className={`inline-flex ${accent}`}
        animate={still ? {} : { y: [0, -2, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <Icon className={className} strokeWidth={2.5} />
      </motion.span>
    );
  }

  if (group === "storm") {
    return (
      <span className={`relative inline-flex ${accent}`}>
        <Cloud className={className} strokeWidth={2.5} />
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-sun"
          animate={still ? {} : { opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <Zap className="size-1/2" strokeWidth={3} />
        </motion.span>
      </span>
    );
  }

  const Icon = group === "fog" ? CloudFog : Cloud;
  return (
    <motion.span
      className={`inline-flex ${accent}`}
      animate={still ? {} : { x: [0, 3, 0] }}
      transition={{ duration: 5, repeat: Infinity }}
    >
      <Icon className={className} strokeWidth={2.5} />
    </motion.span>
  );
}
