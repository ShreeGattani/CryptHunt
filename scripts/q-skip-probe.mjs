#!/usr/bin/env node
const BASE = "https://crypt-hunt-seven.vercel.app";
const EMAIL = "navyaarora.135@gmail.com";
const PASS = "Navya@1234";

function jar(res) {
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

async function me(cookie) {
  const r = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
  return (await r.json()).user;
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  return { cookie: jar(res), user: (await res.json()).user };
}

async function run() {
  const { cookie } = await login();
  let u = await me(cookie);
  console.log("Before:", `L${u.currentLevel} Q${u.currentQuestion} score=${u.score}`);

  await fetch(`${BASE}/api/auth/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ currentQuestion: 2, elapsedTime: (u.elapsedTime || 0) + 1 }),
  });
  u = await me(cookie);
  console.log("After sync forge Q2:", `Q${u.currentQuestion}`);

  for (const a of ["wrong", "majora", "cartridge"]) {
    await fetch(`${BASE}/api/game/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ answer: a }),
    });
  }
  u = await me(cookie);
  console.log("After wrong answers:", `Q${u.currentQuestion}`);

  const sub = await fetch(`${BASE}/api/game/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ answer: "majora's mask" }),
  });
  const body = await sub.text();
  console.log("Correct Q1:", sub.status, body);
}

run().catch(console.error);
