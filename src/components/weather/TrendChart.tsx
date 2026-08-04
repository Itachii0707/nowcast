/**
 * Interactive temperature trend chart (Chart.js).
 *
 * The chart is only mounted after hydration so the canvas never renders during
 * SSR, and colours are read from the live design tokens so it follows the
 * active theme.
 */

import { useEffect, useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { convertTemp, formatHour, formatWeekday, type TemperatureUnit } from "@/lib/weather-format";
import type { DailyPoint, HourlyPoint } from "@/lib/weather-types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type Range = "hourly" | "weekly";

function token(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function TrendChart({
  hourly,
  daily,
  unit,
  dark,
}: {
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  unit: TemperatureUnit;
  dark: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<Range>("hourly");

  useEffect(() => setMounted(true), []);

  const palette = useMemo(() => {
    if (!mounted) return { ink: "#111", accent: "#f2c14e", rain: "#4f7dd4" };
    return {
      ink: token("--ink", dark ? "#fafafa" : "#111111"),
      accent: token("--accent", "#f2c14e"),
      rain: token("--rain", "#4f7dd4"),
    };
    // Recompute when the theme flips.
  }, [mounted, dark]);

  const data = useMemo(() => {
    if (range === "hourly") {
      return {
        labels: hourly.map((hour, index) => (index === 0 ? "Now" : `${formatHour(hour.time)}:00`)),
        datasets: [
          {
            label: `Temperature °${unit}`,
            data: hourly.map((hour) => Number(convertTemp(hour.temp, unit).toFixed(1))),
            borderColor: palette.ink,
            backgroundColor: palette.accent,
            fill: true,
            borderWidth: 3,
            tension: 0.35,
            pointBackgroundColor: palette.accent,
            pointBorderColor: palette.ink,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
          },
        ],
      };
    }

    return {
      labels: daily.map((day, index) => (index === 0 ? "Today" : formatWeekday(day.time))),
      datasets: [
        {
          label: `High °${unit}`,
          data: daily.map((day) => Number(convertTemp(day.max, unit).toFixed(1))),
          borderColor: palette.ink,
          backgroundColor: palette.accent,
          fill: true,
          borderWidth: 3,
          tension: 0.35,
          pointBackgroundColor: palette.accent,
          pointBorderColor: palette.ink,
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: `Low °${unit}`,
          data: daily.map((day) => Number(convertTemp(day.min, unit).toFixed(1))),
          borderColor: palette.rain,
          backgroundColor: "transparent",
          fill: false,
          borderWidth: 3,
          borderDash: [6, 4],
          tension: 0.35,
          pointBackgroundColor: palette.rain,
          pointBorderColor: palette.ink,
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  }, [range, hourly, daily, unit, palette]);

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: range === "weekly",
          labels: {
            color: palette.ink,
            boxHeight: 3,
            font: { family: "JetBrains Mono, monospace", weight: 700, size: 10 },
          },
        },
        tooltip: {
          backgroundColor: palette.ink,
          titleColor: dark ? "#111" : "#fff",
          bodyColor: dark ? "#111" : "#fff",
          borderColor: palette.ink,
          borderWidth: 3,
          cornerRadius: 0,
          displayColors: false,
          padding: 10,
          titleFont: { family: "JetBrains Mono, monospace", weight: 700, size: 11 },
          bodyFont: { family: "JetBrains Mono, monospace", size: 11 },
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.formattedValue}°${unit}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: `color-mix(in oklab, ${palette.ink} 12%, transparent)` },
          border: { color: palette.ink, width: 3 },
          ticks: {
            color: palette.ink,
            maxRotation: 0,
            autoSkipPadding: 16,
            font: { family: "JetBrains Mono, monospace", size: 10, weight: 700 },
          },
        },
        y: {
          grid: { color: `color-mix(in oklab, ${palette.ink} 12%, transparent)` },
          border: { color: palette.ink, width: 3 },
          ticks: {
            color: palette.ink,
            callback: (value) => `${value}°`,
            font: { family: "JetBrains Mono, monospace", size: 10, weight: 700 },
          },
        },
      },
    }),
    [palette, range, unit, dark],
  );

  return (
    <section className="brut bg-card p-6" aria-labelledby="trend-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="trend-heading" className="text-xl uppercase">
          Temperature trend
        </h2>
        <div className="flex" role="group" aria-label="Chart range">
          {(["hourly", "weekly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={`brut-sm px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase ${
                range === option ? "bg-accent text-accent-foreground" : "bg-card"
              } ${option === "weekly" ? "-ml-[3px]" : ""}`}
            >
              {option === "hourly" ? "24 hours" : "7 days"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-64 sm:h-72">
        {mounted ? (
          <Line data={data} options={options} aria-label="Temperature trend chart" />
        ) : (
          <div className="brut-flat h-full animate-pulse bg-muted" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
