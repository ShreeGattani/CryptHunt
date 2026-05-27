"use client";

import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { creepypastaLevels } from "../data/questions";
import Link from "next/link";
import {
  Trophy,
  BookOpen,
  Timer,
  Lock,
  Skull,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  LogOut
} from "lucide-react";

export default function DashboardPage() {
  const { state, logout, resetGame, formatTime, formatDate } = useGame();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // If not logged in, state effect in Context redirects, show null fallback
  if (!state.isLoggedIn) return null;

  const isGameComplete = state.currentLevel > 5;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-mono relative pb-12">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

      {/* Cyber Navbar */}
      <nav className="w-full bg-zinc-900/60 border-b border-red-950/40 sticky top-0 z-30 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skull className="w-6 h-6 text-red-500 animate-pulse" />
          <Link href="/dashboard" className="text-xl font-bold font-orbitron text-red-500 tracking-wider hover:text-red-400 transition-colors">
            CRYPTHUNT
          </Link>
        </div>

        {/* User Identity HUD */}
        <div className="hidden md:flex items-center space-x-6 text-xs border border-zinc-800 bg-black/40 px-4 py-1.5 rounded">
          <div>
            <span className="text-zinc-500 font-share-tech uppercase mr-1">AGENT:</span>
            <span className="text-red-400 font-bold">{state.username.toUpperCase()}</span>
          </div>
          <div className="w-px h-3 bg-zinc-800"></div>
          <div>
            <span className="text-zinc-500 font-share-tech uppercase mr-1">SCORE:</span>
            <span className="text-emerald-400 font-bold">{state.score} PTS</span>
          </div>
          <div className="w-px h-3 bg-zinc-800"></div>
          <div>
            <span className="text-zinc-500 font-share-tech uppercase mr-1">LEVEL:</span>
            <span className="text-cyan-400 font-bold">{isGameComplete ? "5/5" : `${state.currentLevel - 1}/5`}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-share-tech text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RULE BOOK</span>
          </button>

          <Link
            href="/leaderboard"
            className="flex items-center space-x-1 px-3 py-1.5 rounded border border-red-950 bg-red-950/20 text-red-500 hover:text-red-400 hover:border-red-600 text-xs font-share-tech transition-all"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>LEADERBOARD</span>
          </Link>

          <button
            onClick={logout}
            title="Disconnect Active Session (Logout)"
            className="p-1.5 rounded border border-red-950 bg-red-950/10 hover:border-red-600 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 flex flex-col">
        {/* HUD Warning bar */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between p-4 bg-red-950/10 border border-red-950/50 rounded gap-4">
          <div className="flex items-center space-x-3 text-xs text-red-400 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
            <span>[SESSION LOGGED] Acknowledge: Internet legends materialize in this domain. Complete each decryption in sequential order.</span>
          </div>

          {/* Hunt Active Status HUD */}
          <div className="flex items-center space-x-3 bg-black/80 px-4 py-1.5 rounded border border-zinc-800 font-orbitron text-xs">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span className="text-zinc-500 font-share-tech">HUNT TIMELINE:</span>
            <span className="text-red-500 tracking-wider font-bold">6 JUN 12:00 PM - 7 JUN 06:00 PM</span>
          </div>
        </div>

        {/* Completion Panel if finished */}
        {isGameComplete && (
          <div className="mb-12 p-8 border-2 border-emerald-500/30 bg-emerald-950/10 rounded-md relative overflow-hidden pulse-cyan-glow">
            <div className="absolute top-2 right-2 text-emerald-500 opacity-20">
              <Sparkles className="w-32 h-32" />
            </div>
            <h2 className="text-2xl font-extrabold text-emerald-400 font-orbitron uppercase tracking-wider mb-2">
              Labyrinth Securing Complete
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl mb-6">
              Incredible. You faced Slender Man, Eyeless Jack, Ben Drowned, the Puppeteer, and Candle Cove. The digital matrix stands decrypted. Your soul remains intact.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mb-6">
              <div className="bg-black/60 p-4 border border-emerald-500/20 rounded">
                <span className="text-[10px] text-zinc-500 block uppercase">Final High Score</span>
                <span className="text-xl font-bold text-emerald-400 font-orbitron">{state.score} PTS</span>
              </div>
              <div className="bg-black/60 p-4 border border-emerald-500/20 rounded">
                <span className="text-[10px] text-zinc-500 block uppercase">Last Solve Time</span>
                <span className="text-[11px] font-bold text-cyan-400 font-orbitron">{state.updatedAt ? formatDate(state.updatedAt) : "N/A"}</span>
              </div>
              <div className="bg-black/60 p-4 border border-emerald-500/20 rounded">
                <span className="text-[10px] text-zinc-500 block uppercase">Rank Status</span>
                <span className="text-xl font-bold text-white font-orbitron">ELITE HACKER</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/leaderboard"
                className="bg-emerald-500 text-black px-6 py-2 rounded text-xs font-bold font-orbitron uppercase tracking-widest hover:bg-emerald-400 transition-colors"
              >
                Inspect Leaderboard
              </Link>
              <button
                onClick={resetGame}
                className="border border-zinc-800 hover:border-red-600 text-zinc-500 hover:text-red-400 px-6 py-2 rounded text-xs font-bold font-orbitron uppercase tracking-widest transition-all cursor-pointer"
              >
                Wipe Labyrinth Logs
              </button>
            </div>
          </div>
        )}

        {/* Level Progression Grid */}
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 font-orbitron flex items-center space-x-2">
          <span>COGNITIVE DIRECTORY MATRIX</span>
          <span className="h-px bg-zinc-800 flex-1"></span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creepypastaLevels.map((level) => {
            const isCompleted = state.currentLevel > level.id;
            const isActive = state.currentLevel === level.id;
            const isLocked = state.currentLevel < level.id;

            return (
              <div
                key={level.id}
                className={`border rounded-lg p-6 bg-zinc-900/40 relative overflow-hidden transition-all duration-500 flex flex-col h-[320px] justify-between ${
                  isActive
                    ? `border-red-500/50 scale-[1.02] shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-red-950/5`
                    : isCompleted
                    ? "border-emerald-500/20 bg-emerald-950/5"
                    : "border-zinc-900 opacity-60 pointer-events-none"
                }`}
              >
                {/* Entity Identity header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-share-tech px-2 py-0.5 rounded bg-black/60 text-zinc-400 border border-zinc-800">
                      LEVEL 0{level.id}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center text-[10px] text-emerald-400 font-bold space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>DECRYPTED</span>
                      </span>
                    ) : isActive ? (
                      <span className="flex items-center text-[10px] text-red-500 font-bold space-x-1 animate-pulse font-orbitron">
                        <Skull className="w-3.5 h-3.5" />
                        <span>ACTIVE ENCOUNTER</span>
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] text-zinc-600 font-bold space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>SECURE PORT</span>
                      </span>
                    )}
                  </div>

                  <h3 className={`text-xl font-black font-orbitron tracking-wide mb-1 ${isActive ? "text-red-500" : isCompleted ? "text-emerald-500" : "text-zinc-500"}`}>
                    {level.name.toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-share-tech mb-4">
                    {level.theme}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed line-clamp-4">
                    {level.description}
                  </p>
                </div>

                {/* Encrypt CTA Footer */}
                <div className="border-t border-zinc-800/60 pt-4 mt-4 flex items-center justify-between">
                  <div className="text-[10px] text-zinc-500 font-share-tech">
                    <span>SECURITY: </span>
                    <span className={isActive ? "text-red-500 font-bold" : isCompleted ? "text-emerald-500 font-bold" : "text-zinc-600"}>
                      {isCompleted ? "6 / 6 SECURED" : isActive ? `${state.currentQuestion - 1} / 6 SECURED` : "LOCKED"}
                    </span>
                  </div>

                  {isActive ? (
                    <Link
                      href={`/level/${level.id}`}
                      className="flex items-center space-x-1 px-4 py-2 rounded bg-red-600 text-black hover:bg-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)] text-[11px] font-bold font-orbitron uppercase tracking-wider transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{state.currentQuestion > 1 ? "RESUME" : "ENTER LEVEL"}</span>
                    </Link>
                  ) : isCompleted ? (
                    <span className="text-[10px] text-emerald-500 font-bold font-orbitron uppercase tracking-widest px-3 py-1.5 border border-emerald-500/20 bg-emerald-500/5 rounded">
                      SOLVED
                    </span>
                  ) : (
                    <div className="text-zinc-700 p-2 border border-zinc-900 rounded bg-zinc-950/20">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Spooky Rule Book Modal Overlay */}
      {isRulesOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border-2 border-red-900 rounded shadow-2xl overflow-hidden pulse-red-glow font-mono">
            {/* Header */}
            <div className="flex items-center justify-between bg-zinc-950 px-4 py-3 border-b border-red-900">
              <span className="text-xs font-bold text-red-500 tracking-widest font-orbitron flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-red-500" />
                <span>LABYRINTH PROTOCOLS // RULE BOOK</span>
              </span>
              <button
                onClick={() => setIsRulesOpen(false)}
                className="text-zinc-500 hover:text-red-500 transition-colors text-lg font-bold font-orbitron cursor-pointer"
              >
                [X]
              </button>
            </div>

            {/* Rules Text Content */}
            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto text-sm text-zinc-300 leading-relaxed border-b border-zinc-800">
              <div className="space-y-2 border-l-2 border-red-600 pl-4 bg-red-950/5 p-3 rounded">
                <h4 className="text-red-500 font-orbitron font-bold text-xs uppercase tracking-widest">
                  1. Cognitive Decryption Rules
                </h4>
                <p className="text-xs text-zinc-400">
                  Each entity hosts 6 progressive locks. Entering the correct decryption key unlocks the subsequent gate immediately.
                </p>
              </div>

              <div className="space-y-2 border-l-2 border-cyan-600 pl-4 bg-cyan-950/5 p-3 rounded">
                <h4 className="text-cyan-400 font-orbitron font-bold text-xs uppercase tracking-widest">
                  2. Level Exit Safeguards
                </h4>
                <p className="text-xs text-zinc-400">
                  Once a level's 6th key is registered, your consciousness is ejected back to this Directory. The next folklore port will unlock.
                </p>
              </div>

              <div className="space-y-2 border-l-2 border-yellow-600 pl-4 bg-yellow-950/5 p-3 rounded">
                <h4 className="text-yellow-500 font-orbitron font-bold text-xs uppercase tracking-widest">
                  3. Session Run Timer
                </h4>
                <p className="text-xs text-zinc-400">
                  A persistent cyber clock clocks your intrusion duration. Fastest decryption tallies secure top priority in the global rankings matrix.
                </p>
              </div>

              <div className="space-y-2 border-l-2 border-zinc-600 pl-4 bg-zinc-950/5 p-3 rounded">
                <h4 className="text-zinc-500 font-orbitron font-bold text-xs uppercase tracking-widest">
                  4. Decryption Integrity
                </h4>
                <p className="text-xs text-zinc-400">
                  Case insensitivity applies to all submissions. Clean inputs, remove extra whitespace. Use hints if anomalous blocks stall your decryption process.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 bg-zinc-950 flex justify-end">
              <button
                onClick={() => setIsRulesOpen(false)}
                className="bg-red-950/20 border border-red-600 text-red-500 hover:bg-red-900/40 hover:text-red-400 px-6 py-2 rounded text-xs font-bold font-orbitron tracking-widest cursor-pointer transition-all"
              >
                I SURRENDER TO THE TERMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
