/**
 * Vigilància de les apps: n8n mira cada 5 minuts si cada app respon i si
 * l'última publicació a Railway ha anat bé. Quan hi ha un canvi, ho envia
 * aquí signat. Aquest fitxer només valida el missatge i en fa el correu; no
 * toca la xarxa (ho fa app/api/vigilancia).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const ESTATS = ["caiguda", "recuperada", "publicacio-fallida", "publicacio-no-respon", "publicacio-encallada", "ia-falla"];

/** Per què falla la IA (l'envia cada app, docs/n8n.md) i què n'ha de saber el propietari. */
export const MOTIUS_IA = {
  "cupo-dia": "s'ha acabat la quota del dia: tornarà a funcionar demà. Si passa sovint, cal ampliar la quota",
  "cupo-minut": "massa peticions seguides: es resol sol esperant uns minuts",
  model: "el model d'IA ja no existeix: cal canviar-lo al codi de l'app",
  temps: "la IA tarda massa a respondre",
  buida: "la IA respon en blanc",
  format: "la IA respon però l'app no entén la resposta",
  servei: "el servei d'IA dona error",
};
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
 * { data, canvis: [{ app, estat, codi, segons, versio, motiu, model, vegades }] }. Només apps del
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
    const canvi = { app: c.app, estat: c.estat, codi, segons, versio };
    if (c.estat === "ia-falla") {
      if (!Object.hasOwn(MOTIUS_IA, c.motiu)) return { ok: false, error: "canvi" };
      canvi.motiu = c.motiu;
      canvi.model = typeof c.model === "string" && /^[a-z0-9._:/-]{1,60}$/.test(c.model) ? c.model : null;
      canvi.vegades = Number.isInteger(c.vegades) && c.vegades > 0 && c.vegades < 100000 ? c.vegades : null;
    }
    canvis.push(canvi);
  }
  return { ok: true, canvis };
}

// Ordre del correu: primer el que és greu.
const GRUPS = [
  { estat: "caiguda", assumpte: "🔴 Caiguda", titol: "Apps que no responen:", que: "no respon" },
  { estat: "publicacio-fallida", assumpte: "🟠 Publicació fallida", titol: "Publicacions que han fallat a Railway (segueix en marxa la versió anterior):", que: "la publicació ha fallat" },
  { estat: "publicacio-no-respon", assumpte: "🟠 Publicada però no respon", titol: "Publicacions noves que no responen:", que: "s'ha publicat però la web no respon" },
  { estat: "publicacio-encallada", assumpte: "🟠 Publicació encallada", titol: "Publicacions que porten massa estona a mig fer:", que: "porta més de 25 minuts publicant-se" },
  { estat: "ia-falla", assumpte: "🟣 IA amb problemes", titol: "Apps on la IA falla de manera repetida (l'app segueix funcionant; el docent pot fer la feina a mà):", que: null },
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
  const liniaIA = c => {
    const parts = [c.vegades ? `${c.vegades} vegades en l'última hora` : null, c.model ? `model ${c.model}` : null].filter(Boolean);
    return `- ${nomApp(c.app)}: ${MOTIUS_IA[c.motiu]}${parts.length ? ` (${parts.join(", ")})` : ""}`;
  };
  const text = [];
  for (const g of grups) {
    if (text.length) text.push("");
    text.push(g.titol, ...g.llista.map(c => g.estat === "ia-falla" ? liniaIA(c) : `- ${nomApp(c.app)}: ${g.que}${detall(c)}`));
  }
  const publicacions = grups.some(g => g.estat.startsWith("publicacio-"));
  const nomesIA = grups.every(g => g.estat === "ia-falla");
  text.push(
    "",
    nomesIA
      ? "Ho ha detectat n8n comptant els avisos d'error de la IA que envien les apps (3 o més en una hora; com a molt un correu cada 6 hores per app i motiu)."
      : publicacions
      ? "Ho ha detectat la vigilància d'n8n en revisar l'última publicació de cada app a Railway (cada 5 minuts)."
      : "Ho ha detectat la vigilància d'n8n (cada 5 minuts, i dues fallades seguides abans d'avisar).",
    nomesIA
      ? "Què fer: si és la quota del dia, esperar o ampliar-la; si és el model, demanar a Claude que el canviï. Avisos: https://www.aulaia.cat/panel/avisos"
      : "Què fer: obrir Railway, mirar els registres del servei i, si cal, tornar-lo a desplegar.",
    "Estat de les apps: https://www.aulaia.cat/panel",
  );
  return { assumpte, text: text.join("\n") };
}
