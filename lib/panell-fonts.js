import "server-only";
import cataleg from "../data/apps.json";
import accessosReals from "../data/accessos.json";
import * as db from "./db";
import * as railway from "./railway";
import * as cerca from "./search-console";
import * as anthropic from "./anthropic-admin";
import * as resend from "./resend-panel";
import * as tandes from "./contactes-correu";
import { llegirClaus } from "./activitat.mjs";
import { esAdmin } from "./panell-rol";
import * as demoGestio from "./demo/gestio.mjs";
import * as demoInfra from "./demo/infra.mjs";
import * as demoMesures from "./demo/mesures.mjs";
import * as avisosEstat from "./avisos-estat.js";
import * as demoAvisos from "./demo/avisos.mjs";
import * as altesLotEnvio from "./altes-lot-envio";
import * as demoAltesLot from "./demo/altes-lot.mjs";

/**
 * D on treu les dades el panell. ES L UNIC LLOC per on les pagines de /panel
 * han de demanar-les: aqui es decideix, a cada crida, si qui mira es
 * l administrador (dades de debo) o una sessio de demostracio (lib/demo, tot
 * inventat). Qui no es l administrador no arriba mai a la base de dades ni a
 * les claus de Railway, Google, Resend o Anthropic.
 *
 * Una pagina del panell que importi lib/db, lib/railway, lib/search-console,
 * lib/anthropic-admin, lib/resend-panel o data/accessos.json pel seu compte
 * ensenyaria dades reals a la demo. scripts/demo/proves.mjs ho comprova.
 *
 * La regla va del reves a proposit: nomes «admin» veu el que es real. Qualsevol
 * altra cosa (demo, sessio dubtosa, un error en llegir el rol) rep la demo.
 */
function tria(real, fals) {
  return async (...args) => ((await esAdmin()) ? real(...args) : fals(...args));
}

/* ---------- Infraestructura i trafic (Railway) ---------- */
export const getPanelData = tria(railway.getPanelData, opcions => demoInfra.getPanelData(opcions));
export const getTrafficData = tria(railway.getTrafficData, dies => demoInfra.getTrafficData(dies));

/* ---------- Altes, missatges i contactes (base de dades) ---------- */
export const llistarSolicituds = tria(db.llistarSolicituds, (estat, app) => demoGestio.llistarSolicituds(estat, app));
export const comptarPerEstat = tria(db.comptarPerEstat, () => demoGestio.comptarPerEstat());
export const llistarMissatges = tria(db.llistarMissatges, filtre => demoGestio.llistarMissatges(filtre));
export const comptarMissatges = tria(db.comptarMissatges, () => demoGestio.comptarMissatges());
export const llistarContactes = tria(db.llistarContactes, filtre => demoGestio.llistarContactes(filtre));
export const comptarContactes = tria(db.comptarContactes, () => demoGestio.comptarContactes());
export const comarquesDeContactes = tria(db.comarquesDeContactes, () => demoGestio.comarquesDeContactes());
export const eventsDeContactes = tria(db.eventsDeContactes, ids => demoGestio.eventsDeContactes(ids));
export const properPendents = tria(tandes.properPendents, filtre => demoGestio.properPendents(filtre, tandes.TANDA));
export const remitentConfigurat = tria(async () => tandes.remitentConfigurat(), () => demoGestio.REMITENT_DEMO);
/** Mida de la tanda: una xifra, igual per a tothom. */
export const TANDA = tandes.TANDA;
/** Assumpte i text que surten ja escrits a «Enviar tanda». El de debo va signat amb nom i centre. */
export const plantillaTanda = tria(
  async () => ({ assumpte: tandes.ASSUMPTE_PER_DEFECTE, text: tandes.TEXT_PER_DEFECTE }),
  () => ({ assumpte: demoGestio.ASSUMPTE_DEMO, text: demoGestio.TEXT_DEMO })
);

/* ---------- Accessos ---------- */
export const llegirAccessos = tria(async () => accessosReals, () => demoGestio.accessos(cataleg));

/* ---------- Cerca a Google ---------- */
export const teClaus = tria(async () => cerca.teClaus(), () => true);
export const getSeoData = tria(cerca.getSeoData, dies => demoMesures.getSeoData(dies, cataleg));

/* ---------- Activitat ---------- */
export const slugsActivitat = tria(
  async () => llegirClaus(process.env.ACTIVITAT_CLAUS || "").map(([slug]) => slug),
  () => demoMesures.slugsActivitat()
);
export const llegirActivitat = tria(db.llegirActivitat, finestra => demoMesures.llegirActivitat(finestra));

/* ---------- Correus enviats (Resend) ---------- */
export const teClauCorreus = tria(async () => resend.teClauCorreus(), () => true);
export const getCorreus = tria(resend.getCorreus, () => demoMesures.getCorreus(cataleg));

/* ---------- Cost d IA (Anthropic) ---------- */
export const teClauAdmin = tria(async () => anthropic.teClauAdmin(), () => true);
export const getCostAnthropic = tria(anthropic.getCostAnthropic, () => demoMesures.getCostAnthropic());

/* ---------- Avisos de n8n (altes, rols i errors) ---------- */
export const llegirAvisos = tria(avisosEstat.llegirAvisos, opcions => demoAvisos.llegirAvisos(opcions));

/* ---------- Altes en lot (n8n → app) ---------- */
export const altesLotConnectat = tria(async () => altesLotEnvio.teConfiguracio(), () => demoAltesLot.teConfiguracio());
export const enviarAltesLot = tria(altesLotEnvio.enviarOrdre, ordre => demoAltesLot.enviarOrdre(ordre));

/* ---------- Fonaments ---------- */
export const ultimesRevisionsFonaments = tria(db.ultimesRevisionsFonaments, n => demoMesures.ultimesRevisionsFonaments(n, cataleg));
