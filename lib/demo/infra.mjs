/**
 * Demostracio del panell: infraestructura (projectes, desplegaments, cost) i
 * trafic. Tot inventat (vegeu lib/demo/base.mjs). No es crida Railway.
 *
 * Les dades tenen la mateixa forma que les de lib/railway.js, i el cost surt
 * de la mateixa funcio que el de debo (lib/cost-railway.mjs), alimentada amb un
 * consum fictici: aixi la taula quadra sola.
 */

import { calcularCost } from "../cost-railway.mjs";
import { PROJECTES, MINUT, HORA, DIA, atzar, soroll, entre, diaLocal, horaLocal, pesDelDia, pesDeLHora } from "./base.mjs";

const VALID = "CERTIFICATE_STATUS_TYPE_VALID";

const COMMITS = [
  "Corregeix l'ordre de la llista de grups",
  "Afegeix l'exportació a full de càlcul",
  "Millora el contrast del mode fosc",
  "Arregla el tall de l'àudio en connexions lentes",
  "Puja la versió de les dependències",
  "Nou filtre per curs al taulell del docent",
  "Textos en castellà de la pàgina d'inici",
  "Evita la doble càrrega en obrir la sessió",
  "Afegeix la pàgina de privacitat",
  "Revisa els permisos del rol de coordinació",
];

/** Inici i final del cicle de facturacio: del dia 3 d un mes al dia 3 del seguent. */
function cicle(ara) {
  const any = ara.getUTCFullYear();
  const mes = ara.getUTCMonth();
  const inici = ara.getUTCDate() >= 3 ? Date.UTC(any, mes, 3) : Date.UTC(any, mes - 1, 3);
  const i = new Date(inici);
  return { start: i.toISOString(), end: new Date(Date.UTC(i.getUTCFullYear(), i.getUTCMonth() + 1, 3)).toISOString() };
}

/** Projectes amb TOTS els serveis (bases de dades incloses), com els dona Railway. */
function projectes() {
  return PROJECTES.map(p => {
    const noms = p.serveis || ["web"];
    const services = noms.map(n => ({ id: `svc-${p.slug}-${n}`, name: n }));
    if (p.bd) services.push({ id: `svc-${p.slug}-postgres`, name: "Postgres" });
    return { id: `prj-${p.slug}`, name: p.projecte, description: "", services, envId: `env-${p.slug}`, _def: p };
  });
}

/** Dominis i ultim desplegament de cada servei d aplicacio. */
function detall(projs, ara) {
  const out = {};
  projs.forEach((p, i) => {
    const def = p._def;
    const r = atzar("desplegament-" + def.slug);
    for (const s of p.services) {
      if (s.name === "Postgres") continue;
      const principal = s.name === "web";
      const arrel = def.domini.split(".").length === 2;
      const dominis = principal ? [arrel ? "www." + def.domini : def.domini] : [];
      let status = "SUCCESS";
      let at = new Date(ara.getTime() - entre(r, 1, 16) * DIA - entre(r, 1, 20) * HORA);
      // Tres casos perque es vegi com avisa el panell: un servei que s esta
      // desplegant, un que ha fallat i un certificat que encara no ha sortit.
      if (def.slug === "typeedu") { status = "DEPLOYING"; at = new Date(ara.getTime() - 4 * MINUT); }
      if (def.slug === "chefboss" && s.name === "api") { status = "FAILED"; at = new Date(ara.getTime() - 3 * HORA); }

      out[s.id] = {
        serviceDomains: [],
        customDomains: dominis.map(d => ({
          domain: d,
          cert: def.slug === "bitacola" ? "CERTIFICATE_STATUS_TYPE_VALIDATING_OWNERSHIP" : VALID,
          verified: def.slug !== "bitacola",
        })),
        deploy: {
          status,
          at: at.toISOString(),
          commit: COMMITS[(i + (principal ? 0 : 4)) % COMMITS.length],
          // Sense sha, el servei s ha pujat a ma i no se sap quin codi corre (Fonaments ho marca).
          hash: def.sha ? def.sha.slice(0, 7) : null,
          repo: def.sha ? `aulaia-demo/${def.slug}` : null,
          branch: def.sha ? "main" : null,
        },
      };
    }
  });
  return out;
}

/** Consum fictici del cicle, en les unitats que dona l API de Railway. */
function consum(projs, ara) {
  const c = cicle(ara);
  const passats = Math.max(1, (ara.getTime() - Date.parse(c.start)) / MINUT);
  const totals = (Date.parse(c.end) - Date.parse(c.start)) / MINUT;
  const actual = [];
  const previst = [];
  const memoria = [];
  const ts = Math.floor(ara.getTime() / 1000);

  for (const p of projs) {
    const def = p._def;
    const r = atzar("consum-" + def.slug);
    const web = p.services.filter(s => s.name !== "Postgres");
    const bd = p.services.find(s => s.name === "Postgres");
    // La memoria del projecte: el servei web, la base de dades i, si n hi ha, l API.
    const gbPerServei = new Map();
    web.forEach((s, i) => gbPerServei.set(s.id, i === 0 ? def.gb : def.gb * 0.45));
    if (bd) gbPerServei.set(bd.id, 0.06 + r() * 0.08);
    const gb = [...gbPerServei.values()].reduce((a, b) => a + b, 0);

    const mesures = {
      MEMORY_USAGE_GB: gb,                       // GB ocupats, de mitjana
      CPU_USAGE: 0.004 + r() * 0.012,            // vCPU, de mitjana
      DISK_USAGE_GB: bd ? 0.3 + r() * 1.2 : 0,   // GB de disc
    };
    for (const [measurement, mitjana] of Object.entries(mesures)) {
      if (!mitjana) continue;
      actual.push({ measurement, value: mitjana * passats, tags: { projectId: p.id } });
      previst.push({ measurement, estimatedValue: mitjana * totals, projectId: p.id });
    }
    const xarxa = (0.4 + r() * 3) * def.transit / 10;
    actual.push({ measurement: "NETWORK_TX_GB", value: xarxa * (passats / totals), tags: { projectId: p.id } });
    previst.push({ measurement: "NETWORK_TX_GB", estimatedValue: xarxa, projectId: p.id });

    for (const [serviceId, valor] of gbPerServei) {
      memoria.push({ tags: { projectId: p.id, serviceId }, values: [{ ts: ts - 300, value: valor * 0.98 }, { ts, value: valor }] });
    }
  }
  return { actual, previst, memoria, cicle: c };
}

/** El que torna getPanelData de lib/railway.js, amb projectes que no existeixen. */
export function getPanelData({ ambCost = false } = {}, ara = new Date()) {
  const projs = projectes();
  const det = detall(projs, ara);
  const c = ambCost ? consum(projs, ara) : null;

  let cost = null;
  if (c) {
    const sense = calcularCost({ projectes: projs, actual: c.actual, previst: c.previst, memoria: c.memoria });
    // Un projecte esborrat a mig cicle: el consum oficial es una mica mes alt que el dels vius.
    cost = calcularCost({ projectes: projs, actual: c.actual, previst: c.previst, memoria: c.memoria, oficial: sense.total.actual + 0.84 });
  }

  const apps = projs
    .map(({ _def, ...p }) => ({
      ...p,
      databases: p.services.filter(s => s.name === "Postgres").length,
      services: p.services.filter(s => s.name !== "Postgres").map(s => ({ ...s, ...(det[s.id] || {}) })),
      cost: cost ? cost.perProjecte[p.id] || null : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    workspace: "Aulaia · demostració",
    apps,
    cost: cost
      ? { ...cost.total, senseMemoria: false, senseFacturacio: false, cicle: c.cicle, avis: 60, tall: 90 }
      : null,
    generatedAt: ara.toISOString(),
  };
}

/** El que torna getTrafficData de lib/railway.js: peticions per app i al llarg del temps. */
export function getTrafficData(dies = 7, ara = new Date()) {
  const pas = dies <= 1 ? 900 : dies <= 7 ? 3600 : 21600; // segons, com a la consulta de debo
  const punts = Math.floor((dies * 86400) / pas);
  const final = Math.floor(ara.getTime() / 1000 / pas) * pas;
  const marques = Array.from({ length: punts }, (_, i) => final - (punts - 1 - i) * pas);

  const serie = marques.map(ts => ({ ts, ok: 0, err: 0 }));
  const apps = [];

  for (const p of PROJECTES) {
    const b = { ok: 0, noTrobat: 0, limit: 0, altres4xx: 0, servidor: 0 };
    const pics = [];
    marques.forEach((ts, i) => {
      const ms = ts * 1000;
      // Mitjana del pes de les hores que cobreix el punt: un punt de sis hores no es una sola hora.
      let pesHora = 0;
      const hores = Math.max(1, Math.round(pas / 3600));
      for (let h = 0; h < hores; h++) pesHora += pesDeLHora(horaLocal(ms + h * HORA));
      pesHora /= hores;
      const base = p.transit * 38 * (pas / 3600) * pesHora * pesDelDia(diaLocal(ms));
      const total = Math.round(base * (0.75 + soroll(`t-${p.slug}-${ts}`) * 0.5));
      // Els robots busquen rutes que no existeixen a tota hora.
      const noTrobat = Math.round(total * 0.025 + soroll(`n-${p.slug}-${ts}`) * 2 * (pas / 3600));
      // Dos casos per ensenyar: una app que topa amb un limit i una amb errors de servidor.
      const limit = p.slug === "dictats" && soroll(`l-${ts}`) > 0.93 ? Math.round(6 * (pas / 3600)) : 0;
      const recent = i >= punts - Math.max(1, Math.round((4 * 3600) / pas)); // les ultimes quatre hores
      // Uns sis errors per hora, comptant com a molt les quatre hores que fa que falla.
      const servidor = p.slug === "chefboss" && recent ? Math.round((4 + soroll(`s-${ts}`) * 4) * (Math.min(pas, 4 * 3600) / 3600)) : 0;
      const altres = Math.round(total * 0.006);
      const ok = Math.max(0, total - altres);
      b.ok += ok; b.noTrobat += noTrobat; b.limit += limit; b.servidor += servidor; b.altres4xx += altres;
      pics.push(ok + noTrobat + limit + servidor + altres);
      serie[i].ok += ok;
      serie[i].err += noTrobat + limit + servidor + altres;
    });
    const errors = b.noTrobat + b.limit + b.altres4xx + b.servidor;
    apps.push({ name: p.projecte, service: "web", total: b.ok + errors, ...b, errors, pics });
  }

  apps.sort((a, b) => b.total - a.total);
  const suma = camp => apps.reduce((n, a) => n + (a[camp] || 0), 0);
  return {
    apps,
    serie,
    total: suma("total"),
    errors: suma("errors"),
    noTrobat: suma("noTrobat"),
    limit: suma("limit"),
    servidor: suma("servidor"),
    dies,
    incomplet: false,
    generatedAt: ara.toISOString(),
  };
}
