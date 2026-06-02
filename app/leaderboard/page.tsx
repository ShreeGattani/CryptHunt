"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import "./leaderboard.css";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Trophy, CornerUpLeft } from "lucide-react";

interface LeaderboardEntry {
  username: string;
  score: number;
  completedLevels: number;
  updatedAt: string;
  isCurrentUser?: boolean;
}

const mockHackers: LeaderboardEntry[] = [
  { username: "HEYA", score: 4750, completedLevels: 5, updatedAt: "2026-05-28T11:46:25.000Z" },
  { username: "SHRUTI", score: 4220, completedLevels: 5, updatedAt: "2026-05-27T14:41:18.000Z" },
  { username: "GHOST_SIGNAL", score: 3890, completedLevels: 5, updatedAt: "2026-05-28T11:42:46.000Z" },
  { username: "STATIC_VOID", score: 1240, completedLevels: 2, updatedAt: "2026-05-28T11:42:46.000Z" },
];

export default function LeaderboardPage() {
  const { state, formatDate } = useGame();

  const [boardData, setBoardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const fetchLeaderboard = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    let entries: LeaderboardEntry[] = [];

    try {
      const res = await fetch("/api/quiz");
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        entries = json.data;
      }
    } catch {
      // fall through to mock data
    }

    if (entries.length === 0) {
      entries = [...mockHackers];
    }

    // Inject the active player's profile — username match only, no email
    if (state.isLoggedIn) {
      const completedLevels = Math.max(0, state.currentLevel - 1);
      const userIndex = entries.findIndex(
        (e) => e.username.toLowerCase() === state.username.toLowerCase()
      );

      const userEntry: LeaderboardEntry = {
        username: state.username,
        score: state.score,
        completedLevels,
        updatedAt: state.updatedAt || new Date().toISOString(),
        isCurrentUser: true,
      };

      if (userIndex > -1) {
        // Keep the best progress
        const existing = entries[userIndex];
        if (
          userEntry.completedLevels > existing.completedLevels ||
          (userEntry.completedLevels === existing.completedLevels && userEntry.score > existing.score) ||
          (userEntry.completedLevels === existing.completedLevels && userEntry.score === existing.score && new Date(userEntry.updatedAt).getTime() < new Date(existing.updatedAt).getTime())
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

    // Order rankings correctly: highest levels first, then highest score, then earliest solve time
    const sorted = entries.sort((a, b) => {
      if (b.completedLevels !== a.completedLevels) {
        return b.completedLevels - a.completedLevels;
      }
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
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
  }, [state]);

  return (
    <div className="leaderboard-page">

      <div className="leaderboard-shell">

        <div className="archive-header">
          <div className="archive-brand">
            <h1>CRYPTHUNT</h1>
            <p>INTERNET LEGENDS ARCHIVE</p>
          </div>

          <div className="top-icons">
            <button className="top-btn" onClick={() => setIsRulesOpen(true)} title="Rules Matrix" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <BookOpen size={20} style={{ color: '#fff' }} />
            </button>
            <button className="top-btn" title="Leaderboard Matrix" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={20} style={{ color: '#ba9141' }} />
            </button>
            <Link href="/dashboard" className="top-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} title="Return to Dashboard">
              <CornerUpLeft size={20} style={{ color: '#fff' }} />
            </Link>
          </div>
        </div>

        <div className="board-title">
          <h2>LEADERBOARD</h2>
          <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img"></Image>

          {/*<div className="sync-bar">
          <span className="sync-dot"></span>
          LIVE AUTO-SYNC (10M INTERVAL)
          &nbsp; | &nbsp;
          LAST SYNC: {lastUpdated.toLocaleTimeString()}
        </div>*/}
          <p>
            LOREM IPSUM DOREM BLAH BLAH SMILER JACK KILL
          </p>
        </div>

        <div className="leaderboard-frame">

          <table className="archive-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>AGENT</th>
                <th>ARCHIVES OPENED</th>
                <th>SCORE</th>
                <th>LAST ACTIVE</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#8b8b8b", fontSize: "14px" }}>
                    [ RETRIEVING LIVE COGNITIVE SIGNAL MATRIX... ]
                  </td>
                </tr>
              ) : boardData.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#ff3131", fontSize: "14px" }}>
                    [ NO DATA RECOVERED ]
                  </td>
                </tr>
              ) : (
                boardData.map((entry, index) => {
                  const rank = index + 1;

                  return (
                    <tr
                      key={index}
                      className={
                        entry.isCurrentUser
                          ? "user-row"
                          : ""
                      }
                    >
                      <td className="rank">
                        #{String(rank).padStart(2, "0")}
                      </td>

                      <td className="white">
                        {entry.username}
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            color: "#BBBBBB",
                          }}
                        >
                          <span>
                            {entry.completedLevels}/5
                          </span>

                          <div className="progress-bar">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`progress-box ${
                                  i <= entry.completedLevels
                                    ? entry.isCurrentUser
                                      ? "filled red"
                                      : "filled"
                                    : ""
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="score">
                        {entry.score} PTS
                      </td>

                      <td className="white">
                        {formatDate(entry.updatedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        </div>

      </div>

      {isRulesOpen && (
        <div className="rules-overlay">
          <div className="rules-modal">
            <div className="rules-header">
              <div>
                <BookOpen size={16} />
                RULE BOOK
              </div>
              <button
                onClick={() => setIsRulesOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                X
              </button>
            </div>
            <div className="rules-content">
              <p>
                1. Solve all 6 questions to unlock the next tape.
              </p>
              <p>
                2. Answers are NOT case sensitive.
              </p>
              <p>
                3. Each legend contains hidden lore fragments.
              </p>
              <p>
                4. Fastest completion secures leaderboard ranking.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}