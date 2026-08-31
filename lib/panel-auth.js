/**
 * Sessio del panell: cookie signada amb HMAC-SHA256.
 * Fem servir Web Crypto perque el middleware corre a l Edge runtime.
 */

const COOKIE = "panel_session";
const MAX_AGE = 60 * 60 * 12; // 12 hores

function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(mac);
}

/** Comparacio en temps constant, per no filtrar informacio pel temps de resposta. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionValue(secret) {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = String(exp);
  return `${payload}.${await sign(payload, secret)}`;
}

export async function isValidSession(value, secret) {
  if (!value || !secret) return false;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = await sign(payload, secret);
  if (!safeEqual(mac, expected)) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > Date.now();
}

export const COOKIE_NAME = COOKIE;
export const COOKIE_MAX_AGE = MAX_AGE;
