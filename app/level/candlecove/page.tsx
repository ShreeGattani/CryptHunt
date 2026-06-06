"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";
import TopBar from "../../../components/topbar";
import QuestionProgressBar from "../../../components/QuestionProgressBar";
import "./candle.css";

const LEVEL_ID = 5;
const TOTAL_IMAGES = 8;
const BG_KEY = "candle-bg";

export default function CandleCovePage() {
  const [bgImage, setBgImage] = useState("/images/candlecove/candle1.png");
  const [bgFading, setBgFading] = useState(false);
  const [levelCompleteGate, setLevelCompleteGate] = useState(false);
  const router = useRouter();

  const { state, submitAnswer, exitLevelToDashboard, currentQuestionData, loadLevelQuestion, isInitialized } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [finalSentenceInput, setFinalSentenceInput] = useState("");
  const [finalSentenceFeedback, setFinalSentenceFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleFinalSentenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinalSentenceFeedback(null);
    if (!finalSentenceInput.trim()) {
      setFinalSentenceFeedback({ success: false, message: "Decryption key sentence cannot be empty." });
      return;
    }

    const res = await exitLevelToDashboard(finalSentenceInput);
    if (!res.success) {
      setFinalSentenceFeedback({ success: false, message: res.message });
    }
  };

  useEffect(() => {
    const current = Number(localStorage.getItem(BG_KEY)) || 1;
    setBgImage(`/images/candlecove/candle${current}.png`);
    localStorage.setItem(BG_KEY, String(current + 1 > TOTAL_IMAGES ? 1 : current + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cycleBg = useCallback(() => {
    setBgFading(true);
    setTimeout(() => {
      const next = Number(localStorage.getItem(BG_KEY)) || 1;
      setBgImage(`/images/candlecove/candle${next}.png`);
      localStorage.setItem(BG_KEY, String(next + 1 > TOTAL_IMAGES ? 1 : next + 1));
      setBgFading(false);
    }, 200);
  }, []);

  useEffect(() => {
    if (!isInitialized || !state.isLoggedIn) return;
    if (state.currentLevel !== LEVEL_ID) { router.push("/dashboard"); return; }
    loadLevelQuestion(LEVEL_ID).then(({ levelCompletePending }) => {
      setLevelCompleteGate(levelCompletePending);
    });
  }, [isInitialized, state.isLoggedIn, state.currentLevel, router, loadLevelQuestion]);

  if (!state.isLoggedIn || (!currentQuestionData && !levelCompleteGate)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!inputAnswer.trim()) { setFeedback({ success: false, message: "Answer cannot be empty." }); return; }

    const res = await submitAnswer(inputAnswer, honeypot);
    cycleBg();
    if (res.success) {
      setFeedback({ success: true, message: res.message });
      setInputAnswer("");
      if (res.isLevelComplete) setLevelCompleteGate(true);
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  return (
    <div
      className="puppeteer-container"
      style={{
        backgroundImage: `url(${bgImage})`,
        opacity: bgFading ? 0.35 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <TopBar isLevelPage={true} />
      <div className="puppeteer-content vcr-font">
        {levelCompleteGate ? (
          <>
            <div className="title-section">
              <h1>LEVEL SECURED</h1>
              <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img" />
            </div>
            <p className="vcr-font text-red-500 font-bold tracking-[0.2em] text-2xl uppercase animate-pulse" style={{ color: "#ef4444", fontSize: "24px", letterSpacing: "0.2em", marginBottom: "1.5rem" }}>
              [ survived ]
            </p>
            <p className="cipher-text vcr-font">THE BROADCAST ENDS. ALL 6 TRANSMISSIONS DECODED. EXIT THE COVE.</p>
            <div className="answer-section vcr-font" style={{ width: "100%", maxWidth: "500px", marginTop: "1rem" }}>
              <div className="answer-header" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <span style={{ whiteSpace: "nowrap", fontSize: "15px" }}>ENTER THE FINAL KEY SENTENCE TO WIN</span>
              </div>
              <form onSubmit={handleFinalSentenceSubmit} className="answer-form" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "15px" }}>
                <input
                  type="text"
                  value={finalSentenceInput}
                  onChange={(e) => setFinalSentenceInput(e.target.value)}
                  placeholder="Type the complete 5-word sentence here..."
                  className="answer-input vcr-font"
                  style={{
                    width: "100%",
                    background: "rgba(0, 0, 0, 0.7)",
                    border: "1px solid rgba(255, 0, 0, 0.35)",
                    padding: "9px 10px",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "14px",
                    textAlign: "center",
                    outline: "none"
                  }}
                />
                <button type="submit" className="submit-btn vcr-font" style={{ width: "100%", padding: "7px 35px", border: "1px solid rgba(255, 0, 0, 0.5)", background: "rgba(21, 21, 21, 0.8)", color: "#ef4444", fontSize: "16px", cursor: "pointer" }}>
                  DECRYPT &amp; ENTER
                </button>
              </form>
              {finalSentenceFeedback && (
                <div className={`feedback ${finalSentenceFeedback.success ? "success" : "error"}`} style={{ marginTop: "1rem", color: finalSentenceFeedback.success ? "#4ade80" : "#f87171", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.15em" }}>
                  {finalSentenceFeedback.message}
                </div>
              )}
            </div>
          </>
        ) : currentQuestionData ? (
          <>
            <div className="title-section">
              <h1>LEVEL: CANDLE COVE</h1>
              <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img" />
              <QuestionProgressBar />
            </div>
            <p key={currentQuestionData.id} className="cipher-text vcr-font question-animate">{currentQuestionData.text}</p>
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
