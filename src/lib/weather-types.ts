/**
 * Shared, client-safe weather types.
 *
 * Every timestamp in these DTOs is a "display epoch": UTC milliseconds that
 * have already been shifted into the location's local time. Format them with
 * `timeZone: "UTC"` and you get the correct local clock time for that city
 * without shipping a timezone database.
 */

/** Coarse condition families we style and animate against. */
export type ConditionGroup =
  | "clear"
  | "clouds"
  | "rain"
  | "snow"
  | "storm"
  | "fog";

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
}

export interface DailyPoint {
  time: number;
  min: number;
  max: number;
  condition: WeatherCondition;
  pop: number;
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
  /** Display epoch of the moment the data was fetched. */
  fetchedAt: number;
  /** Which upstream provider answered. */
  source: "openweathermap" | "open-meteo";
}

export type WeatherErrorCode =
  | "not_found"
  | "missing_key"
  | "network"
  | "geolocation_denied"
  | "unknown";

export type WeatherResult =
  | { ok: true; data: WeatherPayload }
  | { ok: false; code: WeatherErrorCode; message: string };

/** A saved / recent place. */
export interface SavedPlace {
  name: string;
  country: string;
  lat: number;
  lon: number;
}
