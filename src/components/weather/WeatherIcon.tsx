/**
 * Animated weather glyph. Each condition group gets its own composition so the
 * icon reads at a glance and animates subtly.
 */

import { motion } from "motion/react";
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
  const accent = ACCENT[group];

  if (group === "clear") {
    const Glyph = isDay ? Sun : Moon;
    return (
      <motion.span
        aria-hidden="true"
        className={isDay ? "inline-flex text-sun" : "inline-flex text-night dark:text-snow"}
        animate={still ? {} : isDay ? { rotate: 360 } : { scale: [1, 1.08, 1] }}
        transition={
          isDay
            ? { duration: 26, repeat: Infinity, ease: "linear" }
            : { duration: 4, repeat: Infinity }
        }
      >
        <Glyph className={className} strokeWidth={2.5} />
      </motion.span>
    );
  }

  if (group === "rain" || group === "snow") {
    const Glyph = group === "rain" ? CloudRain : CloudSnow;
    return (
      <motion.span
        aria-hidden="true"
        className={`inline-flex ${accent}`}
        animate={still ? {} : { y: [0, -2, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        <Glyph className={className} strokeWidth={2.5} />
      </motion.span>
    );
  }

  if (group === "storm") {
    return (
      <span aria-hidden="true" className={`relative inline-flex ${accent}`}>
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

  const Glyph = group === "fog" ? CloudFog : Cloud;
  return (
    <motion.span
      aria-hidden="true"
      className={`inline-flex ${accent}`}
      animate={still ? {} : { x: [0, 3, 0] }}
      transition={{ duration: 5, repeat: Infinity }}
    >
      <Glyph className={className} strokeWidth={2.5} />
    </motion.span>
  );
}
