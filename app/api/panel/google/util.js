// Utilitats compartides de l entrada amb Google del panell.

export const GALETA_STATE = "panel_google_state";

export const OPCIONS_GALETA_STATE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/panel/google",
  maxAge: 600,
};

/**
 * Adreça pública del lloc. PANEL_PUBLIC_URL la fixa (per exemple https://www.aulaia.cat),
 * perquè la de Google coincideixi exactament amb la registrada.
 */
export function baseUrlPublica(request) {
  if (process.env.PANEL_PUBLIC_URL) return process.env.PANEL_PUBLIC_URL.replace(/\/+$/, "");
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
