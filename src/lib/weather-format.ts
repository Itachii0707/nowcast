/**
 * Pure display helpers. Timestamps in the payload are "display epochs"
 * (already shifted into the location's local time), so everything here
 * formats in UTC deliberately.
 */

import type { ConditionGroup } from "./weather-types";

/** Display unit for temperature (and, by extension, wind/visibility units). */
export type TemperatureUnit = "C" | "F";

/** Convert a Celsius value into the active unit. */
export function convertTemp(celsius: number, unit: TemperatureUnit): number {
  return unit === "C" ? celsius : celsius * (9 / 5) + 32;
}

export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  return `${Math.round(convertTemp(celsius, unit))}\u00B0`;
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const HOUR_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  timeZone: "UTC",
});

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "UTC",
});

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatClock(epoch: number): string {
  return TIME_FORMAT.format(epoch);
}

export function formatHour(epoch: number): string {
  return HOUR_FORMAT.format(epoch).replace(":", "");
}

export function formatWeekday(epoch: number): string {
  return WEEKDAY_FORMAT.format(epoch);
}

export function formatDate(epoch: number): string {
  return DATE_FORMAT.format(epoch);
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export function windDirection(degrees: number): string {
  return COMPASS[Math.round(degrees / 22.5) % 16] ?? "N";
}

export function formatWind(metresPerSecond: number, unit: TemperatureUnit): string {
  return unit === "C"
    ? `${Math.round(metresPerSecond * 3.6)} km/h`
    : `${Math.round(metresPerSecond * 2.23694)} mph`;
}

export function formatVisibility(metres: number, unit: TemperatureUnit): string {
  return unit === "C"
    ? `${(metres / 1000).toFixed(1)} km`
    : `${(metres / 1609.34).toFixed(1)} mi`;
}

export function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

/** Relative "last updated" string, e.g. "2 min ago". */
export function formatRelative(fetchedAt: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - fetchedAt) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

/**
 * Theme key used to drive background, accents and ambience animation.
 * Night collapses every condition into one calm palette except storms.
 */
export function skyKey(group: ConditionGroup, isDay: boolean): string {
  if (!isDay) return group === "storm" ? "storm-night" : "night";
  return group;
}
