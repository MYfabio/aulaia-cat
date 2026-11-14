/**
 * Quina app del cataleg hi ha darrere d'un projecte de Railway.
 *
 * A Railway els projectes porten el nom que van rebre el dia que es van crear
 * (`biblioteca-pla-lector`, `pantalles`, `clubpoetesvives`...), que no es el
 * nom amb que es coneix l'app. La relacio es treu de les adreces: si alguna
 * adreça del projecte es el domini de l'app al cataleg, o un subdomini seu, o
 * l'adreça on viu de debo segons accessos.json, es aquella app.
 *
 * Funcio pura, sense "server-only", perque es pugui provar amb node tot sol.
 */

function host(valor) {
  if (typeof valor !== "string" || !valor.trim()) return null;
  const v = valor.trim().toLowerCase();
  try {
    return new URL(v.includes("://") ? v : "https://" + v).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * @param {string[]} adreces  dominis del projecte (propis i de Railway)
 * @param {{slug: string, nom: string, domini?: string, url?: string}[]} cataleg
 * @param {{slug: string, url?: string}[]} accessos
 * @returns l'entrada del cataleg, o null si cap adreça hi correspon
 */
export function appDelProjecte(adreces, cataleg, accessos = []) {
  const hosts = (adreces || []).map(host).filter(Boolean);
  if (hosts.length === 0) return null;

  let millor = null;
  for (const app of cataleg || []) {
    const acces = (accessos || []).find(a => a.slug === app.slug);
    const propis = [host(app.domini), host(app.url), host(acces?.url)].filter(Boolean);
    for (const p of propis) {
      // Si dues apps hi encaixen, guanya el domini mes llarg, que es el mes concret.
      if (hosts.some(h => h === p || h.endsWith("." + p)) && (!millor || p.length > millor.pes)) {
        millor = { app, pes: p.length };
      }
    }
  }
  return millor ? millor.app : null;
}
