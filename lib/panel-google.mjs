// Entrada al panell amb el compte de Google de cada persona autoritzada.
// Funcions pures: no toquen cookies ni xarxa, així es poden provar soles.

export const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

/** Llista de correus autoritzats, de la variable PANEL_ADMINS (separats per comes). */
export function llistaAdmins(env = process.env) {
  return String(env.PANEL_ADMINS || "")
    .split(/[,\s]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.includes("@"));
}

/** Només entra si el correu està a la llista i Google l'ha verificat. */
export function esAdminAutoritzat(info, llista) {
  if (!info || info.email_verified !== true) return false;
  const correu = String(info.email || "").trim().toLowerCase();
  return correu !== "" && llista.includes(correu);
}

/** Adreça on enviem la persona perquè triï el seu compte de Google. */
export function urlAutoritzacio({ clientId, redirectUri, state }) {
  const u = new URL(GOOGLE_AUTH);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

/** Comparació en temps constant del paràmetre state amb la galeta. */
export function stateValid(rebut, esperat) {
  if (typeof rebut !== "string" || typeof esperat !== "string") return false;
  if (rebut.length === 0 || rebut.length !== esperat.length) return false;
  let diff = 0;
  for (let i = 0; i < rebut.length; i++) diff |= rebut.charCodeAt(i) ^ esperat.charCodeAt(i);
  return diff === 0;
}
