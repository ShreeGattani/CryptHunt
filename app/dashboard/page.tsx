"use client";

import React, { useState } from "react";
import "./dashboard.css";

import Link from "next/link";

import { useGame } from "../context/GameContext";
import { creepypastaLevels } from "../data/questions";
import TopBar from "../../components/topbar";

import {
  Lock,
  Skull,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {

  const {
    state,
  } = useGame();

  if (!state.isLoggedIn) return null;

  const isGameComplete =
    state.currentLevel > 5;

  return (
    <div className="dashboard">

      <TopBar />

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

              {isLocked ? (
                <img
                  src={level.cover}
                  alt={level.name}
                  className="card-bg"
                />
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
                  className="card-bg"
                  style={{ display: "block", zIndex: 2 }}
                >
                  <img
                    src={level.cover}
                    alt={level.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Link>
              )}

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