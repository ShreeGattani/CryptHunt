"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "./context/GameContext";
import { Terminal, ShieldAlert, Cpu, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";
import "./login.css";

export default function LoginPage() {
  const { login, register, state } = useGame();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // OTP Verification State
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCount, setOtpCount] = useState(0);
  const [otpMessage, setOtpMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("VALID CORE EMAIL NODE REQUIRED FOR DISPATCH.");
      return;
    }
    setError("");
    setOtpLoading(true);
    setOtpMessage("");
    setDevOtp("");

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpSent(true);
        setOtpCount(data.sentCount || 1);
        setOtpMessage(data.message || "OTP transmission verified.");
        if (data.devOtp) {
          setDevOtp(data.devOtp);
          setConsoleLogs((prev) => [
            ...prev,
            `[DEV SIMULATION: VERIFICATION KEY DETECTED = ${data.devOtp}]`
          ]);
        }
        setConsoleLogs((prev) => [
          ...prev,
          `[VERIFICATION DISPATCHED: ATTEMPT ${data.sentCount || 1}/2]`
        ]);
      } else {
        setError(data.message || "OTP transmission denied.");
        setConsoleLogs((prev) => [
          ...prev,
          `[DISPATCH FAILED: ${data.message?.toUpperCase() || "ERROR"}]`
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setError("TRANSMISSION ERROR. CONNECTION INTERFERENCE.");
    } finally {
      setOtpLoading(false);
    }
  };


  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("VALID EMAIL ADDRESS MUST BE INJECTED.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError("DECRYPTION PASS KEY MUST BE 4+ CHARACTERS.");
      return;
    }

    if (authMode === "register" && !username.trim()) {
      setError("ALIAS REQUIRED FOR INTRUSION TRACKING.");
      return;
    }

    setLoading(true);
    setConsoleLogs((prev) => [
      ...prev,
      `[INITIATING AUTH HANDSHAKE: MODE=${authMode.toUpperCase()}, EMAIL=${email.toUpperCase()}]`
    ]);

    let res;
    if (authMode === "register") {
      res = await register(username, email, password, otp);
    } else {
      res = await login(email, password);
    }

    setLoading(false);
    if (!res.success) {
      setError(res.message);
      setConsoleLogs((prev) => [...prev, `[HANDSHAKE FAILED: ${res.message.toUpperCase()}]`]);
    } else {
      setConsoleLogs((prev) => [...prev, `[HANDSHAKE VERIFIED. ACCESS GRANTED.]`]);
    }
  };

  return (
  <div className="login-page">

    <div className="crypt-frame">

      <div className="crypt-inner">

        {/* LOGO */}

        <div className="logo-section">

          <h1>CRYPTX FILES</h1>

          <p>
            CREEPYPASTA DIGITAL LABYRINTH EDITION V7.8.0
          </p>

        </div>

        {/* TABS */}

        <div className="auth-tabs">

          <button
            type="button"
            className={authMode === "login" ? "active" : ""}
            onClick={() => {
              setAuthMode("login");
              setError("");
            }}
          >
            <LogIn size={16} />
            AGENT LOGIN
          </button>

          <button
            type="button"
            className={authMode === "register" ? "active" : ""}
            onClick={() => {
              setAuthMode("register");
              setError("");
            }}
          >
            <UserPlus size={16} />
            NEW REGISTRATION
          </button>

        </div>

        {/* FORM PANEL */}

        <div className="form-panel">

          <form onSubmit={handleAuthSubmit}>

            {authMode === "register" && (
              <div className="field">

                <label>HACKER ALIAS</label>

                <div className="input-box">
                  <Terminal size={18} />

                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    placeholder="GUEST_USER"
                    disabled={loading}
                  />
                </div>

              </div>
            )}

            {/* EMAIL */}

            <div className="field">

              <label>CORE EMAIL NODE</label>

              <div className="email-row">

                <div className="input-box grow">

                  <Cpu size={18} />

                  <input
                    type="email"
                    value={email}
                    placeholder="e.g. gateway@crypt.net"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setOtpSent(false);
                      setOtpMessage("");
                    }}
                  />

                </div>

                {authMode === "register" && (
                  <button
                    type="button"
                    className="otp-btn"
                    onClick={handleSendOtp}
                    disabled={
                      otpLoading ||
                      loading ||
                      otpCount >= 2
                    }
                  >
                    SEND OTP
                  </button>
                )}

              </div>

              {otpMessage && (
                <div className="otp-message">
                  {otpMessage}
                </div>
              )}

            </div>

            {/* OTP */}

            {authMode === "register" && (
              <div className="field">

                <label>DECRYPTION OTP KEY</label>

                <div className="input-box">

                  <Terminal size={18} />

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, "")
                          .substring(0, 6)
                      )
                    }
                    disabled={!otpSent}
                    placeholder="ENTER OTP"
                  />

                </div>

                {devOtp && (
                  <div className="dev-otp">
                    DEV OTP : {devOtp}
                  </div>
                )}

              </div>
            )}

            {/* PASSWORD */}

            <div className="field">

              <label>
                DECRYPTION PASSWORD KEY
              </label>

              <div className="input-box">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••••"
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="error-box">
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            {/* BUTTON */}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading
                ? "ESTABLISHING HANDSHAKE..."
                : authMode === "register"
                ? "INJECT AGENT CONSCIOUSNESS"
                : "DECRYPT PORTAL GATEWAY"}
            </button>

          </form>

          {/* PAPER */}

          <div className="warning-note">

            <p>
              BY CLIMBING THESE WALLS YOU
              CONSENT TO COMPLETE
              COGNITIVE RECORDING.
            </p>

            <p>
              WE WILL WATCH YOU FALL IN
              LOVE WITH THE VOID. EHEHEHEHEHE (maybe clue)
            </p>

          </div>

        </div>

      </div>

    </div>

  </div>
  );
}
