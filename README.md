# Atmosphere

A neubrutalist weather dashboard: live conditions, hourly and 7-day forecasts, air quality, UV, and an interactive temperature trend chart. Built with TanStack Start (React), Tailwind CSS v4, Motion, and Chart.js.

## Features

- Search by city, region, or airport/location name (geocoding)
- One-tap "use my location" via the browser Geolocation API
- Current conditions: temperature, feels-like, condition + animated icon, humidity, wind speed/direction, visibility, pressure, UV index, sunrise/sunset
- 24-hour hourly strip with precipitation probability
- 7-day outlook with proportional high/low range bars
- Interactive temperature trend chart (24-hour and 7-day ranges)
- Air quality index with pollutant breakdown
- Recent searches and favourite cities in `localStorage`, individually removable
- Loading skeletons, graceful errors (bad city, denied location, missing key, network failure)
- Background, palette, and ambient animations adapt to weather condition and day/night
- Dark mode + °C/°F toggle, both persisted
- "Last updated" timestamp and a refresh button
- Responsive and accessible: semantic landmarks, ARIA labels, live region, keyboard-scrollable forecast

## Setup

```bash
bun install
bun run dev
```

The app runs with no configuration: forecast data falls back to [Open-Meteo](https://open-meteo.com), which is keyless.

### Optional: OpenWeatherMap

For OpenWeatherMap data (One Call 3.0 + Air Pollution), set a server-side secret:

```
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

See `.env.example`. Get a key at https://openweathermap.org/api — the One Call 3.0 subscription is required for forecast endpoints.

The key is read **only inside server functions** (`src/lib/weather.functions.ts` → `src/lib/weather.server.ts`), so it is never shipped to the browser. Never prefix it with `VITE_`.

## Browser permissions

- **Location** — required only for the "locate me" button. Denying it is handled gracefully; search still works.
- **No other permissions** are requested.

## Screenshots

<!-- Add screenshots here -->

| Light | Dark |
| ----- | ---- |
| _screenshot placeholder_ | _screenshot placeholder_ |

## Project structure

```text
src/
  routes/index.tsx              dashboard page + head metadata
  lib/weather.functions.ts      server functions (RPC boundary)
  lib/weather.server.ts          providers: geocoding, OpenWeatherMap, Open-Meteo
  lib/weather-types.ts           normalized DTOs
  lib/weather-format.ts          display formatting helpers
  hooks/useWeatherPrefs.ts       units, theme, favourites, recents (localStorage)
  hooks/useGeolocation.ts        Geolocation API wrapper
  components/weather/*           dashboard UI
  styles.css                     design tokens, sky palettes, animations
```

## Deployment

This app has a server runtime (server functions keep the API key private), so publish it from Lovable or any Node/edge host.

### GitHub Pages caveat

GitHub Pages serves **static files only** — there is no server to hold a secret. If you deploy there:

1. Build a static export and rely on the keyless Open-Meteo provider (no secret needed), **or**
2. Put the API call behind your own proxy (Cloudflare Worker, Netlify/Vercel function) and point the app at it.

Never commit a real key or inline it in client JavaScript for a Pages deploy — anything in the bundle is public and can be scraped and abused.
