"use client";

import React, { useState } from "react";
import "./dashboard.css";

import Link from "next/link";

import { useGame } from "../context/GameContext";
import { creepypastaLevels } from "../data/questions";

import {
  Trophy,
  BookOpen,
  Lock,
  Skull,
  CheckCircle2,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {

  const {
    state,
    logout,
  } = useGame();

  const [isRulesOpen, setIsRulesOpen] =
    useState(false);

  if (!state.isLoggedIn) return null;

  const isGameComplete =
    state.currentLevel > 5;

  return (
    <div className="dashboard">

      {/* HEADER */}

      <header className="topbar">

        {/* LEFT */}

        <div className="logo-section">

          <h1>CRYPTHUNT</h1>

          <p>
            INTERNET LEGENDS ARCHIVE
          </p>

        </div>

        {/* HUD */}

        <div className="hud">

          <div className="hud-box">
            AGENT:
            <span>
              {state.username.toUpperCase()}
            </span>
          </div>

          <div className="hud-box">
            SCORE:
            <span>
              {state.score} PTS
            </span>
          </div>

          <div className="hud-box">
            LEVEL:
            <span>
              {isGameComplete
                ? "5/5"
                : `${state.currentLevel - 1}/5`}
            </span>
          </div>

        </div>

        {/* RIGHT */}

        {/* FLOATING ACTIONS */}

      <div className="floating-actions">

        <button
          onClick={() =>
            setIsRulesOpen(true)
          }
          className="action-btn"
        >
          <BookOpen size={18} />
        </button>

        <Link
          href="/leaderboard"
          className="action-btn"
        >
          <Trophy size={18} />
        </Link>

        <button
          onClick={logout}
          className="action-btn"
        >
          <LogOut size={18} />
        </button>

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

              <button
                onClick={() =>
                  setIsRulesOpen(false)
                }
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

      </header>

      {/* GRID */}

      <div className="cards-grid">

        {creepypastaLevels.map((level) => {

          const isCompleted =
            state.currentLevel > level.id;

          const isActive =
            state.currentLevel === level.id;

          const isLocked =
            state.currentLevel < level.id;

          return (

            <div
              key={level.id}
              className={`card
                ${
                  isActive
                    ? "active-card"
                    : isCompleted
                    ? "completed-card"
                    : "locked-card"
                }
              `}
            >

              {/* IMAGE */}

              <img
                src={level.cover}
                alt={level.name}
                className="card-bg"
              />

              {/* OVERLAY */}

              <div className="overlay"></div>

              {/* CONTENT */}

              <div className="card-content">

                {/* TOP */}

                <div>

                  <div className="card-top">

                    <span
                      className={`tape ${
  level.id === 1
    ? "red"
    : level.id === 2
    ? "blue"
    : level.id === 3
    ? "green"
    : level.id === 4
    ? "yellow"
    : level.id ===5
    ? "purple"
    : "yellow"
}`}
                    >
                      TAPE 0{level.id}
                    </span>

                    {isCompleted ? (
                      <span className="status solved">
                        <CheckCircle2 size={14} />
                        SOLVED
                      </span>
                    ) : isActive ? (
                      <span className="status active">
                        <Skull size={14} />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="status locked">
                        <Lock size={14} />
                        LOCKED
                      </span>
                    )}

                  </div>

                  <h2>
                    {level.name.toUpperCase()}
                  </h2>

                  {/* <p className="theme">
                    {level.theme}
                  </p> 

                  <p className="description">
                    {level.description}
                  </p> */}

                </div>

                {/* BOTTOM */}

                <div className="bottom">

                  <p>
                    {isCompleted
                      ? "6 / 6 PAGES RECOVERED"
                      : isActive
                      ? `${state.currentQuestion - 1} / 6 DATA RECOVERED`
                      : "ARCHIVE LOCKED"}
                  </p>

                  {isLocked ? (

                    <div className="lock-btn">
                      <Lock size={20} />
                    </div>

                  ) : (

                    <Link
                      href={`/level/${
                        level.id === 1
                          ? "slenderman"
                          : level.id === 2
                          ? "eyelessjack"
                          : level.id === 3
                          ? "ben"
                          : level.id === 4
                          ? "puppeteer"
                          : "candlecove"
                      }`}
                      className="enter-btn"
                    >
                      {isCompleted
                        ? "[ REVISIT ]"
                        : state.currentQuestion > 1
                        ? "[ RESUME ]"
                        : "[ ENTER ]"}
                    </Link>

                  )}

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* FOOTER */}

      <footer className="footer">
        <div className="footer-left">

          <span>
            SIGNAL STRENGTH: 42%
          </span>

          <span>
            AUDIO FEED: <span className="dark-red">UNSTABLE </span>
          </span>

          <span>
            CONNECTION: <span className="dark-yellow">POOR </span>
          </span>

        </div>

        <div className="footer-right">

          <span>
            ARCHIVE STABILITY
          </span>

          <div className="bar">
            <div className="fill"></div>
          </div>

          <p>23%</p>

        </div>

      </footer>

    </div>
  );
}