/**
 * Interactive temperature trend chart (Chart.js).
 *
 * Canvas 2D uses explicit hex/rgb colors to ensure 100% reliable rendering
 * and ultra-high text visibility in both light and dark themes.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
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

  // Explicit, high-contrast color tokens for Canvas 2D
  const colors = useMemo(() => {
    if (dark) {
      return {
        ink: "#f5f5f5",
        text: "#f5f5f5",
        mutedText: "#a3a3a3",
        accent: "#f2c14e",
        accentFill: "rgba(242, 193, 78, 0.40)",
        rain: "#60a5fa",
        grid: "rgba(255, 255, 255, 0.15)",
        border: "#f5f5f5",
        tooltipBg: "#0f1117",
        tooltipTitle: "#f2c14e",
        tooltipBody: "#f5f5f5",
        tooltipBorder: "#f5f5f5",
      };
    }

    return {
      ink: "#111111",
      text: "#111111",
      mutedText: "#374151",
      accent: "#f2c14e",
      accentFill: "rgba(242, 193, 78, 0.75)",
      rain: "#1d4ed8",
      grid: "rgba(0, 0, 0, 0.12)",
      border: "#111111",
      tooltipBg: "#111111",
      tooltipTitle: "#f2c14e",
      tooltipBody: "#ffffff",
      tooltipBorder: "#111111",
    };
  }, [dark]);

  const data = useMemo(() => {
    if (range === "hourly") {
      return {
        labels: hourly.map((hour, index) => (index === 0 ? "Now" : `${formatHour(hour.time)}:00`)),
        datasets: [
          {
            label: `Temperature °${unit}`,
            data: hourly.map((hour) => Number(convertTemp(hour.temp, unit).toFixed(1))),
            borderColor: colors.ink,
            backgroundColor: colors.accentFill,
            fill: true,
            borderWidth: 3,
            tension: 0.35,
            pointBackgroundColor: colors.accent,
            pointBorderColor: colors.ink,
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
          borderColor: colors.ink,
          backgroundColor: colors.accentFill,
          fill: true,
          borderWidth: 3,
          tension: 0.35,
          pointBackgroundColor: colors.accent,
          pointBorderColor: colors.ink,
          pointBorderWidth: 2,
          pointRadius: 5,
        },
        {
          label: `Low °${unit}`,
          data: daily.map((day) => Number(convertTemp(day.min, unit).toFixed(1))),
          borderColor: colors.rain,
          backgroundColor: "transparent",
          fill: false,
          borderWidth: 3,
          borderDash: [6, 4],
          tension: 0.35,
          pointBackgroundColor: colors.rain,
          pointBorderColor: colors.ink,
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    };
  }, [range, hourly, daily, unit, colors]);

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: range === "weekly",
          labels: {
            color: colors.text,
            boxHeight: 4,
            boxWidth: 16,
            font: { family: "JetBrains Mono, monospace", weight: 700, size: 11 },
          },
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 2,
          cornerRadius: 0,
          displayColors: false,
          padding: 10,
          titleFont: { family: "JetBrains Mono, monospace", weight: 700, size: 12 },
          bodyFont: { family: "JetBrains Mono, monospace", weight: 600, size: 11 },
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.formattedValue}°${unit}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          border: { color: colors.border, width: 3 },
          ticks: {
            color: colors.text,
            maxRotation: 0,
            autoSkipPadding: 16,
            font: { family: "JetBrains Mono, monospace", size: 11, weight: 700 },
          },
        },
        y: {
          grid: { color: colors.grid },
          border: { color: colors.border, width: 3 },
          ticks: {
            color: colors.text,
            callback: (value) => `${value}°`,
            font: { family: "JetBrains Mono, monospace", size: 11, weight: 700 },
          },
        },
      },
    }),
    [colors, range, unit],
  );

  return (
    <section className="brut bg-card p-4 sm:p-6" aria-labelledby="trend-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="trend-heading"
          className="text-xl uppercase font-display tracking-tight text-foreground"
        >
          Temperature Trend
        </h2>
        <div
          className="flex border-3 border-ink bg-card p-0.5"
          role="group"
          aria-label="Chart range"
        >
          {(["hourly", "weekly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={`relative px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase transition-colors z-10 cursor-pointer ${
                range === option
                  ? "text-accent-foreground font-black"
                  : "text-foreground font-bold hover:bg-muted/50"
              }`}
            >
              {range === option && (
                <motion.span
                  layoutId="trend-range-active"
                  className="absolute inset-0 bg-accent border-2 border-ink -z-10 shadow-[2px_2px_0_0_var(--ink)]"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span>{option === "hourly" ? "24 hours" : "7 days"}</span>
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
