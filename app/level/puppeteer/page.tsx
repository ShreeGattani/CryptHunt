"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";
import TopBar from "../../../components/topbar";
import QuestionProgressBar from "../../../components/QuestionProgressBar";
import "./puppet.css";

const LEVEL_ID = 4;
const TOTAL_IMAGES = 5;
const BG_KEY = "puppet-bg";

export default function PuppeteerPage() {
  const [bgImage, setBgImage] = useState("/images/puppeteer/puppet1.png");
  const [bgFading, setBgFading] = useState(false);
  const [levelCompleteGate, setLevelCompleteGate] = useState(false);
  const router = useRouter();

  const { state, submitAnswer, exitLevelToDashboard, currentQuestionData, loadLevelQuestion, isInitialized } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const current = Number(localStorage.getItem(BG_KEY)) || 1;
    setBgImage(`/images/puppeteer/puppet${current}.png`);
    localStorage.setItem(BG_KEY, String(current + 1 > TOTAL_IMAGES ? 1 : current + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cycleBg = useCallback(() => {
    setBgFading(true);
    setTimeout(() => {
      const next = Number(localStorage.getItem(BG_KEY)) || 1;
      setBgImage(`/images/puppeteer/puppet${next}.png`);
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
              [ you ]
            </p>
            <p className="cipher-text vcr-font">THE STRINGS GO SLACK. ALL 6 PUPPETS NAMED. EXIT TO THE MATRIX.</p>
            <div className="answer-section vcr-font">
              <button onClick={() => exitLevelToDashboard()} className="submit-btn vcr-font" style={{ width: "100%", marginTop: "1rem" }}>
                SECURE LOGS &amp; EXIT
              </button>
            </div>
          </>
        ) : currentQuestionData ? (
          <>
            <div className="title-section">
              <h1>LEVEL: THE PUPPETEER</h1>
              <Image src="/images/divider.png" alt="divider" width={400} height={40} className="divider-img" />
            </div>
            <p key={currentQuestionData.id} className="cipher-text vcr-font question-animate">{currentQuestionData.text}</p>
            {currentQuestionData.image && (
              <div className="question-image">
                <img
                  src={currentQuestionData.image}
                  alt="Question clue"
                  width={300}
                  height={100}
                  className="rounded-lg"
                />
              </div>
            )}
            {currentQuestionData.audio && (
              <div className="audio-section">
                <audio controls preload="metadata">
                  <source src={currentQuestionData.audio} type="audio/wav" />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}
            {currentQuestionData.file && (
              <div className="file-section">
                <a
                  href={currentQuestionData.file}
                  download
                  className="file-card"
                >
                  <div className="file-icon">📁</div>
                  <div className="file-info">
                    <span className="file-name">
                      recovered_archive.zip
                    </span>
                    <span className="file-type">
                      RECOVERED FILES
                    </span>
                  </div>
                </a>
              </div>
            )}
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
