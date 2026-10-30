import "server-only";

/**
 * Filtre de spam de les altes. Va abans de desar res: una alta sospitosa ni es
 * desa ni avisa, i qui l'envia rep la mateixa resposta que una de bona, perque
 * un bot que veu un error en prova una altra variant.
 *
 * Que ho atrapa: formularis plens de enllacos (BBCode o HTML), text en alfabets
 * que aquests centres no fan servir i adreces de Gmail amb punts de mes, que
 * son el truc per crear milers de bustias que arriben a la mateixa persona.
 * Que no ho atrapa: un humà que copiï i enganxi spam. Per a aixo hi ha la
 * verificacio del correu i el panell, on es rebutja a ma.
 */

const BBCODE_O_HTML = /\[\/?(url|link|b|i|img)\b|<\s*a\s|href\s*=|<\s*\/?\s*(script|iframe)/i;
const ENLLAC = /(https?:\/\/|www\.)\S+/i;
const SPINTAX = /\{[^{}]*\|[^{}]*\}/;
const CIRILIC = /[Ѐ-ӿ]/;

/** Camps de text curt: en aquests no hi ha cap motiu per posar-hi un enllac. */
const CAMPS_CURTS = ["centre", "codiCentre", "localitat", "contacteNom", "contacteRol"];

/** Dominis de gent que ven posicionament web: ni un centre ni una persona docent. */
const DOMINI_SEO = /^(seo|backlinks?|linkbuilding|posicionamiento|posicionamientoweb|marketingdigital)/;

function dominiSeo(correu) {
  const domini = String(correu).toLowerCase().split("@")[1] || "";
  return DOMINI_SEO.test(domini);
}

function puntsDeMes(correu) {
  const [local = "", domini = ""] = String(correu).toLowerCase().split("@");
  if (!/^(gmail|googlemail)\.com$/.test(domini)) return false;
  return (local.match(/\./g) || []).length >= 4;
}

/**
 * @param {object} dades camps llegits del formulari
 * @param {{honeypot?: string}} extra camps que no son de l'alta
 * @returns {string|null} el motiu, o null si l'alta sembla bona
 */
export function motiuSpam(dades, extra = {}) {
  if (extra.honeypot && String(extra.honeypot).trim()) return "honeypot";

  for (const camp of CAMPS_CURTS) {
    const v = String(dades[camp] ?? "");
    if (ENLLAC.test(v)) return "enllac-" + camp;
  }

  const tots = [...CAMPS_CURTS, "missatge"].map(c => String(dades[c] ?? "")).join("\n");
  if (BBCODE_O_HTML.test(tots)) return "bbcode";
  if (SPINTAX.test(tots)) return "plantilla";
  if (CIRILIC.test(tots)) return "cirilic";

  // Un missatge pot portar un enllac, pero no una pila.
  const enllacsMissatge = (String(dades.missatge ?? "").match(/(https?:\/\/|www\.)\S+/gi) || []).length;
  if (enllacsMissatge > 1) return "enllacs-missatge";

  if (puntsDeMes(dades.contacteEmail)) return "gmail-punts";
  if (dominiSeo(dades.contacteEmail)) return "domini-seo";

  return null;
}
