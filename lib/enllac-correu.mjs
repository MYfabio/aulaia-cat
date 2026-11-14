/**
 * Quins enllaços poden sortir dins d'un correu del servei central.
 *
 * Les plantilles son tancades, pero dues porten un enllaç que ve de fora
 * (verificar l'adreça i entrar a l'app). Si l'enllaç pogues apuntar a
 * qualsevol lloc, qui tingues la clau del servei enviaria «el teu enllaç
 * d'accés» des del nostre domini cap a una pagina seva. Per aixo l'enllaç ha
 * de ser https i del domini d'aulaia.cat o de l'app que diu que l'envia.
 *
 * Funcions pures, sense "server-only" ni el cataleg: els hosts es passen per
 * parametre i aixi es poden provar amb node tot sol.
 */

const LOCALS = new Set(["localhost", "127.0.0.1"]);

function hostDeUrl(url) {
  try {
    return new URL(String(url)).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Hosts de les entrades que es passin (del cataleg o d'accessos): el `domini`
 * amb i sense www, i el host de la `url`. Les entrades buides s'ignoren.
 */
export function hostsDe(...entrades) {
  const hosts = new Set();
  for (const e of entrades) {
    if (!e || typeof e !== "object") continue;
    if (typeof e.domini === "string" && e.domini.trim()) {
      const d = e.domini.trim().toLowerCase();
      hosts.add(d);
      hosts.add(d.startsWith("www.") ? d.slice(4) : "www." + d);
    }
    const h = typeof e.url === "string" ? hostDeUrl(e.url) : null;
    if (h) hosts.add(h);
  }
  return hosts;
}

/**
 * @param {string} enllac  l'enllaç tal com anira al correu
 * @param {Set<string>} hosts  hosts permesos
 * @param {{local?: boolean}} opcions  `local`: accepta tambe http://localhost (nomes en desenvolupament)
 */
export function enllacPermes(enllac, hosts, { local = false } = {}) {
  if (typeof enllac !== "string" || !enllac) return false;
  // Espais, barres inverses i caracters de control: cada programa de correu
  // els llegeix a la seva manera, i el host que veuria no seria el que validem.
  if (/[\s\\\u0000-\u001F\u007F]/.test(enllac)) return false;

  let u;
  try {
    u = new URL(enllac);
  } catch {
    return false;
  }
  // https://www.dictats.cat@un-altre-lloc.tld/ sembla el que no es.
  if (u.username || u.password) return false;

  const host = u.hostname.toLowerCase();
  if (local && u.protocol === "http:" && LOCALS.has(host)) return true;
  if (u.protocol !== "https:" || u.port) return false;
  return hosts.has(host);
}

/** El host de l'enllaç, nomes per al registre (mai l'enllaç sencer: porta un token). */
export function hostPerRegistre(enllac) {
  return hostDeUrl(enllac) || "no es una adreça";
}

/**
 * Base per als enllaços que escrivim nosaltres dins d'un correu. La base de la
 * peticio surt de capçaleres (x-forwarded-host); si no es un host nostre, es
 * fa servir la canonica en lloc de refiar-nos-en.
 */
export function baseSegura(base, hosts, canonica, { local = false } = {}) {
  let u;
  try {
    u = new URL(String(base));
  } catch {
    return canonica;
  }
  return enllacPermes(u.origin + "/", hosts, { local }) ? u.origin : canonica;
}
