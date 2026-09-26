/**
 * Interactive Neubrutalist Live Doppler Radar & Satellite Map.
 *
 * Powered by Leaflet + RainViewer public keyless API.
 * Features frame time-scrubbing, animation loop playback, satellite infrared
 * toggling, city centering, and custom neubrutalist map markers.
 */

import { useEffect, useRef, useState } from "react";
import {
  Layers,
  LocateFixed,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { Map as LeafletMap, TileLayer } from "leaflet";

import { formatHour, formatMinute } from "@/lib/weather-format";
import type { WeatherLocation } from "@/lib/weather-types";

interface RadarFrame {
  time: number;
  path: string;
}

interface RainViewerApiResponse {
  host: string;
  radar?: {
    past?: RadarFrame[];
    nowcast?: RadarFrame[];
  };
  satellite?: {
    infrared?: RadarFrame[];
  };
}

interface RadarMapProps {
  location: WeatherLocation;
  dark: boolean;
}

export function RadarMap({ location, dark }: RadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const baseLayerRef = useRef<TileLayer | null>(null);
  const radarLayerRef = useRef<TileLayer | null>(null);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [host, setHost] = useState("https://tilecache.rainviewer.com");
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layerType, setLayerType] = useState<"radar" | "satellite">("radar");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch RainViewer radar metadata
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    async function fetchRadarFrames() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        if (!res.ok) throw new Error(`RainViewer HTTP ${res.status}`);
        const data: RainViewerApiResponse = await res.json();

        if (cancelled) return;
        setHost(data.host || "https://tilecache.rainviewer.com");

        const availableFrames =
          layerType === "radar"
            ? [...(data.radar?.past ?? []), ...(data.radar?.nowcast ?? [])]
            : (data.satellite?.infrared ?? []);

        if (!availableFrames.length) {
          throw new Error("No radar coverage available for this region.");
        }

        setFrames(availableFrames);
        // Default to the latest past frame (near the end of past)
        setActiveFrameIndex(Math.max(0, (data.radar?.past?.length ?? 1) - 1));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load radar data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchRadarFrames();
    return () => {
      cancelled = true;
    };
  }, [mounted, layerType]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    let isCancelled = false;

    // Dynamically import Leaflet to protect SSR
    import("leaflet").then((L) => {
      if (isCancelled || !containerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(containerRef.current, {
          center: [location.lat, location.lon],
          zoom: 7,
          minZoom: 3,
          maxZoom: 14,
          zoomControl: true,
          attributionControl: true,
        });

        mapInstanceRef.current = map;

        // Custom Neubrutalist city marker pin
        const cityIcon = L.divIcon({
          className: "nowcast-city-pin",
          iconSize: [120, 36],
          iconAnchor: [60, 18],
          html: `<div style="
            border: 3px solid var(--ink);
            background: var(--accent);
            color: var(--accent-foreground);
            box-shadow: 3px 3px 0 0 var(--ink);
            padding: 2px 8px;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            white-space: nowrap;
          ">📍 ${location.name}</div>`,
        });

        L.marker([location.lat, location.lon], { icon: cityIcon }).addTo(map);
      } else {
        // Location changed: fly to new coordinates
        mapInstanceRef.current.flyTo([location.lat, location.lon], 7, { duration: 1.2 });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [mounted, location.lat, location.lon, location.name]);

  // Update base map layer on theme flip
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (baseLayerRef.current) {
        map.removeLayer(baseLayerRef.current);
      }

      const tileUrl = dark
        ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      const base = L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, RainViewer',
        maxZoom: 19,
        subdomains: "abcd",
      });

      base.addTo(map);
      baseLayerRef.current = base;
    });
  }, [dark, mounted]);

  // Update active radar tile overlay when frame changes
  useEffect(() => {
    if (!mapInstanceRef.current || !frames.length) return;
    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (radarLayerRef.current) {
        map.removeLayer(radarLayerRef.current);
      }

      // RainViewer color scheme 2 is universal, smooth snow 1_1
      const colorScheme = layerType === "radar" ? "2" : "0";
      const smooth = layerType === "radar" ? "1_1" : "0";
      const radarUrl = `${host}${currentFrame.path}/256/{z}/{x}/{y}/${colorScheme}/${smooth}.png`;

      const radarLayer = L.tileLayer(radarUrl, {
        opacity: layerType === "radar" ? 0.78 : 0.65,
        zIndex: 50,
      });

      radarLayer.addTo(map);
      radarLayerRef.current = radarLayer;
    });
  }, [activeFrameIndex, frames, host, layerType]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || !frames.length) return;

    const interval = window.setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % frames.length);
    }, 700);

    return () => window.clearInterval(interval);
  }, [isPlaying, frames.length]);

  const activeTime = frames[activeFrameIndex]?.time;
  const formattedTime = activeTime
    ? `${formatHour(activeTime * 1000)}:${formatMinute(activeTime * 1000)}`
    : "--:--";

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.lat, location.lon], 7, { duration: 0.8 });
    }
  };

  return (
    <section
      className={`brut bg-card p-4 sm:p-6 transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50 overflow-hidden flex flex-col" : ""
      }`}
      aria-labelledby="radar-map-heading"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-3 border-ink">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rain opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-rain" />
          </span>
          <h2 id="radar-map-heading" className="text-xl uppercase font-display tracking-tight">
            Live Doppler Radar
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layer switcher */}
          <div className="flex border-3 border-ink bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setLayerType("radar")}
              className={`px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase transition-colors ${
                layerType === "radar"
                  ? "bg-accent text-accent-foreground font-black"
                  : "text-muted-foreground"
              }`}
            >
              Precipitation
            </button>
            <button
              type="button"
              onClick={() => setLayerType("satellite")}
              className={`px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase transition-colors ${
                layerType === "satellite"
                  ? "bg-accent text-accent-foreground font-black"
                  : "text-muted-foreground"
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Recenter */}
          <button
            type="button"
            onClick={handleRecenter}
            title="Center on current city"
            className="brut-sm brut-press bg-card p-1.5 text-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Center map on current city"
          >
            <LocateFixed className="size-4" strokeWidth={2.5} />
          </button>

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Collapse map" : "Expand map"}
            className="brut-sm brut-press bg-card p-1.5 text-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={isExpanded ? "Collapse map" : "Expand map"}
          >
            {isExpanded ? (
              <Minimize2 className="size-4" strokeWidth={2.5} />
            ) : (
              <Maximize2 className="size-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div
        className={`relative mt-4 border-3 border-ink ${isExpanded ? "flex-1 min-h-[400px]" : "h-72 sm:h-96"}`}
      >
        <div ref={containerRef} className="size-full z-0" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/75 backdrop-blur-xs font-mono text-xs font-bold uppercase">
            <span className="brut bg-accent px-4 py-2 text-accent-foreground animate-pulse">
              Calibrating Doppler Stream...
            </span>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/90 p-4 text-center">
            <div className="brut bg-destructive/10 border-destructive p-4 max-w-sm">
              <p className="font-mono text-xs font-bold text-destructive uppercase">
                Radar Offline
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Time Stamp HUD Badge */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div className="brut-sm bg-card/95 backdrop-blur-xs px-3 py-1 font-mono text-xs font-black uppercase text-foreground shadow-[3px_3px_0_0_var(--ink)]">
            Frame: <span className="text-rain">{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Radar Timeline & Playback Controller */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t-3 border-ink pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="brut-sm brut-press bg-accent px-3 py-1.5 font-mono text-xs font-bold uppercase text-accent-foreground flex items-center gap-1.5"
          >
            {isPlaying ? (
              <>
                <Pause className="size-3.5" strokeWidth={3} /> Pause
              </>
            ) : (
              <>
                <Play className="size-3.5" strokeWidth={3} /> Play Loop
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1))}
            className="brut-sm brut-press bg-card p-1.5 text-foreground hover:bg-muted"
            title="Step Back"
            aria-label="Step Back"
          >
            <SkipBack className="size-3.5" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={() => setActiveFrameIndex((prev) => (prev + 1) % frames.length)}
            className="brut-sm brut-press bg-card p-1.5 text-foreground hover:bg-muted"
            title="Step Forward"
            aria-label="Step Forward"
          >
            <SkipForward className="size-3.5" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={() => setActiveFrameIndex(Math.max(0, frames.length - 1))}
            className="brut-sm brut-press bg-card p-1.5 text-foreground hover:bg-muted"
            title="Latest Frame"
            aria-label="Latest Frame"
          >
            <RotateCcw className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Frame Scrubber */}
        <div className="flex-1 max-w-md flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={activeFrameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setActiveFrameIndex(Number(e.target.value));
            }}
            className="w-full accent-ink cursor-pointer"
            aria-label="Radar time scrubber"
          />
          <span className="font-mono text-xs font-bold text-muted-foreground shrink-0">
            {activeFrameIndex + 1}/{frames.length || 1}
          </span>
        </div>

        {/* Neubrutalist Radar Legend */}
        <div className="flex items-center gap-1.5 shrink-0" aria-label="Precipitation legend">
          <span className="font-mono text-[0.6rem] font-bold uppercase text-muted-foreground mr-1">
            Intensity:
          </span>
          <span className="size-3 border border-ink bg-[#72c2ff]" title="Light Drizzle" />
          <span className="size-3 border border-ink bg-[#3b82f6]" title="Moderate Rain" />
          <span className="size-3 border border-ink bg-[#eab308]" title="Heavy Rain" />
          <span className="size-3 border border-ink bg-[#ef4444]" title="Severe Storm" />
          <span className="size-3 border border-ink bg-[#a855f7]" title="Hail / Snow" />
        </div>
      </div>
    </section>
  );
}
