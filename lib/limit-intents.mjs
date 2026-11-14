/**
 * Topall d'intents fallits d'entrada al panell.
 *
 * Sense topall, la contrasenya es pot anar provant sense fi. Hi ha dos
 * comptadors, tots dos d'intents FALLITS dins d'una finestra de temps:
 *
 *  - per adreça IP, perque una sola maquina no pugui anar provant;
 *  - global, perque la IP surt d'una capçalera que pot arribar falsejada i el
 *    topall no ha de dependre de creure-se-la.
 *
 * Viu a la memoria del proces: es perd en reiniciar i no es comparteix entre
 * instancies. Per a un sol servei n'hi ha prou, i no afegeix cap taula.
 *
 * Sense "server-only" i amb el rellotge com a parametre perque es pugui provar
 * amb node tot sol.
 */

export const FINESTRA_MS = 15 * 60 * 1000;
export const MAXIM_PER_IP = 5;
export const MAXIM_GLOBAL = 30;

/** ip -> instants de les fallades recents */
const perIp = new Map();
let totes = [];

function recents(llista, ara) {
  return llista.filter(t => ara - t < FINESTRA_MS);
}

/** Es pot provar la contrasenya? Es mira ABANS de comparar-la. */
export function potIntentar(ip, ara = Date.now()) {
  totes = recents(totes, ara);
  if (totes.length >= MAXIM_GLOBAL) return { ok: false, motiu: "global" };

  const meves = recents(perIp.get(ip) || [], ara);
  if (meves.length) perIp.set(ip, meves);
  else perIp.delete(ip);
  if (meves.length >= MAXIM_PER_IP) return { ok: false, motiu: "ip" };

  return { ok: true };
}

export function anotarFallada(ip, ara = Date.now()) {
  totes = recents(totes, ara);
  totes.push(ara);

  const meves = recents(perIp.get(ip) || [], ara);
  meves.push(ara);
  perIp.set(ip, meves);

  // Amb IP falsejades el mapa podria creixer: es buida del que ja ha caducat.
  if (perIp.size > 5000) {
    for (const [k, v] of perIp) if (!v.some(t => ara - t < FINESTRA_MS)) perIp.delete(k);
  }
}

/** Qui entra be torna a tenir tots els intents. El comptador global no es toca. */
export function anotarEncert(ip) {
  perIp.delete(ip);
}

/** Nomes per a les proves. */
export function reiniciarIntents() {
  perIp.clear();
  totes = [];
}
