import { NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_MAX_AGE, createSessionValue, clauDemoConfigurada } from "../../../../lib/panel-auth";
import { potIntentar, anotarFallada, anotarEncert } from "../../../../lib/limit-intents.mjs";

/**
 * Adreça de qui crida, per al topall d intents. Railway hi posa x-real-ip;
 * x-forwarded-for pot portar al davant el que hagi volgut enviar el client,
 * i per aixo el topall te tambe un comptador global que no en depen.
 */
function ipClient(request) {
  const h = request.headers;
  return (
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconeguda"
  ).slice(0, 64);
}

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

  const tornarAmbError = codi => {
    const url = new URL("/panel/entrar", base);
    url.searchParams.set("error", codi);
    if (seguent !== "/panel") url.searchParams.set("seguent", seguent);
    return NextResponse.redirect(url, { status: 303 });
  };

  // El topall es mira abans de comparar: un cop superat, ni la contrasenya bona
  // entra fins que passi la finestra. Entre aquesta comprovacio i l anotacio de
  // la fallada no hi ha cap await, aixi que peticions simultanies no se'l salten.
  const ip = ipClient(request);
  const limit = potIntentar(ip);
  if (!limit.ok) {
    console.warn("Panell: entrada aturada pel topall d'intents (" + limit.motiu + ")");
    return tornarAmbError("limit");
  }

  // Dues contrasenyes, dos rols. La de la demo nomes existeix si hi ha
  // PANEL_DEMO_PASSWORD, i mai pot ser la mateixa que la de l administrador.
  // Es comparen totes dues sempre, perque el temps de resposta no digui quina ha fallat.
  const clauDemo = clauDemoConfigurada();
  const esAdmin = safeEqual(password, expected);
  const esDemo = safeEqual(password, clauDemo || "") && Boolean(clauDemo);

  if (!esAdmin && !esDemo) {
    anotarFallada(ip);
    return tornarAmbError("1");
  }
  anotarEncert(ip);

  // La demo entra sempre pel Resum: no ha de quedar a mitges d una ruta que no pot fer servir.
  const desti = esAdmin ? seguent : "/panel";
  const sessio = esAdmin
    ? await createSessionValue(secret)
    : await createSessionValue(secret, "demo", clauDemo);

  const response = NextResponse.redirect(new URL(desti, base), { status: 303 });
  response.cookies.set(COOKIE_NAME, sessio, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
