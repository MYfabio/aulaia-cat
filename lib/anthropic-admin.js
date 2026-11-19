import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { llegirCost } from "./cost-ia.mjs";

/**
 * Cost d'Anthropic, llegit de la seva API d'administracio (en beta).
 *
 * Demana ANTHROPIC_ADMIN_KEY: una clau d'administrador de l'organitzacio, que
 * no serveix per enviar missatges a cap model. Aqui nomes es fa servir per
 * LLEGIR el cost i els noms de les claus; no es crea ni es canvia res.
 *
 * Les dades d'Anthropic arriben amb entre 4 i 24 hores de retard, aixi que no
 * cal preguntar cada cop que s'obre la pagina: es desa mitja hora en memoria.
 */

const MINUTS_CAU = 30;
let cau = null;

export function teClauAdmin() {
  return Boolean(process.env.ANTHROPIC_ADMIN_KEY);
}

/** Missatge per al panell segons l'error de l'SDK. Mai hi surt la clau. */
function missatge(e) {
  if (e instanceof Anthropic.AuthenticationError) {
    return "Anthropic no accepta la clau d'administrador: pot ser que s'hagi esborrat o que estigui mal copiada.";
  }
  if (e instanceof Anthropic.PermissionDeniedError || e instanceof Anthropic.NotFoundError) {
    return "La clau no te permis per llegir el cost: ha de ser una clau d'administrador (sk-ant-admin), no una clau d'API normal.";
  }
  if (e instanceof Anthropic.RateLimitError) {
    return "Anthropic demana esperar abans de tornar a preguntar. Torna-ho a provar d'aqui a uns minuts.";
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return "No s'ha pogut connectar amb Anthropic.";
  }
  if (e instanceof Anthropic.APIError) {
    return `Anthropic ha respost amb un error ${e.status ?? ""}`.trim() + ".";
  }
  return "No s'ha pogut llegir el cost d'Anthropic.";
}

/** El resum de lib/cost-ia.mjs. Llança un error amb un missatge per ensenyar al panell. */
export async function getCostAnthropic() {
  if (cau && cau.fins > Date.now()) return cau.dades;

  const clau = process.env.ANTHROPIC_ADMIN_KEY;
  if (!clau) throw new Error("Falta ANTHROPIC_ADMIN_KEY");

  const client = new Anthropic({ apiKey: clau, maxRetries: 1, timeout: 20000 });
  try {
    const dades = await llegirCost(client, new Date(), e => {
      console.error("Cost d'IA: no s'han pogut llegir els noms de les claus:", missatge(e));
    });
    cau = { fins: Date.now() + MINUTS_CAU * 60000, dades };
    return dades;
  } catch (e) {
    console.error("Cost d'IA: la consulta a Anthropic ha fallat:", missatge(e));
    throw new Error(missatge(e));
  }
}
