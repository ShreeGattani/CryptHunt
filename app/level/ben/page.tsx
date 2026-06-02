"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";
import { creepypastaLevels } from "../../data/questions";
import TopBar from "../../../components/topbar";
import QuestionProgressBar from "../../../components/QuestionProgressBar";
import "./ben.css";

const levelData = creepypastaLevels.find((l) => l.id === 3)!;

export default function BenPage() {
  const [bgImage, setBgImage] = useState("/images/ben/ben1.png");
  const router = useRouter();

  const {
    state,
    submitAnswer,
    exitLevelToDashboard,
  } = useGame();

  useEffect(() => {
    const totalImages = 12;

    let current =
      Number(localStorage.getItem("ben-bg")) || 1;

      const next = current + 1 > totalImages
        ? 1
        : current + 1;

      setBgImage(`/images/ben/ben${current}.png`);

      localStorage.setItem("ben-bg", String(next));
  }, [state.currentQuestion]);

  const [inputAnswer, setInputAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Security Gate: Ensure user is logged in, and is active on this exact level
  useEffect(() => {
    if (state.isLoggedIn && state.currentLevel !== 3) {
      router.push("/dashboard");
    }
  }, [state.isLoggedIn, state.currentLevel, router]);

  if (!state.isLoggedIn || state.currentLevel !== 3) {
    return null;
  }

  const activeQuestion =
    levelData.questions[state.currentQuestion - 1];

  if (!activeQuestion) {
    return null;
  }

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
      className="ben-container"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <TopBar isLevelPage={true} />
      <div className="ben-content vcr-font">

      {/* TITLE */}
      <div className="title-section">
        <h1>LEVEL: BEN DROWNED</h1>

        <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img"></Image>

        <QuestionProgressBar />
      </div>

    {/* QUESTION */}
    <p className="cipher-text vcr-font">
      {activeQuestion.text}
    </p>

    {/* ANSWER */}
    <div className="answer-section vcr-font">

      <div className="answer-header">
        <Image src="/images/small-left.png" alt="divider" width={120} height={20} className="mini-divider-img"/>

        <span>ENTER YOUR ANSWER</span>

        <Image src="/images/small-right.png" alt="divider" width={120} height={20} className="mini-divider-img reverse"/>

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
  </div>
</div>
  );
}