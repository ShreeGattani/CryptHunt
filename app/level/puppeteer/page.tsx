"use client";

import Image from "next/image";
import React, { useState, useEffect, use } from "react";
import { useGame } from "../../context/GameContext";
import { useRouter } from "next/navigation";
import "./puppet.css";

export default function PuppeteerPage() {
  const [bgImage, setBgImage] = useState("/images/puppeteer/puppet1.png");

  useEffect(() => {
  const totalImages = 5;

  let current =
    Number(localStorage.getItem("puppet-bg")) || 1;

  const next = current + 1 > totalImages
    ? 1
    : current + 1;

  setBgImage(`/images/puppeteer/puppet${current}.png`);

  localStorage.setItem("puppet-bg", String(next));
}, []);

  const {
    state,
    submitAnswer,
    currentLevelData,
  } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);


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
    } else {
      setFeedback({
        success: false,
        message: res.message,
      });
    }
  };


  return (
    <div
  className="puppeteer-container"
  style={{
    backgroundImage: `url(${bgImage})`,
  }}
>

  <div className="puppeteer-content vcr-font">

    {/* TITLE */}
    <div className="title-section">
      <h1>LEVEL: THE PUPPETEER</h1>

      <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img"></Image>
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