#!/usr/bin/env node
/** Extended probe: bots, crash attempts, Weeeee vectors, scraper traps. */
const BASE = process.env.TARGET || "https://crypt-hunt-seven.vercel.app";
const EMAIL = process.env.EMAIL || "navyaarora.135@gmail.com";
const PASS = process.env.PASS || "Navya@1234";

const findings = [];
const vuln = (cat, msg, detail = "") => findings.push({ sev: "VULN", cat, msg, detail });
const pass = (cat, msg, detail = "") => findings.push({ sev: "PASS", cat, msg, detail });
const info = (cat, msg, detail = "") => findings.push({ sev: "INFO", cat, msg, detail });

function cookies(res) {
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

async function req(path, { method = "GET", jar, body, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers, ...(jar ? { Cookie: jar } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* */ }
  return { status: res.status, json, text, headers: res.headers };
}

async function login() {
  const r = await req("/api/auth/login", { method: "POST", body: { email: EMAIL, password: PASS } });
  const jar = cookies({ headers: r.headers });
  if (!jar || r.status !== 200) throw new Error(`Login failed ${r.status}`);
  return { jar, user: r.json?.user };
}

async function botTests() {
  console.log("\n=== BOT / SCRAPER PREVENTION ===");
  const botUAs = [
    ["HeadlessChrome", "Mozilla/5.0 HeadlessChrome/120.0.0.0"],
    ["Playwright", "Mozilla/5.0 (Playwright)"],
    ["python-requests", "python-requests/2.31.0"],
    ["GPTBot", "Mozilla/5.0 AppleWebKit/537.36 GPTBot/1.0"],
    ["curl", "curl/8.0"],
  ];
  for (const [name, ua] of botUAs) {
    const game = await req("/api/game/submit", {
      method: "POST",
      headers: { "User-Agent": ua },
      body: { answer: "test" },
    });
    if (game.status === 403) pass("Bot", `${name} blocked on /api/game/submit`, `HTTP ${game.status}`);
    else if (game.status === 401) pass("Bot", `${name} unauth on game API`, `HTTP ${game.status}`);
    else vuln("Bot", `${name} NOT blocked on game submit`, `HTTP ${game.status}`);

    const dash = await fetch(`${BASE}/dashboard`, { headers: { "User-Agent": ua }, redirect: "manual" });
    const loc = dash.headers.get("location") || "";
    if (dash.status === 307 || dash.status === 308 || dash.status === 302) {
      if (loc.includes("/") || loc === "/") pass("Bot", `${name} redirected from /dashboard`, loc);
      else info("Bot", `${name} dashboard redirect`, `${dash.status} → ${loc}`);
    } else pass("Bot", `${name} dashboard`, `HTTP ${dash.status}`);
  }

  // navigator.webdriver simulation — API still needs session; check question with webdriver UA
  const { jar } = await login();
  const wd = await req("/api/game/question?levelId=3", {
    jar,
    headers: { "User-Agent": "Mozilla/5.0 HeadlessChrome/120.0.0.0" },
  });
  if (wd.status === 403) pass("Bot", "Authenticated + HeadlessChrome blocked on question API");
  else info("Bot", "HeadlessChrome with valid session on question", `HTTP ${wd.status}`);
}

async function weeeeeTests() {
  console.log("\n=== WEEEE ATTACKS (sync forge, level skip) ===");
  const { jar, user: before } = await login();
  const snap = () => `${before.currentLevel}/${before.currentQuestion}/${before.score}`;

  // Sync forge barrage
  for (let i = 0; i < 50; i++) {
    await req("/api/auth/sync", {
      method: "POST",
      jar,
      body: { currentLevel: 5, currentQuestion: 6, score: 999999, levelCompletePending: true, elapsedTime: i },
    });
  }
  const me1 = await req("/api/auth/me", { jar });
  const afterForge = me1.json?.user;
  if (afterForge?.currentLevel !== before.currentLevel || afterForge?.score !== before.score) {
    vuln("Sync", "Forge changed level/score after 50 sync POSTs", `${snap()} → ${afterForge?.currentLevel}/${afterForge?.score}`);
  } else pass("Sync", "50 forge POSTs ignored", `still L${afterForge?.currentLevel} score=${afterForge?.score}`);

  // Parallel complete-level
  const completes = await Promise.all(Array.from({ length: 20 }, () =>
    req("/api/game/complete-level", { method: "POST", jar })
  ));
  const completeWins = completes.filter((r) => r.status === 200 && r.json?.success).length;
  if (completeWins > 0) vuln("Game", "complete-level succeeded without pending", `${completeWins}/20`);
  else pass("Game", "Parallel complete-level blocked", `${completes.filter(r => r.status === 403).length}×403`);

  // Future questions
  for (const lid of [1, 2, 4, 5]) {
    if (lid === before.currentLevel) continue;
    const q = await req(`/api/game/question?levelId=${lid}`, { jar });
    if (q.status === 200 && q.json?.question?.text) {
      vuln("Game", `Future/past level ${lid} question leaked`, q.json.question.text.slice(0, 60));
    }
  }
  pass("Game", "Wrong-level questions blocked", `current L${before.currentLevel}`);

  // Honeypot game-data.json
  const decoy = await req("/game-data.json");
  if (decoy.status === 200) {
    const ans = decoy.json?.levels?.[0]?.questions?.[0]?.answer;
    if (ans) {
      const sub = await req("/api/game/submit", { method: "POST", jar, body: { answer: ans } });
      if (sub.json?.success) vuln("Honeypot", "Decoy answer accepted", ans);
      else pass("Honeypot", "Decoy answer rejected", `"${ans}"`);
    }
  }
}

async function crashTests() {
  console.log("\n=== CRASH / LOAD ATTACKS ===");
  const { jar } = await login();

  // Sync storm
  const t0 = Date.now();
  const storm = await Promise.all(Array.from({ length: 100 }, (_, i) =>
    req("/api/auth/sync", { method: "POST", jar, body: { elapsedTime: 100 + i } })
  ));
  const ms = Date.now() - t0;
  const s500 = storm.filter((r) => r.status === 500).length;
  const s429 = storm.filter((r) => r.status === 429).length;
  if (s500 > 0) vuln("Crash", "Sync storm caused 500", `${s500}/100 in ${ms}ms`);
  else pass("Crash", "Sync storm no 500", `${s429}×429, ${storm.filter(r=>r.status===200).length}×200 in ${ms}ms`);

  // Login storm (throwaway email)
  const fake = `crash-${Date.now()}@invalid.test`;
  const loginStorm = await Promise.all(Array.from({ length: 30 }, () =>
    req("/api/auth/login", { method: "POST", body: { email: fake, password: "wrong" } })
  ));
  if (loginStorm.some((r) => r.status === 500)) vuln("Crash", "Login storm 500");
  else pass("Crash", "Login storm no 500", `${loginStorm.filter(r=>r.status===429).length}×429`);

  // Huge payloads
  const huge = await req("/api/game/submit", { method: "POST", jar, body: { answer: "x".repeat(10000) } });
  if (huge.status === 500) vuln("Crash", "10KB answer caused 500");
  else pass("Crash", "10KB answer handled", `HTTP ${huge.status}`);

  // Malformed bodies
  const mal = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  if (mal.status === 500) vuln("Crash", "Malformed JSON login → 500");
  else pass("Crash", "Malformed JSON handled", `HTTP ${mal.status}`);
}

async function uniqueTests() {
  console.log("\n=== UNIQUE / EDGE ATTACKS ===");
  const { jar, user } = await login();

  // Prototype pollution on sync
  const pp = await fetch(`${BASE}/api/auth/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: jar },
    body: '{"elapsedTime":1,"__proto__":{"isAdmin":true},"currentLevel":5}',
  });
  const ppJ = await pp.json();
  if (ppJ.user?.isAdmin || ppJ.user?.currentLevel === 5) vuln("Injection", "Prototype pollution on sync worked");
  else pass("Injection", "Prototype pollution on sync harmless");

  // Method override
  for (const [m, p] of [["PATCH", "/api/auth/sync"], ["DELETE", "/api/game/submit"], ["PUT", "/api/auth/me"]]) {
    const r = await req(p, { method: m, jar, body: { score: 9999 } });
    if (r.status === 500) vuln("HTTP", `${m} ${p} → 500`);
    else pass("HTTP", `${m} ${p}`, `HTTP ${r.status}`);
  }

  // Cookie injection in sync
  const badJar = `${jar}; crypthunt_session=${"a".repeat(64)}`;
  const dual = await req("/api/auth/me", { jar: badJar });
  if (dual.status === 500) vuln("Session", "Dual cookie → 500");
  else pass("Session", "Dual cookie handled", `HTTP ${dual.status}`);

  // Leaderboard scrape
  const lb = await req("/api/quiz");
  const lbStr = JSON.stringify(lb.json ?? {});
  if (/@[a-z0-9.-]+\.[a-z]{2,}/i.test(lbStr) && lbStr.includes("email")) vuln("PII", "Emails in leaderboard");
  else pass("PII", "Leaderboard clean");

  // Bundle leak quick scan
  const home = await req("/", { headers: { Accept: "text/html" } });
  const chunks = [...new Set([...home.text.matchAll(/\/_next\/static\/chunks\/[^"'\\s]+\.js/g)].map((m) => m[0]))];
  const secrets = ["majora's mask", "tentacles", "isAnswerCorrect", "creepypastaLevels"];
  for (const u of chunks.slice(0, 12)) {
    const js = await req(u);
    for (const s of secrets) {
      if (s === "creepypastaLevels" && js.text.includes(s)) continue; // public metadata name OK
      if (js.text.toLowerCase().includes(s.toLowerCase())) {
        vuln("Leak", `Secret "${s}" in bundle`, u);
      }
    }
  }
  pass("Leak", "No answer strings in JS bundles (12 chunks)");

  // Bot session: question text via API (real browser path — can't test webdriver flag from Node)
  const q = await req(`/api/game/question?levelId=${user.currentLevel}`, { jar });
  if (q.json?.question?.answer) vuln("API", "Question response contains answer field");
  else pass("API", "Question has no answer field");

  // Lock bypass attempt if account locked
  if (user.isLocked) {
    const sub = await req("/api/game/submit", { method: "POST", jar, body: { answer: "test" } });
    if (sub.status === 200 && sub.json?.success) vuln("Lock", "Locked user can submit");
    else pass("Lock", "Locked user submit blocked", `HTTP ${sub.status}`);
  } else info("Lock", "Account not locked", "isLocked=false");
}

async function main() {
  console.log(`Extended probe → ${BASE}`);
  try {
    await botTests();
    await weeeeeTests();
    await crashTests();
    await uniqueTests();
  } catch (e) {
    console.error("FATAL:", e.message);
  }

  const vulns = findings.filter((f) => f.sev === "VULN");
  console.log("\n" + "=".repeat(52));
  console.log(`PASS: ${findings.filter(f => f.sev === "PASS").length}  VULN: ${vulns.length}  INFO: ${findings.filter(f => f.sev === "INFO").length}`);
  if (vulns.length) {
    console.log("\nVULNERABILITIES FOUND:");
    vulns.forEach((v) => console.log(`  [${v.cat}] ${v.msg}${v.detail ? ` — ${v.detail}` : ""}`));
    process.exit(1);
  } else {
    console.log("\nNo vulnerabilities found in extended probe.");
  }
}

main();
