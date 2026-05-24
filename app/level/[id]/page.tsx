"use client";

import React, { useState, useEffect, use } from "react";
import { useGame } from "../../context/GameContext";
import { creepypastaLevels } from "../../data/questions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Skull,
  ChevronLeft,
  Timer,
  HelpCircle,
  AlertOctagon,
  Unlock,
  ShieldCheck,
  Send,
  Eye,
  AudioLines
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LevelPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    state,
    submitAnswer,
    exitLevelToDashboard,
    formatTime,
    currentLevelData
  } = useGame();

  const [inputAnswer, setInputAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [levelCompleteGate, setLevelCompleteGate] = useState(false);

  const urlLevelId = parseInt(resolvedParams.id, 10);

  // Security Gate: Ensure user is logged in, and is active on this exact level
  useEffect(() => {
    if (state.isLoggedIn) {
      if (state.currentLevel !== urlLevelId) {
        // Enforce sequential level gate
        router.push("/dashboard");
      }
    }
  }, [state.isLoggedIn, state.currentLevel, urlLevelId, router]);

  if (!state.isLoggedIn || !currentLevelData || state.currentLevel !== urlLevelId) {
    return null;
  }

  const activeQuestion = currentLevelData.questions[state.currentQuestion - 1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!inputAnswer.trim()) {
      setFeedback({ success: false, message: "Decryption input cannot be empty." });
      return;
    }

    const res = submitAnswer(inputAnswer);
    if (res.success) {
      setFeedback({ success: true, message: res.message });
      setInputAnswer("");
      setShowHint(false);

      if (res.isLevelComplete) {
        // Last question fully solved! Show Level Completion Gate
        setLevelCompleteGate(true);
      }
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  // Sound cue flavor text generators
  const getEntityGlitches = (id: number) => {
    switch (id) {
      case 1:
        return "FOREST SHADOWS STRETCH. WATCH THE PAGES.";
      case 2:
        return "JACK IS LEANING OVER. SURGICAL COLDNESS DETECTED.";
      case 3:
        return "YOU SHOULDN'T HAVE DONE THAT.";
      case 4:
        return "GOLDEN STRINGS DRAW CLOSER. DO NOT DANCE.";
      case 5:
        return "CANDLE COVE BROADCAST SIGNAL IS DEGRADING.";
      default:
        return "ANOMALOUS ACTIVITY DETECTED.";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-mono relative pb-12">
      {/* Dynamic Cyber Grid styled per level */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none`}></div>

      {/* Dynamic CRT Scanning Line custom visual noise */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent h-1/2 w-full pointer-events-none animate-pulse"></div>

      {/* Level Header HUD */}
      <nav className="w-full bg-zinc-900/60 border-b border-red-950/40 sticky top-0 z-30 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            // exiting to dashboard
            router.push("/dashboard");
          }}
          className="flex items-center space-x-1 px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-share-tech text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>EXIT HUNT</span>
        </button>

        <div className="flex items-center space-x-3 text-red-500 font-orbitron font-bold tracking-widest text-sm">
          <Skull className="w-5 h-5 text-red-600 animate-pulse" />
          <span>{currentLevelData.name.toUpperCase()} Encounter</span>
        </div>

        {/* Global Timer HUD */}
        <div className="flex items-center space-x-2 bg-black/80 px-4 py-1.5 rounded border border-zinc-800 font-orbitron text-xs">
          <Timer className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-zinc-500 font-share-tech">TIME:</span>
          <span className="text-cyan-400 tracking-widest font-bold">{formatTime(state.elapsedTime)}</span>
        </div>
      </nav>

      {/* Main Encounter Frame */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 flex flex-col justify-center">
        {/* If level completed, show gate to exit */}
        {levelCompleteGate ? (
          <div className="w-full max-w-xl mx-auto bg-zinc-900 border-2 border-emerald-500 rounded p-8 shadow-2xl relative z-20 text-center pulse-cyan-glow animate-fade-in">
            <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black font-orbitron text-emerald-400 tracking-wider mb-2">
              LEVEL SECURED
            </h2>
            <p className="text-[10px] text-zinc-500 font-share-tech uppercase tracking-widest mb-6">
              Entity locked // Labyrinth decrypted
            </p>
            <p className="text-sm text-zinc-400 font-mono mb-8 leading-relaxed">
              All 6 keycodes have been injected. The portal is closing. Exit back to the central matrix to proceed to the next anomaly.
            </p>

            <button
              onClick={exitLevelToDashboard}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold uppercase tracking-widest text-xs py-3 rounded transition-all duration-300 font-orbitron cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Unlock className="w-4 h-4" />
              <span>SECURE LOGS & EXIT TO DIRECTORY</span>
            </button>
          </div>
        ) : (
          /* Question View Card */
          <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Audio Wave Sound HUD bar */}
            <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
              <div className="flex items-center space-x-2">
                <AudioLines className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="font-share-tech uppercase">{currentLevelData.audioHint}</span>
              </div>
              <span className="font-mono text-zinc-600">OFFSET: {state.currentQuestion} / 6</span>
            </div>

            {/* Entity Portrait Glitch Field */}
            <div className={`p-6 border-b border-zinc-800 bg-black/60 relative overflow-hidden flex flex-col justify-center items-center select-none text-center h-[140px] ${currentLevelData.glowClass}`}>
              <div className="absolute top-2 left-2 text-[8px] text-zinc-700 tracking-widest font-mono">
                ENCOUNTER GRID // LOG_FILE_0{currentLevelData.id}
              </div>
              <h4 className="text-xs font-bold text-red-500 font-orbitron animate-pulse mb-1">
                [ALERT // PSYCHOLOGICAL STATE: ACTIVE]
              </h4>
              <p className="text-sm font-black font-orbitron tracking-widest text-white/90 uppercase mt-1">
                {getEntityGlitches(currentLevelData.id)}
              </p>
            </div>

            {/* Progress 6-Question Bar */}
            <div className="bg-zinc-950 px-6 py-3 border-b border-zinc-800/60 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-share-tech uppercase">Progress Matrix:</span>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5, 6].map((idx) => {
                  const isDone = state.currentQuestion > idx;
                  const isCurr = state.currentQuestion === idx;

                  return (
                    <div
                      key={idx}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isDone
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : isCurr
                          ? "border-red-500 bg-red-500/20 text-red-400 animate-pulse"
                          : "border-zinc-800 bg-zinc-950 text-zinc-700"
                      }`}
                    >
                      {idx}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question Shell */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-3">
                <h3 className="text-zinc-500 font-share-tech text-xs uppercase tracking-widest">
                  Active Cryptographic Clue
                </h3>
                <p className="text-sm md:text-base text-zinc-100 font-mono leading-relaxed bg-black/40 p-4 border border-zinc-800/50 rounded">
                  {activeQuestion.text}
                </p>
              </div>

              {/* Form Input Shell */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-share-tech mb-2">
                    Inject Decryption Answer Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ENTER KEYCODE HERE..."
                      value={inputAnswer}
                      onChange={(e) => setInputAnswer(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-100 placeholder-zinc-800 text-sm rounded px-3 py-3 focus:outline-none transition-all uppercase font-mono tracking-widest"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-red-950/20 hover:bg-red-900/40 border border-red-600 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] text-red-500 p-3 rounded transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Feedback Toast */}
                {feedback && (
                  <div
                    className={`p-3 border text-xs rounded font-mono text-center flex items-center justify-center space-x-2 ${
                      feedback.success
                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400"
                        : "bg-red-950/30 border-red-500/40 text-red-400 animate-shake"
                    }`}
                  >
                    {feedback.success ? (
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}
              </form>

              {/* Anomaly Hint Panel */}
              <div className="border-t border-zinc-800/60 pt-4 mt-6">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-red-400 font-share-tech uppercase transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{showHint ? "Conceal decrypt help" : "Anomalous help (Request hint)"}</span>
                </button>

                {showHint && (
                  <div className="mt-3 p-3 bg-red-950/5 border border-red-950/30 text-xs text-zinc-400 rounded leading-relaxed border-dashed animate-fade-in font-mono flex items-start space-x-2">
                    <Eye className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{activeQuestion.hint}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
