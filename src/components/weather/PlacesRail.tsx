/**
 * Favourites and recent searches rails, both persisted in localStorage.
 */

import { motion } from "motion/react";
import { Clock, Star, X } from "lucide-react";

import type { SavedPlace } from "@/lib/weather-types";

interface PlacesRailProps {
  favorites: SavedPlace[];
  recents: SavedPlace[];
  activeKey: string;
  onSelect: (place: SavedPlace) => void;
  onRemoveFavorite: (place: SavedPlace) => void;
  onRemoveRecent: (place: SavedPlace) => void;
  onClearRecents: () => void;
}

function placeKey(place: SavedPlace) {
  return `${place.lat.toFixed(2)},${place.lon.toFixed(2)}`;
}

function Rail({
  title,
  icon,
  places,
  emptyCopy,
  activeKey,
  onSelect,
  onRemove,
  accent,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  places: SavedPlace[];
  emptyCopy: string;
  activeKey: string;
  onSelect: (place: SavedPlace) => void;
  onRemove: (place: SavedPlace) => void;
  accent: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="brut bg-card p-5" aria-labelledby={`${title}-heading`}>
      <div className="flex items-center justify-between gap-2">
        <h2
          id={`${title}-heading`}
          className="inline-flex items-center gap-2 text-base uppercase"
        >
          <span className={`brut-flat inline-flex size-7 items-center justify-center ${accent}`}>
            {icon}
          </span>
          {title}
        </h2>
        {action}
      </div>

      {places.length === 0 ? (
        <p className="mt-3 font-mono text-[0.65rem] font-bold uppercase text-muted-foreground">
          {emptyCopy}
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {places.map((place) => {
            const active = placeKey(place) === activeKey;
            return (
              <motion.li
                key={placeKey(place)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`brut-sm flex items-center overflow-hidden ${
                  active ? "bg-accent text-accent-foreground" : "bg-secondary"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  aria-current={active ? "true" : undefined}
                  className="px-3 py-1.5 font-mono text-xs font-bold uppercase"
                >
                  {place.name}
                  {place.country ? (
                    <span className="ml-1 opacity-60">{place.country}</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(place)}
                  aria-label={`Remove ${place.name}`}
                  className="border-l-3 border-ink px-1.5 py-2 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function PlacesRail({
  favorites,
  recents,
  activeKey,
  onSelect,
  onRemoveFavorite,
  onRemoveRecent,
  onClearRecents,
}: PlacesRailProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Rail
        title="Favourites"
        icon={<Star className="size-4" strokeWidth={3} aria-hidden="true" />}
        accent="bg-sun text-ink"
        places={favorites}
        emptyCopy="Save a city to pin it here."
        activeKey={activeKey}
        onSelect={onSelect}
        onRemove={onRemoveFavorite}
      />
      <Rail
        title="Recent"
        icon={<Clock className="size-4" strokeWidth={3} aria-hidden="true" />}
        accent="bg-rain text-ink"
        places={recents}
        emptyCopy="Your searches will show up here."
        activeKey={activeKey}
        onSelect={onSelect}
        onRemove={onRemoveRecent}
        action={
          recents.length > 0 ? (
            <button
              type="button"
              onClick={onClearRecents}
              className="brut-sm brut-press bg-card px-2 py-1 font-mono text-[0.6rem] font-bold uppercase"
            >
              Clear all
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
