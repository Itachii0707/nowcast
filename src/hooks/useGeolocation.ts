/**
 * Browser geolocation with explicit, user-facing error states.
 */

import { useCallback, useState } from "react";

export type GeoStatus = "idle" | "locating" | "denied" | "unavailable" | "success";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");

  const locate = useCallback((onSuccess: (coords: { lat: number; lon: number }) => void) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("success");
        onSuccess({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const reset = useCallback(() => setStatus("idle"), []);

  return { status, locate, reset };
}
