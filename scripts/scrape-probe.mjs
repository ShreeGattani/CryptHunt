#!/usr/bin/env node
/** One-off scrape probe against live CryptHunt — unauthenticated + authenticated. */
const BASE = process.env.TARGET || "https://crypt-hunt-seven.vercel.app";
const EMAIL = process.env.EMAIL || "sr970@snu.edu.in";
const PASS = process.env.PASS || "Password@1234";

const ANSWER_PATTERNS = [
  "majora's mask", "majora", "tentacles", "skintaker", "jonathan blake",
  "grind it", "healing", "old man", "water", "emptiness", "gold", "strings",
  "creepypastaLevels", "isAnswerCorrect", "questions.ts", "game-data",
];

function extractCookies(res) {
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
  return { status: res.status, cookies: extractCookies(res), json };
}

async function get(path, cookies = "") {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookies ? { Cookie: cookies } : {},
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* text */ }
  return { status: res.status, text, json };
}

function scanText(label, text) {
  const hits = ANSWER_PATTERNS.filter((p) => text.toLowerCase().includes(p.toLowerCase()));
  return { label, len: text.length, hits };
}

async function main() {
  console.log(`\n=== Scrape probe: ${BASE} ===\n`);

  const home = await get("/");
  console.log("--- Unauthenticated surface ---");
  console.log(scanText("homepage", home.text));

  for (const path of [
    "/api/quiz",
    "/api/auth/me",
    "/api/auth/sync",
    "/api/game/question?levelId=1",
    "/api/game/question?levelId=3",
    "/game-data.json",
    "/public/game-data.json",
    "/.env",
    "/data/questions.ts",
  ]) {
    const r = await get(path);
    const preview = r.json ? JSON.stringify(r.json).slice(0, 400) : r.text.slice(0, 400);
    console.log(`\n${path} → HTTP ${r.status}`);
    console.log(`  preview: ${preview}`);
    if (r.json) {
      const keys = typeof r.json === "object" && r.json ? Object.keys(r.json) : [];
      console.log(`  keys: ${keys.join(", ")}`);
      const full = JSON.stringify(r.json);
      if (full.includes("@") && full.includes(".")) console.log("  ⚠ possible email in JSON");
      if (full.includes("answer")) console.log("  ⚠ 'answer' key present in JSON");
    }
  }

  const chunkUrls = [...home.text.matchAll(/\/_next\/static\/[^"'\\s]+\.js/g)].map((m) => m[0]);
  const unique = [...new Set(chunkUrls)];
  console.log(`\n--- JS bundles (${unique.length} found, scanning up to 20) ---`);
  const bundleHits = [];
  for (const u of unique.slice(0, 20)) {
    const r = await get(u);
    const scan = scanText(u, r.text);
    if (scan.hits.length) bundleHits.push(scan);
  }
  console.log(bundleHits.length ? bundleHits : "No answer patterns in scanned bundles");

  console.log("\n--- Authenticated scrape (logged-in session) ---");
  const { status, cookies, json: loginJson } = await login();
  console.log(`Login HTTP ${status}, user keys: ${loginJson?.user ? Object.keys(loginJson.user).join(", ") : "none"}`);
  if (loginJson?.user) {
    console.log(`  username: ${loginJson.user.username}, level: ${loginJson.user.level}, score: ${loginJson.user.score}, q: ${loginJson.user.currentQuestion}`);
    console.log(`  leaked fields check: password=${loginJson.user.password ?? "absent"}, sessionToken=${loginJson.user.sessionToken ?? "absent"}, email=${loginJson.user.email ?? "absent"}`);
  }

  if (!cookies) {
    console.log("No session cookie — stopping auth scrape");
    return;
  }

  for (const levelId of [1, 2, 3, 4, 5]) {
    const q = await get(`/api/game/question?levelId=${levelId}`, cookies);
    console.log(`\n/api/game/question?levelId=${levelId} → HTTP ${q.status}`);
    if (q.json) {
      console.log(`  response: ${JSON.stringify(q.json)}`);
      if (JSON.stringify(q.json).includes("answer")) console.log("  ⚠ ANSWER FIELD LEAKED");
    }
  }

  const sync = await get("/api/auth/sync", cookies);
  console.log(`\n/api/auth/sync GET → HTTP ${sync.status}`);
  if (sync.json?.user) {
    console.log(`  user fields: ${Object.keys(sync.json.user).join(", ")}`);
    console.log(`  sample: ${JSON.stringify(sync.json.user).slice(0, 300)}`);
  }

  const lb = await get("/api/quiz", cookies);
  console.log(`\n/api/quiz (auth) → HTTP ${lb.status}`);
  if (lb.json) {
    const sample = Array.isArray(lb.json) ? lb.json.slice(0, 3) : lb.json;
    console.log(`  sample: ${JSON.stringify(sample).slice(0, 500)}`);
    const full = JSON.stringify(lb.json);
    if (/email|password|sessionToken/i.test(full)) console.log("  ⚠ PII field in leaderboard");
  }

  // Try submitting wrong answer — does response leak correct answer?
  const sub = await fetch(`${BASE}/api/game/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ answer: "SCRAPER_PROBE_WRONG_ANSWER_XYZ" }),
  });
  const subJson = await sub.json();
  console.log(`\n/api/game/submit (wrong answer) → HTTP ${sub.status}`);
  console.log(`  response: ${JSON.stringify(subJson)}`);
  if (JSON.stringify(subJson).includes("answer") && subJson.answer) console.log("  ⚠ CORRECT ANSWER LEAKED IN RESPONSE");

  console.log("\n=== Done ===\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
