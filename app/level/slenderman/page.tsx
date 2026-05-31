"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../context/GameContext";
import { creepypastaLevels } from "../../data/questions";
import "./slender.css";

const levelData = creepypastaLevels.find((l) => l.id === 1)!;

export default function SlendermanPage() {
    const [bgImage, setBgImage] = useState("/images/slenderman/man1.png");
    const router = useRouter();

    const {
        state,
        submitAnswer,
        exitLevelToDashboard,
    } = useGame();

    useEffect(() => {
        const totalImages = 7;

        let current =
            Number(localStorage.getItem("slender-bg")) || 1;

        const next = current + 1 > totalImages
            ? 1
            : current + 1;

        setBgImage(`/images/slenderman/man${current}.png`);

        localStorage.setItem("slender-bg", String(next));
    }, [state.currentQuestion]);

    const [inputAnswer, setInputAnswer] = useState("");
    const [feedback, setFeedback] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    // Security Gate: Ensure user is logged in, and is active on this exact level
    useEffect(() => {
        if (state.isLoggedIn && state.currentLevel !== 1) {
            router.push("/dashboard");
        }
    }, [state.isLoggedIn, state.currentLevel, router]);

    if (!state.isLoggedIn || state.currentLevel !== 1) {
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
            className="slenderman-container"
            style={{
                backgroundImage: `url(${bgImage})`,
            }}
        >
            <div className="slenderman-overlay" />

            <div className="slenderman-content vcr-font">

                {/* TITLE */}
                <div className="title-section">
                    <h1>LEVEL: SLENDER MAN</h1>

                    <Image
                        src="/images/divider.png"
                        alt="divider"
                        width={400}
                        height={40}
                        className="divider-img"
                    />
                </div>

                {/* QUESTION */}
                <p className="cipher-text vcr-font">
                    {activeQuestion.text}
                </p>

                {/* ANSWER */}
                <div className="answer-section vcr-font">

                    <div className="answer-header">
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
                            className={`feedback ${feedback.success
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