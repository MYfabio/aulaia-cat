/**
 * Vigilància de les apps: n8n mira cada 5 minuts si cada app respon i, quan
 * una cau o torna, ho envia aquí signat. Aquest fitxer només valida el
 * missatge i en fa el correu; no toca la xarxa (ho fa app/api/vigilancia).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const ESTATS = ["caiguda", "recuperada"];
const MAX_CANVIS = 40;
const MAX_ANTIGUITAT_MS = 10 * 60 * 1000;

/** Compara la signatura HMAC-SHA256 (hex) del cos en temps constant. */
export function signaturaValida(cos, rebuda, secret) {
  if (!secret || typeof rebuda !== "string" || !/^[0-9a-f]{64}$/.test(rebuda)) return false;
  const esperada = createHmac("sha256", secret).update(cos).digest();
  return timingSafeEqual(esperada, Buffer.from(rebuda, "hex"));
}

/**
 * { data, canvis: [{ app, estat, codi, segons }] }. Només apps del catàleg (o
 * «aulaia-cat»), estat conegut, i un missatge de menys de 10 minuts.
 */
export function llegirAvis(text, slugs, ara = Date.now()) {
  let cos;
  try { cos = JSON.parse(text); } catch { return { ok: false, error: "json" }; }
  if (!cos || typeof cos !== "object" || !Array.isArray(cos.canvis)) return { ok: false, error: "format" };
  const data = Date.parse(cos.data);
  if (!Number.isFinite(data) || Math.abs(ara - data) > MAX_ANTIGUITAT_MS) return { ok: false, error: "data" };
  if (cos.canvis.length === 0 || cos.canvis.length > MAX_CANVIS) return { ok: false, error: "canvis" };
  const valids = new Set([...slugs, "aulaia-cat"]);
  const canvis = [];
  for (const c of cos.canvis) {
    if (!c || !valids.has(c.app) || !ESTATS.includes(c.estat)) return { ok: false, error: "canvi" };
    const codi = Number.isInteger(c.codi) && c.codi >= 0 && c.codi < 1000 ? c.codi : 0;
    const segons = Number.isFinite(c.segons) && c.segons >= 0 && c.segons < 120 ? Math.round(c.segons * 10) / 10 : null;
    canvis.push({ app: c.app, estat: c.estat, codi, segons });
  }
  return { ok: true, canvis };
}

/** Correu de text pla: què ha caigut, què ha tornat, i on mirar-ho. */
export function correuVigilancia(canvis, nomApp) {
  const caigudes = canvis.filter(c => c.estat === "caiguda");
  const tornades = canvis.filter(c => c.estat === "recuperada");
  const noms = llista => llista.map(c => nomApp(c.app)).join(", ");
  const assumpte = caigudes.length
    ? `🔴 Caiguda: ${noms(caigudes)}${tornades.length ? ` · 🟢 Torna: ${noms(tornades)}` : ""}`
    : `🟢 Torna a funcionar: ${noms(tornades)}`;
  const linia = c =>
    `- ${nomApp(c.app)}: ${c.estat === "caiguda" ? "no respon" : "torna a respondre"}` +
    (c.codi ? ` (codi ${c.codi}${c.segons != null ? `, ${c.segons} s` : ""})` : c.estat === "caiguda" ? " (sense resposta)" : "");
  const text = [
    caigudes.length ? "Apps que no responen:" : null,
    ...caigudes.map(linia),
    caigudes.length && tornades.length ? "" : null,
    tornades.length ? "Apps que tornen a funcionar:" : null,
    ...tornades.map(linia),
    "",
    "Ho ha detectat la vigilància d'n8n (cada 5 minuts, i dues fallades seguides abans d'avisar).",
    "Què fer: obrir Railway, mirar els registres del servei i, si cal, tornar-lo a desplegar.",
    "Estat de les apps: https://www.aulaia.cat/panel",
  ].filter(l => l !== null);
  return { assumpte, text: text.join("\n") };
}
