/**
 * Air quality panel: US AQI headline plus a pollutant breakdown.
 */

import { motion } from "motion/react";

import type { AirQuality } from "@/lib/weather-types";

function aqiAccent(aqi: number): string {
  if (aqi <= 50) return "bg-lime";
  if (aqi <= 100) return "bg-sun";
  if (aqi <= 150) return "bg-hot";
  if (aqi <= 200) return "bg-destructive text-destructive-foreground";
  return "bg-storm";
}

const POLLUTANTS: Array<{ key: keyof AirQuality["components"]; label: string; unit: string }> = [
  { key: "pm2_5", label: "PM2.5", unit: "µg/m³" },
  { key: "pm10", label: "PM10", unit: "µg/m³" },
  { key: "o3", label: "Ozone", unit: "µg/m³" },
  { key: "no2", label: "NO₂", unit: "µg/m³" },
  { key: "so2", label: "SO₂", unit: "µg/m³" },
  { key: "co", label: "CO", unit: "µg/m³" },
];

export function AirQualityPanel({ air }: { air: AirQuality | null }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="brut bg-card p-6"
      aria-labelledby="air-heading"
    >
      <h2 id="air-heading" className="text-xl uppercase">
        Air quality
      </h2>

      {!air ? (
        <p className="mt-4 font-mono text-xs font-bold uppercase text-muted-foreground">
          Air quality data isn't available for this location.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <span
              className={`brut-flat inline-flex min-w-20 items-center justify-center px-4 py-3 font-display text-3xl ${aqiAccent(air.aqi)}`}
            >
              {air.aqi}
            </span>
            <div>
              <p className="text-lg font-bold uppercase">{air.label}</p>
              <p className="font-mono text-[0.65rem] font-bold uppercase text-muted-foreground">
                US AQI scale
              </p>
            </div>
          </div>

          <div className="mt-4 brut-flat h-4 overflow-hidden bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (air.aqi / 300) * 100)}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className={`h-full ${aqiAccent(air.aqi)}`}
            />
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {POLLUTANTS.map(({ key, label, unit }) => (
              <li key={key} className="brut-flat bg-secondary px-3 py-2">
                <p className="font-mono text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold">
                  {air.components[key].toFixed(1)}
                  <span className="ml-1 text-[0.6rem] text-muted-foreground">{unit}</span>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.section>
  );
}
