/**
 * Server functions for weather lookups.
 *
 * This module is a thin RPC wrapper: it holds nothing but imports and
 * `createServerFn` declarations, so the server-fn splitter can strip the
 * handler bodies from the client bundle safely. The API key is read inside the
 * handler and never crosses the wire.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { loadWeather, ProviderError, searchPlaces } from "./weather.server";
import type { PlaceSuggestion, WeatherResult } from "./weather-types";

const lookupSchema = z
  .object({
    query: z.string().trim().min(1).max(120).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    name: z.string().trim().max(120).optional(),
    country: z.string().trim().max(60).optional(),
  })
  .refine((value) => Boolean(value.query) || (value.lat != null && value.lon != null), {
    message: "Provide either a search query or coordinates.",
  });

export const getWeather = createServerFn({ method: "GET" })
  .validator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }): Promise<WeatherResult> => {
    // Read the secret at call time: env is injected per request on the edge.
    const apiKey = process.env["OPENWEATHER_API_KEY"]?.trim() || undefined;

    try {
      return { ok: true, data: await loadWeather(data, apiKey) };
    } catch (error) {
      if (error instanceof ProviderError) {
        return { ok: false, code: error.code, message: error.message };
      }
      console.error("getWeather failed", error);
      return {
        ok: false,
        code: "network",
        message: "We couldn't reach the weather service. Try again in a moment.",
      };
    }
  });

const searchSchema = z.object({
  query: z.string().trim().min(2).max(100),
});

export const searchLocations = createServerFn({ method: "GET" })
  .validator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => {
    try {
      return await searchPlaces(data.query);
    } catch (error) {
      console.error("searchLocations failed", error);
      return [];
    }
  });
