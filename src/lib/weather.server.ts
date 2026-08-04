/**
 * Server-only weather fetching + normalisation.
 *
 * Two providers are supported and both are normalised to the same
 * `WeatherPayload` DTO:
 *   1. OpenWeatherMap  - used when the OPENWEATHER_API_KEY secret is present.
 *   2. Open-Meteo      - keyless fallback so the dashboard always has data.
 *
 * The API key never leaves this module: only the normalised DTO is returned to
 * the caller (a server function), which then serialises it to the browser.
 */

import type {
  AirQuality,
  ConditionGroup,
  DailyPoint,
  HourlyPoint,
  MinutelyPoint,
  WeatherAlert,
  WeatherCondition,

  WeatherLocation,
  WeatherPayload,
} from "./weather-types";

/* ------------------------------------------------------------------ *
 * Condition mapping
 * ------------------------------------------------------------------ */

const WMO_CONDITIONS: Record<number, WeatherCondition> = {
  0: { group: "clear", label: "Clear sky" },
  1: { group: "clear", label: "Mainly clear" },
  2: { group: "clouds", label: "Partly cloudy" },
  3: { group: "clouds", label: "Overcast" },
  45: { group: "fog", label: "Fog" },
  48: { group: "fog", label: "Freezing fog" },
  51: { group: "rain", label: "Light drizzle" },
  53: { group: "rain", label: "Drizzle" },
  55: { group: "rain", label: "Heavy drizzle" },
  56: { group: "rain", label: "Freezing drizzle" },
  57: { group: "rain", label: "Freezing drizzle" },
  61: { group: "rain", label: "Light rain" },
  63: { group: "rain", label: "Rain" },
  65: { group: "rain", label: "Heavy rain" },
  66: { group: "rain", label: "Freezing rain" },
  67: { group: "rain", label: "Freezing rain" },
  71: { group: "snow", label: "Light snow" },
  73: { group: "snow", label: "Snow" },
  75: { group: "snow", label: "Heavy snow" },
  77: { group: "snow", label: "Snow grains" },
  80: { group: "rain", label: "Light showers" },
  81: { group: "rain", label: "Showers" },
  82: { group: "rain", label: "Violent showers" },
  85: { group: "snow", label: "Snow showers" },
  86: { group: "snow", label: "Heavy snow showers" },
  95: { group: "storm", label: "Thunderstorm" },
  96: { group: "storm", label: "Thunderstorm, hail" },
  99: { group: "storm", label: "Severe thunderstorm" },
};

function wmoCondition(code: number): WeatherCondition {
  return WMO_CONDITIONS[code] ?? { group: "clouds", label: "Unsettled" };
}

/** Map an OpenWeatherMap condition id + description to our condition shape. */
function owmCondition(id: number, description?: string): WeatherCondition {
  let group: ConditionGroup = "clouds";
  if (id >= 200 && id < 300) group = "storm";
  else if (id >= 300 && id < 600) group = "rain";
  else if (id >= 600 && id < 700) group = "snow";
  else if (id >= 700 && id < 800) group = "fog";
  else if (id === 800) group = "clear";
  const label = description
    ? description.charAt(0).toUpperCase() + description.slice(1)
    : group;
  return { group, label };
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Convert a local ISO string without offset (Open-Meteo `timezone=auto`
 * format) into a display epoch.
 */
function localIsoToEpoch(iso: string): number {
  return Date.parse(`${iso}Z`);
}

/** Shift a UTC epoch (seconds) by the location offset -> display epoch. */
function shift(utcSeconds: number, offsetSeconds: number): number {
  return (utcSeconds + offsetSeconds) * 1000;
}

function usAqiLabel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

/** OpenWeatherMap reports a 1-5 index; map it onto the US AQI midpoints. */
function owmAqiToUs(index: number): number {
  return [25, 25, 75, 125, 175, 250][index] ?? 50;
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new ProviderError(
      response.status === 401 || response.status === 403 ? "missing_key" : "network",
      `Upstream responded with ${response.status}`,
    );
  }
  return response.json();
}

/** Typed provider failure so server functions can map it to a UI message. */
export class ProviderError extends Error {
  constructor(
    public code: "not_found" | "missing_key" | "network" | "unknown",
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/* ------------------------------------------------------------------ *
 * Geocoding
 * ------------------------------------------------------------------ */

/** Resolve a free-text place / airport name to coordinates. */
export async function geocode(query: string, apiKey?: string): Promise<WeatherLocation> {
  if (apiKey) {
    const results = (await getJson(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`,
    )) as Array<{ name: string; country: string; lat: number; lon: number }>;
    const hit = results?.[0];
    if (hit) {
      return { name: hit.name, country: hit.country, lat: hit.lat, lon: hit.lon };
    }
  }

  const data = (await getJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
  )) as {
    results?: Array<{
      name: string;
      country_code?: string;
      country?: string;
      latitude: number;
      longitude: number;
      admin1?: string;
    }>;
  };
  const hit = data.results?.[0];
  if (!hit) {
    throw new ProviderError("not_found", `We couldn't find "${query}".`);
  }
  return {
    name: hit.name,
    country: hit.country_code ?? hit.country ?? "",
    lat: hit.latitude,
    lon: hit.longitude,
  };
}

/** Best-effort reverse geocoding for browser geolocation coordinates. */
export async function reverseGeocode(
  lat: number,
  lon: number,
  apiKey?: string,
): Promise<WeatherLocation> {
  try {
    if (apiKey) {
      const results = (await getJson(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`,
      )) as Array<{ name: string; country: string }>;
      const hit = results?.[0];
      if (hit) return { name: hit.name, country: hit.country, lat, lon };
    } else {
      const data = (await getJson(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      )) as { city?: string; locality?: string; countryCode?: string };
      const name = data.city || data.locality;
      if (name) return { name, country: data.countryCode ?? "", lat, lon };
    }
  } catch {
    // Naming is cosmetic — never fail the whole request over it.
  }
  return { name: "Your location", country: "", lat, lon };
}

/* ------------------------------------------------------------------ *
 * Open-Meteo (keyless fallback)
 * ------------------------------------------------------------------ */

interface OpenMeteoForecast {
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    weather_code: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m?: number;
    visibility?: number;
    uv_index?: number;
  };
  minutely_15?: {
    time: string[];
    precipitation: number[];
  };

  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    visibility?: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
}

/** Next two hours of 15-minute precipitation slots, from "now" onwards. */
function minutelyFromOpenMeteo(
  forecast: OpenMeteoForecast,
  nowEpoch: number,
): MinutelyPoint[] | undefined {
  const block = forecast.minutely_15;
  if (!block) return undefined;
  const points: MinutelyPoint[] = [];
  block.time.forEach((iso, index) => {
    const time = localIsoToEpoch(iso);
    if (time < nowEpoch - 15 * 60 * 1000 || points.length >= 8) return;
    points.push({ time, precip: block.precipitation[index] ?? 0 });
  });
  return points.length ? points : undefined;
}

async function fetchOpenMeteo(location: WeatherLocation): Promise<WeatherPayload> {

  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,uv_index",
    minutely_15: "precipitation",
    hourly: "temperature_2m,weather_code,precipitation_probability",

    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "7",
    wind_speed_unit: "ms",
  });

  const forecast = (await getJson(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  )) as OpenMeteoForecast;

  const nowEpoch = localIsoToEpoch(forecast.current.time);

  // Hourly: the next 24 entries from the current hour.
  const startIndex = Math.max(
    0,
    forecast.hourly.time.findIndex((t) => localIsoToEpoch(t) >= nowEpoch),
  );
  const hourly: HourlyPoint[] = forecast.hourly.time
    .slice(startIndex, startIndex + 24)
    .map((time, i) => {
      const index = startIndex + i;
      return {
        time: localIsoToEpoch(time),
        temp: forecast.hourly.temperature_2m[index] ?? 0,
        condition: wmoCondition(forecast.hourly.weather_code[index] ?? 0),
        pop: forecast.hourly.precipitation_probability[index] ?? 0,
      };
    });

  const minutely = minutelyFromOpenMeteo(forecast, nowEpoch);

  const daily: DailyPoint[] = forecast.daily.time.map((time, i) => ({

    time: localIsoToEpoch(time),
    min: forecast.daily.temperature_2m_min[i] ?? 0,
    max: forecast.daily.temperature_2m_max[i] ?? 0,
    condition: wmoCondition(forecast.daily.weather_code[i] ?? 0),
    pop: forecast.daily.precipitation_probability_max[i] ?? 0,
  }));

  return {
    location,
    current: {
      temp: forecast.current.temperature_2m,
      feelsLike: forecast.current.apparent_temperature,
      condition: wmoCondition(forecast.current.weather_code),
      humidity: forecast.current.relative_humidity_2m,
      windSpeed: forecast.current.wind_speed_10m,
      windDeg: forecast.current.wind_direction_10m,
      ...(forecast.current.wind_gusts_10m != null
        ? { windGust: forecast.current.wind_gusts_10m }
        : {}),

      visibility: forecast.current.visibility ?? 10000,
      pressure: Math.round(forecast.current.surface_pressure),
      uvIndex: forecast.current.uv_index ?? forecast.daily.uv_index_max[0] ?? 0,
      sunrise: localIsoToEpoch(forecast.daily.sunrise[0] ?? forecast.daily.time[0]!),
      sunset: localIsoToEpoch(forecast.daily.sunset[0] ?? forecast.daily.time[0]!),
      isDay: forecast.current.is_day === 1,
    },
    hourly,
    daily,
    ...(minutely ? { minutely } : {}),
    air: await fetchOpenMeteoAir(location),


    fetchedAt: Date.now() + forecast.utc_offset_seconds * 1000,
    source: "open-meteo",
  };
}

async function fetchOpenMeteoAir(location: WeatherLocation): Promise<AirQuality | null> {
  try {
    const data = (await getJson(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lon}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide`,
    )) as {
      current?: {
        us_aqi?: number;
        pm2_5?: number;
        pm10?: number;
        ozone?: number;
        nitrogen_dioxide?: number;
        sulphur_dioxide?: number;
        carbon_monoxide?: number;
      };
    };
    const current = data.current;
    if (!current || current.us_aqi == null) return null;
    return {
      aqi: Math.round(current.us_aqi),
      label: usAqiLabel(current.us_aqi),
      components: {
        pm2_5: current.pm2_5 ?? 0,
        pm10: current.pm10 ?? 0,
        o3: current.ozone ?? 0,
        no2: current.nitrogen_dioxide ?? 0,
        so2: current.sulphur_dioxide ?? 0,
        co: current.carbon_monoxide ?? 0,
      },
    };
  } catch {
    return null; // Air quality is optional data.
  }
}

/* ------------------------------------------------------------------ *
 * OpenWeatherMap (One Call 3.0 + Air Pollution)
 * ------------------------------------------------------------------ */

interface OwmOneCall {
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    uvi: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{ id: number; description: string }>;
  };
  minutely?: Array<{ dt: number; precipitation: number }>;
  alerts?: Array<{
    sender_name?: string;
    event: string;
    description: string;
    start: number;
    end: number;
  }>;
  hourly: Array<{
    dt: number;
    temp: number;
    pop: number;
    weather: Array<{ id: number; description: string }>;
  }>;
  daily: Array<{
    dt: number;
    temp: { min: number; max: number };
    pop: number;
    weather: Array<{ id: number; description: string }>;
  }>;
}

async function fetchOpenWeather(
  location: WeatherLocation,
  apiKey: string,
): Promise<WeatherPayload> {
  const data = (await getJson(
    `https://api.openweathermap.org/data/3.0/onecall?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${apiKey}`,
  )) as OwmOneCall;


  const offset = data.timezone_offset;
  const currentWeather = data.current.weather[0];

  return {
    location,
    current: {
      temp: data.current.temp,
      feelsLike: data.current.feels_like,
      condition: owmCondition(currentWeather?.id ?? 800, currentWeather?.description),
      humidity: data.current.humidity,
      windSpeed: data.current.wind_speed,
      windDeg: data.current.wind_deg,
      ...(data.current.wind_gust != null ? { windGust: data.current.wind_gust } : {}),

      visibility: data.current.visibility,
      pressure: data.current.pressure,
      uvIndex: data.current.uvi,
      sunrise: shift(data.current.sunrise, offset),
      sunset: shift(data.current.sunset, offset),
      isDay: data.current.dt >= data.current.sunrise && data.current.dt < data.current.sunset,
    },
    hourly: data.hourly.slice(0, 24).map((hour) => ({
      time: shift(hour.dt, offset),
      temp: hour.temp,
      condition: owmCondition(hour.weather[0]?.id ?? 800, hour.weather[0]?.description),
      pop: Math.round((hour.pop ?? 0) * 100),
    })),
    daily: data.daily.slice(0, 7).map((day) => ({
      time: shift(day.dt, offset),
      min: day.temp.min,
      max: day.temp.max,
      condition: owmCondition(day.weather[0]?.id ?? 800, day.weather[0]?.description),
      pop: Math.round((day.pop ?? 0) * 100),
    })),
    ...(data.minutely?.length
      ? {
          minutely: data.minutely.slice(0, 24).map((slot) => ({
            time: shift(slot.dt, offset),
            precip: slot.precipitation ?? 0,
          })),
        }
      : {}),
    ...(data.alerts?.length
      ? {
          alerts: data.alerts.slice(0, 4).map((alert): WeatherAlert => ({
            event: alert.event,
            description: alert.description.slice(0, 400),
            start: shift(alert.start, offset),
            end: shift(alert.end, offset),
            ...(alert.sender_name ? { sender: alert.sender_name } : {}),
          })),
        }
      : {}),
    air: await fetchOwmAir(location, apiKey),

    fetchedAt: Date.now() + offset * 1000,
    source: "openweathermap",
  };
}

async function fetchOwmAir(
  location: WeatherLocation,
  apiKey: string,
): Promise<AirQuality | null> {
  try {
    const data = (await getJson(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}`,
    )) as {
      list?: Array<{
        main: { aqi: number };
        components: Record<string, number>;
      }>;
    };
    const entry = data.list?.[0];
    if (!entry) return null;
    const aqi = owmAqiToUs(entry.main.aqi);
    return {
      aqi,
      label: usAqiLabel(aqi),
      components: {
        pm2_5: entry.components["pm2_5"] ?? 0,
        pm10: entry.components["pm10"] ?? 0,
        o3: entry.components["o3"] ?? 0,
        no2: entry.components["no2"] ?? 0,
        so2: entry.components["so2"] ?? 0,
        co: entry.components["co"] ?? 0,
      },
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Public entry point
 * ------------------------------------------------------------------ */

export interface WeatherLookup {
  query?: string | undefined;
  lat?: number | undefined;
  lon?: number | undefined;
  name?: string | undefined;
  country?: string | undefined;
}

/**
 * Resolve the requested place and load its weather, preferring
 * OpenWeatherMap when a key is configured and falling back to Open-Meteo.
 */
export async function loadWeather(
  lookup: WeatherLookup,
  apiKey?: string,
): Promise<WeatherPayload> {
  let location: WeatherLocation;

  if (lookup.lat != null && lookup.lon != null) {
    location = lookup.name
      ? { name: lookup.name, country: lookup.country ?? "", lat: lookup.lat, lon: lookup.lon }
      : await reverseGeocode(lookup.lat, lookup.lon, apiKey);
  } else if (lookup.query) {
    location = await geocode(lookup.query, apiKey);
  } else {
    throw new ProviderError("unknown", "No place was provided.");
  }

  if (apiKey) {
    try {
      return await fetchOpenWeather(location, apiKey);
    } catch (error) {
      // A bad/unactivated key shouldn't blank the dashboard — degrade to the
      // keyless provider instead.
      if (error instanceof ProviderError && error.code === "missing_key") {
        return fetchOpenMeteo(location);
      }
      throw error;
    }
  }

  return fetchOpenMeteo(location);
}
