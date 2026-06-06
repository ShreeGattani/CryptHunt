"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { creepypastaLevels, LevelMeta, PublicQuestion } from "../data/levels-public";

export interface GameState {
  username: string;
  email: string;
  score: number;
  currentLevel: number;
  currentQuestion: number;
  startTime: string;
  elapsedTime: number;
  completedAt: string | null;
  isLoggedIn: boolean;
  updatedAt?: string;
  levelCompletePending: boolean;
  createdAt?: string;
  isLocked: boolean;
}

interface GameContextType {
  state: GameState;
  login: (email: string, passwordString: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, passwordString: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  submitAnswer: (answer: string, hp?: string) => Promise<{ success: boolean; message: string; isLevelComplete: boolean }>;
  exitLevelToDashboard: (sentence?: string) => Promise<{ success: boolean; message: string }>;
  resetGame: () => Promise<void>;
  loadLevelQuestion: (levelId: number) => Promise<{ levelCompletePending: boolean }>;
  currentLevelData: LevelMeta | null;
  currentQuestionData: PublicQuestion | null;
  formatTime: (seconds: number) => string;
  formatDate: (dateStr: string) => string;
  isInitialized: boolean;
}

const defaultState: GameState = {
  username: "", email: "", score: 0, currentLevel: 1, currentQuestion: 1,
  startTime: "", elapsedTime: 0, completedAt: null, isLoggedIn: false,
  updatedAt: "", levelCompletePending: false,
  createdAt: undefined, isLocked: false,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

function mapUserToState(user: Record<string, unknown>): GameState {
  return {
    username: String(user.username ?? ""),
    email: String(user.email ?? ""),
    score: Number(user.score ?? 0),
    currentLevel: Number(user.currentLevel ?? 1),
    currentQuestion: Number(user.currentQuestion ?? 1),
    startTime: new Date().toISOString(),
    elapsedTime: Number(user.elapsedTime ?? 0),
    completedAt: user.completedAt ? String(user.completedAt) : null,
    isLoggedIn: true,
    updatedAt: user.updatedAt ? String(user.updatedAt) : "",
    levelCompletePending: Boolean(user.levelCompletePending),
    createdAt: user.createdAt ? String(user.createdAt) : undefined,
    isLocked: Boolean(user.isLocked ?? false),
  };
}

/**
 * Deterministically maps each character to a visually similar but meaningless
 * unicode symbol. Space and newline are preserved so layout is unchanged.
 * Used to scramble question text when headless-browser automation is detected.
 */
function obfuscateText(text: string): string {
  const glyphs = "▓░▒█▀▄■□▪▫●○◆◇★☆✦✧†‡×÷±∞≈≠≡∂∇∫∑∏";
  return text
    .split("")
    .map((c) =>
      c === " " || c === "\n" ? c : glyphs[c.charCodeAt(0) % glyphs.length]
    )
    .join("");
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(defaultState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState<PublicQuestion | null>(null);
  // Detects headless-browser automation (Playwright / Puppeteer / Selenium).
  // Initialized to false (SSR-safe); updated client-side in a useEffect.
  const [isBotSession, setIsBotSession] = useState(false);
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;
  const router = useRouter();
  const pathname = usePathname();

  const applyUser = useCallback((user: Record<string, unknown>) => {
    setState((prev) => ({ ...mapUserToState(user), startTime: prev.startTime || new Date().toISOString() }));
  }, []);

  // Restore session from HttpOnly cookie via server — no localStorage
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            applyUser(json.user);
            setIsInitialized(true);
          } else {
            setIsInitialized(true);
          }
        } else {
          // Cookie is invalid or user was deleted from DB. Clear cookie on browser.
          fetch("/api/auth/logout", { method: "POST", credentials: "include" })
            .catch(() => {})
            .finally(() => {
              setIsInitialized(true);
            });
        }
      })
      .catch(() => {
        setIsInitialized(true);
      });
  }, [applyUser]);

  // Detect headless-browser automation on the client side.
  // navigator.webdriver is set to true by Playwright, Puppeteer, and Selenium.
  // window.__b is set by the early-execution script in layout.tsx.
  // When detected, isBotSession is flipped to true and subsequent renders
  // will expose scrambled question text instead of the real content.
  useEffect(() => {
    try {
      const w = window as unknown as { __b?: number };
      if (w.__b || navigator.webdriver) {
        setIsBotSession(true);
      }
    } catch {
      // ignore — can only fail in SSR, which never reaches this useEffect
    }
  }, []);

  // Background sync: pull server state every 30s, push elapsedTime only.
  // Locked users skip the interval entirely — they cannot write game state
  // before the hunt starts, and the LockGuard UI already handles their flow.
  useEffect(() => {
    if (!state.isLoggedIn || !isInitialized) return;
    if (state.isLocked) return;

    const syncInterval = setInterval(async () => {
      try {
        const current = stateRef.current;
        if (!current.isLoggedIn || current.isLocked) return;

        const pull = await fetch("/api/auth/sync", { credentials: "include" });
        if (pull.status === 401) {
          fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
          setState(defaultState);
          setCurrentQuestionData(null);
          router.push("/");
          return;
        }
        const pullJson = await pull.json();
        if (pull.ok && pullJson.success && pullJson.user) applyUser(pullJson.user);

        if (!current.completedAt && current.currentLevel <= 5) {
          await fetch("/api/auth/sync", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ elapsedTime: current.elapsedTime }),
          });
        }
      } catch {
        // non-fatal
      }
    // 30 seconds: 250 users × 10s = 50 DB ops/sec saturates MongoDB free tier.
    // At 30s the same 250 users produce ~17 ops/sec — well within M0 limits.
    }, 30_000);

    return () => clearInterval(syncInterval);
  }, [state.isLoggedIn, isInitialized, applyUser, router]);

  // Server-side route guard (middleware also protects at edge)
  useEffect(() => {
    if (!isInitialized) return;
    if (!state.isLoggedIn && pathname !== "/" && !pathname.startsWith("/api")) {
      router.push("/");
    } else if (state.isLoggedIn && pathname === "/" && !state.isLocked) {
      router.push("/dashboard");
    }
  }, [isInitialized, state.isLoggedIn, state.isLocked, pathname, router]);

  const register = async (username: string, email: string, passwordString: string, otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password: passwordString, otp }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || "Registration handshake rejected." };
      applyUser(data.user);
      router.push("/dashboard");
      return { success: true, message: "Registration decrypted. Gateway unlocked." };
    } catch {
      return { success: false, message: "CONNECTION TIMED OUT. BOOT GRID ANOMALY." };
    }
  };

  const login = async (email: string, passwordString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: passwordString }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, message: data.message || "Decryption handshake rejected." };
      applyUser(data.user);
      router.push("/dashboard");
      return { success: true, message: "Decryption verified. Portal unlocked." };
    } catch {
      return { success: false, message: "CONNECTION TIMED OUT. CHECK SERVER PROTOCOLS." };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    setState(defaultState);
    setCurrentQuestionData(null);
    router.push("/");
  };

  const loadLevelQuestion = useCallback(async (levelId: number): Promise<{ levelCompletePending: boolean }> => {
    try {
      const res = await fetch(`/api/game/question?levelId=${levelId}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) { setCurrentQuestionData(null); return { levelCompletePending: false }; }
      if (json.levelCompletePending) {
        setCurrentQuestionData(null);
        if (json.user) applyUser(json.user);
        return { levelCompletePending: true };
      }
      if (json.question) setCurrentQuestionData(json.question);
      if (json.user) applyUser(json.user);
      return { levelCompletePending: false };
    } catch {
      setCurrentQuestionData(null);
      return { levelCompletePending: false };
    }
  }, [applyUser]);

  const submitAnswer = async (answer: string, hp?: string): Promise<{ success: boolean; message: string; isLevelComplete: boolean }> => {
    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // _cf is the honeypot field. Real users always send "", bots that
        // auto-fill forms send the value they typed into the hidden input.
        body: JSON.stringify({ answer, _cf: hp ?? "" }),
      });
      const json = await res.json();

      if (res.status === 429) {
        return { success: false, message: json.message || "Too many attempts. Try again later.", isLevelComplete: false };
      }

      if (json.user) applyUser(json.user);

      if (json.success && json.isLevelComplete) {
        return { success: true, message: json.message, isLevelComplete: true };
      }

      if (json.success) {
        const levelId = stateRef.current.currentLevel;
        await loadLevelQuestion(levelId);
        return { success: true, message: json.message, isLevelComplete: false };
      }

      return { success: false, message: json.message || "ACCESS DENIED. Decryption key incorrect.", isLevelComplete: false };
    } catch {
      return { success: false, message: "Connection error. Try again.", isLevelComplete: false };
    }
  };

  const exitLevelToDashboard = async (sentence?: string) => {
    try {
      const res = await fetch("/api/game/complete-level", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: sentence !== undefined ? JSON.stringify({ sentence }) : undefined
      });
      const json = await res.json();
      if (json.user) applyUser(json.user);
      if (!res.ok) {
        return { success: false, message: json.message || "Decryption failed." };
      }
    } catch {
      return { success: false, message: "Connection error." };
    }
    setCurrentQuestionData(null);
    router.push("/dashboard");
    return { success: true, message: "Decrypted." };
  };

  const resetGame = async () => { await logout(); };

  const currentLevelData = creepypastaLevels.find((l) => l.id === state.currentLevel) || null;

  // When a bot session is detected, replace displayed question text with
  // deterministic unicode glyphs. The internal state is untouched; only
  // what the component tree receives is scrambled.
  const exposedQuestionData: PublicQuestion | null =
    isBotSession && currentQuestionData
      ? {
          ...currentQuestionData,
          text: obfuscateText(currentQuestionData.text),
          hint: currentQuestionData.hint ? obfuscateText(currentQuestionData.hint) : currentQuestionData.hint,
        }
      : currentQuestionData;

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs].map((v) => v.toString().padStart(2, "0")).join(":");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      let h = d.getHours();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${d.getDate()} ${months[d.getMonth()]}, ${h.toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")} ${ampm}`;
    } catch { return dateStr; }
  };

  return (
    <GameContext.Provider value={{ state, login, register, logout, submitAnswer, exitLevelToDashboard, resetGame, loadLevelQuestion, currentLevelData, currentQuestionData: exposedQuestionData, formatTime, formatDate, isInitialized }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
