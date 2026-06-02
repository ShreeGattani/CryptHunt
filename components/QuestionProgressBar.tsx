"use client";

import React from "react";
import { useGame } from "../app/context/GameContext";

export default function QuestionProgressBar() {
  const { state, currentLevelData } = useGame();

  if (!state.isLoggedIn || !currentLevelData) return null;

  const totalQuestions = 6; // fixed per level — answers live server-side only
  const currentQ = state.currentQuestion; // 1 to 6

  return (
    <div className="question-progress-simple vcr-font">
      QUESTION &nbsp;<span>{currentQ} / {totalQuestions}</span>
    </div>
  );
}

