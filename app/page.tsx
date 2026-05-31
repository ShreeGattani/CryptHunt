"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "./context/GameContext";
import { Terminal, ShieldAlert, Cpu, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";

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
    } catch (err: unknown) {
      console.error(err);
      setError("TRANSMISSION ERROR. CONNECTION INTERFERENCE.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Simulation of boot sequence logs
  useEffect(() => {
    const logs = [
      "SYSTEM INITIATED. RETRIEVING PORTAL CONFIG...",
      "CONNECTING TO REMOTE DB SECURE PROTOCOL // MYSQL...",
      "WARNING: ANOMALOUS INTERFERENCE DETECTED.",
      "PARSING CREEPYPASTA METADATA FILES...",
      "ENTITIES DETECTED: [SLENDERMAN, EYELESS_JACK, BEN_DROWNED, PUPPETEER, CANDLE_COVE]",
      "LABYRINTH GATEWAYS: SECURED. DECRYPTION KEY REQUIRED.",
      "AWAITING AGENT IDENTITY INJECTION..."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setConsoleLogs((prev) => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

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
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-950 p-4 md:p-8 font-mono overflow-y-auto">
      {/* Decorative cyber grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370c_1px,transparent_1px),linear-gradient(to_bottom,#1f29370c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-zinc-900/80 border-2 border-red-950 pulse-red-glow rounded-md shadow-2xl relative z-10 backdrop-blur-md overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between bg-zinc-950 px-4 py-2 border-b border-red-950">
          <div className="flex items-center space-x-2 text-red-500 font-bold tracking-widest text-xs font-orbitron">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
            <span>SECURE SYSTEM CONNECTION // CRYPTHUNT</span>
          </div>
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-800"></span>
          </div>
        </div>

        {/* Brand Banner */}
        <div className="p-6 text-center border-b border-zinc-800 bg-black/40">
          <h1 className="text-4xl font-extrabold text-red-600 tracking-wider font-orbitron animate-glitch">
            CRYPTHUNT
          </h1>
          <p className="text-zinc-500 text-xs mt-2 font-share-tech uppercase tracking-widest">
            Creepypasta Digital Labyrinth Edition v7.8.0
          </p>
        </div>

        {/* Tab Selection Header (Login vs Register Navbar Buttons as requested!) */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 select-none">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setError("");
            }}
            disabled={loading}
            className={`flex-1 py-3 text-xs font-orbitron uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all border-r border-zinc-800 cursor-pointer ${
              authMode === "login"
                ? "bg-zinc-900 text-red-500 shadow-[inset_0_-2px_0_0_#ef4444]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>AGENT LOGIN</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setError("");
            }}
            disabled={loading}
            className={`flex-1 py-3 text-xs font-orbitron uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              authMode === "register"
                ? "bg-zinc-900 text-red-500 shadow-[inset_0_-2px_0_0_#ef4444]"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>NEW REGISTRATION</span>
          </button>
        </div>

        {/* Boot Sequence Log View */}
        <div className="p-4 bg-black/80 h-28 overflow-y-auto text-xs text-emerald-500/80 font-mono border-b border-zinc-800 border-dashed space-y-1 select-none">
          {consoleLogs.slice(-5).map((log, index) => (
            <div key={index} className="flex items-start">
              <span className="text-emerald-700 mr-2 select-none">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
          {!loading && <div className="w-2 h-4 bg-emerald-500 animate-pulse inline-block"></div>}
        </div>

        {/* Form Container */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {/* Alias Input only visible in Register mode */}
            {authMode === "register" && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 font-share-tech mb-2">
                  Hacker Alias / Codename
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                    <Terminal className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. GUEST_USER"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 text-zinc-100 placeholder-zinc-750 text-sm rounded px-3 py-2.5 pl-10 focus:outline-none transition-all uppercase font-mono"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 font-share-tech mb-2">
                Core Email Node
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                    <Cpu className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="e.g. gateway@crypt.net"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // Reset OTP states if email is changed
                      setOtpSent(false);
                      setOtpMessage("");
                    }}
                    className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 text-zinc-100 placeholder-zinc-750 text-sm rounded px-3 py-2.5 pl-10 focus:outline-none transition-all font-mono animate-pulse"
                    disabled={loading || otpLoading}
                    required
                  />
                </div>
                {authMode === "register" && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || otpLoading || otpCount >= 2}
                    className="bg-red-950/20 hover:bg-red-900/40 border border-red-600 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] text-red-500 hover:text-red-400 font-share-tech uppercase tracking-widest text-xs px-4 rounded transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {otpLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>SEND OTP</span>
                    )}
                  </button>
                )}
              </div>
              {/* OTP Sent status message */}
              {authMode === "register" && otpMessage && (
                <div className={`text-[10px] mt-1.5 uppercase font-mono tracking-wider font-bold ${otpCount >= 2 && !otpSent ? 'text-red-500' : 'text-emerald-500'}`}>
                  {otpMessage}
                </div>
              )}
            </div>

            {/* OTP Verification Input (only visible in Register mode) */}
            {authMode === "register" && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 font-share-tech mb-2">
                  Decryption OTP Key
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                    <Terminal className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={otpSent ? "ENTER 6-DIGIT CODE" : "REQUEST VERIFICATION KEY FIRST"}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))}
                    className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 text-zinc-100 placeholder-zinc-750 text-sm rounded px-3 py-2.5 pl-10 focus:outline-none transition-all font-mono tracking-widest uppercase"
                    disabled={loading || !otpSent}
                    required
                  />
                </div>
                {devOtp && (
                  <div className="text-[10px] mt-1.5 text-zinc-500 font-mono tracking-wider">
                    TESTING MODE // SIMULATED KEY: <span className="text-red-400 font-bold font-mono bg-red-950/20 px-2 py-0.5 rounded border border-red-950/30">{devOtp}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 font-share-tech mb-2">
                Decryption Password Key
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 text-zinc-100 placeholder-zinc-750 text-sm rounded px-3 py-2.5 focus:outline-none transition-all pr-10 font-mono tracking-widest"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-400 text-xs rounded font-mono text-center flex items-center justify-center space-x-2 animate-bounce">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-red-950/20 hover:bg-red-900/40 border border-red-600 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest text-xs py-3.5 rounded transition-all duration-300 cursor-pointer disabled:opacity-50 select-none flex items-center justify-center space-x-2 font-orbitron"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>ESTABLISHING HANDSHAKE...</span>
                </>
              ) : (
                <span>{authMode === "register" ? "INJECT AGENT CONSCIOUSNESS" : "DECRYPT PORTAL GATEWAY"}</span>
              )}
            </button>
          </form>

          {/* Security Disclaimer */}
          <div className="mt-8 text-center text-[10px] text-zinc-600 space-y-1 select-none">
            <p>BY CLIMBING THESE WALLS YOU CONSENT TO COMPLETE COGNITIVE RECORDING.</p>
            <p>WE WILL WATCH YOU FALL IN LOVE WITH THE VOID.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
