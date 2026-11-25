/**
 * Resum setmanal per correu (cada dilluns, flux d'n8n «Resum setmanal»).
 * Aquest fitxer només calcula: rep les dades ja llegides i en fa el correu.
 * La lectura (avisos, sol·licituds, activitat, cost) la fa app/api/resum-setmanal.
 *
 * Mai hi va cap nom ni correu de persones: només apps, centres que han demanat
 * alta (decisió del propietari, 25/11/2026), recomptes i imports.
 */
import { costTokens } from "./preus-ia.mjs";

export const ZONA = "Europe/Madrid";
const DIA_MS = 86_400_000;

/** Dia 'AAAA-MM-DD' a Catalunya d'un instant. */
export function diaLocal(instant) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

/** Instant de les 0:00 de Catalunya d'un dia 'AAAA-MM-DD'. */
export function inicDiaLocal(dia) {
  const [a, m, d] = dia.split("-").map(Number);
  const migdia = new Date(Date.UTC(a, m - 1, d, 12));
  const hores = Number(new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", hourCycle: "h23" }).format(migdia));
  return new Date(Date.UTC(a, m - 1, d, 12 - (hores - 12)) - 12 * 3_600_000);
}

/** La setmana anterior, de dilluns a diumenge (hora de Catalunya): { inici, fi, dies }. fi no s'hi inclou. */
export function setmanaAnterior(ara = new Date()) {
  const avui = diaLocal(ara);
  const dow = new Date(`${avui}T12:00:00Z`).getUTCDay(); // 0 = diumenge
  const fins = new Date(Date.parse(`${avui}T12:00:00Z`) - ((dow + 6) % 7) * DIA_MS); // dilluns d'aquesta setmana
  const dies = Array.from({ length: 7 }, (_, i) => new Date(fins.getTime() - (7 - i) * DIA_MS).toISOString().slice(0, 10));
  return { inici: inicDiaLocal(dies[0]), fi: inicDiaLocal(fins.toISOString().slice(0, 10)), dies };
}

const quan = f => new Date(f.data ?? f.quan).getTime();
const on = f => f?.dades?.on ?? null;

/** Caigudes de la vigilància: per app, quantes vegades i minuts aproximats sense respondre. */
export function caigudes(files, { inici, fi }) {
  const perApp = new Map();
  const ordenades = files.filter(f => f.tipus === "error" && on(f) === "vigilancia").sort((a, b) => quan(a) - quan(b));
  const obertes = new Map();
  for (const f of ordenades) {
    const e = perApp.get(f.app) ?? { app: f.app, vegades: 0, minuts: 0 };
    perApp.set(f.app, e);
    if (f.dades.estat === "caiguda") {
      e.vegades += 1;
      obertes.set(f.app, quan(f));
    } else if (f.dades.estat === "recuperada") {
      // Una recuperació sense caiguda dins la setmana: la caiguda va començar abans.
      const desDe = obertes.get(f.app) ?? inici.getTime();
      e.minuts += Math.max(0, quan(f) - desDe) / 60_000;
      obertes.delete(f.app);
    }
  }
  for (const [app, desDe] of obertes) perApp.get(app).minuts += Math.max(0, fi.getTime() - desDe) / 60_000;
  return [...perApp.values()].map(e => ({ ...e, minuts: Math.round(e.minuts), seguiaCaiguda: obertes.has(e.app) })).sort((a, b) => b.minuts - a.minuts);
}

/** Publicacions amb problemes, per app i estat. */
export function publicacions(files) {
  const out = new Map();
  for (const f of files) {
    if (f.tipus !== "error" || on(f) !== "publicacions") continue;
    const e = out.get(f.app) ?? { app: f.app, fallida: 0, encallada: 0, noRespon: 0 };
    if (f.dades.estat === "publicacio-fallida") e.fallida += 1;
    else if (f.dades.estat === "publicacio-encallada") e.encallada += 1;
    else if (f.dades.estat === "publicacio-no-respon") e.noRespon += 1;
    out.set(f.app, e);
  }
  return [...out.values()];
}

/** Fallades d'IA per app i motiu; i la resta d'errors per app. */
export function errors(files) {
  const ia = new Map();
  const altres = new Map();
  for (const f of files) {
    if (f.tipus !== "error") continue;
    const o = on(f);
    if (o === "ia") {
      const e = ia.get(f.app) ?? { app: f.app, total: 0, motius: {} };
      const motiu = f.dades.motiu || "servei";
      e.total += 1;
      e.motius[motiu] = (e.motius[motiu] || 0) + 1;
      ia.set(f.app, e);
    } else if (o !== "vigilancia" && o !== "publicacions") {
      altres.set(f.app, (altres.get(f.app) || 0) + 1);
    }
  }
  return {
    ia: [...ia.values()].sort((a, b) => b.total - a.total),
    altres: [...altres].map(([app, n]) => ({ app, n })).sort((a, b) => b.n - a.n),
  };
}

// Un avís d'importació porta el recompte; si no, compta com una persona.
const RECOMPTES = ["invitacions", "importats", "altes", "persones", "creats"];
const recompte = d => {
  for (const k of RECOMPTES) if (Number.isInteger(d?.[k]) && d[k] > 0) return d[k];
  return 1;
};

/** Altes, baixes i canvis de rol de persones, per app (només xifres). */
export function persones(files) {
  const out = new Map();
  for (const f of files) {
    const camp = { "alta.solicitud": "invitades", "alta.validada": "altes", baixa: "baixes", "rol.canvi": "canvisRol" }[f.tipus];
    if (!camp) continue;
    const e = out.get(f.app) ?? { app: f.app, invitades: 0, altes: 0, baixes: 0, canvisRol: 0 };
    e[camp] += recompte(f.dades);
    out.set(f.app, e);
  }
  return [...out.values()].sort((a, b) => (b.altes + b.invitades) - (a.altes + a.invitades));
}

/** Cost estimat dels tokens de la setmana, per app (dòlars). Models sense preu: es diu. */
export function costIaPerApp(tokens, dies) {
  const dins = new Set(dies);
  const out = new Map();
  for (const t of tokens) {
    if (!dins.has(t.dia)) continue;
    const e = out.get(t.app) ?? { app: t.app, usd: 0, senseTarifa: false };
    const c = costTokens(t.model, { e: Number(t.e), s: Number(t.s), l: Number(t.l), w: Number(t.w) }, t.dia);
    if (c == null) e.senseTarifa = true;
    else e.usd += c;
    out.set(t.app, e);
  }
  return [...out.values()].sort((a, b) => b.usd - a.usd);
}

const eur = usd => `${usd.toFixed(2).replace(".", ",")} $`;
const temps = min => (min >= 120 ? `${Math.round(min / 60)} h` : `${min} min`);
const MOTIUS = {
  "cupo-dia": "quota del dia", "cupo-minut": "massa peticions", model: "model retirat",
  temps: "temps esgotat", buida: "resposta buida", format: "resposta no vàlida", servei: "error del servei",
};

/**
 * dades: { setmana, caigudes, publicacions, errors, persones, solicituds: { noves: [{app, centre}], pendents },
 *          cost: { railway: {actual, previst} | null, anthropic: number | null, perApp: [...] }, noDisponible: [] }
 */
export function construirCorreu(dades, nomApp, { limitRailway = 15 } = {}) {
  const { setmana } = dades;
  const L = [];
  const titol = t => { if (L.length) L.push(""); L.push(t); };
  const fmtDia = d => d.split("-").reverse().slice(0, 2).join("/");

  titol(`Resum de la setmana del ${fmtDia(setmana.dies[0])} al ${fmtDia(setmana.dies[6])}`);

  titol("CAIGUDES");
  if (!dades.caigudes.length) L.push("- Cap app ha caigut.");
  for (const c of dades.caigudes) L.push(`- ${nomApp(c.app)}: ${c.vegades || 1} ${c.vegades === 1 ? "vegada" : "vegades"}, uns ${temps(c.minuts)} sense respondre${c.seguiaCaiguda ? " (encara no ha tornat)" : ""}`);

  titol("PUBLICACIONS AMB PROBLEMES");
  if (!dades.publicacions.length) L.push("- Totes les publicacions han anat bé.");
  for (const p of dades.publicacions) {
    const parts = [p.fallida && `${p.fallida} fallida`, p.encallada && `${p.encallada} encallada`, p.noRespon && `${p.noRespon} sense resposta`].filter(Boolean);
    L.push(`- ${nomApp(p.app)}: ${parts.join(", ")}`);
  }

  titol("ALTES");
  const { noves, pendents } = dades.solicituds ?? { noves: [], pendents: null };
  if (noves.length) {
    L.push(`Centres que han demanat una app (${noves.length}):`);
    for (const s of noves) L.push(`- ${s.centre} → ${nomApp(s.app)}`);
  } else L.push("- Cap sol·licitud nova de centres.");
  if (pendents != null) L.push(pendents ? `Sol·licituds per revisar al panell: ${pendents} (https://www.aulaia.cat/panel/altes)` : "No hi ha cap sol·licitud per revisar.");
  if (dades.persones.length) {
    L.push("Persones a les apps (només xifres):");
    for (const p of dades.persones) {
      const parts = [p.altes && `${p.altes} altes`, p.invitades && `${p.invitades} invitades`, p.baixes && `${p.baixes} baixes`, p.canvisRol && `${p.canvisRol} canvis de rol`].filter(Boolean);
      L.push(`- ${nomApp(p.app)}: ${parts.join(", ")}`);
    }
  }

  titol("ERRORS");
  if (!dades.errors.ia.length && !dades.errors.altres.length) L.push("- Cap error.");
  for (const e of dades.errors.ia) {
    const m = Object.entries(e.motius).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${MOTIUS[k] || k} ${n}`).join(", ");
    L.push(`- IA de ${nomApp(e.app)}: ${e.total} avisos (${m})`);
  }
  for (const e of dades.errors.altres) L.push(`- ${nomApp(e.app)}: ${e.n} altres errors`);

  titol("DESPESA");
  const r = dades.cost?.railway;
  if (r) {
    const sobre = r.previst > limitRailway;
    L.push(`- Railway aquest mes: ${eur(r.actual)} gastats; previsió a final de mes ${eur(r.previst)} (límit ${limitRailway} $)${sobre ? " ⚠ per sobre del límit" : ""}`);
  } else L.push("- Railway: no s'ha pogut llegir.");
  const a = dades.cost?.anthropic;
  L.push(a == null ? "- Claude (Anthropic): no s'ha pogut llegir." : `- Claude (Anthropic), cost real de la setmana: ${eur(a)}`);
  const perApp = dades.cost?.perApp ?? [];
  if (perApp.length) {
    L.push("- IA per app, estimat amb els tokens de l'informe d'activitat:");
    for (const p of perApp) L.push(`    ${nomApp(p.app)}: ${eur(p.usd)}${p.senseTarifa ? " (algun model sense tarifa)" : ""}`);
  }

  if (dades.noDisponible?.length) {
    titol("No s'ha pogut llegir");
    L.push(`- ${dades.noDisponible.join(", ")}`);
  }
  L.push("", "Panell: https://www.aulaia.cat/panel");

  const tranquil = !dades.caigudes.length && !dades.publicacions.length && !dades.errors.ia.length && !dades.errors.altres.length;
  const assumpte = `${tranquil ? "🟢" : "📋"} Resum setmanal aulaia.cat (${fmtDia(setmana.dies[0])}–${fmtDia(setmana.dies[6])})${tranquil ? ": tot ha anat bé" : ""}`;
  return { assumpte, text: L.join("\n") };
}
