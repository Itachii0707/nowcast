/**
 * Severe weather alert banner. Each alert is collapsible so long provider
 * descriptions never dominate the dashboard.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ChevronDown } from "lucide-react";

import { formatClock } from "@/lib/weather-format";
import type { WeatherAlert } from "@/lib/weather-types";

export function AlertBanner({ alerts }: { alerts: WeatherAlert[] }) {
  if (!alerts.length) return null;

  return (
    <section aria-labelledby="alerts-heading" className="space-y-3">
      <h2 id="alerts-heading" className="sr-only">
        Severe weather alerts
      </h2>
      {alerts.map((alert) => (
        <AlertRow key={`${alert.event}-${alert.start}`} alert={alert} />
      ))}
    </section>
  );
}

function AlertRow({ alert }: { alert: WeatherAlert }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="brut overflow-hidden bg-sun">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <motion.span
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
          className="text-ink"
        >
          <AlertTriangle className="size-6" strokeWidth={3} aria-hidden="true" />
        </motion.span>
        <span className="flex-1">
          <span className="block font-display text-base uppercase tracking-tight text-ink">
            {alert.event}
          </span>
          <span className="block font-mono text-[0.6rem] font-bold uppercase tracking-widest text-ink/70">
            {formatClock(alert.start)} – {formatClock(alert.end)}
            {alert.sender ? ` · ${alert.sender}` : ""}
          </span>
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-ink transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={3}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t-3 border-ink bg-card px-4 text-sm font-semibold"
          >
            <span className="block py-3">{alert.description}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
