/**
 * Cost d'IA: el que factura el proveidor, no el que cada app diu que ha gastat.
 *
 * De moment nomes Anthropic, que te una API d'administracio amb el cost per
 * dia, per model i per clau d'API. Com que cada app te la seva clau, el cost
 * per clau es el cost per app. Gemini no te res semblant: el seu cost surt de
 * la facturacio de Google Cloud (pendent).
 *
 * Sense "server-only" perque es pugui provar amb node sol: el client de l'SDK
 * d'Anthropic es passa des de fora. El panell el crea a lib/anthropic-admin.js
 * i la prova local, a scripts/cost-ia/provar.mjs.
 */

const DIA = 86400000;

/**
 * Dies que s'ensenyen, comptant el d'avui: es el mateix rang que «Últims 30
 * dies» de la consola d'Anthropic, i aixi les dues xifres quadren. L'API no
 * deixa demanar-ne mes de 31 de cop.
 */
export const DIES_SERIE = 30;

/** Els imports arriben com a text, en centims de dolar amb sis decimals. */
export function centimsADolars(text) {
  const n = Number(text);
  return Number.isFinite(n) ? n / 100 : 0;
}

const iso = ms => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
const diaDe = isoText => String(isoText || "").slice(0, 10);

/**
 * Els dos rangs que es demanen a l'API, tots dos en UTC, que es com compta
 * Anthropic. La serie son dies tancats: amb franges d'un dia l'API arrodoneix
 * el final avall fins a mitjanit i el dia en curs en queda fora. Per aixo el
 * dia d'avui es demana a part, sense franges.
 */
export function rangs(ara = new Date()) {
  const avui = Date.UTC(ara.getUTCFullYear(), ara.getUTCMonth(), ara.getUTCDate());
  return {
    serie: { starting_at: iso(avui - (DIES_SERIE - 1) * DIA), ending_at: iso(avui) },
    avui: { starting_at: iso(avui) },
  };
}

/** Totes les pagines d'una consulta de cost, i fins on arriben les dades. */
async function totesLesFiles(client, params) {
  const primera = await client.beta.organization.analytics.cost.list(params);
  const files = [];
  for await (const pagina of primera.iterPages()) files.push(...pagina.data);
  return { files, refrescat: primera.data_refreshed_at };
}

async function totesLesClaus(client) {
  const claus = [];
  for await (const c of client.beta.organization.apiKeys.list({ limit: 100 })) {
    claus.push({ id: c.id, name: c.name, status: c.status });
  }
  return claus;
}

/**
 * Llegeix el cost d'Anthropic i el torna resumit. NOMES LLEGEIX.
 *
 * @param {object} client  client de l'SDK d'Anthropic creat amb una clau d'administrador
 * @param {Date} [ara]
 * @param {(e: Error) => void} [senseNoms]  avisa si no s'han pogut llegir els noms de les claus
 * @returns el resum de `resumir`, mes `refrescat` (fins on arriben les dades) i `llegit`
 */
export async function llegirCost(client, ara = new Date(), senseNoms = () => {}) {
  const r = rangs(ara);
  const agrupar = ["api_key_id", "model"];

  const [serie, claus] = await Promise.all([
    totesLesFiles(client, {
      ...r.serie,
      group_by: agrupar,
      time_bucket_width: "1d",
      order_by: "time",
      order: "asc",
      limit: 1000,
    }),
    // Sense els noms el cost es veu igual, amb l'identificador de la clau.
    totesLesClaus(client).catch(e => { senseNoms(e); return []; }),
  ]);

  // El dia en curs: durant la primera hora del dia (UTC) el rang es buit i
  // l'API el rebutja. No es cap error: encara no hi ha res a ensenyar.
  const avui = await totesLesFiles(client, { ...r.avui, group_by: agrupar, limit: 1000 })
    .catch(() => ({ files: [], refrescat: null }));

  return {
    ...resumir({ files: serie.files, filesAvui: avui.files, claus, ara }),
    refrescat: avui.refrescat || serie.refrescat || null,
    llegit: ara.toISOString(),
  };
}

/** Una clau que ja no surt a la llista: se n'ensenya el final de l'identificador. */
function nomPerDefecte(id) {
  if (!id) return "Sense clau (Console i altres)";
  return "Clau " + String(id).slice(-6);
}

/**
 * Converteix les files de l'API en el que pinta el panell.
 *
 * @param {object} e
 * @param {object[]} e.files      files de la serie: una per dia, clau i model
 * @param {object[]} e.filesAvui  files del dia en curs: una per clau i model
 * @param {{id: string, name: string, status: string}[]} e.claus  claus de l'organitzacio
 * @param {Date} [e.ara]
 */
export function resumir({ files = [], filesAvui = [], claus = [], ara = new Date() }) {
  const avui = Date.UTC(ara.getUTCFullYear(), ara.getUTCMonth(), ara.getUTCDate());
  const iniciMes = iso(Date.UTC(ara.getUTCFullYear(), ara.getUTCMonth(), 1)).slice(0, 10);
  const diaAvui = iso(avui).slice(0, 10);
  const noms = new Map(claus.map(c => [c.id, c]));

  // Tots els dies de la serie, tambe els que no han gastat res. L'ultim es avui.
  const perDia = new Map();
  for (let i = DIES_SERIE - 1; i >= 0; i--) perDia.set(iso(avui - i * DIA).slice(0, 10), 0);

  const perClau = new Map();
  const perModel = new Map();
  let total = 0;
  let mes = 0;
  let totalAvui = 0;

  const clauDe = id => {
    const k = id || "";
    if (!perClau.has(k)) {
      const c = noms.get(id);
      perClau.set(k, {
        id: id || null,
        nom: c?.name || nomPerDefecte(id),
        estat: c?.status || null,
        usd: 0,
        usdMes: 0,
        usdAvui: 0,
        models: new Map(),
      });
    }
    return perClau.get(k);
  };

  const sumar = (fila, dia, esAvui) => {
    const usd = centimsADolars(fila?.cost?.amount);
    if (!usd) return;
    const model = fila?.group?.model || "Altres (eines, sessions)";
    const c = clauDe(fila?.group?.api_key_id);
    c.usd += usd;
    c.models.set(model, (c.models.get(model) || 0) + usd);
    perModel.set(model, (perModel.get(model) || 0) + usd);
    total += usd;
    if (dia >= iniciMes) { mes += usd; c.usdMes += usd; }
    if (esAvui) { totalAvui += usd; c.usdAvui += usd; }
    if (perDia.has(dia)) perDia.set(dia, perDia.get(dia) + usd);
  };

  for (const f of files) sumar(f, diaDe(f.starting_at), false);
  for (const f of filesAvui) sumar(f, diaAvui, true);

  const desc = (a, b) => b.usd - a.usd;
  return {
    total,
    mes,
    avui: totalAvui,
    iniciMes,
    perDia: [...perDia].map(([dia, usd]) => ({ dia, usd })),
    perClau: [...perClau.values()]
      .map(c => ({ ...c, models: [...c.models].map(([model, usd]) => ({ model, usd })).sort(desc) }))
      .sort(desc),
    perModel: [...perModel].map(([model, usd]) => ({ model, usd })).sort(desc),
  };
}
