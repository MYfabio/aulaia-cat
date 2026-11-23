/**
 * Altes d'usuaris en lot des del panell (docs/altes-en-lot.md).
 * Lògica pura: ni base de dades ni xarxa. La fan servir la vista prèvia del
 * panell, la ruta que envia l'ordre i les proves.
 *
 * Les dades personals (noms i correus) no surten mai als motius d'error ni als
 * registres: només el número de fila i el tipus de problema.
 */

export const MAX_USUARIS_LOT = 500;
const MAX_NOM = 120;
const MAX_GRUP = 40;
const MAX_CENTRE = 120;
const CORREU_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Apps que accepten altes en lot. El pilot és només El Pla Lector.
 * Cada app té el seu domini de correu i els seus rols; no es comparteixen.
 */
export const APPS_ALTES_LOT = {
  "pla-lector": {
    nom: "El Pla Lector",
    domini: "escolaindustrial.org",
    rols: ["alumne", "bibliotecari", "docent", "docent_aula", "admin"],
  },
};

/** Text de l'app de cara a la persona que ho prepara. */
export function appAltesLot(slug) {
  return Object.prototype.hasOwnProperty.call(APPS_ALTES_LOT, slug) ? APPS_ALTES_LOT[slug] : null;
}

/**
 * Converteix el text enganxat (una persona per línia) en files.
 * Columnes: nom, correu, rol i, opcionalment, grup. Separador: punt i coma,
 * tabulador o coma. Una primera línia que digui «nom» com a títol es salta.
 */
export function analitzarText(text) {
  const linies = String(text ?? "").split(/\r?\n/);
  const files = [];
  linies.forEach((linia, i) => {
    const net = linia.trim();
    if (!net) return;
    const parts = net.includes(";") ? net.split(";") : net.includes("\t") ? net.split("\t") : net.split(",");
    const [nom = "", email = "", rol = "", grup = ""] = parts.map(p => p.trim());
    if (i === 0 && nom.toLowerCase() === "nom" && email.toLowerCase().startsWith("correu")) return;
    files.push({ linia: i + 1, nom, email, rol: rol.toLowerCase(), grup });
  });
  return files;
}

/** Valida una fila segons l'app. Retorna { ok, usuari } o { ok:false, motiu }. */
export function validarFila(fila, app) {
  if (!fila.nom) return { ok: false, motiu: "falta el nom" };
  if (fila.nom.length > MAX_NOM) return { ok: false, motiu: "nom massa llarg" };

  const email = fila.email.toLowerCase();
  if (!CORREU_RE.test(email)) return { ok: false, motiu: "correu no vàlid" };
  if (!email.endsWith("@" + app.domini)) return { ok: false, motiu: `correu fora del domini @${app.domini}` };

  if (!app.rols.includes(fila.rol)) return { ok: false, motiu: "rol desconegut" };

  if (fila.grup.length > MAX_GRUP) return { ok: false, motiu: "grup massa llarg" };
  return { ok: true, usuari: { nom: fila.nom, email, rol: fila.rol, grup: fila.grup || null } };
}

/**
 * Valida tot el lot. Retorna les files bones, els errors per número de fila,
 * i el recompte per rol (només nombres).
 */
export function validarLot(text, slug) {
  const app = appAltesLot(slug);
  if (!app) throw new Error("aquesta app no admet altes en lot");

  const files = analitzarText(text);
  if (files.length === 0) throw new Error("no hi ha cap fila per processar");
  if (files.length > MAX_USUARIS_LOT) {
    throw new Error(`massa files en un sol lot (màxim ${MAX_USUARIS_LOT})`);
  }

  const valides = [];
  const errors = [];
  const vists = new Set();
  for (const fila of files) {
    const r = validarFila(fila, app);
    if (!r.ok) {
      errors.push({ fila: fila.linia, motiu: r.motiu });
      continue;
    }
    if (vists.has(r.usuari.email)) {
      errors.push({ fila: fila.linia, motiu: "correu repetit dins del lot" });
      continue;
    }
    vists.add(r.usuari.email);
    valides.push(r.usuari);
  }

  const perRol = {};
  for (const u of valides) perRol[u.rol] = (perRol[u.rol] || 0) + 1;

  return { total: files.length, valides, errors, perRol };
}

/** Comprova el nom del centre que la persona escriu per confirmar l'enviament. */
export function centreValid(centre) {
  const net = String(centre ?? "").trim();
  return net.length > 0 && net.length <= MAX_CENTRE ? net : null;
}

/** Cos de l'ordre que el panell envia a n8n. */
export function construirOrdre({ slug, idLot, centre, usuaris }) {
  return { app: slug, id_lot: idLot, centre, usuaris };
}

/** Identificador únic de cada lot, perquè un reenviament no dupliqui res. */
export function nouIdLot(ara = new Date(), aleatori = Math.random) {
  return `lot-${ara.getTime()}-${Math.floor(aleatori() * 1e6).toString(36)}`;
}
