/**
 * Derived, purely client-side insight helpers: moon phase, short-range rain
 * summaries and activity scoring. Nothing here touches the network.
 */

import { formatTemp, formatWind, type TemperatureUnit } from "./weather-format";
import type { CurrentWeather, MinutelyPoint } from "./weather-types";

/* ------------------------------------------------------------------ *
 * Moon phase
 * ------------------------------------------------------------------ */

const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC. */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86400000;

export interface MoonPhase {
  /** 0 = new, 0.5 = full, wraps at 1. */
  fraction: number;
  label: string;
  /** Illuminated share of the disc, 0-1. */
  illumination: number;
}

export function moonPhase(epoch: number): MoonPhase {
  const days = epoch / 86400000 - KNOWN_NEW_MOON;
  const fraction = (((days / SYNODIC_MONTH) % 1) + 1) % 1;
  const illumination = (1 - Math.cos(fraction * 2 * Math.PI)) / 2;

  const labels = [
    "New moon",
    "Waxing crescent",
    "First quarter",
    "Waxing gibbous",
    "Full moon",
    "Waning gibbous",
    "Last quarter",
    "Waning crescent",
  ];
  const label = labels[Math.round(fraction * 8) % 8] ?? "New moon";
  return { fraction, label, illumination };
}

/* ------------------------------------------------------------------ *
 * Short-range rain
 * ------------------------------------------------------------------ */

export interface RainSummary {
  /** Plain-language headline for the next couple of hours. */
  headline: string;
  /** Peak precipitation across the window, in mm per slot. */
  peak: number;
  /** True when any slot has measurable precipitation. */
  wet: boolean;
}

export function summariseRain(points: MinutelyPoint[], now: number): RainSummary {
  const peak = points.reduce((max, point) => Math.max(max, point.precip), 0);
  if (peak <= 0.02) {
    return { headline: "No precipitation expected in the next 2 hours", peak: 0, wet: false };
  }

  const firstWet = points.find((point) => point.precip > 0.02);
  const startsIn = firstWet ? Math.round((firstWet.time - now) / 60000) : 0;
  const intensity = peak > 2.5 ? "heavy rain" : peak > 0.6 ? "rain" : "light rain";

  const headline =
    startsIn <= 5
      ? `${intensity[0]!.toUpperCase()}${intensity.slice(1)} falling right now`
      : `${intensity[0]!.toUpperCase()}${intensity.slice(1)} starting in about ${startsIn} min`;

  return { headline, peak, wet: true };
}

/* ------------------------------------------------------------------ *
 * Activity scoring
 * ------------------------------------------------------------------ */

export interface ActivityScore {
  name: string;
  /** 0-100. */
  score: number;
  note: string;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Rough suitability scores from the current conditions. Deliberately simple and
 * explainable rather than pretending to be meteorologically rigorous.
 */
export function activityScores(
  current: CurrentWeather,
  unit: TemperatureUnit = "C",
): ActivityScore[] {
  const { temp, windSpeed, uvIndex, humidity, condition, isDay } = current;
  const wet = condition.group === "rain" || condition.group === "storm";
  const windKmh = windSpeed * 3.6;

  // Running: likes 8-18C, dislikes wind, heat and rain.
  const running = clamp(
    100 - Math.abs(temp - 13) * 4 - windKmh * 0.8 - (wet ? 40 : 0) - Math.max(0, humidity - 70),
  );

  // Cycling: more wind-sensitive, tolerates warmth better.
  const cycling = clamp(100 - Math.abs(temp - 18) * 3.2 - windKmh * 1.6 - (wet ? 45 : 0));

  // Beach: wants heat, sun and low wind.
  const beach = clamp(
    (temp - 18) * 7 + (condition.group === "clear" ? 30 : 0) - windKmh * 1.2 - (wet ? 60 : 0) + 30,
  );

  // Stargazing: needs night and clear skies.
  const stargazing = clamp(
    (isDay ? 0 : 60) +
      (condition.group === "clear" ? 40 : condition.group === "clouds" ? 5 : 0) -
      Math.max(0, humidity - 80),
  );

  return [
    {
      name: "Running",
      score: running,
      note: wet ? "Wet underfoot" : `${formatTemp(temp, unit)} feels workable`,
    },
    { name: "Cycling", score: cycling, note: `${formatWind(windSpeed, unit)} wind` },
    {
      name: "Beach",
      score: beach,
      note: uvIndex >= 6 ? "High UV — bring cover" : `UV ${uvIndex.toFixed(0)}`,
    },
    {
      name: "Stargazing",
      score: stargazing,
      note: isDay ? "Daylight — wait for dusk" : condition.label,
    },
  ];
}
