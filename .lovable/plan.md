# NowCast — Ambience Transitions + Advanced Features

## Part 1: Animate the sky and icon changes

Right now the sky palette and weather icons swap instantly when the condition or day/night state changes. This makes them morph smoothly.

- **Cross-fading gradients**: keep two stacked gradient layers. When the condition changes, the new palette fades in over the old one (~700ms) instead of snapping. The base colours also animate, so the whole page feels like the sky is actually shifting.
- **Ambience layer crossfade**: rain streaks, snow, fog banks, sun rays and stars fade/scale out as the old condition leaves and fade in as the new one arrives, rather than popping in and out.
- **Day/night sweep**: switching between day and night runs a short warm-to-cool wash across the background, with stars fading up and sun rays fading down.
- **Icon transitions**: every weather icon (hero, hourly, daily) animates on change — old icon scales down and fades, new one springs in with a slight rotate. Icons keep a stable identity key so only genuinely changed ones re-animate.
- **Respect reduced motion**: all of the above collapse to simple instant swaps when the user prefers reduced motion.

## Part 2: Advanced features worth adding

Chosen for value without bloat:

1. **Compare mode** — pin two saved cities side by side (temp, condition, AQI, local time) to answer "where's nicer right now?".
2. **Rain radar timeline** — minute-by-minute precipitation bar for the next 60–120 minutes with a plain-language line ("light rain starting in ~25 min").
3. **Sun & moon arc** — an arc showing the sun's position between sunrise and sunset, plus moon phase for night, replacing the flat daylight bar with something more visual.
4. **Severe weather alerts** — a loud neubrutalist alert banner when the provider reports warnings for the location.
5. **Activity index** — small scores for Running, Cycling, Beach, Stargazing derived from temp, wind, UV, cloud cover and precipitation.
6. **Command palette (Cmd/Ctrl+K)** — quick jump to any favourite/recent city, toggle units, theme, refresh.
7. **Auto-refresh + stale badge** — refresh in the background every 10 minutes and mark data as stale when the tab has been idle.
8. **Shareable URLs** — `/?q=tokyo&units=metric` so a view can be linked or bookmarked; deep links restore state on load.
9. **Wind compass dial** — animated needle with gust reading, replacing the plain wind text tile.
10. **Offline cache** — last successful payload cached locally and shown with an "offline snapshot" marker if a fetch fails.

## Technical notes

- Transitions use the existing `motion` package (`AnimatePresence`, keyed layers) plus new CSS keyframes in `src/styles.css`; no new dependencies for Part 1.
- Sky crossfade lives in `Ambience.tsx` with the palette resolved from `data-sky` as today; the shell keeps `data-sky` for tokens.
- Minutely precipitation, alerts, and moon phase come from the weather server functions in `src/lib/weather.server.ts` (Open-Meteo minutely_15 / OpenWeatherMap One Call when a key exists); normalized DTOs in `src/lib/weather-types.ts` gain optional fields so absent data degrades silently.
- Compare mode, command palette, share URLs, and offline cache are frontend-only, reusing `useWeatherPrefs` and route search params.
