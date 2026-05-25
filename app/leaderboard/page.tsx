"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import Link from "next/link";
import { ChevronLeft, Trophy, Skull, Timer, Award } from "lucide-react";

interface LeaderboardEntry {
  username: string;
  email: string;
  score: number;
  completedLevels: number;
  elapsedTime: number;
  isCurrentUser?: boolean;
}

const mockHackers: LeaderboardEntry[] = [
  {
    username: "BEN_WAS_HERE",
    email: "elegy@haunted.n64",
    score: 2900,
    completedLevels: 5,
    elapsedTime: 620, // ~10m 20s
  },
  {
    username: "SKIN_TAKER_X",
    email: "laughingstock@candle.cove",
    score: 2100,
    completedLevels: 4,
    elapsedTime: 940,
  },
  {
    username: "SLENDER_STALKER",
    email: "forest_pages@woods.net",
    score: 1100,
    completedLevels: 3,
    elapsedTime: 540,
  },
  {
    username: "MARIONETTE_9",
    email: "jonathan_strings@theatre.org",
    score: 680,
    completedLevels: 2,
    elapsedTime: 380,
  },
  {
    username: "WW1_SOLDIER",
    email: "eyeless_scalpel@operating.net",
    score: 280,
    completedLevels: 1,
    elapsedTime: 120,
  }
];

export default function LeaderboardPage() {
  const { state, formatTime } = useGame();
  const [boardData, setBoardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    let entries: LeaderboardEntry[] = [];
    let usingDb = false;

    try {
      const res = await fetch("/api/quiz");
      const json = await res.json();
      
      if (res.ok && json.success && json.databaseStatus === "CONNECTED") {
        entries = json.data || [];
        usingDb = true;
      }
    } catch (e) {
      console.warn("Failed fetching production leaderboard, using local fallbacks", e);
    }

    // If database is offline or returned fallback status, use local localStorage database
    if (!usingDb) {
      try {
        const localUsersRaw = localStorage.getItem("crypthunt_local_users");
        if (localUsersRaw) {
          const localUsers = JSON.parse(localUsersRaw);
          entries = localUsers.map((u: any) => ({
            username: u.username,
            email: u.email,
            score: u.score,
            completedLevels: u.currentLevel - 1,
            elapsedTime: u.elapsedTime
          }));
        }
      } catch (err) {
        console.error("Failed to restore local user leaderboard", err);
      }

      // If no local users registered yet, seed the board with classic creepypasta mock hackers!
      if (entries.length === 0) {
        entries = [...mockHackers];
      }
    }

    // Inject or update the active player's profile dynamically
    if (state.isLoggedIn) {
      const completedLevels = Math.max(0, state.currentLevel - 1);
      const userIndex = entries.findIndex(e => e.email.toLowerCase() === state.email.toLowerCase());
      
      const userEntry: LeaderboardEntry = {
        username: state.username,
        email: state.email,
        score: state.score,
        completedLevels,
        elapsedTime: state.elapsedTime,
        isCurrentUser: true
      };

      if (userIndex > -1) {
        // Keep the best progress
        const existing = entries[userIndex];
        if (
          userEntry.completedLevels > existing.completedLevels ||
          (userEntry.completedLevels === existing.completedLevels && userEntry.score > existing.score) ||
          (userEntry.completedLevels === existing.completedLevels && userEntry.score === existing.score && userEntry.elapsedTime < existing.elapsedTime)
        ) {
          entries[userIndex] = userEntry;
        } else {
          entries[userIndex] = {
            ...existing,
            isCurrentUser: true
          };
        }
      } else {
        entries.push(userEntry);
      }
    }

    // Order rankings correctly
    const sorted = entries.sort((a, b) => {
      if (b.completedLevels !== a.completedLevels) {
        return b.completedLevels - a.completedLevels;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.elapsedTime - b.elapsedTime;
    });

    setBoardData(sorted);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard(true);

    // Auto-update the leaderboard every 10 minutes
    const interval = setInterval(() => {
      fetchLeaderboard(false);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isLoggedIn, state.username, state.email, state.score, state.currentLevel, state.elapsedTime]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-mono relative pb-12">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>

      {/* Cyber Navbar */}
      <nav className="w-full bg-zinc-900/60 border-b border-red-950/40 sticky top-0 z-30 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center space-x-1 px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-share-tech text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>RETURN TO MATRIX</span>
        </Link>

        <div className="flex items-center space-x-3 text-red-500 font-orbitron font-bold tracking-widest text-sm">
          <Skull className="w-5 h-5 text-red-600 animate-pulse" />
          <span className="font-orbitron">LEADERBOARD MATRIX</span>
        </div>

        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-share-tech">
          <span>PORT STATUS: </span>
          <span className="text-emerald-500 font-bold animate-pulse">SYNCHRONIZED // LIVE</span>
        </div>
      </nav>

      {/* Main Leaderboard Panel */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 flex flex-col justify-center">
        <div className="w-full bg-zinc-900/80 border-2 border-red-950 pulse-red-glow rounded shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Header Panel */}
          <div className="p-6 text-center border-b border-zinc-800 bg-black/40 flex flex-col items-center justify-center">
            <Trophy className="w-10 h-10 text-yellow-500 mb-3 animate-bounce" />
            <h1 className="text-3xl font-extrabold text-red-600 tracking-wider font-orbitron">
              LABYRINTH HIGH-SCORE MATRIX
            </h1>
            <p className="text-zinc-500 text-xs mt-2 font-share-tech uppercase tracking-widest">
              Live ranking values // Sorted by secure level tallies and escape timers
            </p>
            <div className="flex items-center space-x-2 mt-3 bg-zinc-950/80 px-3 py-1 rounded border border-zinc-800 text-[10px] text-zinc-400 font-share-tech uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>LIVE AUTO-SYNC (10M Interval)</span>
              <span className="text-zinc-600">|</span>
              <span>Last Sync: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] text-zinc-500 font-share-tech uppercase tracking-widest">
                  <th className="py-4 px-6 text-center">Rank</th>
                  <th className="py-4 px-6">Hacker Codename / Node</th>
                  <th className="py-4 px-6 text-center">Secure Ports</th>
                  <th className="py-4 px-6 text-center">Survival Score</th>
                  <th className="py-4 px-6 text-center">Clock Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-zinc-500 font-orbitron uppercase tracking-widest animate-pulse">
                      [ RETRIEVING LIVE COGNITIVE SIGNAL MATRIX... ]
                    </td>
                  </tr>
                ) : boardData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-red-500 font-orbitron uppercase tracking-widest animate-pulse">
                      [ NO INTRUSION SIGNALS CAPTURED YET ]
                    </td>
                  </tr>
                ) : (
                  boardData.map((entry, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-zinc-950/40 transition-colors ${
                          entry.isCurrentUser
                            ? "bg-red-950/20 border-l-4 border-l-red-500"
                            : ""
                        }`}
                      >
                        {/* Rank Column */}
                        <td className="py-4 px-6 text-center font-bold">
                          <div className="flex items-center justify-center space-x-1">
                            {isTop3 ? (
                              <Award
                                className={`w-4 h-4 ${
                                  rank === 1
                                    ? "text-yellow-400"
                                    : rank === 2
                                    ? "text-zinc-400"
                                    : "text-amber-600"
                                }`}
                              />
                            ) : null}
                            <span
                              className={
                                rank === 1
                                  ? "text-yellow-400 font-orbitron text-sm font-black"
                                  : rank === 2
                                  ? "text-zinc-400 font-orbitron text-sm font-bold"
                                  : rank === 3
                                  ? "text-amber-600 font-orbitron text-sm font-bold"
                                  : "text-zinc-500"
                              }
                            >
                              #{rank.toString().padStart(2, "0")}
                            </span>
                          </div>
                        </td>

                        {/* Username / Email Column */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span
                              className={`font-bold ${
                                entry.isCurrentUser
                                  ? "text-red-400 animate-pulse font-orbitron"
                                  : "text-zinc-200"
                              }`}
                            >
                              {entry.username.toUpperCase()}
                              {entry.isCurrentUser && (
                                <span className="text-[8px] bg-red-950 border border-red-500/50 text-red-500 px-1 rounded ml-2 uppercase font-share-tech tracking-wider select-none animate-pulse">
                                  YOU
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-share-tech lowercase mt-0.5">
                              {entry.email}
                            </span>
                          </div>
                        </td>

                        {/* Completed Levels Count Column */}
                        <td className="py-4 px-6 text-center font-bold text-cyan-400">
                          {entry.completedLevels} / 5
                        </td>

                        {/* Total Score Column */}
                        <td className="py-4 px-6 text-center font-bold text-emerald-400">
                          {entry.score} PTS
                        </td>

                        {/* Survival Clock Duration Column */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-zinc-400">
                            <Timer className="w-3.5 h-3.5 text-zinc-600" />
                            <span className="font-bold tracking-widest">
                              {formatTime(entry.elapsedTime)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
