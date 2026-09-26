# NowCast ⚡

### High-Precision Neubrutalist Weather Forecast & Synoptic Radar Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-Fullstack_SSR-FF4154?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Doppler_Radar-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-black?style=for-the-badge)](LICENSE)

check this out
https://nowcast.antideploy.com/
---

## 🌪️ Overview

**NowCast** is a modern, high-performance weather intelligence web application built with a bold **Neubrutalist design system**. Combining thick retro borders, high-contrast drop-shadows, and smooth spring-physics micro-animations, NowCast delivers meteorological insights with an unmatched visual and tactile experience.

From real-time **Doppler precipitation radar** and **minute-by-minute rain forecasts** to **air quality indexes (AQI)**, **outdoor activity fitness scores**, and **7-day synoptic outlook drawers**, NowCast provides deep meteorological telemetry in an intuitive, executive-grade dashboard.

Best of all, **it works out of the box with zero configuration** using keyless Open-Meteo data, while offering native server-side support for OpenWeatherMap One Call 3.0.

---

## ✨ Core Features

### 🛰️ 1. Interactive Live Doppler Radar & Satellite

- Global precipitation and infrared satellite coverage powered by **Leaflet** and **RainViewer API**.
- **Interactive Time-Scrubber Loop:** Step through past radar sweeps or auto-play real-time storm progression.
- Responsive neubrutalist map controls with smooth zoom, live city pin, and high-contrast tile themes for both light and dark modes.

### 🧭 2. Multi-Mode Dashboard Navigation

Seamlessly switch between 5 focused view modes powered by fluid `<AnimatePresence>` transitions:

1. **Overview:** Executive summary combining current metrics, local sun/moon clock, AQI, and 24h trends.
2. **Live Radar:** Full-width Doppler radar map paired with minute-by-minute rain timeline.
3. **7-Day Outlook:** Comprehensive synoptic outlook with high/low ranges, deep day inspection, and weekly trends.
4. **Air & Health:** Detailed environmental diagnostics, particulate matter breakdown, and outdoor activity indexes.
5. **Full View:** Complete panoramic meteorological command center displaying all cards simultaneously.

### 📅 3. Interactive 7-Day Synoptic Drawers

- Visual high/low temperature distribution bars scaled against the entire week's temperature extremes.
- **Click-to-Expand Synoptic Inspection:** Click any forecast card to reveal:
  - 🌧️ Precipitation Probability & Projected Volume (`mm`)
  - ☀️ Peak UV Index with calibrated risk badges (Low, Moderate, Very High, Extreme)
  - 💨 Wind Gusts & Peak Sustained Speeds
  - 🌅 Exact Astronomical Sunrise and Sunset Timestamps

### 📈 4. High-Contrast Temperature Trend Canvas

- Built with **Chart.js** and **HTML5 Canvas 2D**.
- Switch instantly between a **24-Hour Hourly Curve** and a **7-Day Weekly Trend**.
- Calibrated high-contrast tooltips that automatically adapt to light and dark themes with precise cursor crosshairs.

### 🏃 5. Dynamic Activity & Lifestyle Index

- Real-time suitability scoring (0–100) for outdoor pursuits:
  - 🏃 **Running & Jogging** (calculated against heat index, wind resistance, and rain probability)
  - 🚴 **Cycling** (factoring wind shear, road slickness, and precipitation)
  - 🏖️ **Beach & Sunbathing** (evaluating cloud cover, UV threshold, and ambient warmth)
  - ✨ **Stargazing & Astronomy** (evaluating nighttime cloud cover, visibility, and atmospheric stability)

### 💨 6. Air Quality & Atmospheric Health

- Comprehensive AQI reporting based on European EAQI and US EPA metrics.
- Color-coded severity tiers: _Good, Fair, Moderate, Poor, Very Poor_.
- Real-time particulate sensors: **PM2.5, PM10, Nitrogen Dioxide (NO₂), Ozone (O₃), Carbon Monoxide (CO), and Sulfur Dioxide (SO₂)**.

### 🌓 7. Astronomical Clock & Condition Ambience

- Dynamic astronomical dial displaying solar progression during the day and real-time lunar phases (_Waxing Crescent, Full Moon, Waning Gibbous_, etc.) at night.
- Atmospheric background gradients and animated particles that adapt seamlessly to the local city's conditions (_thunderstorm, drizzle, snow, fog, clear sky_).

### 🔍 8. Smart Geocoding & Local Memory

- Search any global city, airport, or region with instant debounced autocomplete.
- One-tap browser **Geolocation API** integration for instant local forecasts.
- Persisted **Favorites** and **Recent Searches** in `localStorage` for rapid switching between saved locations.

---

## 🏗️ Architecture & Tech Stack

> 📖 **Deep-Dive Architecture & Flowcharts**: For a complete step-by-step breakdown of system workflows, technology rationales, Mermaid diagrams, and edge deployment specifications, see [ARCHITECTURE.md](ARCHITECTURE.md).

```
nowcast/
├── src/
│   ├── components/
│   │   └── weather/           # Specialized meteorological components
│   │       ├── ActivityIndex.tsx    # Outdoor fitness suitability scores
│   │       ├── AirQualityPanel.tsx  # AQI & particulate breakdown
│   │       ├── AlertBanner.tsx      # Severe weather advisories
│   │       ├── Ambience.tsx         # Dynamic weather background gradients
│   │       ├── CurrentCard.tsx      # Hero temperature & current status
│   │       ├── DailyList.tsx        # 7-day forecast with expandable drawer
│   │       ├── ErrorCard.tsx        # Resilient error states & fallbacks
│   │       ├── HourlyStrip.tsx      # Horizontal 24-hour scroller
│   │       ├── InsightPanel.tsx     # Plain-English meteorological insights
│   │       ├── LocalClock.tsx       # City timezone clock & astronomical arc
│   │       ├── MetricTiles.tsx      # Humidity, pressure, wind, UV, visibility
│   │       ├── PlacesRail.tsx       # Quick-access favorites & recent places
│   │       ├── RadarMap.tsx         # Leaflet + RainViewer Doppler radar
│   │       ├── RainTimeline.tsx     # Next 2 hours precipitation timeline
│   │       ├── SearchBar.tsx        # Geocoding search & geolocation
│   │       ├── Skeletons.tsx        # Neubrutalist pulse loading skeletons
│   │       ├── SkyArc.tsx           # Solar & lunar trajectory SVG
│   │       ├── TrendChart.tsx       # Canvas 2D interactive temperature curve
│   │       └── WeatherIcon.tsx      # Animated Lucide SVG condition icons
│   ├── hooks/
│   │   ├── useGeolocation.ts   # Browser Geolocation API wrapper
│   │   └── useWeatherPrefs.ts  # Theme, units (°C/°F), and saved places state
│   ├── lib/
│   │   ├── weather.functions.ts# TanStack Start server RPC functions
│   │   ├── weather.server.ts   # Weather APIs (Open-Meteo & OpenWeatherMap)
│   │   ├── weather-types.ts    # Normalized meteorological TypeScript DTOs
│   │   ├── weather-format.ts   # Mathematical & unit conversion helpers
│   │   ├── weather-insights.ts # Algorithmic daily weather summary engine
│   │   └── error-page.ts       # SSR error boundary templates
│   ├── routes/
│   │   ├── __root.tsx          # Application shell, fonts, meta tags
│   │   └── index.tsx           # Main dashboard page & view tab manager
│   ├── styles.css              # Neubrutalist tokens, sky palettes, Tailwind v4
│   ├── router.tsx              # TanStack Router instance
│   ├── server.ts               # SSR request entry handler
│   └── start.ts                # TanStack Start CSRF & server middleware
```

### Key Technologies

| Layer             | Technology                   | Purpose                                                    |
| ----------------- | ---------------------------- | ---------------------------------------------------------- |
| **Framework**     | **TanStack Start**           | Fullstack React 19 framework with Server Functions (RPC)   |
| **Routing**       | **TanStack Router**          | Type-safe client & server file-based routing               |
| **Styling**       | **Tailwind CSS v4**          | Pure utility-first CSS engine with OKLCH theme tokens      |
| **Motion**        | **Motion (Framer Motion)**   | Spring physics, tab pill sliders, and view transitions     |
| **Charts**        | **Chart.js** & **Canvas 2D** | High-performance interactive temperature graphs            |
| **Radar**         | **Leaflet** & **RainViewer** | Interactive weather radar tiles and global satellite data  |
| **Data Fetching** | **TanStack Query v5**        | Server-state caching, background revalidation, and retries |
| **Icons**         | **Lucide React**             | Clean, accessible vector icons with custom animations      |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later (LTS recommended)
- **npm**: `v10.x` or later

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Itachii0707/nowcast.git
   cd nowcast
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🔑 Weather Data Providers & Configuration

### Zero-Configuration Mode (Default)

By default, NowCast requires **no API keys**. It automatically queries [Open-Meteo](https://open-meteo.com) and the Open-Meteo Geocoding API for global high-resolution forecasts, air quality, and hourly data.

### Optional: OpenWeatherMap One Call 3.0

To enable official OpenWeatherMap One Call 3.0 data and government severe weather alerts:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Add your OpenWeatherMap API key:
   ```env
   OPENWEATHER_API_KEY=your_openweathermap_api_key_here
   ```

> **Security Note:** The API key is consumed strictly on the server inside `src/lib/weather.server.ts` via TanStack Start Server Functions. It is **never exposed or leaked to client bundles**.

---

## 🛠️ Available Scripts

| Command           | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| `npm run dev`     | Starts the local development server with HMR at `http://localhost:8080` |
| `npm run build`   | Compiles a production-ready SSR bundle                                  |
| `npm run preview` | Previews the compiled production build locally                          |
| `npm run lint`    | Runs ESLint across all TypeScript and React files                       |
| `npm run format`  | Formats all files using Prettier                                        |

---

## 🚢 Production Deployment

NowCast is built on TanStack Start with Nitro, making it ready to deploy on any modern edge or server runtime:

### 1. Cloudflare Pages / Workers

The default Nitro preset produces Cloudflare Worker compatibility out of the box (`.output/server` and `.output/public`):

```bash
npm run build
npx nitro deploy --prebuilt
```

### 2. Vercel / Netlify

Connect your GitHub repository to Vercel or Netlify. The build command is:

- **Build Command:** `npm run build`
- **Output Directory:** `.output/public`
- Set `OPENWEATHER_API_KEY` in your provider's Environment Variables dashboard if using OpenWeatherMap.

### 3. Docker / Node.js Server

You can run NowCast in a containerized Node.js environment:

```bash
npm run build
node .output/server/index.mjs
```

---

## ♿ Accessibility & Performance

- **Semantic HTML5:** Strict landmark tags (`<header>`, `<main>`, `<footer>`, `<nav>`, `<section>`).
- **High Contrast Ratios:** All text elements comply with WCAG 2.1 AA standards in both light and dark modes.
- **Prefers-Reduced-Motion:** Respects user operating system settings; ambient animations and auto-sliding effects gracefully degrade for motion-sensitive users.
- **Keyboard Navigation:** Fully navigable tab strips, search dropdowns, radar scrubber buttons, and forecast drawers.
- **Ultra-Fast Bundling:** Production compilation finishes in under 500ms with zero bundle bloat.

---
