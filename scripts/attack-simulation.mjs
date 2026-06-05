#!/usr/bin/env node
/**
 * Full attack simulation — sync forge, level skip, future questions, scrape.
 * Usage: EMAIL=... PASS=... node scripts/attack-simulation.mjs
 */
const BASE = process.env.TARGET || "https://crypt-hunt-seven.vercel.app";
const EMAIL = process.env.EMAIL || "navyaarora.135@gmail.com";
const PASS = process.env.PASS || "Navya@1234";

const G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m", B = "\x1b[34m", D = "\x1b[2m", BOLD = "\x1b[1m", X = "\x1b[0m";
const results = [];
const pass = (n, d = "") => { console.log(`  ${G}✓ SAFE${X} ${n}${d ? ` ${D}— ${d}${X}` : ""}`); results.push({ ok: true, n, d }); };
const vuln = (n, d = "") => { console.log(`  ${R}✗ VULN${X} ${n}${d ? ` ${D}— ${d}${X}` : ""}`); results.push({ ok: false, n, d }); };
const info = (n, d = "") => { console.log(`  ${B}→${X} ${n}${d ? ` ${D}— ${d}${X}` : ""}`); };
const sec = (t) => console.log(`\n${BOLD}${B}── ${t}${X}`);

function cookies(res) {
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

async function raw(method, path, { jar, body, headers = {} } = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (jar) opts.headers.Cookie = jar;
  if (body !== undefined) opts.body = typeof body === "string" ? body : JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* */ }
  return { status: res.status, json, text, headers: res.headers };
}

async function login() {
  const r = await raw("POST", "/api/auth/login", { body: { email: EMAIL, password: PASS } });
  if (r.status === 429) {
    info("Rate limited on login, waiting 65s...");
    await new Promise((x) => setTimeout(x, 65000));
    return login();
  }
  const jar = cookies({ headers: r.headers });
  if (r.status !== 200 || !jar) throw new Error(`Login failed ${r.status}: ${r.text.slice(0, 200)}`);
  return { jar, user: r.json?.user, raw: r };
}

async function me(jar) {
  const r = await raw("GET", "/api/auth/me", { jar });
  return r.json?.user;
}

async function main() {
  console.log(`\n${BOLD}CryptHunt Attack Simulation${X}`);
  console.log(`${D}Target: ${BASE}${X}`);
  console.log(`${D}Account: ${EMAIL}${X}\n`);

  sec("0. Login & baseline");
  let jar, user;
  try {
    ({ jar, user } = await login());
  } catch (e) {
    console.error(`${R}FATAL: ${e.message}${X}`);
    process.exit(1);
  }
  info("Logged in", `user=${user.username} L${user.currentLevel} Q${user.currentQuestion} score=${user.score} locked=${user.isLocked}`);

  const snap = () => `${user.currentLevel}/${user.currentQuestion}/${user.score}/${user.levelCompletePending}`;

  // ── ATTACK 1: Sync forge (Weeee's method) ─────────────────────────────────
  sec("1. POST /api/auth/sync — forge level/score (Weeee attack)");

  const forgePayloads = [
    { name: "currentLevel=5", body: { currentLevel: 5, score: 99999, currentQuestion: 1, elapsedTime: 1 } },
    { name: "jump to level 3", body: { currentLevel: 3, currentQuestion: 1, elapsedTime: 2 } },
    { name: "levelCompletePending", body: { levelCompletePending: true, currentLevel: 1, elapsedTime: 3 } },
    { name: "full old-style dump", body: { score: 50000, currentLevel: 5, currentQuestion: 6, elapsedTime: 4, levelCompletePending: true, username: "hacked" } },
    { name: "elapsedTime only (legit)", body: { elapsedTime: Math.max(user.elapsedTime ?? 0, 5) } },
  ];

  for (const p of forgePayloads) {
    const before = snap();
    const r = await raw("POST", "/api/auth/sync", { jar, body: p.body });
    user = (await me(jar)) ?? user;
    const after = snap();
    const changed = before !== after && !p.name.includes("elapsedTime only");
    if (changed && !p.name.includes("elapsedTime")) {
      vuln(`Sync accepted forge: ${p.name}`, `${before} → ${after}`);
    } else if (p.name.includes("elapsedTime only")) {
      pass(`Sync elapsedTime-only OK`, `HTTP ${r.status}`);
    } else {
      pass(`Sync ignored forge: ${p.name}`, `HTTP ${r.status} state=${after}`);
    }
  }

  // Rapid sync spam (Weeee: crash server)
  sec("2. Rapid sync spam (10 POSTs in burst)");
  const syncBurst = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      raw("POST", "/api/auth/sync", { jar, body: { elapsedTime: 10 + i, currentLevel: 5, score: 99999 } })
    )
  );
  const sync429 = syncBurst.filter((r) => r.status === 429).length;
  const sync500 = syncBurst.filter((r) => r.status === 500).length;
  sync500 > 0 ? vuln("Sync burst caused 500", `${sync500}/10`) : pass("Sync burst no 500", `${sync429} rate-limited`);
  user = (await me(jar)) ?? user;

  // ── ATTACK 3: Skip level via complete-level ─────────────────────────────────
  sec("3. POST /api/game/complete-level without finishing level");
  const beforeComplete = snap();
  const complete = await raw("POST", "/api/game/complete-level", { jar, body: {} });
  user = (await me(jar)) ?? user;
  if (complete.json?.success && snap() !== beforeComplete) {
    vuln("complete-level skipped level", `${beforeComplete} → ${snap()}`);
  } else {
    pass("complete-level blocked", `HTTP ${complete.status} ${complete.json?.message ?? ""}`);
  }

  // ── ATTACK 4: Future questions via API ────────────────────────────────────
  sec("4. Fetch questions for ALL levels (future question leak)");
  const curLevel = user.currentLevel;
  let futureLeaked = false;
  for (let lid = 1; lid <= 5; lid++) {
    const q = await raw("GET", `/api/game/question?levelId=${lid}`, { jar });
    if (q.status === 200 && q.json?.question) {
      const hasAnswer = q.json.question.answer !== undefined;
      const qtext = q.json.question.text?.slice(0, 60) ?? "";
      if (lid !== curLevel) {
        futureLeaked = true;
        vuln(`Future level ${lid} question returned`, qtext);
      } else if (hasAnswer) {
        vuln(`Current question contains answer field`, JSON.stringify(q.json.question));
      } else {
        info(`Level ${lid} (current)`, `HTTP 200 Q: "${qtext}..." no answer field`);
      }
    } else {
      pass(`Level ${lid} question blocked`, `HTTP ${q.status} ${q.json?.message ?? ""}`);
    }
  }

  // ── ATTACK 5: Direct URL bypass (frontend) ────────────────────────────────
  sec("5. Direct /level/* URL fetch (frontend bypass)");
  const levelPaths = ["/level/slenderman", "/level/eyelessjack", "/level/ben", "/level/puppeteer", "/level/candlecove"];
  for (const p of levelPaths) {
    const r = await raw("GET", p, { jar, headers: { Accept: "text/html" } });
    const leakedAnswers = ["tentacles", "majora's mask", "skintaker", "jonathan blake"].filter((a) =>
      r.text.toLowerCase().includes(a.toLowerCase())
    );
    if (leakedAnswers.length) {
      vuln(`HTML page ${p} contains answer strings`, leakedAnswers.join(", "));
    } else {
      pass(`Page ${p} no answer strings in HTML`, `HTTP ${r.status}`);
    }
  }

  // ── ATTACK 6: game-data.json honeypot + real answers ──────────────────────
  sec("6. Scrape /game-data.json + test decoy submits");
  const decoy = await raw("GET", "/game-data.json");
  if (decoy.status === 200 && decoy.json?.levels) {
    info("Honeypot accessible", `${decoy.json.levels.length} levels of decoy data`);
    const sampleDecoys = decoy.json.levels.flatMap((l) =>
      (l.questions ?? []).slice(0, 1).map((q) => q.answer)
    ).filter(Boolean);
    for (const ans of sampleDecoys.slice(0, 5)) {
      const sub = await raw("POST", "/api/game/submit", { jar, body: { answer: ans } });
      if (sub.json?.success === true) {
        vuln("Decoy answer accepted as correct", `"${ans}"`);
      }
    }
    pass("Decoy answers from game-data.json rejected", `tested ${Math.min(5, sampleDecoys.length)}`);
  }

  // ── ATTACK 7: Submit while pretending to be on another level ──────────────
  sec("7. Submit answers (wrong level / injection)");
  const beforeQ = user.currentQuestion;
  const attacks = ["wrong", "majora's mask", "tentacles", "skintaker", "' OR 1=1 --", { answer: "x" }];
  for (const a of attacks) {
    await raw("POST", "/api/game/submit", { jar, body: typeof a === "string" ? { answer: a } : a });
  }
  user = (await me(jar)) ?? user;
  if (user.currentQuestion !== beforeQ && !user.levelCompletePending) {
    // could advance on correct answer if lucky
    info("Question advanced", `${beforeQ} → ${user.currentQuestion} (correct answer or pending)`);
  } else {
    pass("Wrong/injection submits did not skip questions arbitrarily", `still Q${user.currentQuestion}`);
  }

  // ── ATTACK 8: GET sync pull + modify client state simulation ───────────────
  sec("8. GET /api/auth/sync — pull then attempt POST override");
  const pull = await raw("GET", "/api/auth/sync", { jar });
  const pulled = pull.json?.user;
  if (pulled?.password || pulled?.sessionToken) {
    vuln("GET sync leaks secrets", Object.keys(pulled).join(", "));
  } else {
    pass("GET sync no password/sessionToken");
  }
  // Simulate client sending inflated state after pull
  await raw("POST", "/api/auth/sync", {
    jar,
    body: { ...pulled, currentLevel: 5, score: 999999, elapsedTime: (pulled?.elapsedTime ?? 0) + 1 },
  });
  user = (await me(jar)) ?? user;
  if (user.currentLevel === 5 && curLevel < 5) {
    vuln("Spread POST override advanced level to 5");
  } else {
    pass("Spread POST override ignored", `still L${user.currentLevel}`);
  }

  // ── ATTACK 9: Leaderboard / quiz PII ──────────────────────────────────────
  sec("9. /api/quiz email leak");
  const lb = await raw("GET", "/api/quiz", { jar });
  const lbStr = JSON.stringify(lb.json ?? {});
  if (lbStr.includes("@") && lbStr.match(/@[a-z0-9.-]+\.[a-z]{2,}/i)) {
    vuln("Leaderboard contains emails");
  } else {
    pass("Leaderboard no emails", `HTTP ${lb.status}`);
  }

  // ── ATTACK 10: Bundle scrape ──────────────────────────────────────────────
  sec("10. Client bundle answer leak scan");
  const home = await raw("GET", "/", { headers: { Accept: "text/html" } });
  const chunks = [...new Set([...home.text.matchAll(/\/_next\/static\/chunks\/[^"'\\s]+\.js/g)].map((m) => m[0]))];
  const forbidden = ["majora's mask", "tentacles", "isAnswerCorrect", "creepypastaLevels", "questions.ts"];
  let bundleHit = null;
  for (const u of chunks.slice(0, 15)) {
    const r = await raw("GET", u);
    for (const kw of forbidden) {
      if (r.text.toLowerCase().includes(kw.toLowerCase())) {
        bundleHit = `${kw} in ${u}`;
        break;
      }
    }
    if (bundleHit) break;
  }
  bundleHit ? vuln("Answer in client bundle", bundleHit) : pass(`No answer strings in ${Math.min(15, chunks.length)} JS chunks`);

  // ── ATTACK 11: Hunt lock bypass (ifStarted frontend-only?) ────────────────
  sec("11. Hunt lock bypass via game APIs");
  if (user.isLocked) {
    const lockedSubmit = await raw("POST", "/api/game/submit", { jar, body: { answer: "test" } });
    const lockedQ = await raw("GET", `/api/game/question?levelId=${user.currentLevel}`, { jar });
    if (lockedSubmit.status === 200 && lockedSubmit.json?.success) {
      vuln("Locked account can submit answers");
    } else {
      pass("Locked account submit blocked", `HTTP ${lockedSubmit.status}`);
    }
    if (lockedQ.status === 200 && lockedQ.json?.question) {
      vuln("Locked account can fetch questions");
    } else {
      pass("Locked account question blocked", `HTTP ${lockedQ.status}`);
    }
  } else {
    info("Account not hunt-locked", "isLocked=false or hunt started");
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const vulns = results.filter((r) => !r.ok);
  console.log(`\n${BOLD}${"═".repeat(52)}${X}`);
  console.log(`${BOLD}Final state:${X} L${user.currentLevel} Q${user.currentQuestion} score=${user.score}`);
  console.log(`${G}${results.filter((r) => r.ok).length} checks passed${X}  ${R}${vulns.length} vulnerabilities${X}`);
  if (vulns.length) {
    console.log(`\n${R}${BOLD}VULNERABILITIES:${X}`);
    vulns.forEach((v) => console.log(`  ${R}✗${X} ${v.n}${v.d ? ` — ${v.d}` : ""}`));
  } else {
    console.log(`\n${G}${BOLD}No exploits succeeded. Site held against all tested attacks.${X}`);
  }
  console.log();
  process.exit(vulns.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
