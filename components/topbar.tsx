"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGame } from "../app/context/GameContext";
import { useMusicPlayer } from "./AudioManager";
import { BookOpen, Trophy, LogOut, Home, Volume2, VolumeX } from "lucide-react";

export default function TopBar({ isLevelPage = false }: { isLevelPage?: boolean }) {
  const { state, logout } = useGame();
  const { isMuted, toggleMute } = useMusicPlayer();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  if (!state.isLoggedIn) return null;

  const isGameComplete = state.currentLevel > 5;

  return (
    <header className={`topbar ${isLevelPage ? "topbar-absolute" : ""}`}>
      {/* LEFT */}
      <div className="logo-section">
        <h1>CRYPTHUNT</h1>
        <p>INTERNET LEGENDS ARCHIVE</p>
      </div>

      {/* HUD */}
      <div className="hud">
        <div className="hud-box">
          AGENT:
          <span>{state.username.toUpperCase()}</span>
        </div>
        <div className="hud-box">
          SCORE:
          <span>{state.score} PTS</span>
        </div>
        <div className="hud-box">
          LEVEL:
          <span>{isGameComplete ? "5/5" : `${state.currentLevel - 1}/5`}</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="floating-actions">
        <button onClick={() => setIsRulesOpen(true)} className="action-btn" title="Rule Book">
          <BookOpen size={18} />
        </button>
        <Link href="/leaderboard" className="action-btn" title="Leaderboard">
          <Trophy size={18} />
        </Link>
        <button
          onClick={toggleMute}
          className="action-btn"
          title={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        {isLevelPage ? (
          <Link href="/dashboard" className="action-btn" title="Back to Home">
            <Home size={18} />
          </Link>
        ) : (
          <button onClick={logout} className="action-btn" title="Logout">
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* RULES MODAL */}
      {isRulesOpen && (
        <div className="rules-overlay">
          <div className="rules-modal">
            <div className="rules-header">
              <div>
                <BookOpen size={16} />
                RULE BOOK
              </div>
              <button onClick={() => setIsRulesOpen(false)}>X</button>
            </div>
            <div className="rules-content">
              <p>1. Solve all 6 questions to unlock the next tape.</p>
              <p>2. Answers are NOT case sensitive.</p>
              <p>3. Each legend contains hidden lore fragments.</p>
              <p>4. Fastest completion secures leaderboard ranking.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
