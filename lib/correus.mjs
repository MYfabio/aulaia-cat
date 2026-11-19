/**
 * Correus enviats: el que Resend diu que ha sortit del compte, agrupat per app.
 *
 * Resend te una llista de tots els enviaments de l'equip (GET /emails), amb el
 * remitent, el destinatari, l'assumpte, la data i l'ultim estat. D'aqui surt
 * tot: no es desa res a la nostra base de dades i l'historial es el que guarda
 * Resend (30 dies).
 *
 * De quina app es cada correu es dedueix de dues maneres:
 *   - pel remitent, quan l'app envia amb la seva adreça (Pla Lector, dictats...);
 *   - per l'assumpte, quan l'envia aulaia.cat en nom d'una app (altes). Les
 *     plantilles son tancades i viuen a lib/correu-central.js i lib/correu.js:
 *     si se'n canvia l'assumpte, cal canviar tambe PLANTILLES d'aquest fitxer.
 *
 * Sense "server-only" perque es pugui provar amb node sol
 * (scripts/correus/proves.mjs i scripts/correus/provar.mjs).
 */

const DIA = 86400000;

/** Dies que s'ensenyen, comptant el d'avui. Es el que Resend guarda. */
export const DIES_SERIE = 30;

/** Resend no deixa demanar-ne mes de 100 per pagina. */
export const PER_PAGINA = 100;

/** Topall de pagines per lectura: 4.000 correus, i el pla gratuit en deixa 3.000 al mes. */
export const MAX_PAGINES = 40;

/** El que envia aulaia.cat i no es de cap app (missatges, presentacions). */
export const AULAIA = "aulaia";

const ZONA = "Europe/Madrid";

/* ---------- Lectura ---------- */

/** Un error de Resend, sense res del cos: nomes el codi i el nom que hi posa Resend. */
export class ErrorResend extends Error {
  constructor(estat, nom) {
    super(`Resend ha respost ${estat}${nom ? " (" + nom + ")" : ""}`);
    this.name = "ErrorResend";
    this.estat = estat;
    this.nom = nom || null;
  }
}

/**
 * Funcio que demana una pagina de la llista. NOMES LLEGEIX.
 *
 * @param {string} clau  clau de Resend amb acces complet (no n'hi ha de nomes lectura)
 * @param {{base?: string, fetch?: typeof fetch}} [opcions]
 */
export function clientResend(clau, { base = "https://api.resend.com", fetch: demanar = fetch } = {}) {
  return async function demana(params) {
    const url = new URL("/emails", base);
    for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, String(v));

    for (let intent = 0; ; intent++) {
      const r = await demanar(url, {
        headers: { Authorization: `Bearer ${clau}`, "User-Agent": "aulaia-panell" },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) return r.json();
      // El limit de peticions es de tot l'equip i el comparteixen les apps que
      // envien: si Resend demana esperar, s'espera una vegada i prou.
      if (r.status === 429 && intent === 0) {
        const segons = Math.min(Number(r.headers.get("retry-after")) || 1, 5);
        await new Promise(res => setTimeout(res, segons * 1000));
        continue;
      }
      const cos = await r.json().catch(() => null);
      throw new ErrorResend(r.status, typeof cos?.name === "string" ? cos.name.slice(0, 60) : null);
    }
  };
}

/**
 * Totes les pagines fins a cobrir els ultims DIES_SERIE dies. Resend torna els
 * correus del mes nou al mes antic, i la pagina seguent es demana amb
 * l'identificador de l'ultim de l'actual.
 *
 * @param {(params: object) => Promise<{data: object[], has_more: boolean}>} demana
 * @returns {Promise<{correus: object[], pagines: number, incomplet: boolean}>}
 */
export async function llegirCorreus(demana, ara = new Date(), { pausaMs = 150 } = {}) {
  const inici = iniciSerie(ara);
  const correus = [];
  let cursor = null;
  let pagines = 0;
  let incomplet = false;

  for (;;) {
    const pagina = await demana({ limit: PER_PAGINA, ...(cursor ? { after: cursor } : {}) });
    const files = Array.isArray(pagina?.data) ? pagina.data : [];
    pagines++;
    correus.push(...files);

    const ultim = files[files.length - 1];
    if (!pagina?.has_more || !ultim?.id) break;
    const quan = quanDe(ultim.created_at);
    if (quan !== null && quan < inici) break;
    if (pagines >= MAX_PAGINES) { incomplet = true; break; }
    cursor = ultim.id;
    if (pausaMs) await new Promise(res => setTimeout(res, pausaMs));
  }
  return { correus, pagines, incomplet };
}

/* ---------- Dates ---------- */

/**
 * Resend escriu les dates com «2026-11-14 09:12:33.123456+00», que no es ISO i
 * que `new Date` no sempre enten. Torna mil·lisegons, o null si no es una data.
 */
export function quanDe(text) {
  const m = String(text || "").trim().match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i
  );
  if (!m) return null;
  const ms = (m[3] || "").slice(0, 3).padEnd(3, "0");
  let zona = (m[4] || "Z").toUpperCase();
  if (zona !== "Z") {
    const z = zona.replace(":", "");
    zona = z.slice(0, 3) + ":" + (z.slice(3) || "00");
  }
  const t = Date.parse(`${m[1]}T${m[2]}.${ms}${zona}`);
  return Number.isNaN(t) ? null : t;
}

const fmtDia = new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** El dia «2026-11-14» d'un instant, en hora de Catalunya. */
export function diaLocal(ms) {
  return fmtDia.format(new Date(ms));
}

/** Els DIES_SERIE dies que s'ensenyen, del mes antic a avui. */
function diesSerie(ara) {
  // Migdia UTC del dia local d'avui: restar-hi dies sencers no salta mai de dia
  // encara que pel mig hi hagi un canvi d'hora.
  const migdia = Date.parse(diaLocal(ara.getTime()) + "T12:00:00Z");
  const dies = [];
  for (let i = DIES_SERIE - 1; i >= 0; i--) dies.push(new Date(migdia - i * DIA).toISOString().slice(0, 10));
  return dies;
}

/** Instant a partir del qual un correu ja pot ser dins de la serie (amb marge d'un dia). */
function iniciSerie(ara) {
  return Date.parse(diesSerie(ara)[0] + "T00:00:00Z") - DIA;
}

/* ---------- De quina app es ---------- */

/** «Pla Lector <plalector@aulaia.cat>» → nom, adreça, part local i domini. */
export function llegirRemitent(from) {
  const text = String(from || "").trim();
  const m = text.match(/^(.*?)\s*<([^<>\s]+)>\s*$/);
  const adreca = (m ? m[2] : text).toLowerCase();
  const nom = m ? m[1].replace(/^["']+|["']+$/g, "").trim() : "";
  const arrova = adreca.lastIndexOf("@");
  return {
    nom,
    adreca,
    local: arrova > 0 ? adreca.slice(0, arrova) : adreca,
    domini: arrova > 0 ? adreca.slice(arrova + 1) : "",
  };
}

/** Text reduit a lletres i xifres, per comparar «Pla Lector», «pla-lector» i «plalector». */
function clau(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const sensePrefix = d => String(d || "").toLowerCase().replace(/^www\./, "");

/** Dominis des d'on envia aulaia.cat mateix; `onboarding@resend.dev` es el de proves de Resend. */
const DOMINIS_GENERICS = new Set(["aulaia.cat", "resend.dev"]);

/**
 * Index del cataleg per buscar-hi de pressa. Es construeix un cop per lectura.
 * @param {{slug: string, nom: string, domini?: string}[]} cataleg
 */
export function indexCataleg(cataleg) {
  const perClau = new Map();
  const perDomini = new Map();
  const perNom = new Map();
  const afegir = (k, app) => { if (k && k.length >= 4 && !perClau.has(k)) perClau.set(k, app); };

  for (const app of cataleg || []) {
    if (!app?.slug) continue;
    const domini = sensePrefix(app.domini);
    perNom.set(String(app.nom || "").toLowerCase(), app);
    afegir(clau(app.slug), app);
    afegir(clau(app.nom), app);
    // «El Pla Lector» tambe es «Pla Lector»: l'article sol caure al nom del remitent.
    afegir(clau(String(app.nom || "").replace(/^(el|la|els|les|l')\s*/i, "")), app);
    if (domini && !DOMINIS_GENERICS.has(domini)) {
      perDomini.set(domini, app);
      // «laclaqueta.aulaia.cat» → «laclaqueta»; «dictats.cat» → «dictats».
      afegir(clau(domini.split(".")[0]), app);
    }
  }
  return { perClau, perDomini, perNom };
}

function appPerDomini(domini, index) {
  const d = sensePrefix(domini);
  if (!d || DOMINIS_GENERICS.has(d)) return null;
  if (index.perDomini.has(d)) return index.perDomini.get(d);
  // Resend sol enviar des d'un subdomini (send.dictats.cat).
  for (const [dom, app] of index.perDomini) if (d.endsWith("." + dom)) return app;
  return null;
}

/**
 * Plantilles que envia aulaia.cat. `nom` es el grup de l'expressio on hi ha el
 * nom de l'app, tal com surt al cataleg; sense `nom`, el correu es d'aulaia.cat.
 */
const PLANTILLES = [
  { tipus: "alta-verif", re: /^Verifica (?:la teva adreça|tu dirección) · (.+)$/, nom: 1 },
  { tipus: "alta-rebuda", re: /^(?:Hem rebut la teva sol·licitud|Hemos recibido tu solicitud) · (.+)$/, nom: 1 },
  // El centre pot portar « · » al nom: l'app es el que hi ha despres de l'ultim.
  { tipus: "alta-avis-intern", re: /^🔔 Alta nova: .* · ([^·]+)$/u, nom: 1 },
  { tipus: "alta-validada", re: /^Accés validat a (.+) · aulaia\.cat$/, nom: 1 },
  { tipus: "enllac-acces", re: /^El teu enllaç d'accés a (.+)$/, nom: 1 },
  { tipus: "missatge-rebut", re: /^(?:Hem rebut el teu missatge|Hemos recibido tu mensaje) · aulaia\.cat$/ },
  { tipus: "missatge-avis-intern", re: /^💬 /u },
];

export const TEXT_TIPUS = {
  "alta-verif": "Verificació de l'adreça",
  "alta-rebuda": "Sol·licitud rebuda",
  "alta-avis-intern": "Avís intern d'alta nova",
  "alta-validada": "Alta validada",
  "enllac-acces": "Enllaç d'accés",
  "missatge-rebut": "Missatge rebut",
  "missatge-avis-intern": "Avís intern de missatge",
  presentacio: "Presentació a centres",
  altres: "Altres",
};

/**
 * De quina app es un correu i qui l'ha enviat.
 *
 * @param {{from?: string, subject?: string}} correu
 * @param {ReturnType<typeof indexCataleg>} index
 * @param {{remitentContactes?: string}} [opcions]  adreça de les presentacions a centres
 * @returns {{app: string, nom: string, via: "propia"|"aulaia"|"desconeguda", tipus: string|null}}
 */
export function classificar(correu, index, { remitentContactes } = {}) {
  const r = llegirRemitent(correu?.from);
  const assumpte = String(correu?.subject || "").trim();

  // 1. L'app envia amb el seu domini o amb el seu nom.
  const propia = appPerDomini(r.domini, index) || index.perClau.get(clau(r.nom)) || index.perClau.get(clau(r.local));
  if (propia) return { app: propia.slug, nom: propia.nom, via: "propia", tipus: null };

  // 2. Un remitent que no es de cap app ni d'aulaia.cat: s'ensenya tal qual.
  if (!DOMINIS_GENERICS.has(sensePrefix(r.domini))) {
    return { app: "remitent:" + r.adreca, nom: r.adreca || "Sense remitent", via: "desconeguda", tipus: null };
  }

  // 3. L'envia aulaia.cat: el tipus i l'app surten de l'assumpte.
  if (remitentContactes && r.adreca === llegirRemitent(remitentContactes).adreca) {
    return { app: AULAIA, nom: "aulaia.cat", via: "aulaia", tipus: "presentacio" };
  }
  for (const p of PLANTILLES) {
    const m = assumpte.match(p.re);
    if (!m) continue;
    const app = p.nom ? index.perNom.get(m[p.nom].trim().toLowerCase()) : null;
    return app
      ? { app: app.slug, nom: app.nom, via: "aulaia", tipus: p.tipus }
      : { app: AULAIA, nom: "aulaia.cat", via: "aulaia", tipus: p.tipus };
  }
  return { app: AULAIA, nom: "aulaia.cat", via: "aulaia", tipus: "altres" };
}

/* ---------- Estats ---------- */

const ESTATS = {
  delivered: { text: "Lliurat", grup: "ok" },
  opened: { text: "Obert", grup: "ok" },
  clicked: { text: "Clicat", grup: "ok" },
  sent: { text: "Enviat", grup: "pendent" },
  queued: { text: "En cua", grup: "pendent" },
  scheduled: { text: "Programat", grup: "pendent" },
  delivery_delayed: { text: "Amb retard", grup: "pendent" },
  bounced: { text: "Rebotat", grup: "problema" },
  complained: { text: "Marcat com a brossa", grup: "problema" },
  failed: { text: "Fallit", grup: "problema" },
  suppressed: { text: "Adreça bloquejada", grup: "problema" },
  canceled: { text: "Cancel·lat", grup: "aturat" },
};

/** Text i grup («ok», «pendent», «problema», «aturat») de l'ultim estat que dona Resend. */
export function estatDe(lastEvent) {
  const k = String(lastEvent || "").toLowerCase();
  return ESTATS[k] || { text: k ? k.replace(/_/g, " ") : "Sense estat", grup: "pendent" };
}

/** «jo•••@escola.cat»: prou per reconeixer-la, no per copiar-la. */
export function emmascarar(adreca) {
  const text = String(adreca || "").trim();
  const arrova = text.lastIndexOf("@");
  if (arrova < 1) return text ? "•••" : "";
  const local = text.slice(0, arrova);
  return local.slice(0, local.length > 2 ? 2 : 1) + "•••" + text.slice(arrova);
}

/* ---------- Resum ---------- */

/**
 * Converteix la llista de Resend en el que pinta el panell.
 *
 * @param {object} e
 * @param {object[]} e.correus   files de GET /emails
 * @param {object[]} e.cataleg   data/apps.json
 * @param {Date} [e.ara]
 * @param {{remitentContactes?: string}} [e.opcions]
 */
export function resumir({ correus = [], cataleg = [], ara = new Date(), opcions = {} }) {
  const index = indexCataleg(cataleg);
  const dies = diesSerie(ara);
  const avui = dies[dies.length - 1];
  const perDia = new Map(dies.map(d => [d, 0]));
  const perApp = new Map();
  const perTipus = new Map();
  const llista = [];
  const totals = { total: 0, avui: 0, ok: 0, pendents: 0, problemes: 0, aturats: 0 };

  const sumarEstat = (on, grup) => {
    on.total++;
    if (grup === "ok") on.ok++;
    else if (grup === "problema") on.problemes++;
    else if (grup === "aturat") on.aturats++;
    else on.pendents++;
  };

  for (const c of correus) {
    const quan = quanDe(c?.created_at);
    if (quan === null) continue;
    const dia = diaLocal(quan);
    if (!perDia.has(dia)) continue;

    const de = classificar(c, index, opcions);
    const estat = estatDe(c.last_event);
    const remitent = llegirRemitent(c.from).adreca;

    if (!perApp.has(de.app)) {
      perApp.set(de.app, {
        app: de.app, nom: de.nom, total: 0, avui: 0, ok: 0, pendents: 0, problemes: 0, aturats: 0,
        propis: 0, perAulaia: 0, desconegut: de.via === "desconeguda", ultim: 0, remitents: new Set(),
      });
    }
    const a = perApp.get(de.app);
    sumarEstat(a, estat.grup);
    if (de.via === "aulaia") a.perAulaia++; else a.propis++;
    if (dia === avui) a.avui++;
    if (quan > a.ultim) a.ultim = quan;
    if (remitent) a.remitents.add(remitent);

    if (de.via === "aulaia") {
      const k = de.tipus || "altres";
      if (!perTipus.has(k)) perTipus.set(k, { tipus: k, text: TEXT_TIPUS[k] || k, total: 0, ok: 0, pendents: 0, problemes: 0, aturats: 0, ultim: 0 });
      const t = perTipus.get(k);
      sumarEstat(t, estat.grup);
      if (quan > t.ultim) t.ultim = quan;
    }

    sumarEstat(totals, estat.grup);
    if (dia === avui) totals.avui++;
    perDia.set(dia, perDia.get(dia) + 1);

    llista.push({
      id: String(c.id || ""),
      quan,
      app: de.app,
      nomApp: de.nom,
      via: de.via,
      tipus: de.tipus,
      assumpte: String(c.subject || "").slice(0, 200),
      per: (Array.isArray(c.to) ? c.to : [c.to]).filter(x => typeof x === "string" && x),
      estat: estat.text,
      grup: estat.grup,
    });
  }

  llista.sort((x, y) => y.quan - x.quan);
  const perTotal = (x, y) => y.total - x.total || String(x.nom || x.text).localeCompare(String(y.nom || y.text), "ca");
  const amb = new Set(perApp.keys());

  return {
    ...totals,
    perDia: [...perDia].map(([dia, n]) => ({ dia, n })),
    perApp: [...perApp.values()].map(a => ({ ...a, remitents: [...a.remitents].sort() })).sort(perTotal),
    perTipus: [...perTipus.values()].sort(perTotal),
    // Apps del cataleg de les quals no ha sortit cap correu en tot el periode.
    senseCorreu: (cataleg || []).filter(a => a?.slug && !amb.has(a.slug)).map(a => a.nom),
    correus: llista,
  };
}
