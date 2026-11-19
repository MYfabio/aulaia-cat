/**
 * Demostracio del panell: la base comuna de les dades inventades.
 *
 * Tot el que hi ha a lib/demo es fictici: centres, persones, correus, xifres i
 * imports. Cap fila surt de la base de dades ni de cap servei de fora, i cap
 * d aquests fitxers llegeix variables d entorn. Els correus van tots en dominis
 * «.test», que no poden existir. L unic que es de debo son els noms i els
 * dominis de les apps, que ja son publics al cataleg del web.
 *
 * Les dades es calculen respecte de «ara», aixi que la demo sempre sembla
 * d avui, i amb un atzar de llavor fixa, aixi que no ballen entre dues visites.
 *
 * Funcions pures, sense "server-only", perque es puguin provar amb node sol
 * (scripts/demo/proves.mjs).
 */

export const MINUT = 60 * 1000;
export const HORA = 60 * MINUT;
export const DIA = 24 * HORA;

export const ZONA = "Europe/Madrid";

/** Atzar repetible: la mateixa llavor dona sempre la mateixa sequencia. */
export function atzar(llavor) {
  let h = 1779033703 ^ String(llavor).length;
  for (const c of String(llavor)) {
    h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function seguent() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un valor entre 0 i 1 que depen nomes de la clau: per a soroll estable dia a dia. */
export function soroll(clau) {
  return atzar(clau)();
}

export const entre = (r, min, max) => min + Math.floor(r() * (max - min + 1));
export const tria = (r, llista) => llista[Math.floor(r() * llista.length)];

const fmtDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtHora = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", hourCycle: "h23" });

/** 'AAAA-MM-DD' del dia de Catalunya d un instant. */
export const diaLocal = instant => fmtDia.format(new Date(instant));

/** Hora del dia (0-23) a Catalunya. */
export const horaLocal = instant => Number(fmtHora.format(new Date(instant)));

/** Dia de la setmana d un 'AAAA-MM-DD': 0 diumenge … 6 dissabte. */
export function diaSetmana(dia) {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

export function sumarDies(dia, n) {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Quanta activitat hi ha un dia respecte d un dia de classe normal. */
export function pesDelDia(dia) {
  const s = diaSetmana(dia);
  if (s === 0) return 0.06;
  if (s === 6) return 0.1;
  return s === 5 ? 0.8 : 1;
}

/** Quanta activitat hi ha a cada hora del dia: pic al mati, cua a la tarda. */
export function pesDeLHora(hora) {
  const corba = [0.02, 0.01, 0.01, 0.01, 0.01, 0.02, 0.05, 0.2, 0.7, 1, 0.95, 0.85, 0.9, 0.6, 0.4, 0.55, 0.5, 0.35, 0.3, 0.25, 0.2, 0.15, 0.08, 0.04];
  return corba[hora] ?? 0.05;
}

/* ---------- Centres ficticis ---------- */

/**
 * Centres que no existeixen: noms i municipis inventats, en comarques de debo
 * perque els filtres del panell tinguin sentit. Els codis comencen per 99, que
 * no es de cap centre.
 */
export const CENTRES = [
  { nom: "Institut Miralba", municipi: "Vilamiralba", comarca: "Vallès Occidental", codi: "99000101", domini: "ins-miralba.test" },
  { nom: "Institut Escola Brugalada", municipi: "Brugalada", comarca: "Osona", codi: "99000102", domini: "ie-brugalada.test" },
  { nom: "Institut Riera d'Auró", municipi: "Auró de Mar", comarca: "Maresme", codi: "99000103", domini: "ins-rieradauro.test" },
  { nom: "Escola Puig de Llevant", municipi: "Sant Feliu de Llevant", comarca: "Vallès Occidental", codi: "99000104", domini: "esc-puigdellevant.test" },
  { nom: "Institut Pedrallonga", municipi: "Pedrallonga del Camp", comarca: "Baix Camp", codi: "99000105", domini: "ins-pedrallonga.test" },
  { nom: "Institut Llentiscar", municipi: "Llentiscar d'Ebre", comarca: "Baix Ebre", codi: "99000106", domini: "ins-llentiscar.test" },
  { nom: "Escola Camp de l'Alosa", municipi: "Vilalosa", comarca: "Gironès", codi: "99000107", domini: "esc-campalosa.test" },
  { nom: "Institut Torrent Blau", municipi: "Torrentblau", comarca: "Barcelonès", codi: "99000108", domini: "ins-torrentblau.test" },
  { nom: "Institut Coll d'Estela", municipi: "Santa Estela del Coll", comarca: "Bages", codi: "99000109", domini: "ins-colldestela.test" },
  { nom: "Institut Serra Vinyera", municipi: "Vinyera de Segre", comarca: "Segrià", codi: "99000110", domini: "ins-serravinyera.test" },
  { nom: "Escola Font de l'Om", municipi: "La Font de l'Om", comarca: "Segrià", codi: "99000111", domini: "esc-fontdelom.test" },
  { nom: "Institut Mar d'Argelaga", municipi: "Argelaga de Mar", comarca: "Maresme", codi: "99000112", domini: "ins-argelaga.test" },
  { nom: "Institut Escola Rocaplana", municipi: "Rocaplana", comarca: "Osona", codi: "99000113", domini: "ie-rocaplana.test" },
  { nom: "Escola Pla de l'Espígol", municipi: "Espígol del Vallès", comarca: "Vallès Oriental", codi: "99000114", domini: "esc-espigol.test" },
  { nom: "Institut Camí de Nòria", municipi: "Vilanòria", comarca: "Baix Llobregat", codi: "99000115", domini: "ins-caminoria.test" },
  { nom: "Institut Quatre Vents de Solvella", municipi: "Solvella", comarca: "Vallès Oriental", codi: "99000116", domini: "ins-solvella.test" },
];

export const PERSONES = [
  "Marta Soler Vidal", "Jordi Puigdevall Camps", "Núria Camps Roure", "Pau Ferrer Bonet", "Laia Roca Serrat",
  "Arnau Bosch Tarrés", "Anna Vilaró Pons", "Marc Serra Oliva", "Carla Mas Riera", "Albert Font Colomer",
  "Mireia Pons Aymerich", "Xènia Coll Farré", "Gemma Rius Batlle", "Ferran Sala Mestres", "Judit Casals Prat",
  "Roger Vila Torrent", "Elena Prat Güell", "Toni Guasch Mir", "Sílvia Riera Jou", "Dani Molins Cabré",
];

/** «Marta Soler Vidal» + centre → «marta.soler@ins-miralba.test» */
export function correuDe(persona, domini) {
  const [nom, cognom] = String(persona)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/);
  return `${nom}.${cognom}@${domini}`;
}

/* ---------- Apps i projectes ---------- */

/**
 * Els projectes ficticis de Railway, un per app. Infraestructura, Tràfic i
 * Fonaments en treuen les dades: per aixo viu aqui, perque quadrin entre elles.
 *   gb       memoria que ocupa el servei web
 *   transit  pes relatiu al grafic de trafic
 *   sha      l ultim commit de la branca; el desplegament en corre els 7 primers
 */
export const PROJECTES = [
  { slug: "aulaia", projecte: "aulaia-web", domini: "aulaia.cat", bd: true, gb: 0.21, transit: 9, sha: "3f9a1c27d5b84e60a1f2c3d4e5f60718293a4b5c" },
  { slug: "pla-lector", projecte: "pla-lector", domini: "elplalector.cat", bd: true, gb: 0.34, transit: 14, sha: "a81d04f6c2e97b3155d0e8f1a2b3c4d5e6f70819" },
  { slug: "typeedu", projecte: "typeedu", domini: "typeedu.com", bd: true, gb: 0.29, transit: 12, sha: "5c2e7b90a14d36f8e9c0b1a2d3e4f5061728394a" },
  { slug: "dictats", projecte: "dictats", domini: "dictats.cat", bd: true, gb: 0.41, transit: 11, sha: "d7046ae19b3c5f20718a9b0c1d2e3f4a5b6c7d8e" },
  { slug: "radio-escolar", projecte: "radio-escolar", domini: "radioescolar.cat", bd: false, gb: 0.18, transit: 6, sha: "19be3d5a70c46f82e1d2c3b4a5968778695a4b3c" },
  { slug: "aulaacull", projecte: "aulaacull", domini: "aulaacull.aulaia.cat", bd: true, gb: 0.38, transit: 7, sha: "8e15c9d2460ab7f3091a2b3c4d5e6f7081920a1b" },
  { slug: "chefboss", projecte: "chefboss", domini: "chefboss.es", bd: true, gb: 0.52, transit: 5, serveis: ["web", "api"], sha: "62fa0b8d31e94c75a6b7c8d9e0f1a2b3c4d5e6f7" },
  { slug: "kipuk", projecte: "kipuk", domini: "kipuk.cat", bd: true, gb: 0.16, transit: 4, sha: null },
  { slug: "diedric3d", projecte: "diedric3d", domini: "diedric3d.com", bd: true, gb: 0.44, transit: 5, serveis: ["web", "api"], sha: "b3907e1f5a2c48d6e7f8091a2b3c4d5e6f708192" },
  { slug: "matescac", projecte: "matescac", domini: "matescac.aulaia.cat", bd: true, gb: 0.27, transit: 3, sha: "0d6c4a82e7f1953bc4d5e6f708192a3b4c5d6e7f" },
  { slug: "fpsegura", projecte: "fpsegura", domini: "fpsegura.aulaia.cat", bd: true, gb: 0.24, transit: 3, sha: "f2a8d6103c7e495b8c9d0e1f2a3b4c5d6e7f8091" },
  { slug: "la-claqueta", projecte: "la-claqueta", domini: "laclaqueta.aulaia.cat", bd: true, gb: 0.22, transit: 2, sha: "7b41e9c05d2a368f9a0b1c2d3e4f5a6b7c8d9e0f" },
  { slug: "kiosko", projecte: "kiosko", domini: "kiosko.aulaia.cat", bd: false, gb: 0.12, transit: 8, sha: "c9d37a5e1042f86b0b1c2d3e4f5061728394a5b6" },
  { slug: "museu-apagat", projecte: "museu-apagat", domini: "museu.aulaia.cat", bd: true, gb: 1.12, transit: 2, sha: "4a6f02b8d9e1735c1d2e3f405162738495a6b7c8" },
  { slug: "bitacola", projecte: "bitacola", domini: "bitacola.aulaia.cat", bd: true, gb: 0.19, transit: 1, sha: "e05b7c3a918d264f2e3f4a5b6c7d8e9f0a1b2c3d" },
];

/** Nom amb que es coneix una app: el del cataleg public, o l slug si no hi es. */
export function nomDeLApp(slug, cataleg = []) {
  if (slug === "aulaia") return "aulaia.cat";
  return cataleg.find(a => a.slug === slug)?.nom || slug;
}
