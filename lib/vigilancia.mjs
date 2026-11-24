/**
 * Vigilància de les apps: n8n mira cada 5 minuts si cada app respon i si
 * l'última publicació a Railway ha anat bé. Quan hi ha un canvi, ho envia
 * aquí signat. Aquest fitxer només valida el missatge i en fa el correu; no
 * toca la xarxa (ho fa app/api/vigilancia).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const ESTATS = ["caiguda", "recuperada", "publicacio-fallida", "publicacio-no-respon", "publicacio-encallada"];
const MAX_CANVIS = 40;
const MAX_ANTIGUITAT_MS = 10 * 60 * 1000;

/** Compara la signatura HMAC-SHA256 (hex) del cos en temps constant. */
export function signaturaValida(cos, rebuda, secret) {
  if (!secret || typeof rebuda !== "string" || !/^[0-9a-f]{64}$/.test(rebuda)) return false;
  const esperada = createHmac("sha256", secret).update(cos).digest();
  return timingSafeEqual(esperada, Buffer.from(rebuda, "hex"));
}

/** Un missatge signat també ha de ser recent, perquè no es pugui reenviar més tard. */
export function dataRecent(text, ara = Date.now()) {
  const data = Date.parse(text);
  return Number.isFinite(data) && Math.abs(ara - data) <= MAX_ANTIGUITAT_MS;
}

/**
 * { data, canvis: [{ app, estat, codi, segons, versio }] }. Només apps del
 * catàleg (o «aulaia-cat»), estat conegut, i un missatge de menys de 10 minuts.
 */
export function llegirAvis(text, slugs, ara = Date.now()) {
  let cos;
  try { cos = JSON.parse(text); } catch { return { ok: false, error: "json" }; }
  if (!cos || typeof cos !== "object" || !Array.isArray(cos.canvis)) return { ok: false, error: "format" };
  if (!dataRecent(cos.data, ara)) return { ok: false, error: "data" };
  if (cos.canvis.length === 0 || cos.canvis.length > MAX_CANVIS) return { ok: false, error: "canvis" };
  const valids = new Set([...slugs, "aulaia-cat"]);
  const canvis = [];
  for (const c of cos.canvis) {
    if (!c || !valids.has(c.app) || !ESTATS.includes(c.estat)) return { ok: false, error: "canvi" };
    const codi = Number.isInteger(c.codi) && c.codi >= 0 && c.codi < 1000 ? c.codi : 0;
    const segons = Number.isFinite(c.segons) && c.segons >= 0 && c.segons < 120 ? Math.round(c.segons * 10) / 10 : null;
    const versio = typeof c.versio === "string" && /^[0-9a-f]{7}$/.test(c.versio) ? c.versio : null;
    canvis.push({ app: c.app, estat: c.estat, codi, segons, versio });
  }
  return { ok: true, canvis };
}

// Ordre del correu: primer el que és greu.
const GRUPS = [
  { estat: "caiguda", assumpte: "🔴 Caiguda", titol: "Apps que no responen:", que: "no respon" },
  { estat: "publicacio-fallida", assumpte: "🟠 Publicació fallida", titol: "Publicacions que han fallat a Railway (segueix en marxa la versió anterior):", que: "la publicació ha fallat" },
  { estat: "publicacio-no-respon", assumpte: "🟠 Publicada però no respon", titol: "Publicacions noves que no responen:", que: "s'ha publicat però la web no respon" },
  { estat: "publicacio-encallada", assumpte: "🟠 Publicació encallada", titol: "Publicacions que porten massa estona a mig fer:", que: "porta més de 25 minuts publicant-se" },
  { estat: "recuperada", assumpte: "🟢 Torna", titol: "Apps que tornen a funcionar:", que: "torna a respondre" },
];

/** Correu de text pla: què passa a cada app, i on mirar-ho. */
export function correuVigilancia(canvis, nomApp) {
  const grups = GRUPS.map(g => ({ ...g, llista: canvis.filter(c => c.estat === g.estat) })).filter(g => g.llista.length);
  const noms = llista => llista.map(c => nomApp(c.app)).join(", ");
  const nomesTornen = grups.length === 1 && grups[0].estat === "recuperada";
  const assumpte = nomesTornen
    ? `🟢 Torna a funcionar: ${noms(grups[0].llista)}`
    : grups.map(g => `${g.assumpte}: ${noms(g.llista)}`).join(" · ");
  const detall = c => {
    const parts = [];
    if (c.codi) parts.push(`codi ${c.codi}${c.segons != null ? `, ${c.segons} s` : ""}`);
    else if (c.estat === "caiguda" || c.estat === "publicacio-no-respon") parts.push("sense resposta");
    if (c.versio) parts.push(`versió ${c.versio}`);
    return parts.length ? ` (${parts.join(", ")})` : "";
  };
  const text = [];
  for (const g of grups) {
    if (text.length) text.push("");
    text.push(g.titol, ...g.llista.map(c => `- ${nomApp(c.app)}: ${g.que}${detall(c)}`));
  }
  const publicacions = grups.some(g => g.estat.startsWith("publicacio-"));
  text.push(
    "",
    publicacions
      ? "Ho ha detectat la vigilància d'n8n en revisar l'última publicació de cada app a Railway (cada 5 minuts)."
      : "Ho ha detectat la vigilància d'n8n (cada 5 minuts, i dues fallades seguides abans d'avisar).",
    "Què fer: obrir Railway, mirar els registres del servei i, si cal, tornar-lo a desplegar.",
    "Estat de les apps: https://www.aulaia.cat/panel",
  );
  return { assumpte, text: text.join("\n") };
}
