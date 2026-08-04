/**
 * Error surface for invalid cities, denied location, missing keys and
 * network failures.
 */

import { AlertTriangle, RotateCw } from "lucide-react";

import type { WeatherErrorCode } from "@/lib/weather-types";

const COPY: Record<WeatherErrorCode, { title: string; body: string }> = {
  not_found: {
    title: "No match found",
    body: "We couldn't find that place. Try a city, region or airport name — for example \u201CLisbon\u201D or \u201CJFK\u201D.",
  },
  missing_key: {
    title: "Weather key not configured",
    body: "The premium provider key is missing or inactive, so NowCast fell back to its keyless data source.",
  },
  network: {
    title: "Weather service unreachable",
    body: "The forecast provider didn't respond. Check your connection and refresh.",
  },
  geolocation_denied: {
    title: "Location permission denied",
    body: "NowCast can't read your position. Allow location access in your browser, or search for a city instead.",
  },
  unknown: {
    title: "Something went sideways",
    body: "We hit an unexpected problem loading this forecast.",
  },
};

interface ErrorCardProps {
  code: WeatherErrorCode;
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({ code, message, onRetry }: ErrorCardProps) {
  const copy = COPY[code] ?? COPY.unknown;

  return (
    <div role="alert" className="brut bg-destructive/15 p-6">
      <div className="flex items-start gap-4">
        <span className="brut-flat inline-flex size-12 shrink-0 items-center justify-center bg-destructive text-destructive-foreground">
          <AlertTriangle className="size-6" strokeWidth={3} aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h2 className="text-xl uppercase">{copy.title}</h2>
          <p className="max-w-prose text-sm text-foreground/80">{message ?? copy.body}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="brut-sm brut-press mt-2 inline-flex items-center gap-2 bg-accent px-4 py-2 font-mono text-xs font-bold uppercase text-accent-foreground"
            >
              <RotateCw className="size-4" strokeWidth={3} aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
