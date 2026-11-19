/**
 * Preus dels models d'IA, per estimar el cost dels tokens que informen les apps.
 *
 * Els tokens no els factura Railway: els cobren Anthropic i Google a part. Aqui
 * hi ha la taula de preus publics i la multiplicacio; la xifra oficial es la de
 * la consola de cada proveidor.
 *
 * COMPROVAT EL 14/11/2026 contra:
 *   - https://platform.claude.com/docs/en/about-claude/pricing
 *   - https://ai.google.dev/gemini-api/docs/pricing  (nivell de pagament, «Standard»)
 *   - https://developers.openai.com/api/docs/pricing  (nomes el model que fa servir El Taulell)
 * Si un proveidor canvia preus, es canvien aqui i s'actualitza la data.
 *
 * Models que alguna app crida i que NO son a la taula, perque el dia de la
 * comprovacio no sortien a la pagina de preus del proveidor: `gemini-3.7-flash`
 * (Chef Boss) i l'alies `gemini-flash-latest` (Radio Escolar), que no diu a
 * quin model apunta. Al panell surten com a «sense preu».
 *
 * Que NO recull l'estimacio, perque l'informe nomes porta tokens per model:
 *   - Claude Haiku 5.5 val 5 vegades mes quan el prompt passa de 100.000 tokens,
 *     i els Gemini Pro pugen a partir de 200.000. Aqui es compta sempre el tram baix.
 *   - L'entrada d'audio de Gemini es mes cara que la de text. Es compta com a text.
 *   - Descomptes (lots) i recarrecs (inferencia fixada a una regio, mode rapid).
 *   - Claude servit per Bedrock o Vertex te preus propis: es compta com l'API directa.
 *   - El que no es mesura en tokens (OpenAI tts-1 per caracter, Vision per imatge).
 *
 * Funcions pures, sense "server-only", perque es puguin provar amb node sol.
 */

export const PREUS_COMPROVATS_EL = "2026-11-14";

/**
 * Dolars per milio de tokens. Cada model te una llista de trams de preu:
 * el primer val des de sempre i els seguents des de la data `desDe` (inclosa).
 *   e = entrada   s = sortida   l = lectura de cau   w = escriptura de cau (5 minuts)
 * Sense `l` o `w`, aquells tokens es compten al preu d'entrada.
 */
export const PREUS_IA = {
  // ---------- Anthropic ----------
  "claude-fable-5-2":  [{ e: 8,    s: 40,  l: 0.20, w: 10 }],
  "claude-mythos-5-2": [{ e: 8,    s: 40,  l: 0.20, w: 10 }],
  "claude-fable-5-1":  [{ e: 10,   s: 50,  l: 0.25, w: 12.5 }],
  "claude-mythos-5-1": [{ e: 10,   s: 50,  l: 0.25, w: 12.5 }],
  "claude-fable-5":    [{ e: 10,   s: 50,  l: 1,    w: 12.5 }],
  "claude-mythos-5":   [{ e: 10,   s: 50,  l: 1,    w: 12.5 }],
  "claude-opus-5-5":   [{ e: 4,    s: 20,  l: 0.20, w: 5 }],
  "claude-opus-5":     [{ e: 5,    s: 25,  l: 0.50, w: 6.25 }],
  "claude-opus-4-8":   [{ e: 5,    s: 25,  l: 0.50, w: 6.25 }],
  "claude-opus-4-7":   [{ e: 5,    s: 25,  l: 0.50, w: 6.25 }],
  "claude-opus-4-6":   [{ e: 5,    s: 25,  l: 0.50, w: 6.25 }],
  "claude-opus-4-5":   [{ e: 5,    s: 25,  l: 0.50, w: 6.25 }],
  "claude-sonnet-5-5": [{ e: 2,    s: 10,  l: 0.10, w: 2.5 }],
  "claude-sonnet-5":   [{ e: 2,    s: 10,  l: 0.20, w: 2.5 }],
  "claude-sonnet-4-6": [{ e: 3,    s: 15,  l: 0.30, w: 3.75 }],
  "claude-sonnet-4-5": [{ e: 3,    s: 15,  l: 0.30, w: 3.75 }],
  "claude-haiku-5-5":  [{ e: 0.10, s: 0.50, l: 0.01, w: 0.125 }], // prompts fins a 100.000 tokens
  "claude-haiku-4-5":  [{ e: 1,    s: 5,   l: 0.10, w: 1.25 }],

  // ---------- Google (Gemini API) ----------
  "gemini-4-carbon":   [{ e: 2, s: 10, l: 0.10 }, { desDe: "2026-12-01", e: 4, s: 20, l: 0.20 }],
  "gemini-4-argon":    [{ e: 2, s: 10, l: 0.10 }, { desDe: "2026-12-01", e: 4, s: 20, l: 0.20 }],
  "gemini-4-hydrogen": [{ e: 1.5, s: 7.5, l: 0.075 }],
  "gemini-3.8-flash":  [{ e: 0.75, s: 3.75, l: 0.075 }, { desDe: "2027-01-01", e: 1.5, s: 7.5, l: 0.15 }],
  "gemini-3.6-flash":  [{ e: 0.75, s: 3.75, l: 0.075 }, { desDe: "2027-01-01", e: 1.5, s: 7.5, l: 0.15 }],
  "gemini-3.5-flash-lite":  [{ e: 0.30, s: 2.5, l: 0.03 }],
  "gemini-3.1-flash-lite":  [{ e: 0.25, s: 1.5, l: 0.025 }],
  "gemini-3.1-pro-preview": [{ e: 2, s: 12, l: 0.20 }], // prompts fins a 200.000 tokens
  "gemini-3-flash-preview": [{ e: 0.50, s: 3, l: 0.05 }],
  "gemini-2.5-pro":        [{ e: 1.25, s: 10, l: 0.125 }], // obsolet: Google el redirigeix l'1/12/2026
  "gemini-2.5-flash":      [{ e: 0.30, s: 2.5, l: 0.03 }], // obsolet: Google el redirigeix l'1/12/2026
  "gemini-2.5-flash-lite": [{ e: 0.10, s: 0.40, l: 0.01 }],
  // Veu: l'entrada es text i la sortida son tokens d'audio.
  "gemini-3.8-flash-tts":         [{ e: 0.50, s: 9 }, { desDe: "2027-01-01", e: 1, s: 18 }],
  "gemini-3.8-flash-lite-tts":    [{ e: 0.50, s: 6 }, { desDe: "2027-01-01", e: 1, s: 12 }],
  "gemini-3.1-flash-tts-preview": [{ e: 1, s: 20 }],
  "gemini-2.5-flash-preview-tts": [{ e: 0.50, s: 10 }],
  "gemini-2.5-pro-preview-tts":   [{ e: 1, s: 20 }],

  // ---------- OpenAI ----------
  "gpt-5.6-sol": [{ e: 4, s: 20, l: 0.40, w: 5 }], // context curt; `w` es l'escriptura de cau de 30 minuts
};

/** Sufixos que nomes diuen quina versio del mateix model es, i no en canvien el preu. */
const SUFIXOS_DE_VERSIO = [/-latest$/, /-\d{3}$/, /-preview-\d{2}-\d{2,4}$/, /-preview$/];

/**
 * Les apps poden informar el model tal com el crida el seu SDK: amb la data al
 * final (`claude-haiku-4-5-20251001`), amb el prefix de Bedrock
 * (`eu.anthropic.claude-haiku-5-5-v1:0`), de Vertex (`claude-opus-4-5@20251101`)
 * o de Gemini (`models/gemini-3.6-flash`). Torna la clau de PREUS_IA, o null.
 *
 * No s'accepta qualsevol nom que comenci igual: `gemini-2.5-flash-image` no es
 * `gemini-2.5-flash`, es un altre model amb un altre preu.
 */
export function modelDeLaTaula(model) {
  if (typeof model !== "string") return null;
  let m = model.trim().toLowerCase();
  m = m.replace(/^models\//, "");
  m = m.replace(/^(?:[a-z]{2,6}\.)?anthropic\./, "");
  m = m.replace(/-v\d+(?::\d+)?$/, "");
  m = m.replace(/[@-]20\d{6}$/, "");
  if (Object.hasOwn(PREUS_IA, m)) return m;
  for (const sufix of SUFIXOS_DE_VERSIO) {
    const curt = m.replace(sufix, "");
    if (curt !== m && Object.hasOwn(PREUS_IA, curt)) return curt;
  }
  return null;
}

/** El tram de preu vigent el dia `dia` ('AAAA-MM-DD'), o null si no es coneix el model. */
export function preuDelModel(model, dia) {
  const clau = modelDeLaTaula(model);
  if (!clau) return null;
  let vigent = PREUS_IA[clau][0];
  for (const tram of PREUS_IA[clau]) {
    if (tram.desDe && typeof dia === "string" && dia >= tram.desDe) vigent = tram;
  }
  return vigent;
}

const num = x => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : 0);

/**
 * Cost en dolars d'uns tokens. Torna null si el model no es a la taula: val
 * mes dir «sense preu» que inventar-se'n un.
 * @param {string} model
 * @param {{e?: number, s?: number, l?: number, w?: number}} tokens
 * @param {string} [dia] 'AAAA-MM-DD' del consum, per triar el tram de preu
 */
export function costTokens(model, tokens, dia) {
  const p = preuDelModel(model, dia);
  if (!p) return null;
  const t = tokens || {};
  return (
    num(t.e) * p.e +
    num(t.s) * p.s +
    num(t.l) * (p.l ?? p.e) +
    num(t.w) * (p.w ?? p.e)
  ) / 1e6;
}
