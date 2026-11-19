/**
 * Demostracio del panell: cerca a Google, activitat, correus enviats, cost
 * d IA i fonaments. Tot inventat (vegeu lib/demo/base.mjs). No es crida Google,
 * Resend ni Anthropic, ni es llegeix la base de dades.
 *
 * Sempre que la pagina de debo passa les dades per una funcio pura
 * (resumirActivitat, resumir de correus, resumir de cost), aqui es fabrica
 * l entrada d aquella funcio i no el resultat: aixi la demo pinta exactament
 * el mateix que pintaria el panell amb aquelles xifres.
 */

import { resumir as resumirCorreus } from "../correus.mjs";
import { resumir as resumirCost, DIES_SERIE } from "../cost-ia.mjs";
import { horaDeReferencia } from "../activitat.mjs";
import { CENTRES, PERSONES, PROJECTES, MINUT, HORA, DIA, atzar, soroll, entre, tria, correuDe, diaLocal, horaLocal, sumarDies, pesDelDia, pesDeLHora, nomDeLApp } from "./base.mjs";
import { REMITENT_DEMO } from "./gestio.mjs";

/* ---------- Cerca a Google ---------- */

const DESFASAMENT = 3; // com a lib/search-console.js: Google tanca les dades amb retard

/** [slug, clics per dia, impressions per clic, posicio, consultes, pagines] */
const PROPIETATS = [
  ["aulaia", 9, 19, 14.2,
    ["aplicacions gratuïtes per a l'aula", "apps educatives en català", "eines digitals per a docents", "recursos tic secundària", "aulaia"],
    ["/", "/apps/pla-lector", "/blog/com-organitzar-el-pla-lector-d-un-institut", "/apps/typeedu", "/alta"]],
  ["dictats", 14, 16, 9.8,
    ["dictats en català online", "dictats 1r eso", "dictats amb àudio", "practicar ortografia català", "dictats primària"],
    ["/", "/dictats", "/docents", "/privacitat"]],
  ["typeedu", 11, 22, 12.6,
    ["mecanografia per a primària", "aprendre a escriure a màquina nens", "mecanografia en català", "curs de mecanografia escola"],
    ["/", "/ca", "/es", "/ca/docents"]],
  ["pla-lector", 6, 24, 17.4,
    ["pla lector institut", "gestionar biblioteca escolar", "app préstec de llibres escola", "pla lector eso"],
    ["/", "/es/", "/demo.html"]],
  ["radio-escolar", 4, 21, 15.1,
    ["ràdio escolar com començar", "pòdcast a l'aula", "publicar pòdcast escola"],
    ["/", "/podcasts"]],
  ["aules-sostenibles", 2, 28, 22.3,
    ["escola verda activitats", "aula sostenible secundària"],
    ["/"]],
  ["chefboss", 1, 34, 27.9,
    ["joc cuina cicle formatiu", "simulador escandalls"],
    ["/"]],
];

export function getSeoData(dies = 28, cataleg = [], ara = new Date()) {
  const dia = d => new Date(ara.getTime() - d * DIA).toISOString().slice(0, 10);
  const fi = dia(DESFASAMENT);
  const inici = dia(dies + DESFASAMENT);

  const llocs = PROPIETATS.map(([slug, perDia, impPerClic, posicio, consultes, pagines]) => {
    const def = PROJECTES.find(p => p.slug === slug);
    const domini = def?.domini || cataleg.find(a => a.slug === slug)?.domini || slug + ".test";
    const serie = [];
    for (let i = dies - 1; i >= 0; i--) {
      const data = sumarDies(fi, -i);
      // Tendencia suau cap amunt: el final del periode pesa una mica mes.
      const tendencia = 0.8 + 0.4 * ((dies - 1 - i) / Math.max(1, dies - 1));
      const clicks = Math.round(perDia * tendencia * (0.35 + pesDelDia(data) * 0.65) * (0.6 + soroll(`seo-${slug}-${data}`) * 0.8));
      const impressions = Math.round(clicks * impPerClic * (0.85 + soroll(`imp-${slug}-${data}`) * 0.3) + perDia * 4);
      serie.push({ data, clicks, impressions });
    }
    const clicks = serie.reduce((n, p) => n + p.clicks, 0);
    const impressions = serie.reduce((n, p) => n + p.impressions, 0);

    const reparteix = (total, textos, clau) => {
      const pesos = textos.map((_, i) => 1 / (i + 1.4));
      const suma = pesos.reduce((a, b) => a + b, 0) * 1.5; // la resta son consultes que Google no detalla
      return textos.map((text, i) => ({ text, n: Math.round((total * pesos[i]) / suma), k: soroll(`${clau}-${slug}-${i}`) }));
    };

    return {
      siteUrl: `sc-domain:${domini}`,
      nom: nomDeLApp(slug, cataleg),
      host: domini,
      slug: slug === "aulaia" ? null : slug,
      error: null,
      clicks,
      impressions,
      ctr: impressions ? clicks / impressions : 0,
      position: posicio,
      abans: { clicks: Math.round(clicks * (0.78 + soroll("abans-" + slug) * 0.2)), impressions: Math.round(impressions * (0.8 + soroll("abansi-" + slug) * 0.25)) },
      consultes: reparteix(clicks, consultes, "q").map(c => ({
        text: c.text, clicks: c.n, impressions: Math.round(c.n * impPerClic * (0.7 + c.k)), position: Math.round((posicio * (0.4 + c.k)) * 10) / 10,
      })),
      pagines: reparteix(clicks, pagines, "p").map(p => ({
        url: `https://${domini}${p.text}`, clicks: p.n, impressions: Math.round(p.n * impPerClic * (0.8 + p.k * 0.6)),
      })),
      serie,
    };
  });

  llocs.sort((a, b) => b.clicks - a.clicks);
  return { llocs, inici, fi, dies, generatAt: ara.toISOString() };
}

/* ---------- Activitat ---------- */

/**
 * Apps que informen a la demo. `actius` es per domini de centre en un dia de classe,
 * i `ia` son els tokens [entrada, sortida, lectura de cau, escriptura de cau] per
 * persona i dia. Estan triats perque el cost estimat d aqui i el de «Cost d IA»
 * siguin del mateix ordre: son la mateixa despesa vista de dues maneres.
 */
const APPS_ACTIVITAT = [
  { slug: "pla-lector", centres: [0, 1, 4, 8], actius: [86, 64, 41, 22], ia: null },
  { slug: "typeedu", centres: [2, 3, 6, 12], actius: [58, 47, 33, 12], ia: { "gemini-3.8-flash-tts": [900, 600, 0, 0] } },
  { slug: "dictats", centres: [0, 5, 10], actius: [44, 29, 17], ia: { "gemini-3.8-flash-tts": [1400, 1100, 0, 0], "claude-haiku-5-5": [5200, 1300, 21000, 800] } },
  { slug: "radio-escolar", centres: [2, 15], actius: [18, 9], ia: null },
  { slug: "aulaacull", centres: [7, 4], actius: [14, 11], ia: { "claude-sonnet-5-5": [4000, 1300, 15000, 800] } },
  // Un model que no es a la taula de preus: el panell el marca com a «sense preu».
  { slug: "chefboss", centres: [5, 9], actius: [26, 19], ia: { "gemini-3.7-flash": [4200, 1900, 0, 0] } },
  { slug: "kipuk", centres: [9], actius: [21], ia: null },
  // Fa dies que no envia res: el panell la marca com a «callada».
  { slug: "la-claqueta", centres: [3], actius: [8], ia: null, callada: true },
];

/** Tenen clau; MatEscac encara no ha enviat mai res. */
export function slugsActivitat() {
  return [...APPS_ACTIVITAT.map(a => a.slug), "matescac"];
}

/**
 * El que torna llegirActivitat de lib/db.js.
 * @param {{desDeDia: string, mesDesDe: string, horesDesDe: Date}} finestra
 */
export function llegirActivitat({ desDeDia, mesDesDe, horesDesDe }, ara = new Date()) {
  const avui = diaLocal(ara);
  const referencia = horesDesDe instanceof Date ? horesDesDe : horaDeReferencia(ara);
  // Quina part del dia ja ha passat, per no donar a mig mati les xifres del dia sencer.
  let fet = 0;
  let tot = 0;
  for (let h = 0; h < 24; h++) {
    tot += pesDeLHora(h);
    if (h <= horaLocal(referencia)) fet += pesDeLHora(h);
  }
  const partDelDia = Math.max(0.08, fet / tot);

  const dies = [];
  const recents = [];
  const tokens = [];
  const ultims = [];

  for (const app of APPS_ACTIVITAT) {
    const ultimDia = app.callada ? sumarDies(avui, -6) : avui;
    // Com al panell de debo: amb menys de tres persones el domini no surt amb el
    // seu nom, i les seves persones se sumen a la fila d «altres» d aquell dia.
    const petits = new Map();
    app.centres.forEach((c, i) => {
      const domini = CENTRES[c].domini;
      for (let dia = desDeDia; dia <= ultimDia; dia = sumarDies(dia, 1)) {
        const base = app.actius[i] * pesDelDia(dia) * (0.7 + soroll(`act-${app.slug}-${domini}-${dia}`) * 0.5);
        const n = Math.round(dia === avui ? base * partDelDia : base);
        if (n >= 3) dies.push({ app: app.slug, dia, domini, actius_dia: n });
        else if (n > 0) petits.set(dia, (petits.get(dia) || 0) + n);

        if (dia === avui && n >= 3) {
          const ara1 = Math.max(1, Math.min(n, Math.round(app.actius[i] * 0.3 * pesDeLHora(horaLocal(referencia)) * pesDelDia(dia) + 1)));
          recents.push({ app: app.slug, hora: referencia, domini, actius_hora: ara1 });
        }

        if (app.ia && dia >= mesDesDe && n > 0) {
          for (const [model, [e, s, l, w]] of Object.entries(app.ia)) {
            const k = n * (0.8 + soroll(`tok-${app.slug}-${model}-${dia}`) * 0.4);
            tokens.push({
              app: app.slug, domini: n >= 3 ? domini : "altres", dia, model,
              e: Math.round(e * k), s: Math.round(s * k), l: Math.round(l * k), w: Math.round(w * k),
            });
          }
        }
      }
    });
    for (const [dia, n] of petits) dies.push({ app: app.slug, dia, domini: "altres", actius_dia: n });
    ultims.push({ app: app.slug, hora: app.callada ? new Date(referencia.getTime() - 6 * DIA) : referencia });
  }
  return { dies, recents, tokens, ultims };
}

/* ---------- Correus enviats ---------- */

/** Data com l escriu Resend: «2026-11-14 09:12:33.123456+00». */
const dataResend = ms => new Date(ms).toISOString().replace("T", " ").replace(/Z$/, "000+00");

const ESTATS_CORREU = ["delivered", "delivered", "delivered", "delivered", "delivered", "opened", "opened", "clicked", "delivered", "delivered"];

/**
 * Apps que envien amb la seva adreça: [slug, remitent, assumptes, correus per dia de classe].
 * L adreça es fictícia; el panell reconeix l app pel nom del remitent.
 */
const REMITENTS = [
  ["pla-lector", "El Pla Lector <avisos@plalector-demo.test>", ["Tens un llibre per tornar aquesta setmana", "El teu préstec s'acaba demà", "Resum setmanal de la biblioteca"], 5],
  ["dictats", "dictats.cat <hola@dictats-demo.test>", ["El teu enllaç per entrar a dictats.cat", "Nou dictat assignat al teu grup"], 3],
  ["typeedu", "TypeEdu <hola@typeedu-demo.test>", ["El teu enllaç d'accés", "Informe setmanal del grup"], 3],
  ["radio-escolar", "Ràdio Escolar <hola@radioescolar-demo.test>", ["Tens un pòdcast pendent de revisar"], 1],
  ["aules-sostenibles", "Aules Sostenibles <hola@aulessostenibles-demo.test>", ["Resum setmanal de les aules"], 0.4],
];

export function getCorreus(cataleg = [], ara = new Date()) {
  const correus = [];
  let n = 0;
  const afegir = (quan, from, to, subject, estat) => {
    correus.push({ id: `demo-${String(++n).padStart(5, "0")}`, from, to: [to], subject, created_at: dataResend(quan), last_event: estat });
  };
  const estatDe = (r, quan) => {
    // Els de l ultima estona encara no tenen confirmacio; de tant en tant en rebota algun.
    if (ara.getTime() - quan < 20 * MINUT) return "sent";
    const p = r();
    if (p < 0.02) return "bounced";
    if (p < 0.024) return "complained";
    return tria(r, ESTATS_CORREU);
  };
  const destinatari = r => {
    const c = tria(r, CENTRES);
    return correuDe(tria(r, PERSONES), c.domini);
  };
  const horaDeFeina = (r, diaMs) => diaMs + (7 + r() * 11) * HORA;

  const avui0 = Date.parse(diaLocal(ara) + "T00:00:00Z");
  for (let d = DIES_SERIE - 1; d >= 0; d--) {
    const dia0 = avui0 - d * DIA;
    const dia = new Date(dia0).toISOString().slice(0, 10);
    const pes = pesDelDia(dia);
    const r = atzar("correus-" + dia);
    const posa = (from, subject, to = destinatari(r)) => {
      const quan = horaDeFeina(r, dia0);
      if (quan < ara.getTime()) afegir(quan, from, to, subject, estatDe(r, quan));
    };

    for (const [, from, assumptes, perDia] of REMITENTS) {
      const quants = Math.round(perDia * pes * (0.5 + r()) + r() * 0.6);
      for (let i = 0; i < quants; i++) posa(from, tria(r, assumptes));
    }

    // El que envia aulaia.cat en nom de les apps: el circuit d una alta, de punta a punta.
    if (r() < 0.45 * pes + 0.05) {
      const app = nomDeLApp(tria(r, ["pla-lector", "typeedu", "dictats", "aulaacull", "kipuk", "fpsegura"]), cataleg);
      const centre = tria(r, CENTRES);
      const qui = correuDe(tria(r, PERSONES), centre.domini);
      const de = "aulaia.cat <altes@aulaia.cat>";
      posa(de, `Verifica la teva adreça · ${app}`, qui);
      posa(de, `Hem rebut la teva sol·licitud · ${app}`, qui);
      posa(de, `🔔 Alta nova: ${centre.nom} · ${app}`, "avisos@aulaia-demo.test");
      if (r() < 0.8) posa(de, `Accés validat a ${app} · aulaia.cat`, qui);
    }
    if (r() < 0.3 * pes) posa("aulaia.cat <altes@aulaia.cat>", `El teu enllaç d'accés a ${nomDeLApp(tria(r, ["kipuk", "fpsegura", "la-claqueta"]), cataleg)}`);
    if (r() < 0.2 * pes) {
      const qui = tria(r, PERSONES);
      posa("aulaia.cat <hola@aulaia.cat>", "Hem rebut el teu missatge · aulaia.cat", correuDe(qui, tria(r, CENTRES).domini));
      posa("aulaia.cat <hola@aulaia.cat>", `💬 Dubte de ${qui}`, "avisos@aulaia-demo.test");
    }
    // Presentacions a centres: tandes de cinc, alguns dies.
    if (pes === 1 && r() < 0.3) {
      for (let i = 0; i < 5; i++) posa(REMITENT_DEMO, "Aplicacions gratuïtes per a l'aula · aulaia.cat", `a${99001000 + entre(r, 0, 60)}@centre-demo.test`);
    }
  }

  return {
    ...resumirCorreus({ correus, cataleg, ara, opcions: { remitentContactes: REMITENT_DEMO } }),
    incomplet: false,
    origenClau: "panell",
    llegit: ara.toISOString(),
  };
}

/* ---------- Cost d IA ---------- */

/** Claus fictícies: [id, nom a la consola, estat, {model: dolars per dia de classe}] */
const CLAUS_IA = [
  ["apikey_demo_dictats", "dictats-produccio", "active", { "claude-haiku-5-5": 0.34 }],
  ["apikey_demo_aulaacull", "aulaacull-produccio", "active", { "claude-sonnet-5-5": 0.52, "claude-haiku-5-5": 0.06 }],
  ["apikey_demo_plalector", "pla-lector-proves-de-lectura", "active", { "claude-haiku-5-5": 0.11 }],
  ["apikey_demo_memoria", "memoria-produccio", "active", { "claude-sonnet-5-5": 0.19 }],
  ["apikey_demo_bitacola", "bitacola-proves", "inactive", { "claude-opus-5-5": 0.09 }],
];

/** El que torna getCostAnthropic de lib/anthropic-admin.js. */
export function getCostAnthropic(ara = new Date()) {
  const avui = Date.UTC(ara.getUTCFullYear(), ara.getUTCMonth(), ara.getUTCDate());
  const files = [];
  const filesAvui = [];
  const centims = usd => (usd * 100).toFixed(6);

  for (let d = DIES_SERIE - 1; d >= 0; d--) {
    const inici = new Date(avui - d * DIA).toISOString().replace(/\.\d{3}Z$/, "Z");
    const dia = inici.slice(0, 10);
    for (const [id, , estat, models] of CLAUS_IA) {
      // La clau desactivada va deixar de gastar fa dues setmanes.
      if (estat === "inactive" && d < 14) continue;
      for (const [model, perDia] of Object.entries(models)) {
        const usd = perDia * pesDelDia(dia) * (0.55 + soroll(`ia-${id}-${model}-${dia}`) * 0.9);
        if (usd < 0.004) continue;
        const fila = { starting_at: inici, group: { api_key_id: id, model }, cost: { amount: centims(d === 0 ? usd * Math.min(1, ara.getUTCHours() / 16) : usd), currency: "USD" } };
        (d === 0 ? filesAvui : files).push(fila);
      }
    }
  }

  return {
    ...resumirCost({ files, filesAvui, claus: CLAUS_IA.map(([id, name, status]) => ({ id, name, status })), ara }),
    refrescat: new Date(ara.getTime() - 5 * HORA).toISOString(),
    llegit: ara.toISOString(),
  };
}

/* ---------- Fonaments ---------- */

const NETA = { hiHa: true, remotAmbToken: false, branca: "main", brutes: 0, perPujar: 0, brancaRemota: true };
const copia = (ara, restaura) => ({
  workflows: [{ fitxer: ".github/workflows/copia-bd.yml", restaura, xifra: true, ultima: { conclusio: "success", estat: "completed", data: new Date(ara.getTime() - 9 * HORA).toISOString() } }],
  scripts: [],
});
const SENSE_COPIA = { workflows: [], scripts: [] };
const PROVES_BONES = { script: true, fitxers: 14, ci: true, ciFitxers: [".github/workflows/proves.yml"] };
const SENSE_SECRETS = { escanejat: "git", fitxers: 212, envSeguit: [], trobades: [] };
const MENORS_BE = { privacitat: ["app/privacitat/page.js"], retencio: ["scripts/esborrat-fi-de-curs.mjs"] };

/** El que canvia de cada app respecte d una app amb tots els pilots posats. */
const revisio = ara => ({
  "pla-lector": {},
  dictats: {},
  typeedu: { git: { brutes: 2 } },
  "radio-escolar": { bd: null, proves: { script: true, fitxers: 6, ci: false, ciFitxers: [] } },
  aulaacull: { copies: SENSE_COPIA, indicisMenors: { privacitat: ["src/app/privacitat/page.tsx"], retencio: [] } },
  chefboss: { menors: false, proves: { script: false, fitxers: 0, ci: false, ciFitxers: [] } },
  kipuk: { proves: { script: true, fitxers: 9, ci: false, ciFitxers: [] } },
  diedric3d: { copies: copia(ara, false) },
  matescac: { secrets: { escanejat: "git", fitxers: 148, envSeguit: [], trobades: [{ tipus: "Clau d'API", fitxer: "scripts/prova-antiga.js", linia: 12 }] } },
  fpsegura: { proves: { script: true, fitxers: 4, ci: false, ciFitxers: [] } },
  "la-claqueta": { git: { perPujar: 3 } },
  kiosko: { bd: null, menors: false },
});

function appsRevisades(cataleg, ara, anterior) {
  return Object.entries(revisio(ara)).map(([slug, canvis]) => {
    const def = PROJECTES.find(p => p.slug === slug);
    const copies = canvis.copies || copia(ara, true);
    const app = {
      slug,
      nom: nomDeLApp(slug, cataleg),
      carpeta: `C:\\Projectes\\${slug}`,
      bd: "bd" in canvis ? canvis.bd : "postgres",
      menors: "menors" in canvis ? canvis.menors : true,
      nota: null,
      error: null,
      railway: [{ projecte: def.projecte, servei: "web" }],
      git: { ...NETA, remot: `aulaia-demo/${slug}`, head: def.sha?.slice(0, 7) || "9c1e4b7", ultimCommit: null, caps: def.sha ? { main: def.sha } : { main: "9c1e4b7a2d3f5061728394a5b6c7d8e9f0a1b2c3" }, ...(canvis.git || {}) },
      proves: canvis.proves || PROVES_BONES,
      copies,
      secrets: canvis.secrets || SENSE_SECRETS,
      indicisMenors: canvis.indicisMenors || MENORS_BE,
    };
    // La setmana passada: dues coses que s han arreglat i una que ha empitjorat.
    if (anterior) {
      if (slug === "dictats") app.copies = SENSE_COPIA;
      if (slug === "typeedu") app.proves = { script: true, fitxers: 11, ci: false, ciFitxers: [] };
      if (slug === "matescac") app.secrets = SENSE_SECRETS;
    }
    return app;
  });
}

/** El que torna ultimesRevisionsFonaments de lib/db.js: la revisio d aquesta setmana i l anterior. */
export function ultimesRevisionsFonaments(n = 2, cataleg = [], ara = new Date()) {
  const fa = dies => new Date(ara.getTime() - dies * DIA - 3 * HORA);
  const fila = (id, quan, anterior) => ({
    id,
    creada_el: quan,
    origen: "ordinador de demostració",
    dades: { versio: 1, generada: quan.toISOString(), origen: "ordinador de demostració", apps: appsRevisades(cataleg, ara, anterior) },
  });
  return [fila(42, fa(2), false), fila(41, fa(9), true)].slice(0, n);
}
