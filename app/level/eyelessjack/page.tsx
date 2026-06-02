"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";
import { creepypastaLevels } from "../../data/questions";
import TopBar from "../../../components/topbar";
import QuestionProgressBar from "../../../components/QuestionProgressBar";
import "./eyelessjack.css";

const TOTAL_IMAGES = 9;
const levelData = creepypastaLevels.find((l) => l.id === 2)!;

export default function EyelessJackPage() {
  const [bgIndex, setBgIndex] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const router = useRouter();

  const {
    state,
    submitAnswer,
    exitLevelToDashboard,
  } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");

  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Rotate background image on question change
  useEffect(() => {
    let current =
      Number(localStorage.getItem("jack-bg")) || 1;

    setBgIndex(current);

    const next =
      current + 1 > TOTAL_IMAGES
        ? 1
        : current + 1;

    localStorage.setItem("jack-bg", String(next));
  }, [state.currentQuestion]);

  // Hide hint when question changes
  useEffect(() => {
    setShowHint(false);
  }, [state.currentQuestion]);

  // Security Gate: Ensure user is logged in, and is active on this exact level
  useEffect(() => {
    if (state.isLoggedIn && state.currentLevel !== 2) {
      router.push("/dashboard");
    }
  }, [state.isLoggedIn, state.currentLevel, router]);

  if (!state.isLoggedIn || state.currentLevel !== 2) {
    return null;
  }

  const activeQuestion =
    levelData.questions[
      state.currentQuestion - 1
    ];

  if (!activeQuestion) {
    return null;
  }

  const bgImage = `/images/eyelessjack/jack${bgIndex}.png`;

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFeedback(null);

    if (!inputAnswer.trim()) {
      setFeedback({
        success: false,
        message:
          "Answer cannot be empty.",
      });
      return;
    }

    const res = submitAnswer(inputAnswer);

    if (res.success) {
      setFeedback({
        success: true,
        message: res.message,
      });

      setInputAnswer("");
      setShowHint(false);

      // Exit after level complete
      if (res.isLevelComplete) {
        setTimeout(() => {
          exitLevelToDashboard();
        }, 1500);
      }
    } else {
      setFeedback({
        success: false,
        message: res.message,
      });
    }
  };

  return (
    <div
      className="ej-container"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <TopBar isLevelPage={true} />
      <div className="ej-content vcr-font">

        {/* TITLE */}
        <div className="ej-title-section">
          <h1>LEVEL: EYELESS JACK</h1>

          <Image
            src="/images/divider.png"
            alt="divider"
            width={400}
            height={40}
            className="divider-img"
          />

          <QuestionProgressBar />
        </div>


        {/* QUESTION */}
        <p className="ej-cipher-text vcr-font">
          {activeQuestion.text}
        </p>


        {/* ANSWER */}
        <div className="ej-answer-section vcr-font">

          <div className="ej-answer-header">
            <Image
              src="/images/small-left.png"
              alt="divider"
              width={120}
              height={20}
              className="mini-divider-img"
            />

            <span>ENTER YOUR ANSWER</span>

            <Image
              src="/images/small-right.png"
              alt="divider"
              width={120}
              height={20}
              className="mini-divider-img reverse"
            />
          </div>

          <form
            onSubmit={handleSubmit}
            className="ej-answer-form"
          >
            <input
              type="text"
              value={inputAnswer}
              onChange={(e) =>
                setInputAnswer(
                  e.target.value
                )
              }
              placeholder="Type your answer here [no spaces]..."
              className="ej-answer-input vcr-font"
            />

            <button
              type="submit"
              className="ej-submit-btn vcr-font"
            >
              SUBMIT
            </button>
          </form>

          {feedback && (
            <div
              className={`ej-feedback ${
                feedback.success
                  ? "success"
                  : "error"
              }`}
            >
              {feedback.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}