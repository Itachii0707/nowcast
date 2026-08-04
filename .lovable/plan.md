# Atmosphere — Neubrutalist Weather Dashboard

A single-page weather dashboard built in this React project, styled as hard-edged neubrutalism, with weather data fetched through a server function so the API key stays private.

## Visual direction

- Thick black borders (3–4px), hard offset drop shadows, zero blur, sharp corners
- Bold display type for temperature and headings, tight monospace for metrics
- Saturated weather accents on an off-white paper base (sun yellow, rain blue, storm violet, night indigo)
- Dark mode: near-black canvas, same hard borders in white, accents stay saturated
- Motion: springy card entrances, press-down button interactions, ticking number transitions, subtle weather-condition ambience (drifting clouds, rain streaks, sun rays) built as CSS/Motion layers behind the cards
- Background palette + ambience switch automatically by weather condition and day/night

## Screens and sections

Everything lives on `/` (the home route):

1. Header — Atmosphere wordmark, search bar with location autocomplete, "use my location" button, °C/°F toggle, dark-mode toggle
2. Hero current-weather card — city + country, big temperature, feels-like, condition label and icon, last-updated timestamp, refresh button
3. Metric tiles — humidity, wind speed + direction (with compass arrow), visibility, pressure, UV index, sunrise/sunset
4. Air quality panel — AQI value, category label, pollutant breakdown
5. Hourly forecast — horizontally scrollable strip of the next 24 hours
6. Temperature trend chart — interactive Chart.js line/area chart with a toggle between hourly and 7-day range
7. 7-day forecast — day rows with high/low bars and condition icons
8. Sidebar rails — bookmarked favorites (add/remove, click to switch) and recent searches (remove individually), persisted in browser storage

First paint shows a complete default city dashboard (real data for a default location) rather than an empty state. Loading uses neubrutalist skeleton blocks; errors render an in-card message for invalid city, denied geolocation, missing key, and network failure.

## Behavior

- Search resolves city/airport/place names through geocoding, then loads that location
- Geolocation button requests browser permission and falls back gracefully on denial
- Unit toggle, dark mode, favorites, and recent searches all persist locally
- Refresh re-fetches and updates the last-updated timestamp

## Technical section

- **Data source:** OpenWeatherMap (geocoding + One Call for current/hourly/daily/UV, plus Air Pollution for AQI). Requires an `OPENWEATHER_API_KEY` secret — I'll request it via the secure secret form before wiring the live calls.
- **Key safety:** a TanStack `createServerFn` in `src/lib/weather.functions.ts` reads the key inside its handler and returns a normalized DTO. The browser never sees the key. Zod-validated inputs (coords or query string).
- **Client data layer:** TanStack Query with the route loader prefetching the default city so SSR renders a full dashboard.
- **Design tokens:** neubrutalist tokens (border width, hard shadow, accent ramps, weather-condition palettes) added to `src/styles.css` in oklch; components use semantic classes only.
- **Files:** `src/routes/index.tsx` (page + head metadata), `src/components/weather/*` (search bar, current card, metric tiles, air quality, hourly strip, trend chart, daily list, favorites, recents, skeletons, error card, ambience layer), `src/hooks/useWeatherPrefs.ts` + `useGeolocation.ts`, `src/lib/weather.functions.ts` and `weather.server.ts`, `src/lib/weather-format.ts`.
- **Packages:** `motion`, `chart.js` + `react-chartjs-2`, `zod`. Chart renders client-side only to avoid SSR canvas issues.
- **Accessibility:** semantic landmarks, single H1, ARIA labels on icon-only controls, live region for updates, visible focus rings, keyboard-navigable scroll strips.
- **README + .env.example:** setup, key configuration, feature list, screenshot placeholders, required browser permissions, and deployment notes explaining why the key lives in a server secret rather than a GitHub Pages static bundle.

## Verification

Browser-drive the dashboard: default load, search, unit toggle, dark mode, favorites/recents add-remove, refresh, chart range switch, error states, and mobile/tablet/desktop widths — confirming no console errors.
