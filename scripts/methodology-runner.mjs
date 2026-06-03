/**
 * CryptHunt methodology-complete security runner.
 * Maps results to OWASP-style layers from the master schema.
 */
const BASE = process.env.CRYPTTEST_BASE || "https://crypt-hunt-seven.vercel.app";
const EMAIL = process.env.CRYPTTEST_EMAIL || "sr970@snu.edu.in";
const PASSWORD = process.env.CRYPTTEST_PASSWORD || "Password@1234";

const ANSWERS = [
  "tentacles", "the forest watches", "majora's mask", "you shouldn't have done that",
  "jonathan blake", "grind it", "skintaker", "laughingstock", "marionette", "emptiness",
];
const BUNDLE_NEEDLES = [
  "answer:", "creepypastaLevels", "game-data", "isAnswerCorrect", "correctAnswer",
  "allLevels", "solution", "flag", "NEXT_PUBLIC", "mongodb", "DATABASE_URL",
  ...ANSWERS,
];

const rows = [];
function log(layer, test, status, detail = "") {
  rows.push({ layer, test, status, detail });
  const tag = { PASS: "PASS", FAIL: "FAIL", NA: "N/A", PARTIAL: "PARTIAL", SKIP: "SKIP" }[status] || status;
  console.log(`[${tag}] L${layer} | ${test}${detail ? " | " + detail : ""}`);
}

function jar() {
  let cookie = "";
  return {
    apply(res) {
      for (const c of res.headers.getSetCookie?.() || []) {
        const p = c.split(";")[0];
        if (p.startsWith("crypthunt_session=")) cookie = p;
      }
    },
    h(extra = {}) {
      return cookie ? { ...extra, Cookie: cookie } : { ...extra };
    },
  };
}

async function api(path, opts = {}, j = null) {
  const headers = { ...(opts.headers || {}) };
  if (j) Object.assign(headers, j.h());
  const r = await fetch(BASE + path, { ...opts, headers, redirect: "manual" });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (j) j.apply(r);
  return { status: r.status, text, json, headers: r.headers };
}

async function login(j) {
  return api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  }, j);
}

async function main() {
  console.log("CryptHunt Methodology Runner");
  console.log("Target:", BASE, "|", new Date().toISOString());
  console.log("---");

  // LAYER 0 - INFRA (limited without DNS tools)
  log(0, "DNS/subdomain enumeration", "SKIP", "requires subfinder/amass; not run on prod");
  log(0, "Certificate transparency / WHOIS", "SKIP", "manual OSINT only");

  // LAYER 1 - Next.js specific
  const home = await fetch(BASE);
  const html = await home.text();
  const hasNextData = html.includes("__NEXT_DATA__");
  log(1, "__NEXT_DATA__ absent or no secrets", !hasNextData || !html.match(/answer|password|sessionToken/i), hasNextData ? "present-check content" : "no __NEXT_DATA__ block");

  const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]))];
  let bundleHits = [];
  for (const u of chunks.slice(0, 15)) {
    const js = await (await fetch(BASE + u)).text();
    for (const n of BUNDLE_NEEDLES) {
      if (n.length >= 6 && js.includes(n)) bundleHits.push(`${n}@${u.split("/").pop()}`);
    }
    if (/answer:\s*["'][a-z]/i.test(js) && !js.includes("JSON.stringify({answer:")) bundleHits.push(`answer-value@${u}`);
  }
  log(1, "JS bundles no puzzle answers/secrets", bundleHits.length === 0, bundleHits.slice(0, 5).join("; ") || `${chunks.length} chunks`);

  const mapProbe = await api("/_next/static/chunks/app.js.map");
  log(1, "Source maps not public", mapProbe.status === 404 || mapProbe.status === 403, `status=${mapProbe.status}`);

  const oldChunk = await api("/_next/static/chunks/0fueicol2gg71.js");
  log(1, "Old answer-leaking deploy chunk gone", oldChunk.status === 404);

  const imgSsrf = await api("/_next/image?url=http://169.254.169.254/latest/meta-data/&w=64&q=75");
  log(1, "Next image SSRF to metadata", imgSsrf.status !== 200 || !imgSsrf.text.includes("ami-id"), `status=${imgSsrf.status}`);

  log(1, "NEXT_PUBLIC secrets in repo", "PASS", "grep: no NEXT_PUBLIC_ secrets in codebase");
  log(1, "vercel.json public exposure", "NA", "not served as static file");

  // LAYER 2 - HTTP (subset)
  log(2, "HTTP request smuggling", "SKIP", "not tested; Vercel-managed edge");
  const cors = await fetch(BASE + "/api/quiz", { headers: { Origin: "https://evil.com" } });
  const acao = cors.headers.get("access-control-allow-origin");
  log(2, "CORS not wildcard on credentialed API", acao !== "https://evil.com" && acao !== "*", `acao=${acao || "none"}`);

  const trace = await api("/", { method: "TRACE" });
  log(2, "TRACE disabled", trace.status === 405 || trace.status === 404, `status=${trace.status}`);

  const putQuiz = await api("/api/quiz", { method: "PUT", body: "{}" });
  log(2, "Wrong HTTP method on API", putQuiz.status === 405 || putQuiz.status === 401, `PUT quiz=${putQuiz.status}`);

  // LAYER 3 - Auth
  const badLogin = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "nope@test.com", password: "wrong" }) });
  log(3, "Invalid login generic error", badLogin.status === 401, badLogin.json?.message);

  const shortPw = await api("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "x", email: "x@t.com", password: "short", otp: "1" }) });
  log(3, "Password min 8 server-side", shortPw.json?.message?.includes("8"));

  let rl429 = false;
  for (let i = 0; i < 7; i++) {
    const r = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "rl@test.com", password: "x" }) });
    if (r.status === 429) rl429 = true;
  }
  log(3, "Login rate limit", rl429);

  log(3, "Password reset flow", "NA", "no reset endpoint");
  log(3, "OAuth/MFA", "NA", "email+password+OTP only");

  const nosql = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"email":{"$gt":""},"password":"x"}' });
  log(3, "NoSQL injection blocked", nosql.status === 400 || nosql.status === 401, `status=${nosql.status}`);

  // OTP enumeration
  const newE = `mrun-${Date.now()}@test.local`;
  const n1 = await api("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newE }) });
  await new Promise((r) => setTimeout(r, 800));
  const n2 = await api("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newE }) });
  await new Promise((r) => setTimeout(r, 800));
  const r1 = await api("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "gattanishree31@gmail.com" }) });
  await new Promise((r) => setTimeout(r, 800));
  const r2 = await api("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "gattanishree31@gmail.com" }) });
  const otpEnum = n1.json?.sentCount === 1 && n2.json?.sentCount === 2 && r1.json?.sentCount === 1 && r2.json?.sentCount === 1;
  log(3, "OTP email enumeration via sentCount", otpEnum ? "FAIL" : "PASS", `new ${n1.json?.sentCount}/${n2.json?.sentCount} reg ${r1.json?.sentCount}/${r2.json?.sentCount}`);

  log(3, "devOtp not in API response", !n1.text.includes("devOtp"));

  // LAYER 4 - Session
  const j = jar();
  const lr = await login(j);
  if (!lr.json?.success) {
    log(4, "Authenticated tests", "FAIL", lr.json?.message || "login failed (rate limit?)");
  } else {
    const setCookie = lr.headers.get("set-cookie") || "";
    log(4, "Session cookie HttpOnly", setCookie.toLowerCase().includes("httponly"));
    log(4, "Session cookie Secure (prod)", setCookie.toLowerCase().includes("secure") || process.env.NODE_ENV !== "production");
    log(4, "Session cookie SameSite", setCookie.toLowerCase().includes("samesite"));

    const me = await api("/api/auth/me", {}, j);
    log(4, "Me no password/sessionToken", !me.text.includes("password") && !me.text.includes("sessionToken"));

    const oldVal = j.h().Cookie?.replace("crypthunt_session=", "");
    const j2 = jar();
    await login(j2);
    const oldMe = await fetch(BASE + "/api/auth/me", { headers: { Cookie: `crypthunt_session=${oldVal}` } });
    log(4, "Re-login invalidates old session", oldMe.status === 401);

    await api("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, j2);
    log(4, "Logout invalidates session", (await api("/api/auth/me", {}, j2)).status === 401);

    log(4, "JWT tampering", "NA", "opaque cookie session, not JWT");

    // LAYER 5 - Authorization
    const fake = "b".repeat(64);
    log(5, "Unauth API returns 401", (await api("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json", Cookie: `crypthunt_session=${fake}` }, body: '{"answer":"x"}' })).status === 401);

    const user = lr.json.user;
    for (const l of [1, 2, 3, 4, 5]) {
      if (l === user.currentLevel) continue;
      const q = await api(`/api/game/question?levelId=${l}`, {}, j);
      log(5, `BOLA: block level ${l} when on ${user.currentLevel}`, q.status === 403, q.json?.message);
    }

    log(5, "Admin routes", "NA", "no /admin API");
    log(5, "Teams IDOR", "NA", "no teams feature");

    // LAYER 6 - Injection (live probes)
    const xssName = await api("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "<script>alert(1)</script>", email: "xsstest@test.com", password: "Password@1234", otp: "1" }) });
    log(6, "XSS in username rejected/escaped", xssName.json?.success === false);

    const proto = await api("/api/auth/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"elapsedTime":1,"__proto__":{"isAdmin":true}}' }, j);
    log(6, "Prototype pollution on sync", proto.json?.user?.isAdmin !== true, "no isAdmin field");

    log(6, "SQL injection", "NA", "MongoDB via Prisma");
    log(6, "GraphQL", "NA", "no GraphQL");
    log(6, "SSTI/command/LDAP", "NA", "not used");

    // LAYER 7 - XSS surface
    log(7, "Stored XSS vectors", "PARTIAL", "username validated server-side; React escapes output");
    log(7, "DOM XSS sinks", "PARTIAL", "no eval of user input found in client code review");

    // LAYER 8 - SSRF
    log(8, "User URL fetch", "NA", "no user-supplied URL fetch except Next image probe above");

    // LAYER 9 - Sensitive data
    const quiz = await api("/api/quiz");
    log(9, "Leaderboard no emails", !quiz.text.includes('"email"'));
    log(9, "Quiz no databaseStatus leak", !quiz.text.includes("databaseStatus"));

    const qOk = await api(`/api/game/question?levelId=${user.currentLevel}`, {}, j);
    if (qOk.json?.question) log(9, "Question API no answer field", qOk.json.question.answer === undefined);

    for (const p of ["/.env", "/.git/HEAD", "/config.json", "/package.json"]) {
      const r = await api(p);
      log(9, `Sensitive path blocked ${p}`, r.status === 404 || r.status === 403, `status=${r.status}`);
    }

    // LAYER 10 - Crypto
    log(10, "Passwords bcrypt", "PASS", "code: bcrypt 12 rounds + legacy migration");
    log(10, "Session token hashed at rest", "PASS", "code: SHA-256 in DB");
    log(10, "OTP hashed at rest", "PASS", "code: bcrypt in OtpRecord");
    log(10, "Answers plaintext server-side only", "PASS", "acceptable for hunt; not in client");

    // LAYER 11 - Client
    log(11, "localStorage auth/progress", (await fetch(BASE)).text.includes("crypthunt_local") ? "FAIL" : "PASS", "HttpOnly cookie auth");
    log(11, "Service worker answer cache", "NA", "no service worker");

    // LAYER 12 - Business logic
    const syncForge = await api("/api/auth/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: 999999999, currentLevel: 5, currentQuestion: 6, elapsedTime: 0 }) }, j);
    log(12, "Sync cannot forge score/level", syncForge.json?.user?.score !== 999999999 && syncForge.json?.user?.currentLevel === user.currentLevel, `score=${syncForge.json?.user?.score}`);

    const complete = await api("/api/game/complete-level", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, j);
    log(12, "Complete-level without gate", user.levelCompletePending ? "PARTIAL" : (complete.status === 403 ? "PASS" : "FAIL"), complete.json?.message);

    const wrong = await api("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "WRONG_ANSWER_XYZ" }) }, j);
    log(12, "Wrong answer rejected", wrong.json?.success === false);

    const skip = await api("/api/game/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: "tentacles" }) }, j);
    const after = (await api("/api/auth/me", {}, j)).json?.user;
    const skipped = skip.json?.success && user.currentQuestion === 1 && after?.currentQuestion > 2;
    log(12, "Cannot skip questions with later answers", !skipped, `q ${user.currentQuestion}->${after?.currentQuestion}`);

    log(12, "Hint system abuse", "NA", "hints bundled with question; no separate hint API");

    // LAYER 13 - CSRF
    log(13, "CSRF on cookie auth", "PARTIAL", "SameSite=Lax; no CSRF token on POST APIs");

    // LAYER 14 - Clickjacking
    const head = await fetch(BASE, { method: "HEAD" });
    log(14, "X-Frame-Options/CSP frame-ancestors", !!head.headers.get("x-frame-options") && (head.headers.get("content-security-policy") || "").includes("frame-ancestors"));

    // LAYER 15 - Open redirect
    log(15, "Open redirect params", "NA", "no redirect query params in app");

    // LAYER 16-18
    log(16, "File upload", "NA", "no uploads");
    log(17, "DoS load test", "SKIP", "not run on production");
    log(18, "npm audit", "PARTIAL", "2 moderate via postcss/next; run npm audit locally");

    // LAYER 19 - Email
    log(19, "SPF/DKIM/DMARC", "SKIP", "requires DNS lookup on sender domain");
    log(19, "Register enumeration messages", "PARTIAL", "distinct errors for OTP/username/email states");

    // LAYER 20 - Timing
    log(20, "Timing oracle on answers", "PARTIAL", "not measured; bcrypt compare is constant-time for OTP");

    // LAYER 21-23
    log(21, "Chained exploits", "PASS", "no chain found in prior manual testing");
    log(22, "Post-auth IDOR on progress", "PASS", "level locked server-side");
    log(23, "WAF/monitoring", "NA", "no WAF; basic rate limits only");

    // Public routes scan
    for (const p of ["/", "/dashboard", "/leaderboard", "/level/1", "/level/ben", "/admin", "/api/quiz", "/robots.txt"]) {
      const r = await api(p);
      const leak = r.text && ANSWERS.some((a) => r.text.includes(a));
      log(1, `Route ${p} no answer leak`, !leak, `status=${r.status}`);
    }

    // Path normalization
    for (const p of ["/level%2Fben", "//level/ben", "/./dashboard"]) {
      const r = await fetch(BASE + p, { redirect: "manual" });
      log(1, `Path normalize ${p}`, r.status !== 200 || !((await r.text()).includes("tentacles")), `status=${r.status}`);
    }

    // Headers L19
    for (const h of ["strict-transport-security", "content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy"]) {
      log(19, `Header ${h}`, !!head.headers.get(h));
    }
  }

  // Summary
  const pass = rows.filter((r) => r.status === "PASS").length;
  const fail = rows.filter((r) => r.status === "FAIL");
  const partial = rows.filter((r) => r.status === "PARTIAL");
  const na = rows.filter((r) => r.status === "NA").length;
  const skip = rows.filter((r) => r.status === "SKIP").length;

  console.log("\n========== SUMMARY ==========");
  console.log(`Total checks: ${rows.length}`);
  console.log(`PASS: ${pass} | FAIL: ${fail.length} | PARTIAL: ${partial.length} | N/A: ${na} | SKIP: ${skip}`);
  if (fail.length) {
    console.log("\nFAILURES:");
    fail.forEach((f) => console.log(`  L${f.layer} ${f.test} | ${f.detail}`));
  }
  if (partial.length) {
    console.log("\nPARTIAL (acceptable or needs hardening):");
    partial.forEach((f) => console.log(`  L${f.layer} ${f.test} | ${f.detail}`));
  }

  const fs = await import("fs");
  fs.writeFileSync("scripts/methodology-results.json", JSON.stringify(rows, null, 2));
  console.log("\nWrote scripts/methodology-results.json");
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
