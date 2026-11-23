import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, COOKIE_MAX_AGE, createSessionValue } from "../../../../../lib/panel-auth";
import {
  GOOGLE_TOKEN, GOOGLE_USERINFO, esAdminAutoritzat, llistaAdmins, stateValid,
} from "../../../../../lib/panel-google.mjs";
import { baseUrlPublica, GALETA_STATE } from "../util";

/** Torna a la pantalla d entrada amb un error generic (no diu el correu ni el motiu exacte). */
function tornarAmbError(base, codi) {
  const url = new URL("/panel/entrar", base);
  url.searchParams.set("error", codi);
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.delete(GALETA_STATE);
  return response;
}

export async function GET(request) {
  const base = baseUrlPublica(request);
  const { searchParams } = new URL(request.url);
  const galeta = (await cookies()).get(GALETA_STATE)?.value;
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  if (searchParams.get("error") || !code) return tornarAmbError(base, "google");
  if (!stateValid(state, galeta)) return tornarAmbError(base, "google");

  const clientId = process.env.PANEL_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.PANEL_GOOGLE_CLIENT_SECRET;
  const secret = process.env.PANEL_SECRET;
  if (!clientId || !clientSecret || !secret) return tornarAmbError(base, "google-no");

  // Canvi del codi pel token i lectura del correu verificat, tot des del servidor.
  let info;
  try {
    const tok = await fetch(GOOGLE_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${base}/api/panel/google/retorn`,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!tok.ok) return tornarAmbError(base, "google");
    const { access_token } = await tok.json();
    const resposta = await fetch(GOOGLE_USERINFO, {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!resposta.ok) return tornarAmbError(base, "google");
    info = await resposta.json();
  } catch {
    return tornarAmbError(base, "google");
  }

  if (!esAdminAutoritzat(info, llistaAdmins())) {
    console.warn("Panell: entrada amb Google rebutjada (compte no autoritzat)");
    return tornarAmbError(base, "no-autoritzat");
  }

  console.log("Panell: entrada amb Google");
  const response = NextResponse.redirect(new URL("/panel", base), { status: 303 });
  response.cookies.delete(GALETA_STATE);
  response.cookies.set(COOKIE_NAME, await createSessionValue(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
