/**
 * Neubrutalist Opening Sequence & Atmospheric Radar Calibration
 * An attractive, unique boot sequence with procedural Web Audio SFX
 * and catchy real-time synoptic telemetry code.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Radio, Zap, CheckCircle2, Volume2, VolumeX, Terminal, Activity } from "lucide-react";

interface IntroBootSequenceProps {
  onComplete?: () => void;
  forceOpen?: boolean;
}

interface TelemetryLog {
  tag: string;
  code: string;
  status: string;
}

const CATCHY_BOOT_LOGS: TelemetryLog[] = [
  {
    tag: "SYS.INIT",
    code: "0x7F4A // MOUNTING SYNOPTIC CORE",
    status: "OK",
  },
  {
    tag: "DOPPLER",
    code: "LOCKING S-BAND 2.8GHz RADAR TILES",
    status: "SYNC",
  },
  {
    tag: "ATMOS",
    code: "BAROMETRIC EQUILIBRIUM: 1013.25 hPa",
    status: "CALIBRATED",
  },
  {
    tag: "NOWCAST",
    code: "PRECISION ENGINE ARMED · READY FOR LAUNCH",
    status: "ONLINE",
  },
];

export function IntroBootSequence({ onComplete, forceOpen = false }: IntroBootSequenceProps) {
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context safely
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // High-tech digital chirp / radar ping
  const playChirp = useCallback(
    (freq = 880, duration = 0.08) => {
      if (!soundEnabledRef.current) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.6, ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Audio autoplay policy catch
      }
    },
    [getAudioContext],
  );

  // Atmospheric frequency sweep
  const playSweep = useCallback(() => {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio catch
    }
  }, [getAudioContext]);

  // Harmonious Futuristic System Ready Chime (C6 -> E6 -> G6)
  const playReadyChime = useCallback(() => {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [1046.5, 1318.5, 1568.0]; // C6, E6, G6 triad

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.09, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      });
    } catch {
      // Audio catch
    }
  }, [getAudioContext]);

  useEffect(() => {
    // If motion is reduced, skip the intro
    if (reducedMotion) {
      if (onComplete) onComplete();
      return undefined;
    }

    // Check if previously viewed in this browser session
    const hasBooted = sessionStorage.getItem("nowcast_intro_seen");
    if (!hasBooted || forceOpen) {
      setIsVisible(true);

      // Initial chirp
      const t0 = setTimeout(() => {
        playChirp(720, 0.07);
        setProgress(18);
        setLogIndex(0);
      }, 150);

      // Phase 1: Doppler Lock
      const t1 = setTimeout(() => {
        playSweep();
        setProgress(48);
        setLogIndex(1);
      }, 450);

      // Phase 2: Atmospheric Calibration
      const t2 = setTimeout(() => {
        playChirp(1080, 0.09);
        setProgress(82);
        setLogIndex(2);
      }, 850);

      // Phase 3: All Systems Nominal
      const t3 = setTimeout(() => {
        playReadyChime();
        setProgress(100);
        setLogIndex(3);
      }, 1250);

      // Final: Seamless Curtain Reveal
      const t4 = setTimeout(() => {
        sessionStorage.setItem("nowcast_intro_seen", "true");
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 1850);

      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else {
      if (onComplete) onComplete();
      return undefined;
    }
  }, [reducedMotion, forceOpen, onComplete, playChirp, playSweep, playReadyChime]);

  const handleDismiss = () => {
    sessionStorage.setItem("nowcast_intro_seen", "true");
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="intro-boot-overlay"
          initial={{ opacity: 1, y: 0 }}
          exit={{
            y: "-100%",
            transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-4 py-8 select-none"
        >
          {/* Neubrutalist grid lines background */}
          <div className="absolute inset-0 pointer-events-none opacity-30 hatch" />

          {/* Central Neubrutalist Diagnostic Console */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative z-10 w-full max-w-lg border-3 border-ink bg-card p-6 shadow-[8px_8px_0_var(--color-ink)] sm:p-8"
          >
            {/* Top diagnostic header */}
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <div className="flex items-center gap-2 font-mono text-[0.68rem] font-black uppercase tracking-widest text-muted-foreground">
                <Radio className="size-3.5 animate-pulse text-amber-500" />
                <span>NC-RADAR // NODE-880</span>
                <span className="hidden sm:inline text-ink/40">|</span>
                <span className="hidden sm:inline text-lime">2.85 GHz</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Audio SFX Toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  className="flex items-center gap-1 border border-ink/40 bg-secondary px-1.5 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-foreground hover:border-ink hover:bg-accent"
                  title={soundEnabled ? "Mute SFX" : "Enable SFX"}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="size-3 text-lime" />
                      <span>SFX ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="size-3 text-muted-foreground" />
                      <span>MUTED</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:underline"
                >
                  Skip [ESC]
                </button>
              </div>
            </div>

            {/* Central Animated Logo & Emblem */}
            <div className="my-6 flex flex-col items-center text-center">
              <div className="relative mb-3.5 border-3 border-ink bg-sun p-3 shadow-[4px_4px_0_var(--color-ink)]">
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  className="size-12 text-ink animate-[spin-slow_12s_linear_infinite]"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="4 3"
                    className="opacity-40"
                  />
                  <circle cx="20" cy="20" r="8" fill="#111111" />
                  <path
                    d="M20 4V8M20 32V36M4 20H8M32 20H36M8.7 8.7L11.5 11.5M28.5 28.5L31.3 31.3M8.7 31.3L11.5 28.5M28.5 11.5L31.3 8.7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="square"
                  />
                  <polygon
                    points="22,6 12,22 19,22 17,34 29,18 22,18"
                    fill="#ffffff"
                    stroke="#111111"
                    strokeWidth="2"
                  />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full border border-ink bg-lime" />
                </span>
              </div>

              <h1 className="font-display text-3xl uppercase tracking-tight text-foreground sm:text-4xl">
                NOW<span className="text-amber-500 dark:text-sun">CAST</span>
              </h1>
              <p className="mt-0.5 font-mono text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
                WEATHER · UNFILTERED & INTUITIVE
              </p>
            </div>

            {/* Catchy Real-Time Telemetry Terminal */}
            <div className="mb-4 border-2 border-ink bg-black p-3 text-left font-mono shadow-[3px_3px_0_var(--color-ink)]">
              <div className="mb-1.5 flex items-center justify-between border-b border-zinc-800 pb-1 text-[0.58rem] font-bold text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Terminal className="size-3 text-lime" />
                  SYS.TELEMETRY_LOG
                </span>
                <span className="flex items-center gap-1 text-lime">
                  <Activity className="size-2.5 animate-pulse" />
                  LIVE
                </span>
              </div>

              <div className="space-y-1 text-[0.65rem] font-mono leading-tight">
                {CATCHY_BOOT_LOGS.map((item, idx) => {
                  const isActive = idx === logIndex;
                  const isDone = idx < logIndex;

                  return (
                    <div
                      key={item.tag}
                      className={`flex items-center justify-between transition-opacity ${
                        isActive
                          ? "font-bold text-lime"
                          : isDone
                            ? "text-zinc-400"
                            : "opacity-25 text-zinc-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-amber-400">[{item.tag}]</span>
                        <span className="truncate">{item.code}</span>
                      </div>
                      <span
                        className={`ml-2 text-[0.55rem] font-black uppercase ${
                          isActive
                            ? "bg-lime px-1 text-black"
                            : isDone
                              ? "text-zinc-400"
                              : "text-zinc-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calibration Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs font-black">
                <span className="flex items-center gap-1.5 uppercase text-foreground">
                  <Zap className="size-3.5 text-lime fill-lime" />
                  Synoptic Calibration
                </span>
                <span className="font-mono text-sm">{progress}%</span>
              </div>

              <div className="h-5 w-full border-2 border-ink bg-secondary p-0.5 shadow-[2px_2px_0_var(--color-ink)]">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full bg-accent"
                />
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 pt-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-tight text-muted-foreground">
                {progress === 100 ? (
                  <CheckCircle2 className="size-3.5 text-lime" />
                ) : (
                  <span className="inline-block size-2 animate-ping rounded-full bg-amber-500" />
                )}
                <span className="truncate text-foreground font-black">
                  {progress === 100
                    ? "ATMOSPHERE LOCKED · WELCOME TO NOWCAST"
                    : (CATCHY_BOOT_LOGS[logIndex]?.code ?? "CALIBRATING...")}
                </span>
              </div>
            </div>

            {/* Bottom button trigger */}
            <div className="mt-5 border-t-2 border-dashed border-ink/40 pt-4 text-center">
              <button
                type="button"
                onClick={handleDismiss}
                className="brut-sm brut-press w-full bg-primary py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground"
              >
                Enter Station // Launch ⚡
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
