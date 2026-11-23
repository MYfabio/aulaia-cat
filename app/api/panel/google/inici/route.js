import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { urlAutoritzacio } from "../../../../../lib/panel-google.mjs";
import { baseUrlPublica, GALETA_STATE, OPCIONS_GALETA_STATE } from "../util";

/**
 * Comença l entrada amb Google: envia la persona a Google i deixa una galeta
 * amb un valor aleatori (state) que el retorn ha de tornar, per evitar que
 * algú fora del panell completi una entrada que no ha demanat.
 */
export async function GET(request) {
  const base = baseUrlPublica(request);
  const clientId = process.env.PANEL_GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.PANEL_GOOGLE_CLIENT_SECRET) {
    const url = new URL("/panel/entrar", base);
    url.searchParams.set("error", "google-no");
    return NextResponse.redirect(url, { status: 303 });
  }

  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(
    urlAutoritzacio({ clientId, redirectUri: `${base}/api/panel/google/retorn`, state }),
    { status: 303 }
  );
  response.cookies.set(GALETA_STATE, state, OPCIONS_GALETA_STATE);
  return response;
}
