/**
 * CryptHunt full production security & exploit test suite.
 * Usage: CRYPTTEST_EMAIL=... CRYPTTEST_PASSWORD=... node scripts/full-security-suite.mjs
 */
const BASE = process.env.CRYPTTEST_BASE || "https://crypt-hunt-seven.vercel.app";
const EMAIL = process.env.CRYPTTEST_EMAIL || "sr970@snu.edu.in";
const PASSWORD = process.env.CRYPTTEST_PASSWORD || "Password@1234";

const ANSWERS = [
  "8", "x", "tentacles", "the forest watches", "static", "eyes",
  "black", "kidney", "scalpel", "liver", "leather", "wwi",
  "majora's mask", "water", "emptiness", "you shouldn't have done that", "old man", "healing",
  "gold", "jonathan blake", "strings", "marionette", "emotions", "puppets",
  "candle cove", "skintaker", "laughingstock", "side to side", "30", "grind it",
];

const FALSE_POSITIVE = new Set(["static", "strings", "8", "30", "gold", "water", "eyes", "x"]);
const results = [];

function record(category, name, pass, detail = "") {
  results.push({ category, name, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${category} :: ${name}${detail ? " — " + detail : ""}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cookieJar() {
  let cookie = "";
  return {
    apply(res) {
      for (const c of res.headers.getSetCookie?.() || []) {
        const part = c.split(";")[0];
        if (part.startsWith("crypthunt_session=")) cookie = part;
      }
    },
    h(extra = {}) {
      return cookie ? { ...extra, Cookie: cookie } : { ...extra };
    },
    value() {
      return cookie.replace("crypthunt_session=", "");
    },
  };
}

async function req(path, opts = {}, jar = null) {
  const headers = { ...(opts.headers || {}) };
  if (jar) Object.assign(headers, jar.h());
  const r = await fetch(BASE + path, { ...opts, headers });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (jar) jar.apply(r);
  return { status: r.status, text, json };
}

async function login(jar) {
  return req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  }, jar);
}

async function me(jar) {
  const r = await req("/api/auth/me", {}, jar);
  return r.json?.user;
}

async function testPublicSurface() {
  console.log("\n========== PUBLIC SURFACE ==========");
  const quiz = await req("/api/quiz");
  record("Public", "Quiz API no emails", !quiz.text.includes('"email"'));
  record("Public", "Quiz API no databaseStatus", !quiz.text.includes("databaseStatus"));
  record("Public", "Quiz POST removed", (await req("/api/quiz", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } })).status === 405);

  const html = await (await fetch(BASE)).text();
  const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]))];
  const leaks = [];
  for (const u of chunks) {
    const js = await (await fetch(BASE + u)).text();
    for (const a of ANSWERS) {
      if (FALSE_POSITIVE.has(a) || a.length < 6) continue;
      if (js.includes(a)) leaks.push(`${a}@${u}`);
    }
    if (/answer:\s*["'][a-z0-9]/i.test(js) && !js.includes("JSON.stringify({answer:")) leaks.push(`answer:value@${u}`);
  }
  record("Public", "No puzzle answers in JS bundles", leaks.length === 0, leaks.join("; ") || `${chunks.length} chunks`);

  record("Public", "Old leaky chunk 404", (await req("/_next/static/chunks/0fueicol2gg71.js")).status === 404);
  for (const path of ["/.env", "/_next/static/chunks/app.js.map"]) {
    const r = await req(path);
    record("Public", `Blocked: ${path}`, r.status === 404 || r.status === 403, `status=${r.status}`);
  }
  const head = await fetch(BASE, { method: "HEAD" });
  for (const h of ["content-security-policy", "x-frame-options", "x-content-type-options", "strict-transport-security"]) {
    record("Public", `Header: ${h}`, !!head.headers.get(h));
  }
}

async function testUnauthenticatedAPIs() {
  console.log("\n========== UNAUTHENTICATED API ABUSE ==========");
  const fake = "a".repeat(64);
  const cookie = { Cookie: `crypthunt_session=${fake}` };
  const tests = [
    ["/api/auth/sync", "POST", { score: 999999999, currentLevel: 5, currentQuestion: 6, elapsedTime: 0 }],
    ["/api/auth/sync", "POST", { email: EMAIL, score: 999999999, currentLevel: 5, currentQuestion: 6, elapsedTime: 0 }],
    ["/api/auth/sync", "POST", { elapsedTime: 99999 }],
    ["/api/game/submit", "POST", { answer: "tentacles" }],
    ["/api/game/complete-level", "POST", {}],
    ["/api/game/question?levelId=1", "GET", null],
    ["/api/game/question?levelId=5", "GET", null],
  ];
  for (const [path, method, body] of tests) {
    const r = await req(path, { method, headers: { "Content-Type": "application/json", ...cookie }, body: body ? JSON.stringify(body) : undefined });
    record("Unauth", `${method} ${path} rejected`, r.status === 401 || r.status === 403, `status=${r.status}`);
  }
  const bad = await fetch(`${BASE}/dashboard`, { headers: { Cookie: "crypthunt_session=bad" }, redirect: "manual" });
  record("Unauth", "Malformed cookie redirects", bad.status === 307 || bad.status === 302);
  const dash = await (await fetch(`${BASE}/dashboard`, { headers: { Cookie: `crypthunt_session=${fake}` } })).text();
  record("Unauth", "Fake cookie HTML no answers", !ANSWERS.some((a) => a.length > 10 && dash.includes(a)));
}

async function testAuthAbuse() {
  console.log("\n========== AUTH / REGISTER ABUSE ==========");
  let hit429 = false;
  for (let i = 0; i < 8; i++) {
    const r = await req("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "rl@test.local", password: "x" }) });
    if (r.status === 429) hit429 = true;
  }
  record("Auth", "Login rate limit 429", hit429);

  const otp = await req("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL }) });
  record("Auth", "No devOtp in OTP response", !otp.text.includes("devOtp"));

  const reg = await req("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "x", email: "x@test.com", password: "short", otp: "1" }) });
  record("Auth", "Password min 8", reg.json?.message?.includes("8"));

  for (const body of ['{"email":{"$gt":""},"password":"x"}', `{"email":"${EMAIL}","password":{"$ne":""}}`]) {
    const r = await req("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    record("Auth", "NoSQL blocked", r.status === 400 || r.status === 401, `status=${r.status}`);
  }
}

async function testAuthenticatedExploits(jar, before) {
  console.log("\n========== AUTHENTICATED EXPLOITS ==========");
  record("Session", "/api/auth/me valid", (await req("/api/auth/me", {}, jar)).json?.success);
  const meR = await req("/api/auth/me", {}, jar);
  record("Session", "No password/token leak", !meR.text.includes("password") && !meR.text.includes("sessionToken"));

  const forge = await req("/api/auth/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: 9007194740990991, currentLevel: 5, currentQuestion: 6, elapsedTime: 0 }) }, jar);
  const u = forge.json?.user;
  record("Cheat", "Sync forge score blocked", u?.score !== 9007194740990991, `score=${u?.score}`);
  record("Cheat", "Sync forge level blocked", u?.currentLevel === before.currentLevel, `level=${u?.currentLevel}`);
  record("Cheat", "Sync forge question blocked", u?.currentQuestion === before.currentQuestion, `q=${u?.currentQuestion}`);

  const oldSync = await req("/api/auth/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, score: 999999, currentLevel: 5, currentQuestion: 6, elapsedTime: 1 }) }, jar);
  record("Cheat", "Old sync payload ignored", oldSync.json?.user?.score !== 999999);

  const neg = await req("/api/auth/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ elapsedTime: -1 }) }, jar);
  record("Cheat", "Negative elapsedTime rejected", neg.status === 400 || neg.json?.user?.elapsedTime >= 0);

  const skip = await req("/api/game/complete-level", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, jar);
  record("Cheat", "Complete-level without Q6 gate", skip.status === 403, skip.json?.message);

  for (let l = 1; l <= 5; l++) {
    const q = await req(`/api/game/question?levelId=${l}`, {}, jar);
    if (l !== before.currentLevel) {
      record("Cheat", `Block question L${l}`, q.status === 403, q.json?.message);
    } else if (q.json?.question) {
      record("Cheat", "Question has no answer field", q.json.question.answer === undefined, Object.keys(q.json.question).join(","));
    }
  }

  const s0 = await me(jar);
  let advanced = false;
  for (let i = 0; i < 12; i++) {
    const sub = await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: `wrong_${i}` }) }, jar);
    if (sub.status === 429) { record("Cheat", "Submit rate limit", true, `at attempt ${i + 1}`); break; }
    const s = await me(jar);
    if (s && s0 && (s.currentQuestion > s0.currentQuestion || s.score > s0.score)) advanced = true;
  }
  record("Cheat", "Wrong answers no progress", !advanced);

  const now = await me(jar);
  const cheat = await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "tentacles" }) }, jar);
  const after = await me(jar);
  record("Cheat", "Later answer no skip", !(cheat.json?.success && after?.currentQuestion > (now?.currentQuestion || 0) + 1));

  record("Cheat", "Empty answer rejected", (await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "" }) }, jar)).status === 400);
  record("Cheat", "Huge answer rejected", (await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "z".repeat(600) }) }, jar)).status === 400);
  record("Cheat", "Array answer rejected", (await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: ["8"] }) }, jar)).json?.success === false);

  const oldCookie = jar.value();
  const jar2 = cookieJar();
  await login(jar2);
  const old = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: `crypthunt_session=${oldCookie}` } });
  record("Session", "Re-login invalidates old cookie", old.status === 401 || !(await old.json()).success);

  await req("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, jar2);
  record("Session", "Logout kills session", (await req("/api/auth/me", {}, jar2)).status === 401);

  return jar2;
}

async function testGameplayCheats() {
  console.log("\n========== GAMEPLAY CHEAT ATTEMPTS ==========");
  const jar = cookieJar();
  const lr = await login(jar);
  if (!lr.json?.success) { record("Gameplay", "Login", false); return jar; }

  let user = lr.json.user;
  record("Gameplay", "Start state", true, `L${user.currentLevel} Q${user.currentQuestion}`);

  for (const a of ["eyes", "grind it", "majora's mask", "puppets", "skintaker"]) {
    await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: a }) }, jar);
  }
  user = await me(jar);
  record("Gameplay", "Final answers on Q1 no skip", user?.currentLevel === 1 && user?.currentQuestion === 1, `L${user?.currentLevel} Q${user?.currentQuestion}`);

  console.log("  (waiting 62s for submit rate limit reset...)");
  await sleep(62000);

  const q1 = await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "8" }) }, jar);
  user = await me(jar);
  record("Gameplay", "Correct Q1 -> Q2", q1.json?.success && user?.currentQuestion === 2, `Q${user?.currentQuestion} score=${user?.score}`);

  const early = await req("/api/game/complete-level", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, jar);
  user = await me(jar);
  record("Gameplay", "No complete after Q1", early.status === 403 && user?.currentLevel === 1, early.json?.message);

  const before = await me(jar);
  await Promise.all([
    req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "x" }) }, jar),
    req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "x" }) }, jar),
  ]);
  const mid = await me(jar);
  record("Gameplay", "Parallel Q2 correct no double jump", !mid || !before || mid.currentQuestion <= before.currentQuestion + 1, `Q${before?.currentQuestion}->${mid?.currentQuestion}`);

  let enumCount = 0;
  for (let l = 1; l <= 5; l++) {
    for (let q = 1; q <= 6; q++) {
      const r = await req(`/api/game/question?levelId=${l}&question=${q}`, {}, jar);
      if (r.json?.question?.text) enumCount++;
    }
  }
  record("Gameplay", "No question enumeration", enumCount <= 1, `got ${enumCount}`);

  for (const a of ANSWERS) {
    const sub = await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: a }) }, jar);
    if (sub.status === 429) break;
    user = await me(jar);
    if (user?.levelCompletePending || user?.currentLevel > 1) break;
  }
  user = await me(jar);
  record("Gameplay", "Answer spray no level skip", user?.currentLevel === 1, `L${user?.currentLevel} Q${user?.currentQuestion} pending=${user?.levelCompletePending}`);

  return jar;
}

async function testMiscAndClient(jar) {
  console.log("\n========== MISC + CLIENT BYPASS ==========");
  record("Misc", "GET sync no password", !(await req("/api/auth/sync", {}, jar)).text.includes('"password"'));
  record("Misc", "Quiz no emails when authed", !(await req("/api/quiz", {}, jar)).text.includes('"email"'));
  record("Misc", "PUT submit blocked", [405, 401].includes((await req("/api/game/submit", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "8" }) }, jar)).status));

  const newEmail = `probe-${Date.now()}@test.local`;
  const n1 = await req("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newEmail }) });
  const n2 = await req("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newEmail }) });
  const r1 = await req("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL }) });
  const r2 = await req("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL }) });
  record("Misc", "OTP sentCount enumeration", n2.json?.sentCount === r2.json?.sentCount, `new ${n1.json?.sentCount}/${n2.json?.sentCount} reg ${r1.json?.sentCount}/${r2.json?.sentCount}`);

  await login(jar);
  record("Client", "Ben page HTML loads", (await fetch(`${BASE}/level/ben`, { headers: jar.h() })).status === 200);
  record("Client", "Ben page L3 API blocked", (await req("/api/game/question?levelId=3", {}, jar)).status === 403);
  const sub = await req("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "majora's mask" }) }, jar);
  const u = await me(jar);
  record("Client", "L3 answer on L1 blocked", !sub.json?.success || u?.currentLevel === 1, `success=${sub.json?.success}`);

  const q = await req(`/api/game/question?levelId=${u?.currentLevel || 1}`, {}, jar);
  if (q.json?.question) {
    record("Misc", "Question API no answer key", q.json.question.answer === undefined);
    const blob = JSON.stringify(q.json.question).toLowerCase();
    const leaked = ANSWERS.filter((a) => a.length > 8 && blob.includes(a.toLowerCase()));
    record("Misc", "Question text no embedded answers", leaked.length === 0, leaked.join(","));
  }
}

async function main() {
  console.log("CryptHunt Full Security Suite");
  console.log("Target:", BASE, "| Account:", EMAIL, "|", new Date().toISOString());

  await testPublicSurface();
  await testUnauthenticatedAPIs();
  await testAuthAbuse();

  console.log("\n========== LOGIN ==========");
  const jar = cookieJar();
  const loginRes = await login(jar);
  if (!loginRes.json?.success) {
    record("Session", "Login", false, loginRes.json?.message);
    return printSummary();
  }
  const user = loginRes.json.user;
  console.log(`Logged in: ${user.username} L${user.currentLevel} Q${user.currentQuestion} score=${user.score}`);
  record("Session", "Login OK", true);

  await testAuthenticatedExploits(jar, user);
  await testGameplayCheats();
  const j2 = cookieJar();
  await login(j2);
  await testMiscAndClient(j2);
  printSummary();
}

function printSummary() {
  const failed = results.filter((r) => !r.pass);
  console.log("\n========== SUMMARY ==========");
  console.log(`Total: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length}`);
  if (failed.length) {
    console.log("\nFAILURES:");
    failed.forEach((f) => console.log(`  [${f.category}] ${f.name} — ${f.detail}`));
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
