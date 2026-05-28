"use client";

import React, { useState } from "react";
import { useGame } from "../../context/GameContext";
import "./puppet.css";

export default function PuppeteerPage() {
  const {
    state,
    submitAnswer,
    currentLevelData,
    exitLevelToDashboard,
  } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [levelCompleteGate, setLevelCompleteGate] = useState(false);

  if (
    !state.isLoggedIn ||
    !currentLevelData
  ) {
    return null;
  }

  const activeQuestion =
    currentLevelData.questions[state.currentQuestion - 1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!inputAnswer.trim()) {
      setFeedback({
        success: false,
        message: "Answer cannot be empty.",
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
      if (res.isLevelComplete) {
        setLevelCompleteGate(true);
      }
    } else {
      setFeedback({
        success: false,
        message: res.message,
      });
    }
  };

  return (
    <div className="puppeteer-container">
      <div className="puppet-stage-glow"></div>
      <div className="puppet-string string-one"></div>
      <div className="puppet-string string-two"></div>
      <div className="puppet-string string-three"></div>

      <div className="puppeteer-content vcr-font">
        <div className="title-section">
          <p>CRYPT@TRIX LEVEL 04</p>
          <h1>THE PUPPETEER</h1>
          <div className="divider-line"></div>
        </div>

        {levelCompleteGate ? (
          <div className="completion-card">
            <h2>STRINGS SEVERED</h2>
            <p>All Puppeteer keys have been injected. Exit the theatre and return to the directory.</p>
            <button type="button" onClick={exitLevelToDashboard} className="submit-btn vcr-font">
              EXIT TO DIRECTORY
            </button>
          </div>
        ) : (
          <>
            <p className="cipher-text vcr-font">
              {activeQuestion.text}
            </p>

            <div className="answer-section vcr-font">
              <div className="answer-header">
                <span></span>
                <strong>ENTER YOUR ANSWER</strong>
                <span></span>
              </div>

              <form
                onSubmit={handleSubmit}
                className="answer-form"
              >
                <input
                  type="text"
                  value={inputAnswer}
                  onChange={(e) =>
                    setInputAnswer(e.target.value)
                  }
                  placeholder="Type your answer here [no spaces]..."
                  className="answer-input vcr-font"
                />

                <button
                  type="submit"
                  className="submit-btn vcr-font"
                >
                  SUBMIT
                </button>
              </form>

              {feedback && (
                <div
                  className={`feedback ${
                    feedback.success
                      ? "success"
                      : "error"
                  }`}
                >
                  {feedback.message}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
