"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";
import TopBar from "../../../components/topbar";
import QuestionProgressBar from "../../../components/QuestionProgressBar";
import "./candle.css";

const LEVEL_ID = 5;

export default function CandleCovePage() {
  const [bgImage, setBgImage] = useState("/images/candlecove/candle1.png");
  const [levelCompleteGate, setLevelCompleteGate] = useState(false);
  const router = useRouter();

  const { state, submitAnswer, exitLevelToDashboard, currentQuestionData, loadLevelQuestion, isInitialized } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const totalImages = 8;
    let current = Number(localStorage.getItem("candle-bg")) || 1;
    setBgImage(`/images/candlecove/candle${current}.png`);
    localStorage.setItem("candle-bg", String(current + 1 > totalImages ? 1 : current + 1));
  }, [state.currentQuestion]);

  useEffect(() => {
    if (!isInitialized || !state.isLoggedIn) return;
    if (state.currentLevel !== LEVEL_ID) { router.push("/dashboard"); return; }
    loadLevelQuestion(LEVEL_ID).then(({ levelCompletePending }) => {
      if (levelCompletePending) setLevelCompleteGate(true);
    });
  }, [isInitialized, state.isLoggedIn, state.currentLevel, router, loadLevelQuestion]);

  if (!state.isLoggedIn || (!currentQuestionData && !levelCompleteGate)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!inputAnswer.trim()) { setFeedback({ success: false, message: "Answer cannot be empty." }); return; }

    const res = await submitAnswer(inputAnswer, honeypot);
    if (res.success) {
      setFeedback({ success: true, message: res.message });
      setInputAnswer("");
      if (res.isLevelComplete) setLevelCompleteGate(true);
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  return (
    <div className="puppeteer-container" style={{ backgroundImage: `url(${bgImage})` }}>
      <TopBar isLevelPage={true} />
      <div className="puppeteer-content vcr-font">
        {levelCompleteGate ? (
          <>
            <div className="title-section">
              <h1>LEVEL SECURED</h1>
              <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img" />
            </div>
            <p className="cipher-text vcr-font">THE BROADCAST ENDS. ALL 6 TRANSMISSIONS DECODED. EXIT THE COVE.</p>
            <div className="answer-section vcr-font">
              <button onClick={() => exitLevelToDashboard()} className="submit-btn vcr-font" style={{ width: "100%", marginTop: "1rem" }}>
                SECURE LOGS &amp; EXIT
              </button>
            </div>
          </>
        ) : currentQuestionData ? (
          <>
            <div className="title-section">
              <h1>LEVEL: CANDLE COVE</h1>
              <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img" />
              <QuestionProgressBar />
            </div>
            <p className="cipher-text vcr-font">{currentQuestionData.text}</p>
            <div className="answer-section vcr-font">
              <div className="answer-header">
                <Image src="/images/small-left.png" alt="divider" width={120} height={20} className="mini-divider-img" />
                <span>ENTER YOUR ANSWER</span>
                <Image src="/images/small-right.png" alt="divider" width={120} height={20} className="mini-divider-img reverse" />
              </div>
              <form onSubmit={handleSubmit} className="answer-form">
                {/* Honeypot: invisible to real users, catches automated form-fillers */}
                <input
                  type="text"
                  name="key_fragment"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                  style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", overflow: "hidden", opacity: 0 }}
                />
                <input type="text" value={inputAnswer} onChange={(e) => setInputAnswer(e.target.value)} placeholder="Type your answer here [no spaces]..." className="answer-input vcr-font" />
                <button type="submit" className="submit-btn vcr-font">SUBMIT</button>
              </form>
              {feedback && <div className={`feedback ${feedback.success ? "success" : "error"}`}>{feedback.message}</div>}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
