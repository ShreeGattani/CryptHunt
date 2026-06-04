"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

const AMBIENT_SRC = "/audio/ambient-horror.mp3";
const INTENSE_SRC = "/audio/psychological-horror.mp3";

// Final level path that triggers the intense track
const INTENSE_PATHS = ["/level/candlecove"];

const AMBIENT_TARGET_VOL = 0.10;
const INTENSE_TARGET_VOL = 0.15;
const FADE_DURATION_MS = 2500;

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioCtx = createContext<AudioContextType>({ isMuted: false, toggleMute: () => {} });

export function useMusicPlayer() {
  return useContext(AudioCtx);
}

function rampVolume(audio: HTMLAudioElement, target: number, durationMs: number) {
  const steps = 60;
  const stepMs = durationMs / steps;
  const start = audio.volume;
  const delta = (target - start) / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    audio.volume = Math.max(0, Math.min(1, start + delta * step));
    if (step >= steps) clearInterval(id);
  }, stepMs);
  return id;
}

function fadeOut(
  audio: HTMLAudioElement,
  durationMs: number,
  onDone?: () => void
) {
  const steps = 40;
  const stepMs = durationMs / steps;
  const start = audio.volume;
  const delta = start / steps;
  let step = 0;
  const id = setInterval(() => {
    step++;
    audio.volume = Math.max(0, start - delta * step);
    if (step >= steps) {
      clearInterval(id);
      audio.pause();
      audio.currentTime = 0;
      onDone?.();
    }
  }, stepMs);
  return id;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const intenseRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("crypthunt_muted") === "1";
  });

  // Create audio elements once on mount
  useEffect(() => {
    const ambient = new Audio(AMBIENT_SRC);
    ambient.loop = true;
    ambient.volume = 0;
    ambientRef.current = ambient;

    const intense = new Audio(INTENSE_SRC);
    intense.loop = true;
    intense.volume = 0;
    intenseRef.current = intense;

    return () => {
      ambient.pause();
      intense.pause();
    };
  }, []);

  // Start audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const startAudio = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      document.removeEventListener("click", startAudio);
      document.removeEventListener("keydown", startAudio);

      if (isMuted) return;

      const isIntense = INTENSE_PATHS.some((p) => pathname.startsWith(p));
      const track = isIntense ? intenseRef.current : ambientRef.current;
      const targetVol = isIntense ? INTENSE_TARGET_VOL : AMBIENT_TARGET_VOL;

      if (track) {
        track.volume = 0;
        track.play().catch(() => {});
        rampVolume(track, targetVol, FADE_DURATION_MS);
      }
    };

    document.addEventListener("click", startAudio);
    document.addEventListener("keydown", startAudio);
    return () => {
      document.removeEventListener("click", startAudio);
      document.removeEventListener("keydown", startAudio);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tracks when pathname changes
  useEffect(() => {
    if (!startedRef.current || isMuted) return;

    const ambient = ambientRef.current;
    const intense = intenseRef.current;
    if (!ambient || !intense) return;

    const goIntense = INTENSE_PATHS.some((p) => pathname.startsWith(p));

    if (goIntense && intense.paused) {
      // Fade out ambient, fade in intense
      if (!ambient.paused) {
        fadeOut(ambient, 800);
      }
      intense.volume = 0;
      intense.play().catch(() => {});
      rampVolume(intense, INTENSE_TARGET_VOL, FADE_DURATION_MS);
    } else if (!goIntense && ambient.paused) {
      // Fade out intense, fade in ambient
      if (!intense.paused) {
        fadeOut(intense, 800);
      }
      ambient.volume = 0;
      ambient.play().catch(() => {});
      rampVolume(ambient, AMBIENT_TARGET_VOL, FADE_DURATION_MS);
    }
  }, [pathname, isMuted]);

  // Mute / unmute
  useEffect(() => {
    const ambient = ambientRef.current;
    const intense = intenseRef.current;
    if (!ambient || !intense) return;

    if (isMuted) {
      if (!ambient.paused) fadeOut(ambient, 400);
      if (!intense.paused) fadeOut(intense, 400);
    } else {
      // Unmuting — restart whichever track belongs to current route
      const goIntense = INTENSE_PATHS.some((p) => pathname.startsWith(p));
      const track = goIntense ? intense : ambient;
      const vol = goIntense ? INTENSE_TARGET_VOL : AMBIENT_TARGET_VOL;
      if (track.paused) {
        track.volume = 0;
        track.play().catch(() => {});
        rampVolume(track, vol, FADE_DURATION_MS);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("crypthunt_muted", next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <AudioCtx.Provider value={{ isMuted, toggleMute }}>
      {children}
    </AudioCtx.Provider>
  );
}
