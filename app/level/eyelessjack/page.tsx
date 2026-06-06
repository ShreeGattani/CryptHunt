"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";
import TopBar from "../../../components/topbar";
import QuestionProgressBar from "../../../components/QuestionProgressBar";
import "./eyelessjack.css";

const TOTAL_IMAGES = 9;
const LEVEL_ID = 2;
const BG_KEY = "jack-bg";

export default function EyelessJackPage() {
  const [bgIndex, setBgIndex] = useState(1);
  const [bgFading, setBgFading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [levelCompleteGate, setLevelCompleteGate] = useState(false);
  const router = useRouter();

  const { state, submitAnswer, exitLevelToDashboard, currentQuestionData, loadLevelQuestion, isInitialized } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Load initial bg from stored index
  useEffect(() => {
    const current = Number(localStorage.getItem(BG_KEY)) || 1;
    setBgIndex(current);
    localStorage.setItem(BG_KEY, String(current + 1 > TOTAL_IMAGES ? 1 : current + 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setShowHint(false); }, [state.currentQuestion]);

  const cycleBg = useCallback(() => {
    setBgFading(true);
    setTimeout(() => {
      const next = Number(localStorage.getItem(BG_KEY)) || 1;
      setBgIndex(next);
      localStorage.setItem(BG_KEY, String(next + 1 > TOTAL_IMAGES ? 1 : next + 1));
      setBgFading(false);
    }, 200);
  }, []);

  useEffect(() => {
    if (!isInitialized || !state.isLoggedIn) return;
    if (state.currentLevel !== LEVEL_ID) { router.push("/dashboard"); return; }
    loadLevelQuestion(LEVEL_ID).then(({ levelCompletePending }) => {
      if (levelCompletePending) setLevelCompleteGate(true);
    });
  }, [isInitialized, state.isLoggedIn, state.currentLevel, router, loadLevelQuestion]);

  if (!state.isLoggedIn || (!currentQuestionData && !levelCompleteGate)) return null;

  const bgImage = `/images/eyelessjack/jack${bgIndex}.png`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!inputAnswer.trim()) { setFeedback({ success: false, message: "Answer cannot be empty." }); return; }

    const res = await submitAnswer(inputAnswer, honeypot);
    cycleBg();
    if (res.success) {
      setFeedback({ success: true, message: res.message });
      setInputAnswer("");
      setShowHint(false);
      if (res.isLevelComplete) setLevelCompleteGate(true);
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  return (
    <div
      className="ej-container"
      style={{
        backgroundImage: `url(${bgImage})`,
        opacity: bgFading ? 0.35 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <TopBar isLevelPage={true} />
      <div className="ej-content vcr-font">
        {levelCompleteGate ? (
          <>
            <div className="ej-title-section">
              <h1>LEVEL SECURED</h1>
              <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img" />
            </div>
            <p className="vcr-font text-red-500 font-bold tracking-[0.2em] text-2xl uppercase animate-pulse" style={{ color: "#ef4444", fontSize: "24px", letterSpacing: "0.2em", marginBottom: "1.5rem" }}>
              [ or ]
            </p>
            <p className="ej-cipher-text vcr-font">ALL 6 ORGANS EXTRACTED. JACK IS SATISFIED. EXIT TO THE MATRIX.</p>
            <div className="ej-answer-section vcr-font">
              <button onClick={() => exitLevelToDashboard()} className="ej-submit-btn vcr-font" style={{ width: "100%", marginTop: "1rem" }}>
                SECURE LOGS &amp; EXIT
              </button>
            </div>
          </>
        ) : currentQuestionData ? (
          <>
            <div className="ej-title-section">
              <h1>LEVEL: EYELESS JACK</h1>
              <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img" />
              <QuestionProgressBar />
            </div>
            <p key={currentQuestionData.id} className="ej-cipher-text vcr-font question-animate">{currentQuestionData.text}</p>
            <div className="ej-answer-section vcr-font">
              <div className="ej-answer-header">
                <Image src="/images/small-left.png" alt="divider" width={120} height={20} className="mini-divider-img" />
                <span>ENTER YOUR ANSWER</span>
                <Image src="/images/small-right.png" alt="divider" width={120} height={20} className="mini-divider-img reverse" />
              </div>
              <form onSubmit={handleSubmit} className="ej-answer-form">
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
                <input type="text" value={inputAnswer} onChange={(e) => setInputAnswer(e.target.value)} placeholder="Type your answer here [no spaces]..." className="ej-answer-input vcr-font" />
                <button type="submit" className="ej-submit-btn vcr-font">SUBMIT</button>
              </form>
              {feedback && <div className={`ej-feedback ${feedback.success ? "success" : "error"}`}>{feedback.message}</div>}
              <button onClick={() => setShowHint(!showHint)} className="ej-submit-btn vcr-font" style={{ marginTop: "0.5rem", opacity: 0.6 }}>
                {showHint ? "HIDE HINT" : "REQUEST HINT"}
              </button>
              {showHint && currentQuestionData.hint && (
                <p className="ej-cipher-text vcr-font" style={{ fontSize: "0.8rem", opacity: 0.7 }}>{currentQuestionData.hint}</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
