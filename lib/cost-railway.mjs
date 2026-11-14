/**
 * Cost de Railway per projecte, a partir del consum que dona la seva API.
 *
 * Railway no torna l'import de cada projecte per API: torna consum (GB-minut
 * de memoria, vCPU-minut, GB de xarxa...). Aqui es multiplica pels preus del
 * pla Pro. Comprovat el 14/11/2026 contra la CLI de Railway: cada projecte
 * quadra al centim i la factura prevista, amb un marge de dos centims.
 * Si Railway canvia els preus, es canvien aqui.
 *
 * El consum per projecte nomes cobreix els projectes vius. El que han gastat
 * aquest cicle els projectes ja esborrats tambe es paga, i surt de restar-lo
 * del consum oficial del workspace (`oficial`), que si que els inclou.
 *
 * Funcions pures, sense "server-only", perque es puguin provar amb node sol.
 */

const MINUTS_MES = 30 * 24 * 60;

/** Dolars per unitat de cada mesura. */
export const PREUS = {
  MEMORY_USAGE_GB: 10 / MINUTS_MES,    // 10 $ per GB i mes
  CPU_USAGE: 20 / MINUTS_MES,          // 20 $ per vCPU i mes
  NETWORK_TX_GB: 0.05,                 // 0,05 $ per GB de sortida
  DISK_USAGE_GB: 0.15 / MINUTS_MES,    // 0,15 $ per GB i mes
  BACKUP_USAGE_GB: 0.15 / MINUTS_MES,
};

/** Les mesures que es demanen a l'API, en l'ordre de PREUS. */
export const MESURES = Object.keys(PREUS);

/** Quota del pla Pro: es paga encara que el consum sigui inferior. */
export const QUOTA_PLA = 20;

/** El que costa tenir 1 GB de memoria ocupat tot un mes. */
export const DOLARS_GB_MES = PREUS.MEMORY_USAGE_GB * MINUTS_MES;

const GRUP = {
  MEMORY_USAGE_GB: "memoria",
  CPU_USAGE: "cpu",
  NETWORK_TX_GB: "xarxa",
  DISK_USAGE_GB: "disc",
  BACKUP_USAGE_GB: "disc",
};

const buit = () => ({ actual: 0, previst: 0, desglos: { memoria: 0, cpu: 0, xarxa: 0, disc: 0 } });
const numero = x => (typeof x === "number" && Number.isFinite(x) ? x : 0);

/**
 * @param {object} e
 * @param {{id: string, name: string, services: {id: string, name: string}[]}[]} e.projectes
 *        projectes vius, amb TOTS els serveis (bases de dades incloses)
 * @param {{measurement: string, value: number, tags: {projectId: string}}[]} e.actual
 *        files de `usage` agrupades per projecte: consum del cicle fins ara
 * @param {{measurement: string, estimatedValue: number, projectId: string}[]} e.previst
 *        files d'`estimatedUsage`: consum previst a final de cicle
 * @param {{tags: {projectId: string, serviceId: string}, values: {ts: number, value: number}[]}[]} e.memoria
 *        files de `metrics` de memoria agrupades per servei
 * @param {number|null} [e.oficial]
 *        consum del cicle que Railway dona per al workspace sencer, en dolars
 */
export function calcularCost({ projectes = [], actual = [], previst = [], memoria = [], oficial = null }) {
  const vius = new Set(projectes.map(p => p.id));
  const per = new Map();
  const de = id => {
    if (!per.has(id)) per.set(id, buit());
    return per.get(id);
  };

  for (const f of actual || []) {
    const id = f?.tags?.projectId;
    const preu = PREUS[f?.measurement];
    if (!id || !preu) continue;
    const d = numero(f.value) * preu;
    const p = de(id);
    p.actual += d;
    p.desglos[GRUP[f.measurement]] += d;
  }
  for (const f of previst || []) {
    const preu = PREUS[f?.measurement];
    if (!f?.projectId || !preu) continue;
    de(f.projectId).previst += numero(f.estimatedValue) * preu;
  }

  // Memoria ara mateix: l'ultim punt de cada serie.
  const gbServei = new Map();
  for (const f of memoria || []) {
    const id = f?.tags?.serviceId;
    const punts = Array.isArray(f?.values) ? f.values : [];
    if (!id || punts.length === 0) continue;
    const ultim = punts.reduce((a, b) => (numero(b.ts) >= numero(a.ts) ? b : a));
    gbServei.set(id, numero(ultim.value));
  }

  const perProjecte = {};
  let actualVius = 0;
  let previstVius = 0;
  let memoriaAra = 0;

  for (const p of projectes) {
    const c = per.get(p.id) || buit();
    const serveis = (p.services || [])
      .map(s => ({ id: s.id, name: s.name, gb: gbServei.has(s.id) ? gbServei.get(s.id) : null }))
      .sort((a, b) => (b.gb ?? -1) - (a.gb ?? -1));
    const memoria = serveis.reduce((n, s) => n + (s.gb || 0), 0);
    perProjecte[p.id] = { ...c, serveis, memoriaAra: memoria, ritmeMes: memoria * DOLARS_GB_MES };
    actualVius += c.actual;
    previstVius += c.previst;
    memoriaAra += memoria;
  }

  // Files de projectes que ja no son a la llista: Railway les torna una estona
  // despres d'esborrar-los i despres deixen de sortir.
  let actualAltres = 0;
  let previstAltres = 0;
  for (const [id, c] of per) {
    if (vius.has(id)) continue;
    actualAltres += c.actual;
    previstAltres += c.previst;
  }

  // El que han gastat aquest cicle els projectes esborrats. Ja no corren, aixi
  // que el que portaven gastat es tambe el que costaran al tancament.
  const teOficial = typeof oficial === "number" && Number.isFinite(oficial) && oficial > 0;
  const esborrats = teOficial ? Math.max(0, oficial - actualVius) : Math.max(actualAltres, previstAltres);
  const previstTotal = previstVius + esborrats;

  const total = {
    actual: teOficial ? oficial : actualVius + actualAltres,
    previst: previstTotal,
    esborrats,
    memoriaAra,
    ritmeMes: memoriaAra * DOLARS_GB_MES,
    factura: Math.max(QUOTA_PLA, previstTotal),
  };

  return { perProjecte, total };
}
