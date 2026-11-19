import "server-only";
import apps from "../data/apps.json";
import { clientResend, llegirCorreus, resumir, ErrorResend } from "./correus.mjs";

/**
 * Correus enviats, llegits de Resend per al panell (/panel/correus).
 *
 * Demana RESEND_PANEL_KEY: una clau de Resend amb acces complet. Resend nomes
 * te dos permisos, enviar o acces complet, i llistar els enviaments demana el
 * segon. Aqui nomes es fa servir per LLEGIR la llista: no s'envia, no es crea
 * ni s'esborra res. No surt mai d'aquest fitxer ni va a cap registre.
 *
 * Si no hi es, es prova amb RESEND_API_KEY, la d'enviar: si resulta que te
 * acces complet, la pagina funciona igual i ho diu, perque una clau d'enviar
 * hauria de poder nomes enviar.
 *
 * La llista es desa uns minuts en memoria: el limit de peticions de Resend es
 * de tot l'equip i el comparteixen les apps que envien.
 */

const MINUTS_CAU = 5;
let cau = null;

/** Quina clau es fa servir i d'on surt. Mai es torna a qui pinta la pagina. */
function clauCorreus() {
  if (process.env.RESEND_PANEL_KEY) return { clau: process.env.RESEND_PANEL_KEY, origen: "panell" };
  if (process.env.RESEND_API_KEY) return { clau: process.env.RESEND_API_KEY, origen: "enviament" };
  return null;
}

export function teClauCorreus() {
  return Boolean(clauCorreus());
}

/** Missatge per al panell segons l'error. Mai hi surt la clau ni el cos de la resposta. */
function missatge(e, origen) {
  if (e instanceof ErrorResend) {
    if (e.nom === "restricted_api_key") {
      return origen === "enviament"
        ? "La clau d'enviar (RESEND_API_KEY) nomes pot enviar, que es com ha de ser. Per llegir els enviaments cal una altra clau de Resend amb acces complet, desada com a RESEND_PANEL_KEY."
        : "La clau nomes te permis d'enviar. Per llegir els enviaments ha de ser una clau de Resend amb acces complet (Full access).";
    }
    if (e.estat === 401 || e.estat === 403) {
      return "Resend no accepta la clau: pot ser que s'hagi esborrat o que estigui mal copiada.";
    }
    if (e.estat === 429) {
      return "Resend demana esperar abans de tornar a preguntar. Torna-ho a provar d'aqui a un minut.";
    }
    return `Resend ha respost amb un error ${e.estat}.`;
  }
  if (e?.name === "TimeoutError" || e?.name === "AbortError") return "Resend ha trigat massa a respondre.";
  return "No s'ha pogut connectar amb Resend.";
}

/** Adreça de proves: nomes fora de produccio, per provar la pagina amb un servidor fals. */
function baseApi() {
  const b = process.env.RESEND_API_BASE;
  return b && process.env.NODE_ENV !== "production" ? b : undefined;
}

/**
 * El resum de lib/correus.mjs, mes `llegit`, `incomplet` i `origenClau`.
 * Llança un error amb un missatge per ensenyar al panell.
 */
export async function getCorreus() {
  if (cau && cau.fins > Date.now()) return cau.dades;

  const c = clauCorreus();
  if (!c) throw new Error("Falta RESEND_PANEL_KEY");

  const ara = new Date();
  try {
    const base = baseApi();
    const demana = clientResend(c.clau, base ? { base } : {});
    const { correus, incomplet } = await llegirCorreus(demana, ara);
    const dades = {
      ...resumir({
        correus,
        cataleg: apps,
        ara,
        opcions: { remitentContactes: process.env.RESEND_FROM_CONTACTES || undefined },
      }),
      incomplet,
      origenClau: c.origen,
      llegit: ara.toISOString(),
    };
    cau = { fins: Date.now() + MINUTS_CAU * 60000, dades };
    return dades;
  } catch (e) {
    const text = missatge(e, c.origen);
    console.error("Correus enviats: la consulta a Resend ha fallat:", text);
    throw new Error(text);
  }
}
