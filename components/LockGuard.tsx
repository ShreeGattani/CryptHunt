"use client";

import React, { useEffect, useState } from "react";
import { useGame } from "../app/context/GameContext";
import { Lock, LogOut, ShieldAlert, Timer } from "lucide-react";

export default function LockGuard({ children }: { children: React.ReactNode }) {
  const { state, logout } = useGame();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!state.isLoggedIn || !state.isLocked) return;

    const lockEndTime = new Date("2026-06-08T01:00:00+05:30");

    const updateTimer = () => {
      const now = new Date();
      const diff = lockEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00:00");
        // Force reload to update lock status once the hunt starts
        window.location.reload();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days.toString().padStart(2, "0")}d : ${hours
          .toString()
          .padStart(2, "0")}h : ${minutes
          .toString()
          .padStart(2, "0")}m : ${seconds.toString().padStart(2, "0")}s`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state.isLoggedIn, state.isLocked]);

  if (state.isLoggedIn && state.isLocked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden font-mono text-zinc-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,0,0,0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />
        
        <div className="max-w-md w-full border border-red-900/30 bg-black/60 backdrop-blur-md p-8 rounded-lg shadow-2xl relative z-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-red-950/40 border border-red-500/20 text-red-500 animate-pulse">
              <Lock size={48} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-widest text-red-500 uppercase font-sans animate-glitch">
              WEBSITE UNDER CONSTRUCTION
            </h2>
            <div className="text-xs text-zinc-500 tracking-wider">
              AGENT INTERFACE TEMP-LOCKED FOR UPDATES
            </div>
          </div>

          <div className="border-t border-b border-zinc-900 py-5 space-y-3">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2">
              <Timer size={14} className="text-red-500/70" />
              PORTAL RE-OPENS IN:
            </div>
            <div className="text-2xl font-bold font-sans text-zinc-100 tracking-widest animate-pulse">
              {timeLeft || "CALCULATING..."}
            </div>
            <div className="text-[10px] text-zinc-600 uppercase">
              COMPLETION TARGET: JUNE 8, 2026 @ 1:00 AM IST
            </div>
          </div>

          <div className="p-4 border border-red-950/30 bg-red-950/10 rounded text-left text-xs space-y-2 text-red-200/80">
            <div className="font-bold flex items-center gap-1 text-red-400">
              <ShieldAlert size={14} />
              SYSTEM MAINTENANCE INFO:
            </div>
            <p>
              The digital labyrinth is currently undergoing essential construction. Please relax. Access to all nodes will resume once the transmission updates are fully integrated.
            </p>
            <p className="text-[10px] text-zinc-500">
              Registered Alias: {state.username.toUpperCase()}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 rounded transition-all duration-300 text-xs tracking-widest uppercase font-bold cursor-pointer"
          >
            <LogOut size={14} />
            LOGOUT / REGISTER TEST USER
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
