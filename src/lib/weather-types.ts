/**
 * Shared, client-safe weather types.
 *
 * Every timestamp in these DTOs is a "display epoch": UTC milliseconds that
 * have already been shifted into the location's local time. Format them with
 * `timeZone: "UTC"` and you get the correct local clock time for that city
 * without shipping a timezone database.
 */

/** Coarse condition families we style and animate against. */
export type ConditionGroup = "clear" | "clouds" | "rain" | "snow" | "storm" | "fog";

export interface WeatherCondition {
  group: ConditionGroup;
  /** Human readable label, e.g. "Light rain". */
  label: string;
}

export interface WeatherLocation {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  /** Always Celsius; the UI converts for display. */
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  humidity: number;
  /** Metres per second. */
  windSpeed: number;
  /** Meteorological degrees the wind is coming from. */
  windDeg: number;
  /** Gust speed in metres per second, when the provider reports it. */
  windGust?: number;

  /** Metres. */
  visibility: number;
  /** hPa. */
  pressure: number;
  uvIndex: number;
  sunrise: number;
  sunset: number;
  isDay: boolean;
}

export interface HourlyPoint {
  time: number;
  temp: number;
  condition: WeatherCondition;
  /** Precipitation probability, 0-100. */
  pop: number;
  /** Whether this hour falls during daytime at the location. */
  isDay?: boolean | undefined;
}

export interface DailyPoint {
  time: number;
  min: number;
  max: number;
  condition: WeatherCondition;
  pop: number;
  uvMax?: number | undefined;
  sunrise?: number | undefined;
  sunset?: number | undefined;
  precipSum?: number | undefined;
  windMax?: number | undefined;
}

/** Short-range precipitation point (15-minute or 1-minute resolution). */
export interface MinutelyPoint {
  time: number;
  /** Millimetres of precipitation for the slot. */
  precip: number;
}

/** Provider-issued severe weather warning. */
export interface WeatherAlert {
  event: string;
  description: string;
  start: number;
  end: number;
  sender?: string;
}

export interface AirQuality {
  /** US AQI scale. */
  aqi: number;
  label: string;
  components: {
    pm2_5: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
}

export interface WeatherPayload {
  location: WeatherLocation;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  air: AirQuality | null;
  /** Next ~2 hours of precipitation, when the provider supports it. */
  minutely?: MinutelyPoint[];
  /** Active severe weather warnings (OpenWeatherMap only). */
  alerts?: WeatherAlert[];

  /** Display epoch of the moment the data was fetched. */
  fetchedAt: number;
  /** Real UTC epoch timestamp (Date.now()) when the payload was created. */
  rawFetchedAt: number;
  /** Timezone offset in seconds from UTC. */
  timezoneOffset: number;
  /** Which upstream provider answered. */
  source: "openweathermap" | "open-meteo";
}

export type WeatherErrorCode =
  "not_found" | "missing_key" | "network" | "geolocation_denied" | "unknown";

export type WeatherResult =
  { ok: true; data: WeatherPayload } | { ok: false; code: WeatherErrorCode; message: string };

/** A saved / recent place. */
export interface SavedPlace {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

/** Autocomplete suggestion from geocoding. */
export interface PlaceSuggestion {
  id: number;
  name: string;
  admin1?: string | undefined;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  population?: number | undefined;
}
