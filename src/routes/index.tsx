import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Layers, LayoutDashboard, Radar, Wind } from "lucide-react";

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
import { RadarMap } from "@/components/weather/RadarMap";
import { SearchBar } from "@/components/weather/SearchBar";
import { DashboardSkeleton } from "@/components/weather/Skeletons";
import { TrendChart } from "@/components/weather/TrendChart";
import { NowCastLogo } from "@/components/weather/NowCastLogo";
import { IntroBootSequence } from "@/components/weather/IntroBootSequence";
import { useGeolocation } from "@/hooks/useGeolocation";
import { samePlace, useWeatherPrefs } from "@/hooks/useWeatherPrefs";
import { skyKey } from "@/lib/weather-format";
import { getWeather } from "@/lib/weather.functions";
import type { SavedPlace, WeatherResult } from "@/lib/weather-types";

/** Default place so the very first screen is a complete dashboard. */
const DEFAULT_LOOKUP = { query: "Lisbon" } as const;

interface Lookup {
  query?: string | undefined;
  lat?: number | undefined;
  lon?: number | undefined;
  name?: string | undefined;
  country?: string | undefined;
}

type ViewTab = "overview" | "radar" | "forecast" | "air" | "all";

interface TabItem {
  id: ViewTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const VIEW_TABS: TabItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "radar", label: "Live Radar", icon: Radar },
  { id: "forecast", label: "7-Day Outlook", icon: CalendarDays },
  { id: "air", label: "Air & Health", icon: Wind },
  { id: "all", label: "Full View", icon: Layers },
];

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
      { title: "NowCast — Weather, Loud and Clear" },
      {
        name: "description",
        content:
          "NowCast is a bold weather dashboard with current conditions, live Doppler radar, 7-day synoptic forecast, air quality analytics, and interactive temperature trends.",
      },
      { property: "og:title", content: "NowCast" },
      {
        property: "og:description",
        content:
          "NowCast is a bold weather dashboard with current conditions, live Doppler radar, 7-day synoptic forecast, air quality analytics, and interactive temperature trends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    // Prime the default city so SSR renders a full dashboard, not an empty state.
    await context.queryClient.ensureQueryData(weatherQuery(DEFAULT_LOOKUP));
  },
  component: NowCastPage,
});

function NowCastPage() {
  const queryClient = useQueryClient();
  const prefs = useWeatherPrefs();
  const geo = useGeolocation();

  const [lookup, setLookup] = useState<Lookup>(DEFAULT_LOOKUP);
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");
  const [now, setNow] = useState(() => Date.now());
  const [showIntro, setShowIntro] = useState(false);

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

  const sky = weather ? skyKey(weather.current.condition.group, weather.current.isDay) : "clouds";

  return (
    <div data-sky={sky} className="min-h-screen">
      <IntroBootSequence forceOpen={showIntro} onComplete={() => setShowIntro(false)} />

      <Ambience
        group={weather?.current.condition.group ?? "clouds"}
        isDay={weather?.current.isDay ?? true}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <NowCastLogo onClick={() => setShowIntro(true)} />
            <div className="flex items-center gap-3">
              {query.isFetching && (
                <span className="font-mono text-[0.65rem] font-black uppercase text-accent bg-ink px-2 py-0.5 animate-pulse">
                  Syncing Feed...
                </span>
              )}
              <p className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-foreground/70 hidden sm:block">
                Weather, loud and clear
              </p>
            </div>
          </div>

          <SearchBar
            unit={prefs.unit}
            dark={prefs.dark}
            locating={geo.status === "locating"}
            onSearch={(q) => setLookup({ query: q })}
            onSelectPlace={selectPlace}
            onLocate={() => geo.locate((coords) => setLookup({ lat: coords.lat, lon: coords.lon }))}
            onToggleUnit={prefs.toggleUnit}
            onToggleTheme={prefs.toggleTheme}
          />

          {/* Senior UI/UX: Interactive Neubrutalist View Navigation */}
          {weather && (
            <nav
              className="flex flex-wrap items-center gap-1.5 border-3 border-ink bg-card p-1 shadow-[4px_4px_0_0_var(--ink)]"
              aria-label="Dashboard Views"
            >
              {VIEW_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-pressed={isActive}
                    className={`relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-xs font-bold uppercase transition-colors z-10 cursor-pointer ${
                      isActive
                        ? "text-accent-foreground font-black"
                        : "text-foreground/75 hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="active-view-tab"
                        className="absolute inset-0 bg-accent border-2 border-ink -z-10 shadow-[2px_2px_0_0_var(--ink)]"
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      />
                    )}
                    <Icon className="size-3.5 sm:size-4" strokeWidth={2.5} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </header>

        <p aria-live="polite" className="sr-only">
          {weather
            ? `Showing weather for ${weather.location.name}. ${weather.current.condition.label}.`
            : "Loading weather data."}
        </p>

        <main className="mt-6 space-y-6">
          {geo.status === "denied" && <ErrorCard code="geolocation_denied" onRetry={geo.reset} />}
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
            <div className="space-y-3">
              <ErrorCard
                code={result.code}
                message={result.message}
                onRetry={result.code === "not_found" ? () => setLookup(DEFAULT_LOOKUP) : refresh}
              />
              {result.code === "not_found" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setLookup(DEFAULT_LOOKUP)}
                    className="brut-sm brut-press bg-accent px-3 py-1.5 font-mono text-xs font-bold uppercase text-accent-foreground"
                  >
                    Reset to default (Lisbon)
                  </button>
                </div>
              )}
            </div>
          )}

          {weather && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${activeKey}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {weather.alerts?.length ? <AlertBanner alerts={weather.alerts} /> : null}

                {/* VIEW 1: OVERVIEW DASHBOARD */}
                {activeTab === "overview" && (
                  <>
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
                        timezoneOffset={weather.timezoneOffset}
                        current={weather.current}
                        place={weather.location.name}
                      />
                      <AirQualityPanel air={weather.air} />
                    </div>

                    {weather.minutely?.length ? (
                      <div className="grid gap-5 lg:grid-cols-2">
                        <RainTimeline points={weather.minutely} localNow={weather.fetchedAt} />
                        <ActivityIndex current={weather.current} unit={prefs.unit} />
                      </div>
                    ) : (
                      <ActivityIndex current={weather.current} unit={prefs.unit} />
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
                  </>
                )}

                {/* VIEW 2: LIVE RADAR & SATELLITE */}
                {activeTab === "radar" && (
                  <>
                    <RadarMap location={weather.location} dark={prefs.dark} />

                    <div className="grid gap-5 lg:grid-cols-2">
                      <CurrentCard
                        weather={weather}
                        unit={prefs.unit}
                        now={now}
                        isFavorite={isFavorite}
                        refreshing={query.isFetching}
                        onToggleFavorite={() => activePlace && prefs.toggleFavorite(activePlace)}
                        onRefresh={refresh}
                      />
                      {weather.minutely?.length ? (
                        <RainTimeline points={weather.minutely} localNow={weather.fetchedAt} />
                      ) : (
                        <InsightPanel
                          current={weather.current}
                          hourly={weather.hourly}
                          daily={weather.daily}
                          unit={prefs.unit}
                        />
                      )}
                    </div>
                  </>
                )}

                {/* VIEW 3: 7-DAY SYNOPTIC OUTLOOK */}
                {activeTab === "forecast" && (
                  <>
                    <DailyList daily={weather.daily} unit={prefs.unit} />

                    <TrendChart
                      hourly={weather.hourly}
                      daily={weather.daily}
                      unit={prefs.unit}
                      dark={prefs.dark}
                    />

                    <HourlyStrip hourly={weather.hourly} unit={prefs.unit} />
                  </>
                )}

                {/* VIEW 4: AIR QUALITY & HEALTH */}
                {activeTab === "air" && (
                  <>
                    <AirQualityPanel air={weather.air} />

                    <div className="grid gap-5 lg:grid-cols-2">
                      <ActivityIndex current={weather.current} unit={prefs.unit} />
                      <LocalClock
                        fetchedAt={weather.fetchedAt}
                        timezoneOffset={weather.timezoneOffset}
                        current={weather.current}
                        place={weather.location.name}
                      />
                    </div>

                    <MetricTiles current={weather.current} unit={prefs.unit} />
                  </>
                )}

                {/* VIEW 5: FULL EXECUTIVE VIEW */}
                {activeTab === "all" && (
                  <>
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
                        timezoneOffset={weather.timezoneOffset}
                        current={weather.current}
                        place={weather.location.name}
                      />
                      <AirQualityPanel air={weather.air} />
                    </div>

                    <RadarMap location={weather.location} dark={prefs.dark} />

                    {weather.minutely?.length ? (
                      <div className="grid gap-5 lg:grid-cols-2">
                        <RainTimeline points={weather.minutely} localNow={weather.fetchedAt} />
                        <ActivityIndex current={weather.current} unit={prefs.unit} />
                      </div>
                    ) : (
                      <ActivityIndex current={weather.current} unit={prefs.unit} />
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
              </motion.div>
            </AnimatePresence>
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
      </div>
    </div>
  );
}
