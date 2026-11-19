/**
 * Informe d'activitat: el que cada app envia a aulaia.cat, un cop per hora i
 * nomes si hi ha entrat algu. El contracte sencer es a docs/informe-activitat.md.
 *
 * Qui parla es l'app; aulaia.cat no consulta mai cap app. I nomes viatgen
 * xifres agregades per domini de centre: ni noms, ni correus, ni identificadors
 * de persona. Hi ha alumnat menor d'edat.
 *
 * Funcions pures, sense "server-only" i amb el rellotge com a parametre, perque
 * es puguin provar amb node sol (scripts/activitat/proves.mjs).
 */

import { costTokens, modelDeLaTaula } from "./preus-ia.mjs";

export const VERSIO_INFORME = 1;

/** Un informe d'una hora amb 300 dominis i 12 models no arriba a aquesta mida. */
export const MAX_BYTES_INFORME = 64 * 1024;
export const MAX_DOMINIS = 300;
export const MAX_MODELS = 12;

/** Amb menys persones que aixo en tot el dia, el domini compta dins d'«altres». */
export const MINIM_PER_DOMINI = 3;
export const ALTRES = "altres";

/** S'accepten hores endarrerides (una app adormida envia en despertar-se), pero no gaire. */
export const DIES_ENRERE = 7;
const MARGE_RELLOTGE_MS = 5 * 60 * 1000;

/** Hores lectives sense cap informe a partir de les quals una app surt marcada. */
export const HORES_SILENCI = 26;

/** El «dia» d'un informe es el dia d'aquesta zona, no el d'UTC. */
export const ZONA = "Europe/Madrid";

const HORA_MS = 60 * 60 * 1000;
const MAX_PERSONES = 1e6;
const MAX_TOKENS = 1e12;

export const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;
const HORA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:00:00(?:\.000)?Z$/;
const DOMINI = /^(?=.{4,100}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
// Sense «@» a proposit: un identificador de model no ha de poder semblar un correu.
const MODEL = /^[a-z0-9][a-z0-9._:/-]{0,79}$/;
const EMPREMTA = /^[0-9a-f]{64}$/;
const CLAUS_PROHIBIDES = new Set(["__proto__", "constructor", "prototype"]);

/* ---------- Claus ---------- */

/**
 * ACTIVITAT_CLAUS es un JSON { "slug": "empremta SHA-256 de la clau, en hexadecimal" }.
 * aulaia.cat no guarda mai les claus, nomes la seva empremta: si es filtra
 * aquesta variable, ningu pot enviar res amb ella.
 * Torna [[slug, empremta], ...]; el que no te la forma esperada es descarta.
 */
export function llegirClaus(text) {
  if (typeof text !== "string" || !text.trim()) return [];
  let mapa;
  try {
    mapa = JSON.parse(text);
  } catch {
    return [];
  }
  if (!mapa || typeof mapa !== "object" || Array.isArray(mapa)) return [];
  const vistes = new Set();
  const out = [];
  for (const [slug, empremta] of Object.entries(mapa).slice(0, 200)) {
    if (!SLUG.test(slug) || typeof empremta !== "string") continue;
    const e = empremta.trim().toLowerCase();
    // Dues apps amb la mateixa clau trencarien la regla d'una clau per app.
    if (!EMPREMTA.test(e) || vistes.has(e)) continue;
    vistes.add(e);
    out.push([slug, e]);
  }
  return out;
}

/* ---------- Dates ---------- */

const fmtDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** 'AAAA-MM-DD' del dia que es a Catalunya en aquest instant. */
export function diaLocal(instant) {
  return fmtDia.format(instant instanceof Date ? instant : new Date(instant));
}

export function iniciHora(instant) {
  const ms = instant instanceof Date ? instant.getTime() : Number(instant);
  return new Date(Math.floor(ms / HORA_MS) * HORA_MS);
}

/** Suma dies a un 'AAAA-MM-DD' (dies de calendari, sense hores pel mig). */
export function sumarDies(dia, n) {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * L'hora que el panell ensenya com a «ultima hora»: l'ultima tancada, deixant
 * deu minuts perque arribin els informes. A les 16:05 encara es la de 14 a 15.
 */
export function horaDeReferencia(ara) {
  const oberta = iniciHora(ara).getTime();
  const minuts = (ara.getTime() - oberta) / 60000;
  return new Date(oberta - (minuts < 10 ? 2 : 1) * HORA_MS);
}

/**
 * Dies sense classe que no son cap de setmana, a mes dels que ja coneix
 * `esLectiu` (juliol, agost i Nadal). Format: ['AAAA-MM-DD', 'AAAA-MM-DD']
 * amb primer i ultim dia inclosos. Setmana Santa i els festius locals canvien
 * cada curs: s'apunten aqui.
 */
export const DIES_NO_LECTIUS = [];

/**
 * Hi ha classe aquest dia? Nomes serveix per no donar l'alarma un dilluns al
 * mati perque una app ha callat tot el cap de setmana.
 */
export function esLectiu(dia) {
  const [a, m, d] = dia.split("-").map(Number);
  const setmana = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  if (setmana === 0 || setmana === 6) return false;
  if (m === 7 || m === 8) return false;
  if ((m === 12 && d >= 24) || (m === 1 && d <= 6)) return false;
  return !DIES_NO_LECTIUS.some(([de, fins]) => dia >= de && dia <= fins);
}

/** Hores que cauen en dia lectiu entre dos instants. */
export function horesLectivesEntre(desDe, fins) {
  let hores = 0;
  // Amb 45 dies de finestra son com a molt 1.080 voltes.
  for (let t = iniciHora(desDe).getTime(); t + HORA_MS <= fins.getTime(); t += HORA_MS) {
    if (esLectiu(diaLocal(t))) hores++;
  }
  return hores;
}

/**
 * Com esta l'enviament d'una app. Com que nomes s'envia quan hi ha activitat,
 * el silenci vol dir que no hi ha entrat ningu o que l'emissor no funciona:
 * des d'aqui no es pot distingir, i per aixo es diu aixi al panell.
 * @param {Date|null} ultimaHora inici de l'ultima hora informada
 */
export function estatEnviament(ultimaHora, ara) {
  if (!ultimaHora) return { estat: "mai", hores: null };
  const fiHora = new Date(ultimaHora.getTime() + HORA_MS);
  const hores = horesLectivesEntre(fiHora, ara);
  return { estat: hores > HORES_SILENCI ? "callada" : "ok", hores };
}

/* ---------- Validacio del que envia l'app ---------- */

const esObjecte = x => !!x && typeof x === "object" && !Array.isArray(x);
const nomesClaus = (obj, permeses) => Object.keys(obj).every(k => permeses.includes(k));
const enter = (x, max) => Number.isInteger(x) && x >= 0 && x <= max;
const error = (motiu, on) => ({ ok: false, motiu, ...(on ? { on } : {}) });

const CAMPS_ARREL = ["versio", "app", "hora", "dominis"];
const CAMPS_DOMINI = ["domini", "actiusHora", "actiusDia", "ia"];
const CAMPS_IA = ["model", "entrada", "sortida", "cauLectura", "cauEscriptura"];

/**
 * Reconstrueix l'informe nomes amb els camps coneguts i amb mides acotades.
 * Qualsevol camp que no sigui del contracte fa rebutjar l'informe sencer: si
 * una app s'equivoca i hi afegeix un correu o un nom, s'ha de notar al primer
 * enviament, no quedar desat. L'error diu ON es el problema, mai el valor.
 *
 * Els dominis amb menys de MINIM_PER_DOMINI persones en tot el dia es fonen
 * aqui dins d'«altres», encara que l'app no ho hagi fet.
 *
 * @param {unknown} cos   el JSON rebut
 * @param {{app: string, ara?: Date}} context  `app` es l'slug que surt de la clau
 * @returns {{ok: true, informe: {hora: string, dominis: object[]}, agrupats: number}
 *          | {ok: false, motiu: string, on?: string}}
 */
export function netejarInforme(cos, { app, ara = new Date() }) {
  if (!esObjecte(cos)) return error("format");
  if (!nomesClaus(cos, CAMPS_ARREL)) return error("camp-desconegut", "arrel");
  if (cos.versio !== VERSIO_INFORME) return error("versio");
  // L'slug que val es el de la clau. El del cos nomes serveix per descobrir una
  // app desplegada amb la clau d'una altra abans que n'embruti les xifres.
  if (cos.app !== app) return error("app-no-coincideix");

  if (typeof cos.hora !== "string" || !HORA_ISO.test(cos.hora)) return error("hora");
  const ms = Date.parse(cos.hora);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 13) !== cos.hora.slice(0, 13)) return error("hora");
  if (ms > ara.getTime() + MARGE_RELLOTGE_MS) return error("hora-futura");
  if (ms < ara.getTime() - DIES_ENRERE * 24 * HORA_MS) return error("hora-antiga");

  if (!Array.isArray(cos.dominis) || cos.dominis.length === 0 || cos.dominis.length > MAX_DOMINIS) {
    return error("dominis");
  }

  const perDomini = new Map();
  for (let i = 0; i < cos.dominis.length; i++) {
    const d = cos.dominis[i];
    const on = `dominis[${i}]`;
    if (!esObjecte(d)) return error("format", on);
    if (!nomesClaus(d, CAMPS_DOMINI)) return error("camp-desconegut", on);

    const domini = typeof d.domini === "string" ? d.domini.trim().toLowerCase() : "";
    if (domini !== ALTRES && !DOMINI.test(domini)) return error("domini", on);
    if (perDomini.has(domini)) return error("domini-repetit", on);

    if (!enter(d.actiusHora, MAX_PERSONES) || !enter(d.actiusDia, MAX_PERSONES)) return error("actius", on);
    // Qui ha estat actiu aquesta hora tambe ho ha estat avui.
    if (d.actiusHora > d.actiusDia) return error("actius", on);

    const ia = new Map();
    if (d.ia !== undefined) {
      if (!Array.isArray(d.ia) || d.ia.length > MAX_MODELS) return error("ia", on);
      for (let j = 0; j < d.ia.length; j++) {
        const m = d.ia[j];
        const onIa = `${on}.ia[${j}]`;
        if (!esObjecte(m)) return error("format", onIa);
        if (!nomesClaus(m, CAMPS_IA)) return error("camp-desconegut", onIa);
        const model = typeof m.model === "string" ? m.model.trim().toLowerCase() : "";
        if (!MODEL.test(model) || CLAUS_PROHIBIDES.has(model)) return error("model", onIa);
        if (ia.has(model)) return error("model-repetit", onIa);
        const t = { e: m.entrada, s: m.sortida, l: m.cauLectura ?? 0, w: m.cauEscriptura ?? 0 };
        if (!Object.values(t).every(x => enter(x, MAX_TOKENS))) return error("tokens", onIa);
        if (t.e + t.s + t.l + t.w > 0) ia.set(model, t);
      }
    }
    perDomini.set(domini, { domini, actiusHora: d.actiusHora, actiusDia: d.actiusDia, ia });
  }

  // Dominis petits cap a «altres». Sumar persones es correcte perque cada
  // persona es d'un sol domini.
  let agrupats = 0;
  const altres = perDomini.get(ALTRES) || { domini: ALTRES, actiusHora: 0, actiusDia: 0, ia: new Map() };
  for (const [domini, d] of [...perDomini]) {
    if (domini === ALTRES || d.actiusDia >= MINIM_PER_DOMINI) continue;
    altres.actiusHora += d.actiusHora;
    altres.actiusDia += d.actiusDia;
    for (const [model, t] of d.ia) {
      const a = altres.ia.get(model) || { e: 0, s: 0, l: 0, w: 0 };
      altres.ia.set(model, { e: a.e + t.e, s: a.s + t.s, l: a.l + t.l, w: a.w + t.w });
    }
    perDomini.delete(domini);
    agrupats++;
  }
  if (agrupats > 0) perDomini.set(ALTRES, altres);

  const dominis = [...perDomini.values()]
    .filter(d => d.actiusDia > 0 || d.ia.size > 0)
    .map(d => ({
      domini: d.domini,
      actiusHora: Math.min(d.actiusHora, MAX_PERSONES),
      actiusDia: Math.min(d.actiusDia, MAX_PERSONES),
      ia: Object.fromEntries(d.ia),
    }));
  if (dominis.length === 0) return error("dominis");

  return { ok: true, informe: { hora: new Date(ms).toISOString(), dominis }, agrupats };
}

/* ---------- Resum per al panell ---------- */

const zero = () => ({ e: 0, s: 0, l: 0, w: 0 });
const sumaTokens = (a, b) => ({ e: a.e + b.e, s: a.s + b.s, l: a.l + b.l, w: a.w + b.w });
export const totalTokens = t => t.e + t.s + t.l + t.w;

/**
 * Ajunta el que surt de la base de dades en el que pinta la pagina.
 *
 * @param {object} e
 * @param {{app: string, dia: string, domini: string, actius_dia: number}[]} e.dies
 *        l'ultim informe de cada dia dels ultims 30: es la foto del dia sencer
 * @param {{app: string, hora: Date, domini: string, actius_hora: number}[]} e.recents
 *        files de les ultimes hores
 * @param {{app: string, domini: string, dia: string, model: string, e: number, s: number, l: number, w: number}[]} e.tokens
 *        tokens del mes en curs, per dia (el preu pot canviar a mig mes)
 * @param {{app: string, hora: Date}[]} e.ultims  l'ultima hora informada per cada app
 * @param {string[]} e.slugs     apps que tenen clau a ACTIVITAT_CLAUS
 * @param {{slug: string, nom: string}[]} e.cataleg
 * @param {Date} e.ara
 */
export function resumirActivitat({ dies = [], recents = [], tokens = [], ultims = [], slugs = [], cataleg = [], ara = new Date() }) {
  const avui = diaLocal(ara);
  const dies30 = Array.from({ length: 30 }, (_, i) => sumarDies(avui, i - 29));
  const posicio = new Map(dies30.map((d, i) => [d, i]));
  const referencia = horaDeReferencia(ara);
  const noms = new Map(cataleg.map(a => [a.slug, a.nom]));

  const apps = new Map();
  const app = slug => {
    if (!apps.has(slug)) {
      apps.set(slug, {
        slug,
        nom: noms.get(slug) || slug,
        ambClau: slugs.includes(slug),
        actiusHora: 0,
        actiusAvui: 0,
        serie: dies30.map(() => 0),
        tokens: zero(),
        cost: 0,
        sensePreu: new Set(),
        ultimaHora: null,
        dominis: new Map(),
      });
    }
    return apps.get(slug);
  };
  const domini = (a, nom) => {
    if (!a.dominis.has(nom)) {
      a.dominis.set(nom, { domini: nom, actiusHora: 0, actiusAvui: 0, diesActius: 0, pic: 0, tokens: zero(), cost: 0, models: new Map() });
    }
    return a.dominis.get(nom);
  };

  for (const slug of slugs) app(slug);

  for (const f of dies) {
    const i = posicio.get(f.dia);
    if (i === undefined) continue;
    const a = app(f.app);
    const d = domini(a, f.domini);
    const n = Number(f.actius_dia) || 0;
    a.serie[i] += n;
    if (n > 0) d.diesActius++;
    d.pic = Math.max(d.pic, n);
    if (f.dia === avui) {
      a.actiusAvui += n;
      d.actiusAvui += n;
    }
  }

  for (const f of recents) {
    if (new Date(f.hora).getTime() !== referencia.getTime()) continue;
    const a = app(f.app);
    const n = Number(f.actius_hora) || 0;
    a.actiusHora += n;
    domini(a, f.domini).actiusHora += n;
  }

  for (const f of tokens) {
    const a = app(f.app);
    const d = domini(a, f.domini);
    const t = { e: Number(f.e) || 0, s: Number(f.s) || 0, l: Number(f.l) || 0, w: Number(f.w) || 0 };
    const cost = costTokens(f.model, t, f.dia);
    // Dos identificadors del mateix model (amb data, amb prefix) es pinten junts.
    const nomModel = modelDeLaTaula(f.model) || f.model;
    const m = d.models.get(nomModel) || { model: nomModel, tokens: zero(), cost: 0, ambPreu: cost != null };
    m.tokens = sumaTokens(m.tokens, t);
    m.cost += cost || 0;
    d.models.set(nomModel, m);
    d.tokens = sumaTokens(d.tokens, t);
    d.cost += cost || 0;
    a.tokens = sumaTokens(a.tokens, t);
    a.cost += cost || 0;
    if (cost == null) a.sensePreu.add(f.model);
  }

  for (const f of ultims) app(f.app).ultimaHora = new Date(f.hora);

  const llista = [...apps.values()].map(a => ({
    ...a,
    pic: Math.max(...a.serie, 0),
    sensePreu: [...a.sensePreu].sort(),
    enviament: estatEnviament(a.ultimaHora, ara),
    dominis: [...a.dominis.values()]
      .map(d => ({ ...d, models: [...d.models.values()].sort((x, y) => y.cost - x.cost || totalTokens(y.tokens) - totalTokens(x.tokens)) }))
      // «altres» sempre al final: no es un centre.
      .sort((x, y) => (x.domini === ALTRES) - (y.domini === ALTRES) || y.actiusAvui - x.actiusAvui || y.pic - x.pic || x.domini.localeCompare(y.domini)),
  }));
  llista.sort((x, y) => y.actiusAvui - x.actiusAvui || y.pic - x.pic || y.cost - x.cost || x.nom.localeCompare(y.nom, "ca"));

  // Per centre: quines apps fa servir i quant costa la seva IA. Les persones no
  // se sumen entre apps, perque la mateixa persona entra a mes d'una.
  const centres = new Map();
  for (const a of llista) {
    for (const d of a.dominis) {
      if (!centres.has(d.domini)) centres.set(d.domini, { domini: d.domini, apps: [], tokens: zero(), cost: 0 });
      const c = centres.get(d.domini);
      c.apps.push({ slug: a.slug, nom: a.nom, actiusAvui: d.actiusAvui, pic: d.pic });
      c.tokens = sumaTokens(c.tokens, d.tokens);
      c.cost += d.cost;
    }
  }
  const perCentre = [...centres.values()].sort(
    (x, y) => (x.domini === ALTRES) - (y.domini === ALTRES) || y.apps.length - x.apps.length || y.cost - x.cost || x.domini.localeCompare(y.domini)
  );

  const ambDades = llista.filter(a => a.ultimaHora);
  return {
    ara,
    avui,
    dies30,
    referencia,
    apps: llista,
    perCentre,
    callades: llista.filter(a => a.enviament.estat === "callada"),
    senseEstrenar: llista.filter(a => a.ambClau && !a.ultimaHora),
    senseClau: cataleg.filter(a => !slugs.includes(a.slug)),
    total: {
      actiusHora: ambDades.reduce((n, a) => n + a.actiusHora, 0),
      actiusAvui: ambDades.reduce((n, a) => n + a.actiusAvui, 0),
      tokens: ambDades.reduce((t, a) => sumaTokens(t, a.tokens), zero()),
      cost: ambDades.reduce((n, a) => n + a.cost, 0),
      serie: dies30.map((_, i) => ambDades.reduce((n, a) => n + a.serie[i], 0)),
    },
  };
}
