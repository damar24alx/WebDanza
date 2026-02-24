"use client";

import { useMemo, useState } from "react";
import {
  FlipHorizontal2,
  Maximize2,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  Settings2,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/cn";

type AdvancedVideoControlsProps = {
  durationSec: number;
  defaultCurrentSec?: number;
  className?: string;
};

const speedOptions = [0.5, 0.75, 1, 1.25];

function formatTime(totalSec: number) {
  const safe = Math.max(0, Math.floor(totalSec));
  const min = Math.floor(safe / 60)
    .toString()
    .padStart(1, "0");
  const sec = (safe % 60).toString().padStart(2, "0");

  return `${min}:${sec}`;
}

export function AdvancedVideoControls({
  durationSec,
  defaultCurrentSec = 0,
  className,
}: AdvancedVideoControlsProps) {
  const safeDuration = Math.max(1, durationSec);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [volume, setVolume] = useState(70);
  const [currentSec, setCurrentSec] = useState(Math.min(defaultCurrentSec, safeDuration));
  const [loopStart, setLoopStart] = useState(Math.round(safeDuration * 0.2));
  const [loopEnd, setLoopEnd] = useState(Math.round(safeDuration * 0.6));

  const currentPct = (currentSec / safeDuration) * 100;
  const loopStartPct = (loopStart / safeDuration) * 100;
  const loopEndPct = (loopEnd / safeDuration) * 100;

  const loopWidthPct = useMemo(() => {
    const width = loopEndPct - loopStartPct;
    return Math.max(0, width);
  }, [loopEndPct, loopStartPct]);

  return (
    <div className={cn("space-y-4 rounded-b-2xl bg-[#141122] p-4", className)}>
      <div className="space-y-1">
        <div className="relative h-7">
          <div
            className="absolute top-1/2 h-7 -translate-y-1/2 rounded-sm border-x-2 border-[var(--color-primary)] bg-[var(--color-primary)]/12"
            style={{ left: `${loopStartPct}%`, width: `${loopWidthPct}%` }}
          />
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-[var(--color-primary)]"
              style={{ width: `${currentPct}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-primary)] text-[9px] font-bold text-white"
            style={{ left: `${loopStartPct}%` }}
            aria-label="A loop marker"
          >
            A
          </div>
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-primary)] text-[9px] font-bold text-white"
            style={{ left: `${loopEndPct}%` }}
            aria-label="B loop marker"
          >
            B
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={safeDuration}
          value={currentSec}
          onChange={(event) => setCurrentSec(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15"
          aria-label="Playback position"
        />

        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-xs text-[var(--text-3)]">
            Loop A
            <input
              type="range"
              min={0}
              max={loopEnd - 1}
              value={loopStart}
              onChange={(event) => setLoopStart(Number(event.target.value))}
              className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15"
              aria-label="Loop start"
            />
          </label>
          <label className="text-xs text-[var(--text-3)]">
            Loop B
            <input
              type="range"
              min={loopStart + 1}
              max={safeDuration}
              value={loopEnd}
              onChange={(event) => setLoopEnd(Number(event.target.value))}
              className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15"
              aria-label="Loop end"
            />
          </label>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-[var(--text-3)]">
          <span>{formatTime(currentSec)}</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying((current) => !current)}
            className="rounded-full bg-[var(--color-primary)] p-2.5 text-white shadow-[0_0_20px_rgba(50,17,212,0.45)] transition-transform hover:scale-105"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <div className="flex items-center gap-2 text-[var(--text-2)]">
            <Volume2 size={16} />
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-white/15"
              aria-label="Volume"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsLoopEnabled((current) => !current)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition-colors",
              isLoopEnabled
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary-soft)]"
                : "border-white/20 text-[var(--text-3)] hover:text-[var(--text-2)]",
            )}
            aria-pressed={isLoopEnabled}
          >
            <Repeat size={14} />
            Loop {isLoopEnabled ? "On" : "Off"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
            {speedOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSpeed(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  speed === option
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--text-3)] hover:bg-white/10 hover:text-[var(--text-1)]",
                )}
              >
                {option.toFixed(2).replace(".00", "").replace("0.", ".")}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMirrored((current) => !current)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
              isMirrored
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary-soft)]"
                : "border-white/20 text-[var(--text-3)] hover:text-[var(--text-2)]",
            )}
            aria-pressed={isMirrored}
          >
            <FlipHorizontal2 size={14} />
            Mirror
          </button>

          <button
            type="button"
            className="rounded-md border border-white/20 p-2 text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
            aria-label="Settings"
          >
            <Settings2 size={16} />
          </button>
          <button
            type="button"
            className="rounded-md border border-white/20 p-2 text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
            aria-label="Picture in picture"
          >
            <PictureInPicture2 size={16} />
          </button>
          <button
            type="button"
            className="rounded-md border border-white/20 p-2 text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
            aria-label="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
