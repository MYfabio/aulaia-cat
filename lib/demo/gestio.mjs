/**
 * Demostracio del panell: altes de centres, missatges, contactes i accessos.
 * Tot inventat (vegeu lib/demo/base.mjs). Les files tenen la mateixa forma que
 * les que tornen les funcions de lib/db.js, perque les pagines no hi notin cap
 * diferencia.
 */

import { CENTRES, PERSONES, HORA, DIA, atzar, entre, tria, correuDe } from "./base.mjs";

const fa = (ara, ms) => new Date(ara.getTime() - ms);

/* ---------- Altes de centres ---------- */

const ROLS = ["Direcció", "Coordinació digital", "Coordinació pedagògica", "Docent"];

/** [app, centre, persona, rol, estat, fa quantes hores, missatge] */
const ALTES = [
  ["pla-lector", 0, 0, 1, "pendent", 2, "Voldríem fer-lo servir amb els quatre grups de 1r d'ESO a partir del gener. Tenim uns 900 llibres a la biblioteca."],
  ["typeedu", 2, 3, 3, "pendent", 5, "Soc el tutor de 5è i 6è. M'agradaria provar-lo amb dos grups abans de proposar-ho al claustre."],
  ["dictats", 5, 6, 2, "pendent", 19, "Ens interessa per al departament de català. Es pot entrar amb el compte de Google del centre?"],
  ["aulaacull", 7, 9, 0, "pendent", 27, "Tenim aula d'acollida amb 14 alumnes nouvinguts aquest curs."],
  ["kipuk", 9, 11, 3, "pendent", 46, null],
  ["pla-lector", 1, 1, 0, "validada", 3 * 24, "Som institut escola: ens aniria bé per a primària i secundària alhora."],
  ["pla-lector", 4, 4, 2, "validada", 6 * 24, null],
  ["pla-lector", 8, 10, 1, "validada", 11 * 24, "Ens l'ha recomanat un centre veí."],
  ["pla-lector", 11, 13, 0, "validada", 24 * 24, null],
  ["typeedu", 3, 5, 3, "validada", 4 * 24, "Per a cicle superior de primària."],
  ["typeedu", 6, 7, 1, "validada", 9 * 24, null],
  ["typeedu", 12, 14, 3, "validada", 17 * 24, "Volem fer-ne una prova d'un trimestre."],
  ["typeedu", 13, 15, 0, "validada", 31 * 24, null],
  ["dictats", 0, 2, 3, "validada", 7 * 24, "Ja fem servir el Pla Lector i voldríem afegir-hi els dictats."],
  ["dictats", 10, 12, 2, "validada", 14 * 24, null],
  ["dictats", 14, 16, 3, "validada", 38 * 24, null],
  ["radio-escolar", 2, 8, 3, "validada", 8 * 24, "Tenim un projecte de ràdio a 3r d'ESO i ens cal on publicar els pòdcasts."],
  ["radio-escolar", 15, 17, 1, "validada", 21 * 24, null],
  ["aulaacull", 4, 18, 2, "validada", 12 * 24, null],
  ["chefboss", 5, 19, 3, "validada", 15 * 24, "Per al cicle de cuina i gastronomia."],
  ["chefboss", 9, 0, 3, "validada", 44 * 24, null],
  ["fpsegura", 7, 3, 1, "validada", 5 * 24, "Per a la formació de riscos dels cicles de fabricació mecànica."],
  ["fpsegura", 14, 6, 3, "validada", 29 * 24, null],
  ["diedric3d", 8, 9, 3, "validada", 18 * 24, "Dibuix tècnic de 1r de batxillerat."],
  ["matescac", 1, 11, 3, "validada", 26 * 24, null],
  ["aules-sostenibles", 12, 13, 2, "validada", 33 * 24, "Dins del projecte d'escola verda."],
  ["la-claqueta", 3, 15, 3, "validada", 41 * 24, null],
  ["kipuk", 6, 17, 3, "rebutjada", 10 * 24, "prova"],
  ["dictats", 13, 19, 3, "rebutjada", 23 * 24, "Sol·licitud repetida per error."],
  ["typeedu", 15, 2, 3, "rebutjada", 36 * 24, null],
];

function solicituds(ara) {
  return ALTES.map(([app, c, p, r, estat, hores, missatge], i) => {
    const centre = CENTRES[c];
    const creada = fa(ara, hores * HORA + (i % 7) * 7 * 60000);
    return {
      id: 500 - i,
      app,
      centre: centre.nom,
      codi_centre: centre.codi,
      localitat: centre.municipi,
      contacte_nom: PERSONES[p],
      contacte_rol: ROLS[r],
      contacte_email: correuDe(PERSONES[p], centre.domini),
      missatge,
      estat,
      verif_email: estat !== "pendent" || i % 2 === 0,
      fecha_verif: estat !== "pendent" || i % 2 === 0 ? new Date(creada.getTime() + 6 * 60000) : null,
      creada_el: creada,
      resolta_el: estat === "pendent" ? null : new Date(Math.min(creada.getTime() + (5 + (i % 9) * 4) * HORA, ara.getTime() - HORA)),
      nota_interna: null,
    };
  }).sort((a, b) => b.creada_el - a.creada_el);
}

export function llistarSolicituds(estat = null, app = null, ara = new Date()) {
  return solicituds(ara).filter(s => (!estat || s.estat === estat) && (!app || s.app === app));
}

export function comptarPerEstat(ara = new Date()) {
  const out = { pendent: 0, validada: 0, rebutjada: 0 };
  for (const s of solicituds(ara)) out[s.estat]++;
  return out;
}

/* ---------- Missatges de l assistent ---------- */

/** [tipus, perfil, apps, via, persona, centre|null, estat, fa quantes hores, text] */
const MISSATGES = [
  ["dubte", "docent", ["pla-lector"], "recomanacio", 5, 2, "pendent", 3, "Hola! Es poden importar els llibres des d'un full de càlcul, o s'han d'entrar un per un? En tenim uns 1.200."],
  ["incidencia", "docent", ["typeedu"], "buscador", 8, 6, "pendent", 9, "Dos alumnes de 6è B no veuen el nivell 4 tot i haver acabat el 3. La resta del grup sí."],
  ["collaboracio", "direccio", [], "xarxes", 12, 10, "pendent", 30, "Som un grup de treball de centres de la comarca i ens agradaria que ens presentéssiu les apps en una trobada al febrer."],
  ["dubte", "direccio", ["dictats", "pla-lector"], "buscador", 1, 4, "respost", 2 * 24, "On es guarden les dades de l'alumnat? Ho hem de posar al registre d'activitats de tractament del centre."],
  ["dubte", "docent", ["radio-escolar"], "blog", 14, 15, "respost", 3 * 24, "Quant pot durar com a màxim un pòdcast? Volem penjar un programa de 40 minuts."],
  ["incidencia", "docent", ["dictats"], "recomanacio", 16, 0, "respost", 4 * 24, "L'àudio del dictat s'ha tallat a la meitat a tres ordinadors de l'aula d'informàtica."],
  ["dubte", "altre", ["aulaacull"], "buscador", 18, null, "respost", 6 * 24, "Soc mare d'un alumne nouvingut. Pot fer-lo servir a casa, o només a l'institut?"],
  ["collaboracio", "docent", ["matescac"], "xarxes", 3, 8, "respost", 9 * 24, "Porto el club d'escacs del centre. Si us va bé, puc provar les lliçons amb alumnes i dir-vos què falla."],
  ["dubte", "docent", ["chefboss"], "recomanacio", 7, 5, "respost", 12 * 24, "Hi ha versió en castellà? Tenim alumnat de cicles que ho agrairia."],
  ["dubte", "direccio", [], "buscador", 10, 11, "respost", 15 * 24, "Té algun cost per al centre? I el curs que ve?"],
  ["incidencia", "docent", ["kiosko"], "altre", 19, 13, "arxivat", 20 * 24, "La pantalla del vestíbul s'ha quedat en negre aquest matí. Ja s'ha arreglat sola."],
  ["dubte", "docent", ["diedric3d"], "blog", 2, 7, "arxivat", 26 * 24, "Funciona amb tauletes?"],
  ["dubte", "altre", [], "buscador", 6, null, "arxivat", 34 * 24, "Missatge de prova."],
];

function missatges(ara) {
  return MISSATGES.map(([tipus, perfil, apps, via, p, c, estat, hores, text], i) => {
    const centre = c == null ? null : CENTRES[c];
    const creat = fa(ara, hores * HORA + (i % 5) * 11 * 60000);
    return {
      id: 200 - i,
      tipus,
      perfil,
      apps,
      via,
      nom: PERSONES[p],
      centre: centre?.nom || null,
      correu: correuDe(PERSONES[p], centre?.domini || "correu-particular.test"),
      text,
      idioma: "ca",
      estat,
      creat_el: creat,
      resolt_el: estat === "pendent" ? null : new Date(Math.min(creat.getTime() + (3 + (i % 6) * 5) * HORA, ara.getTime() - HORA)),
    };
  }).sort((a, b) => b.creat_el - a.creat_el);
}

export function llistarMissatges({ estat, tipus } = {}, ara = new Date()) {
  return missatges(ara).filter(m => (!estat || m.estat === estat) && (!tipus || m.tipus === tipus));
}

export function comptarMissatges(ara = new Date()) {
  const out = { pendent: 0, respost: 0, arxivat: 0 };
  for (const m of missatges(ara)) out[m.estat]++;
  return out;
}

/* ---------- Contactes ---------- */

const COMARQUES = ["Bages", "Baix Camp", "Baix Ebre", "Baix Llobregat", "Barcelonès", "Gironès", "Maresme", "Osona", "Segrià", "Vallès Occidental", "Vallès Oriental"];
const TOPONIMS = ["Miralba", "Brugalada", "Auró", "Pedrallonga", "Llentiscar", "Vilalosa", "Torrentblau", "Solvella", "Rocaplana", "Vilanòria", "Argelaga", "Vinyera", "Espígol", "Montserè", "Riuclar", "Fontalba", "Canyissar", "Pujolet", "Serrabona de Baix", "Vallfreda"];
const NOMS_CENTRE = ["Institut", "Escola", "Institut Escola"];
const SUFIXOS = ["", " Nou", " de Dalt", " del Pla", " de Ponent"];

const RESPOSTES = [
  "Ho passen a la coordinació digital.",
  "Demanen una demostració en línia al gener.",
  "Volen provar el Pla Lector amb un grup.",
  "Ho portaran al proper claustre.",
  "Pregunten si hi ha formació per al professorat.",
];

/** Uns setanta contactes, generats amb atzar de llavor fixa. */
function contactes(ara) {
  const r = atzar("contactes-demo");
  const files = [];
  let id = 1000;

  const afegir = (tipus, nom, municipi, comarca, codi, correu, font) => {
    const p = r();
    // La majoria ja han rebut la presentacio; uns quants han contestat.
    const estat = p < 0.34 ? "pendent" : p < 0.74 ? "enviat" : p < 0.86 ? "respost" : p < 0.95 ? "interessat" : "baixa";
    files.push({
      id: id++, tipus, nom, municipi, comarca, codi_centre: codi, correu, font, estat,
      creat_el: fa(ara, entre(r, 20, 75) * DIA),
    });
  };

  // Un servei educatiu fictici per comarca.
  for (const comarca of COMARQUES) {
    const lloc = tria(r, TOPONIMS);
    const clau = comarca.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
    afegir("crp", `CRP de ${lloc} (${comarca})`, lloc, comarca, null, `crp@serveieducatiu-${clau}.test`, "Llista inicial");
  }
  afegir("servei", "Servei Educatiu de la Vall de Miralba", "Vilamiralba", "Vallès Occidental", null, "servei@se-vallmiralba.test", "Afegit a mà");
  afegir("servei", "Centre de Recursos de Llevant", "Sant Feliu de Llevant", "Vallès Occidental", null, "recursos@cr-llevant.test", "Afegit a mà");

  let n = 0;
  for (const comarca of COMARQUES) {
    const quants = entre(r, 4, 6);
    for (let i = 0; i < quants; i++) {
      const lloc = TOPONIMS[(n * 7 + i * 3) % TOPONIMS.length] + tria(r, SUFIXOS);
      const tipusNom = tria(r, NOMS_CENTRE);
      const nom = `${tipusNom} ${lloc}`;
      const codi = String(99001000 + n);
      const clau = lloc.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
      afegir("centre", nom, lloc, comarca, codi, `a${codi}@${clau}.test`, "Directori de centres (demostració)");
      n++;
    }
  }
  return files;
}

function ordenar(files) {
  const cmp = (a, b) => (a == null) - (b == null) || String(a || "").localeCompare(String(b || ""), "ca");
  return files.sort((a, b) => cmp(a.comarca, b.comarca) || cmp(a.municipi, b.municipi) || cmp(a.nom, b.nom));
}

export function llistarContactes({ estat, tipus, comarca, q } = {}, ara = new Date()) {
  const cerca = q ? q.toLowerCase() : null;
  return ordenar(
    contactes(ara).filter(c =>
      (!estat || c.estat === estat) &&
      (!tipus || c.tipus === tipus) &&
      (!comarca || c.comarca === comarca) &&
      (!cerca || [c.nom, c.municipi, c.correu].some(x => String(x || "").toLowerCase().includes(cerca)))
    )
  );
}

export function comptarContactes(ara = new Date()) {
  const out = { pendent: 0, enviat: 0, respost: 0, interessat: 0, baixa: 0 };
  for (const c of contactes(ara)) out[c.estat]++;
  return out;
}

export function comarquesDeContactes() {
  return [...COMARQUES];
}

/** El rastre de cada contacte: quan se li va enviar i que va contestar. */
export function eventsDeContactes(ids, ara = new Date()) {
  const volguts = new Set(ids);
  const events = [];
  let id = 1;
  for (const c of contactes(ara)) {
    if (c.estat === "pendent") continue;
    const r = atzar("events-" + c.id);
    const enviat = fa(ara, entre(r, 6, 18) * DIA);
    const mou = (tipus, text, quan) => {
      if (volguts.has(c.id)) events.push({ id, contacte_id: c.id, tipus, text, quan });
      id++;
    };
    mou("enviat", "Presentació enviada des del panell", enviat);
    if (c.estat === "respost" || c.estat === "interessat") {
      mou("resposta", tria(r, RESPOSTES), new Date(enviat.getTime() + entre(r, 1, 4) * DIA));
    }
    if (c.estat === "interessat") mou("nota", "Quedem que els truco la setmana que ve.", new Date(enviat.getTime() + 5 * DIA));
    if (c.estat === "baixa") mou("nota", "Baixa demanada des de l'enllaç del correu.", new Date(enviat.getTime() + 2 * DIA));
  }
  return events.sort((a, b) => b.quan - a.quan);
}

/** La tanda que s enviaria ara: els primers pendents, com a lib/contactes-correu.js. */
export function properPendents({ comarca, tipus } = {}, mida = 5, ara = new Date()) {
  return llistarContactes({ estat: "pendent", comarca, tipus }, ara).slice(0, mida);
}

export const REMITENT_DEMO = "Aulaia (demostració) <presentacio@aulaia.cat>";

export const ASSUMPTE_DEMO = "Aplicacions gratuïtes per a l'aula · aulaia.cat";

export const TEXT_DEMO = [
  "Hola,",
  "",
  "Soc docent d'un institut públic. Estem creant aplicacions gratuïtes per a l'aula, fetes a partir del que passa de debò a classe, i voldria presentar-les a {{nom}}.",
  "",
  "Les trobareu totes a https://www.aulaia.cat. Si us interessa provar-ne alguna, o teniu dubtes, respongueu aquest correu.",
  "",
  "Gràcies pel vostre temps.",
  "",
  "(Text de la demostració: no s'envia a ningú.)",
].join("\n");

/* ---------- Accessos ---------- */

const ACCESSOS = [
  ["pla-lector", "dins", "Compte de Google del centre", "El panell de la biblioteca surt a dins de l'app per a qui té rol de coordinació."],
  ["typeedu", "dins", "Compte de Google o enllaç al correu", "El docent veu el progrés dels seus grups des del mateix inici."],
  ["dictats", "ruta", "Compte de Google o enllaç al correu", "Ruta pròpia d'administració per donar d'alta centres i mirar l'ús."],
  ["radio-escolar", "ruta", "Compte de Google", "Ruta de superadministració per revisar els pòdcasts abans de publicar-los."],
  ["aulaacull", "dins", "Compte de Google del centre", "El professorat de l'aula d'acollida hi té el seu taulell."],
  ["chefboss", "dins", "Codi d'equip o compte del docent", "El docent tria el rol en entrar."],
  ["kiosko", "ruta", "Usuari i contrasenya propis", "Les pantalles no van lligades a cap compte personal."],
  ["kipuk", "ruta", "Compte de Google", "Gestió de grups i sessions."],
  ["fpsegura", "dins", "Compte de Google del centre", "Seguiment de la formació per cicle i grup."],
  ["la-claqueta", "dins", "Compte de Google del centre", "La redacció aprova els articles abans de publicar-los."],
  ["bitacola", "construccio", "—", "Encara en disseny: no hi ha panell."],
];

/** Mateixa forma que data/accessos.json, amb l adreça publica de l app i notes generiques. */
export function accessos(cataleg = []) {
  return ACCESSOS
    .map(([slug, tipus, acces, nota]) => {
      const app = cataleg.find(a => a.slug === slug);
      return app ? { slug, url: app.url, tipus, acces, nota } : null;
    })
    .filter(Boolean);
}
