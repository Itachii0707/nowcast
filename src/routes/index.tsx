import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CloudSun } from "lucide-react";

import { ActivityIndex } from "@/components/weather/ActivityIndex";
import { AlertBanner } from "@/components/weather/AlertBanner";
import { Ambience } from "@/components/weather/Ambience";
import { AirQualityPanel } from "@/components/weather/AirQualityPanel";
import { CurrentCard } from "@/components/weather/CurrentCard";
import { RainTimeline } from "@/components/weather/RainTimeline";
import { DailyList } from "@/components/weather/DailyList";
import { ErrorCard } from "@/components/weather/ErrorCard";
import { HourlyStrip } from "@/components/weather/HourlyStrip";
import { InsightPanel } from "@/components/weather/InsightPanel";
import { LocalClock } from "@/components/weather/LocalClock";
import { MetricTiles } from "@/components/weather/MetricTiles";
import { PlacesRail } from "@/components/weather/PlacesRail";
import { SearchBar } from "@/components/weather/SearchBar";
import { DashboardSkeleton } from "@/components/weather/Skeletons";
import { TrendChart } from "@/components/weather/TrendChart";
import { useGeolocation } from "@/hooks/useGeolocation";
import { samePlace, useWeatherPrefs } from "@/hooks/useWeatherPrefs";
import { skyKey } from "@/lib/weather-format";
import { getWeather } from "@/lib/weather.functions";
import type { SavedPlace, WeatherResult } from "@/lib/weather-types";

/** Default place so the very first screen is a complete dashboard. */
const DEFAULT_LOOKUP = { query: "Lisbon" } as const;

interface Lookup {
  query?: string;
  lat?: number;
  lon?: number;
  name?: string;
  country?: string;
}

function weatherQuery(lookup: Lookup) {
  return queryOptions({
    queryKey: ["weather", lookup],
    queryFn: () => getWeather({ data: lookup }) as Promise<WeatherResult>,
    staleTime: 5 * 60 * 1000,
  });
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NowCast" },
      {
        name: "description",
        content:
          "NowCast is a bold weather dashboard with current conditions, hourly and 7-day forecasts, air quality, UV index and interactive temperature trends.",
      },
      { property: "og:title", content: "NowCast" },
      {
        property: "og:description",
        content:
          "NowCast is a bold weather dashboard with current conditions, hourly and 7-day forecasts, air quality, UV index and interactive temperature trends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    // Prime the default city so SSR renders a full dashboard, not an empty state.
    context.queryClient.ensureQueryData(weatherQuery(DEFAULT_LOOKUP));
  },
  component: NowCastPage,
});

function NowCastPage() {
  const queryClient = useQueryClient();
  const prefs = useWeatherPrefs();
  const geo = useGeolocation();

  const [lookup, setLookup] = useState<Lookup>(DEFAULT_LOOKUP);
  const [now, setNow] = useState(() => Date.now());

  const query = useQuery(weatherQuery(lookup));
  const result = query.data;
  const weather = result?.ok ? result.data : undefined;

  // Keep the "last updated" label live.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  // Track successful loads in the recent-searches list.
  useEffect(() => {
    if (!weather) return;
    prefs.pushRecent({
      name: weather.location.name,
      country: weather.location.country,
      lat: weather.location.lat,
      lon: weather.location.lon,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.location.lat, weather?.location.lon]);

  const activePlace: SavedPlace | undefined = weather
    ? {
        name: weather.location.name,
        country: weather.location.country,
        lat: weather.location.lat,
        lon: weather.location.lon,
      }
    : undefined;

  const activeKey = activePlace
    ? `${activePlace.lat.toFixed(2)},${activePlace.lon.toFixed(2)}`
    : "";

  const isFavorite = Boolean(
    activePlace && prefs.favorites.some((entry) => samePlace(entry, activePlace)),
  );

  const selectPlace = (place: SavedPlace) =>
    setLookup({
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      country: place.country,
    });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["weather", lookup] });
    setNow(Date.now());
  };

  const sky = weather
    ? skyKey(weather.current.condition.group, weather.current.isDay)
    : "clouds";

  return (
    <div data-sky={sky} className="min-h-screen">
      <Ambience
        group={weather?.current.condition.group ?? "clouds"}
        isDay={weather?.current.isDay ?? true}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="brut inline-flex items-center gap-2 bg-accent px-4 py-2 font-display text-lg uppercase tracking-tight text-accent-foreground">
              <CloudSun className="size-5" strokeWidth={3} aria-hidden="true" />
              NowCast
            </p>
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-foreground/70">
              Weather, loud and clear
            </p>
          </div>

          <SearchBar
            unit={prefs.unit}
            dark={prefs.dark}
            locating={geo.status === "locating"}
            onSearch={(query) => setLookup({ query })}
            onLocate={() =>
              geo.locate((coords) => setLookup({ lat: coords.lat, lon: coords.lon }))
            }
            onToggleUnit={prefs.toggleUnit}
            onToggleTheme={prefs.toggleTheme}
          />
        </header>

        <p aria-live="polite" className="sr-only">
          {weather
            ? `Showing weather for ${weather.location.name}. ${weather.current.condition.label}.`
            : "Loading weather data."}
        </p>

        <main className="mt-6 space-y-5">
          {geo.status === "denied" && (
            <ErrorCard code="geolocation_denied" onRetry={geo.reset} />
          )}
          {geo.status === "unavailable" && (
            <ErrorCard
              code="unknown"
              message="Your browser couldn't provide a location. Search for a city instead."
              onRetry={geo.reset}
            />
          )}

          {query.isPending && <DashboardSkeleton />}

          {query.isError && (
            <ErrorCard
              code="network"
              message="The request failed before it reached the forecast service."
              onRetry={refresh}
            />
          )}

          {result && !result.ok && (
            <ErrorCard code={result.code} message={result.message} onRetry={refresh} />
          )}

          {weather && (
            <>
              {weather.alerts?.length ? <AlertBanner alerts={weather.alerts} /> : null}

              <CurrentCard
                weather={weather}
                unit={prefs.unit}
                now={now}
                isFavorite={isFavorite}
                refreshing={query.isFetching}
                onToggleFavorite={() => activePlace && prefs.toggleFavorite(activePlace)}
                onRefresh={refresh}
              />

              <div className="grid gap-5 lg:grid-cols-2">
                <LocalClock
                  fetchedAt={weather.fetchedAt}
                  current={weather.current}
                  place={weather.location.name}
                />
                <AirQualityPanel air={weather.air} />
              </div>

              {weather.minutely?.length ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  <RainTimeline points={weather.minutely} localNow={weather.fetchedAt} />
                  <ActivityIndex current={weather.current} />
                </div>
              ) : (
                <ActivityIndex current={weather.current} />
              )}

              <InsightPanel
                current={weather.current}
                hourly={weather.hourly}
                daily={weather.daily}
                unit={prefs.unit}
              />

              <MetricTiles current={weather.current} unit={prefs.unit} />


              <HourlyStrip hourly={weather.hourly} unit={prefs.unit} />

              <TrendChart
                hourly={weather.hourly}
                daily={weather.daily}
                unit={prefs.unit}
                dark={prefs.dark}
              />

              <DailyList daily={weather.daily} unit={prefs.unit} />
            </>
          )}

          {/* Rails stay visible even when a lookup fails, so recovery is one tap away. */}
          <PlacesRail
            favorites={prefs.favorites}
            recents={prefs.recents}
            activeKey={activeKey}
            onSelect={selectPlace}
            onRemoveFavorite={prefs.removeFavorite}
            onRemoveRecent={prefs.removeRecent}
            onClearRecents={prefs.clearRecents}
          />
        </main>

        <footer className="mt-10 border-t-3 border-ink pt-4 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-foreground/70">
          NowCast · forecast data via {weather?.source ?? "open-meteo"} · built as a portfolio
          dashboard
        </footer>
      </div>
    </div>
  );
}
