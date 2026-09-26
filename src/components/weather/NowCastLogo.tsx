/**
 * NowCast Brandmark & Logo
 * Custom Neubrutalist emblem combining a radiant sun, Doppler radar wave, and high-voltage lightning bolt.
 */

import { motion } from "motion/react";

interface NowCastLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export function NowCastLogo({
  size = "md",
  showSubtitle = true,
  animated = true,
  onClick,
}: NowCastLogoProps) {
  const iconSizes = {
    sm: "size-6",
    md: "size-8",
    lg: "size-11",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group inline-flex items-center gap-2.5 select-none ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Neubrutalist Emblem Box */}
      <motion.div
        {...(animated
          ? {
              whileHover: { scale: 1.05, rotate: -2 },
              whileTap: { scale: 0.95 },
            }
          : {})}
        className="relative border-3 border-ink bg-sun p-1 shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-150"
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizes[size]} text-ink`}
        >
          {/* Radar concentric arc */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="4 3"
            className="opacity-40"
          />

          {/* Sun Disk with Rays */}
          <circle cx="20" cy="20" r="8" fill="#111111" />
          <path
            d="M20 4V8M20 32V36M4 20H8M32 20H36M8.7 8.7L11.5 11.5M28.5 28.5L31.3 31.3M8.7 31.3L11.5 28.5M28.5 11.5L31.3 8.7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="square"
          />

          {/* Electric Lightning Bolt through center */}
          <polygon
            points="22,6 12,22 19,22 17,34 29,18 22,18"
            fill="#ffffff"
            stroke="#111111"
            strokeWidth="2"
            strokeLinejoin="miter"
          />
        </svg>

        {/* Live Signal Pulse Dot */}
        <span className="absolute -top-1 -right-1 flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full border border-ink bg-lime" />
        </span>
      </motion.div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display tracking-tight uppercase text-foreground ${textSizes[size]}`}
          >
            NOW<span className="text-amber-500 dark:text-sun">CAST</span>
          </span>
        </div>

        {showSubtitle && (
          <span className="mt-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
            Precision Forecast Engine
          </span>
        )}
      </div>
    </div>
  );
}
