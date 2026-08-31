import { NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_MAX_AGE, createSessionValue } from "../../../../lib/panel-auth";

/** Comparacio en temps constant per no filtrar la contrasenya pel temps de resposta. */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * URL publica real de la peticio.
 * Dins del contenidor, request.url apunta a localhost: si la fem servir per
 * redirigir, el navegador acaba a localhost i no al domini public.
 */
function baseUrl(request) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function POST(request) {
  const expected = process.env.PANEL_PASSWORD;
  const secret = process.env.PANEL_SECRET;
  const base = baseUrl(request);

  if (!expected || !secret) {
    return NextResponse.json(
      { error: "El panell no esta configurat. Falten PANEL_PASSWORD o PANEL_SECRET." },
      { status: 503 }
    );
  }

  let password = "";
  let seguent = "/panel";
  try {
    const form = await request.formData();
    password = String(form.get("password") || "");
    const s = String(form.get("seguent") || "");
    // Nomes acceptem rutes internes, mai una URL externa.
    if (s.startsWith("/") && !s.startsWith("//")) seguent = s;
  } catch {
    return NextResponse.json({ error: "Peticio invalida" }, { status: 400 });
  }

  if (!safeEqual(password, expected)) {
    const url = new URL("/panel/entrar", base);
    url.searchParams.set("error", "1");
    if (seguent !== "/panel") url.searchParams.set("seguent", seguent);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(seguent, base), { status: 303 });
  response.cookies.set(COOKIE_NAME, await createSessionValue(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
