"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { creepypastaLevels, LevelData, Question } from "../data/questions";

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
  sessionToken: string;
  updatedAt?: string;
}

interface RegisterUserPayload {
  username: string;
  email: string;
  passwordString: string;
  score: number;
  currentLevel: number;
  currentQuestion: number;
  elapsedTime: number;
  completedAt: string | null;
  sessionToken: string;
  updatedAt?: string;
}

interface GameContextType {
  state: GameState;
  login: (email: string, passwordString: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, passwordString: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  submitAnswer: (answer: string) => { success: boolean; message: string; isLevelComplete: boolean };
  exitLevelToDashboard: () => void;
  resetGame: () => void;
  currentLevelData: LevelData | null;
  currentQuestionData: Question | null;
  formatTime: (seconds: number) => string;
  formatDate: (dateStr: string) => string;
}

const defaultState: GameState = {
  username: "",
  email: "",
  score: 0,
  currentLevel: 1,
  currentQuestion: 1,
  startTime: "",
  elapsedTime: 0,
  completedAt: null,
  isLoggedIn: false,
  sessionToken: "",
  updatedAt: "",
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window === "undefined") return defaultState;

    const saved = window.localStorage.getItem("crypthunt_session");
    if (!saved) return defaultState;

    try {
      return JSON.parse(saved) as GameState;
    } catch (error) {
      console.error("Failed to parse game session", error);
      return defaultState;
    }
  });
  const [isInitialized] = useState(true);
  const stateRef = useRef<GameState>(state);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync active session to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    if (state.isLoggedIn) {
      localStorage.setItem("crypthunt_session", JSON.stringify(state));
    } else {
      localStorage.removeItem("crypthunt_session");
    }
  }, [state, isInitialized]);

  // Real-time multi-browser/multi-session score & progress synchronization
  useEffect(() => {
    if (!state.isLoggedIn || !isInitialized) return;

    const syncInterval = setInterval(async () => {
      try {
        const currentState = stateRef.current;
        if (!currentState.isLoggedIn) return;

        const response = await fetch(`/api/auth/sync?email=${encodeURIComponent(currentState.email)}&sessionToken=${encodeURIComponent(currentState.sessionToken)}`);
        const json = await response.json();
        
        if (response.ok && json.success && json.databaseStatus === "CONNECTED") {
          // If session is terminated due to single-login override, kick user out!
          if (json.sessionActive === false) {
            clearInterval(syncInterval);
            setState(defaultState);
            localStorage.removeItem("crypthunt_session");
            alert("🚨 SESSION TERMINATED: This account has been logged in from another device/browser. Only one active login is permitted.");
            router.push("/");
            return;
          }

          if (json.data) {
            const db = json.data;
            
            // Check if database progress is further along or different than local state
            const hasFurtherProgress = 
              db.currentLevel > currentState.currentLevel ||
              (db.currentLevel === currentState.currentLevel && db.currentQuestion > currentState.currentQuestion) ||
              db.score > currentState.score ||
              db.completedAt !== currentState.completedAt ||
              (db.updatedAt && db.updatedAt !== currentState.updatedAt);

            if (hasFurtherProgress) {
              setState((prev) => ({
                ...prev,
                score: Math.max(prev.score, db.score),
                currentLevel: Math.max(prev.currentLevel, db.currentLevel),
                currentQuestion: db.currentLevel > prev.currentLevel 
                  ? db.currentQuestion 
                  : (db.currentLevel === prev.currentLevel ? Math.max(prev.currentQuestion, db.currentQuestion) : prev.currentQuestion),
                elapsedTime: db.elapsedTime,
                completedAt: db.completedAt || prev.completedAt,
                updatedAt: db.updatedAt || prev.updatedAt,
              }));
            }
          }
        }

        // Push local progress to database to keep all browser sessions perfectly aligned
        if (currentState.isLoggedIn && !currentState.completedAt) {
          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: currentState.email, 
              elapsedTime: currentState.elapsedTime, 
              score: currentState.score,
              currentLevel: currentState.currentLevel,
              currentQuestion: currentState.currentQuestion,
              sessionToken: currentState.sessionToken 
            }),
          });
          const postJson = await res.json();
          if (res.ok && postJson.success && postJson.sessionActive === false) {
            clearInterval(syncInterval);
            setState(defaultState);
            localStorage.removeItem("crypthunt_session");
            alert("🚨 SESSION TERMINATED: This account has been logged in from another device/browser. Only one active login is permitted.");
            router.push("/");
            return;
          }
        }
      } catch (e) {
        console.warn("Background session sync skipped due to connection speed", e);
      }
    }, 10000); // Poll and push every 10 seconds for real-time multi-browser response!

    return () => clearInterval(syncInterval);
  }, [state.isLoggedIn, isInitialized, router]);

  // Security gate redirects
  useEffect(() => {
    if (!isInitialized) return; // Wait until session recovery check is done!

    if (!state.isLoggedIn && pathname !== "/" && !pathname.startsWith("/api")) {
      router.push("/");
    } else if (state.isLoggedIn && pathname === "/") {
      router.push("/dashboard");
    }
  }, [isInitialized, state.isLoggedIn, pathname, router]);

  // Custom Registration Logic with Offline local registry fallback
  const register = async (username: string, email: string, passwordString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password: passwordString }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || "Registration handshake rejected." };
      }

      if (data.databaseStatus === "OFFLINE_FALLBACK") {
        // Enforce registration gates locally against localStorage array
        const localUsers: RegisterUserPayload[] = JSON.parse(localStorage.getItem("crypthunt_local_users") || "[]");
        
        const duplicateEmail = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (duplicateEmail) {
          return { success: false, message: "EMAIL ALREADY REGISTERED MATRIX INDUCTION." };
        }

        const duplicateName = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (duplicateName) {
          return { success: false, message: "HACKER ALIAS IN USE BY ANOTHER AGENT." };
        }

        // Add newly registered user details to local repository
        localUsers.push({
          username,
          email,
          passwordString,
          score: 0,
          currentLevel: 1,
          currentQuestion: 1,
          elapsedTime: 0,
          completedAt: null,
          sessionToken: "local_mock_token"
        });

        localStorage.setItem("crypthunt_local_users", JSON.stringify(localUsers));
      }

      // Log the registered user in immediately
      const newState: GameState = {
        username,
        email,
        score: 0,
        currentLevel: 1,
        currentQuestion: 1,
        startTime: new Date().toISOString(),
        elapsedTime: 0,
        completedAt: null,
        isLoggedIn: true,
        sessionToken: data.user?.sessionToken || "local_mock_token",
      };
      
      setState(newState);
      router.push("/dashboard");
      return { success: true, message: "Registration decrypted. Gateway unlocked." };
    } catch (err: unknown) {
      console.error("Registry fetch error, defaulting locally", err);
      return { success: false, message: "CONNECTION TIMED OUT. BOOT GRID ANOMALY." };
    }
  };

  // Custom Authentication Login Logic with Offline local registry lookup
  const login = async (email: string, passwordString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: passwordString }),
      });

      const data = await response.json();

      if (!response.ok && data.databaseStatus !== "OFFLINE_FALLBACK") {
        return { success: false, message: data.message || "Decryption handshake rejected." };
      }

      if (data.databaseStatus === "OFFLINE_FALLBACK") {
        // Authenticate offline using local users array in localStorage
        const localUsers: RegisterUserPayload[] = JSON.parse(localStorage.getItem("crypthunt_local_users") || "[]");
        const foundUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!foundUser || foundUser.passwordString !== passwordString) {
          return { success: false, message: "DECRYPTION DENIED. INVALID EMAIL OR PASSWORD KEY." };
        }

        // Restore user progress and score state offline
        const newState: GameState = {
          username: foundUser.username,
          email: foundUser.email,
          score: foundUser.score,
          currentLevel: foundUser.currentLevel,
          currentQuestion: foundUser.currentQuestion,
          startTime: new Date().toISOString(),
          elapsedTime: foundUser.elapsedTime,
          completedAt: foundUser.completedAt,
          isLoggedIn: true,
          sessionToken: foundUser.sessionToken || "local_mock_token",
        };

        setState(newState);
        router.push("/dashboard");
        return { success: true, message: "Handshake verified offline. Session restored." };
      }

      // Live database verified login response
      const newState: GameState = {
        username: data.user.username,
        email: data.user.email,
        score: data.user.score,
        currentLevel: data.user.currentLevel,
        currentQuestion: data.user.currentQuestion,
        startTime: new Date().toISOString(),
        elapsedTime: data.user.elapsedTime,
        completedAt: data.user.completedAt,
        isLoggedIn: true,
        sessionToken: data.user.sessionToken || "local_mock_token",
      };

      setState(newState);
      router.push("/dashboard");
      return { success: true, message: "Decryption verified. Portal unlocked." };
    } catch (err: unknown) {
      console.error("Login fetch error", err);
      return { success: false, message: "CONNECTION TIMED OUT. CHECK SERVER PROTOCOLS." };
    }
  };

  const logout = () => {
    // Clear current active session (so they are logged out)
    setState(defaultState);
    localStorage.removeItem("crypthunt_session");
    router.push("/");
  };

  const currentLevelData = creepypastaLevels.find((l) => l.id === state.currentLevel) || null;
  const currentQuestionData = currentLevelData?.questions[state.currentQuestion - 1] || null;

  const submitAnswer = (answer: string) => {
    if (!currentLevelData || !currentQuestionData) {
      return { success: false, message: "No active level/question", isLevelComplete: false };
    }

    const cleanInput = answer.trim().toLowerCase();
    const cleanAnswer = currentQuestionData.answer.trim().toLowerCase();

    if (cleanInput === cleanAnswer) {
      const addedPoints = currentQuestionData.points;
      const isLastQuestion = state.currentQuestion === 6;

      if (isLastQuestion) {
        return {
          success: true,
          message: `ACCESS GRANTED! +${addedPoints} pts. Level fully decrypted!`,
          isLevelComplete: true,
        };
      } else {
        setState((prev) => {
          const nextScore = prev.score + addedPoints;
          const nextQuestion = prev.currentQuestion + 1;
          const nowStr = new Date().toISOString();

          // Instant cloud synchronization of progress
          fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: prev.email,
              elapsedTime: prev.elapsedTime,
              score: nextScore,
              currentLevel: prev.currentLevel,
              currentQuestion: nextQuestion,
              sessionToken: prev.sessionToken
            })
          }).catch(err => console.warn("Instant answer sync skipped", err));

          // Persist progress offline in background
          if (localStorage.getItem("crypthunt_local_users")) {
            try {
              const localUsers: RegisterUserPayload[] = JSON.parse(localStorage.getItem("crypthunt_local_users") || "[]");
              const userIdx = localUsers.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
              if (userIdx > -1) {
                localUsers[userIdx] = {
                  ...localUsers[userIdx],
                  score: nextScore,
                  currentLevel: prev.currentLevel,
                  currentQuestion: nextQuestion,
                  completedAt: prev.completedAt,
                  updatedAt: nowStr
                };
                localStorage.setItem("crypthunt_local_users", JSON.stringify(localUsers));
              }
            } catch (e) {
              console.error("Failed offline progress sync", e);
            }
          }

          return {
            ...prev,
            score: nextScore,
            currentQuestion: nextQuestion,
            updatedAt: nowStr,
          };
        });
        return {
          success: true,
          message: `ACCESS GRANTED! +${addedPoints} pts. Moving to next lock...`,
          isLevelComplete: false,
        };
      }
    } else {
      return {
        success: false,
        message: "ACCESS DENIED. Decryption key incorrect.",
        isLevelComplete: false,
      };
    }
  };

  const exitLevelToDashboard = () => {
    setState((prev) => {
      const isLastQuestion = prev.currentQuestion === 6;
      if (isLastQuestion) {
        const nextLevel = prev.currentLevel + 1;
        const allDone = nextLevel > 5;
        const finalPoints = currentQuestionData ? currentQuestionData.points : 0;
        const nextScore = prev.score + finalPoints;
        const nowStr = new Date().toISOString();

        // Post completion to MySQL / Mock API routes in background
        fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: prev.username,
            email: prev.email,
            score: nextScore,
            completedLevel: prev.currentLevel,
            elapsedTime: prev.elapsedTime,
          }),
        }).catch(err => console.error("Database score sync failed, synced locally:", err));

        // Persist progress offline in background
        if (localStorage.getItem("crypthunt_local_users")) {
          try {
            const localUsers: RegisterUserPayload[] = JSON.parse(localStorage.getItem("crypthunt_local_users") || "[]");
            const userIdx = localUsers.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
            if (userIdx > -1) {
              localUsers[userIdx] = {
                ...localUsers[userIdx],
                score: nextScore,
                currentLevel: nextLevel,
                currentQuestion: 1,
                completedAt: allDone ? nowStr : null,
                updatedAt: nowStr
              };
              localStorage.setItem("crypthunt_local_users", JSON.stringify(localUsers));
            }
          } catch (e) {
            console.error("Failed offline progress sync", e);
          }
        }

        return {
          ...prev,
          score: nextScore,
          currentLevel: nextLevel,
          currentQuestion: 1,
          completedAt: allDone ? nowStr : null,
          updatedAt: nowStr,
        };
      }
      return prev;
    });

    router.push("/dashboard");
  };

  const resetGame = () => {
    setState(defaultState);
    localStorage.removeItem("crypthunt_session");
    // Also reset their local users database so they can start completely clean
    localStorage.removeItem("crypthunt_local_users");
    router.push("/");
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const seconds = d.getSeconds().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return `${day} ${month}, ${hours.toString().padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <GameContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        submitAnswer,
        exitLevelToDashboard,
        resetGame,
        currentLevelData,
        currentQuestionData,
        formatTime,
        formatDate,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
