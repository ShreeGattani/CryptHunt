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
}

interface GameContextType {
  state: GameState;
  login: (email: string, passwordString: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, passwordString: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<{ success: boolean; message: string; isLevelComplete: boolean }>;
  exitLevelToDashboard: () => Promise<void>;
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
  };
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(defaultState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState<PublicQuestion | null>(null);
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
          if (json.success && json.user) applyUser(json.user);
        }
      })
      .catch(() => {})
      .finally(() => setIsInitialized(true));
  }, [applyUser]);

  // Background sync: pull server state every 10s, push elapsedTime only
  useEffect(() => {
    if (!state.isLoggedIn || !isInitialized) return;

    const syncInterval = setInterval(async () => {
      try {
        const current = stateRef.current;
        if (!current.isLoggedIn) return;

        const pull = await fetch("/api/auth/sync", { credentials: "include" });
        if (pull.status === 401) {
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
    }, 10_000);

    return () => clearInterval(syncInterval);
  }, [state.isLoggedIn, isInitialized, applyUser, router]);

  // Server-side route guard (middleware also protects at edge)
  useEffect(() => {
    if (!isInitialized) return;
    if (!state.isLoggedIn && pathname !== "/" && !pathname.startsWith("/api")) {
      router.push("/");
    } else if (state.isLoggedIn && pathname === "/") {
      router.push("/dashboard");
    }
  }, [isInitialized, state.isLoggedIn, pathname, router]);

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

  const loadLevelQuestion = async (levelId: number): Promise<{ levelCompletePending: boolean }> => {
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
  };

  const submitAnswer = async (answer: string): Promise<{ success: boolean; message: string; isLevelComplete: boolean }> => {
    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
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

  const exitLevelToDashboard = async () => {
    try {
      const res = await fetch("/api/game/complete-level", { method: "POST", credentials: "include" });
      const json = await res.json();
      if (json.user) applyUser(json.user);
    } catch {
      // continue to dashboard regardless
    }
    setCurrentQuestionData(null);
    router.push("/dashboard");
  };

  const resetGame = async () => { await logout(); };

  const currentLevelData = creepypastaLevels.find((l) => l.id === state.currentLevel) || null;

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
    <GameContext.Provider value={{ state, login, register, logout, submitAnswer, exitLevelToDashboard, resetGame, loadLevelQuestion, currentLevelData, currentQuestionData, formatTime, formatDate, isInitialized }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
