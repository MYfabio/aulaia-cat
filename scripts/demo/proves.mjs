/**
 * Proves de la demostracio del panell: que el rol de demo no es pugui convertir
 * en administrador, que cap dada de la demo sigui de debo i que cap pagina del
 * panell pugui saltar-se lib/panell-fonts.js.
 * Sense dependencies:  node --test scripts/demo/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { createSessionValue, rolDeSessio, isValidSession, clauDemoConfigurada } from "../../lib/panel-auth.js";
import * as gestio from "../../lib/demo/gestio.mjs";
import * as infra from "../../lib/demo/infra.mjs";
import * as mesures from "../../lib/demo/mesures.mjs";
import * as avisos from "../../lib/demo/avisos.mjs";
import { resumirActivitat, horaDeReferencia, diaLocal, sumarDies } from "../../lib/activitat.mjs";
import { veredictes, ESTATS } from "../../lib/fonaments.mjs";

const ARREL = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cataleg = JSON.parse(readFileSync(join(ARREL, "data", "apps.json"), "utf8"));

// Dimarts 17/11/2026 a les 11:30 de Catalunya: un dia de classe a mig mati.
const ARA = new Date("2026-11-17T10:30:00Z");
const SECRET = "secret-de-prova-0123456789abcdef";
const CLAU_DEMO = "clau-de-demo-de-prova";

function fitxers(carpeta, filtre) {
  const out = [];
  for (const nom of readdirSync(carpeta)) {
    const cami = join(carpeta, nom);
    if (statSync(cami).isDirectory()) out.push(...fitxers(cami, filtre));
    else if (filtre(cami)) out.push(cami);
  }
  return out;
}

/* ---------- Rols ---------- */

test("cada contrasenya dona el seu rol", async () => {
  const admin = await createSessionValue(SECRET);
  const demo = await createSessionValue(SECRET, "demo", CLAU_DEMO);
  assert.equal(await rolDeSessio(admin, SECRET, CLAU_DEMO), "admin");
  assert.equal(await rolDeSessio(demo, SECRET, CLAU_DEMO), "demo");
});

test("una sessio de demo no passa mai per administrador", async () => {
  const demo = await createSessionValue(SECRET, "demo", CLAU_DEMO);
  assert.equal(await isValidSession(demo, SECRET), false);
  // Treure-li el prefix deixa la signatura sense valer.
  const senseRol = demo.replace(/^demo\./, "");
  assert.equal(await rolDeSessio(senseRol, SECRET, CLAU_DEMO), null);
  const [, exp, , mac] = demo.split(".");
  assert.equal(await rolDeSessio(`${exp}.${mac}`, SECRET, CLAU_DEMO), null);
});

test("sense la variable, o si es canvia, les sessions de demo deixen de valer", async () => {
  const demo = await createSessionValue(SECRET, "demo", CLAU_DEMO);
  assert.equal(await rolDeSessio(demo, SECRET, null), null);
  assert.equal(await rolDeSessio(demo, SECRET, "una-altra-clau-de-demo"), null);
  assert.equal(await rolDeSessio(demo, "un-altre-secret-0123456789", CLAU_DEMO), null);
});

test("la demo esta apagada si no hi ha contrasenya, si es curta o si es la de l'administrador", () => {
  assert.equal(clauDemoConfigurada({}), null);
  assert.equal(clauDemoConfigurada({ PANEL_DEMO_PASSWORD: "" }), null);
  assert.equal(clauDemoConfigurada({ PANEL_DEMO_PASSWORD: "curta" }), null);
  assert.equal(clauDemoConfigurada({ PANEL_DEMO_PASSWORD: "la-mateixa-clau", PANEL_PASSWORD: "la-mateixa-clau" }), null);
  assert.equal(clauDemoConfigurada({ PANEL_DEMO_PASSWORD: CLAU_DEMO, PANEL_PASSWORD: "una-altra" }), CLAU_DEMO);
});

/* ---------- Res de debo ---------- */

/** Tot el que la demo pot arribar a ensenyar, en un sol sac. */
function totaLaDemo() {
  return {
    altes: gestio.llistarSolicituds(null, null, ARA),
    missatges: gestio.llistarMissatges({}, ARA),
    contactes: gestio.llistarContactes({}, ARA),
    events: gestio.eventsDeContactes(gestio.llistarContactes({}, ARA).map(c => c.id), ARA),
    tanda: gestio.properPendents({}, 5, ARA),
    plantilla: [gestio.REMITENT_DEMO, gestio.ASSUMPTE_DEMO, gestio.TEXT_DEMO],
    accessos: gestio.accessos(cataleg),
    panell: infra.getPanelData({ ambCost: true }, ARA),
    trafic: infra.getTrafficData(7, ARA),
    cerca: mesures.getSeoData(28, cataleg, ARA),
    activitat: mesures.llegirActivitat(finestra(), ARA),
    correus: mesures.getCorreus(cataleg, ARA),
    ia: mesures.getCostAnthropic(ARA),
    fonaments: mesures.ultimesRevisionsFonaments(2, cataleg, ARA),
  };
}

function finestra() {
  const avui = diaLocal(ARA);
  return { desDeDia: sumarDies(avui, -29), mesDesDe: avui.slice(0, 8) + "01", horesDesDe: horaDeReferencia(ARA) };
}

test("tots els correus de la demo son de dominis que no poden existir", () => {
  const text = JSON.stringify(totaLaDemo());
  const adreces = [...new Set(text.match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi) || [])];
  assert.ok(adreces.length > 50, "s'esperaven moltes adreces a la demo");
  // Les uniques adreces de debo son les de sortida d'aulaia.cat, que no son de cap persona.
  const remitents = new Set(["altes@aulaia.cat", "hola@aulaia.cat", "presentacio@aulaia.cat"]);
  const dolentes = adreces.filter(a => !a.toLowerCase().endsWith(".test") && !remitents.has(a.toLowerCase()));
  assert.deepEqual(dolentes, []);
});

test("a la demo no hi surt res del centre ni de la persona de debo", () => {
  const text = JSON.stringify(totaLaDemo()).toLowerCase();
  for (const prohibit of ["escolaindustrial", "escola industrial", "fabio", "sabadell", "railway.app"]) {
    assert.equal(text.includes(prohibit), false, `la demo conte «${prohibit}»`);
  }
});

test("els fitxers de la demo no llegeixen cap variable d'entorn ni criden cap servei", () => {
  for (const f of fitxers(join(ARREL, "lib", "demo"), c => c.endsWith(".mjs"))) {
    const codi = readFileSync(f, "utf8");
    assert.equal(/process\.env|fetch\(|from ["']pg["']|import ["']server-only["']/.test(codi), false, f);
  }
});

/* ---------- Cap pagina se salta el punt unic ---------- */

const PROHIBITS = /from\s+["'][./]+\/(?:lib\/(?:db|railway|search-console|anthropic-admin|resend-panel|contactes-correu|correu|correu-central)|data\/accessos\.json)["']/;

test("cap pagina del panell demana dades pel seu compte", () => {
  const pagines = fitxers(join(ARREL, "app", "(ca)", "panel"), c => c.endsWith(".js"));
  assert.ok(pagines.length >= 15);
  for (const f of pagines) {
    assert.equal(PROHIBITS.test(readFileSync(f, "utf8")), false, `${f} ha de demanar les dades a lib/panell-fonts.js`);
  }
});

test("totes les rutes del panell que desen o envien son nomes per a l'administrador", () => {
  const rutes = fitxers(join(ARREL, "app", "api", "panel"), c => c.endsWith("route.js"))
    // Entrar, sortir i l entrada amb Google son el propi acces: no desen ni envien dades.
    .filter(f => !/[\\/](entrar|sortir|google[\\/]inici|google[\\/]retorn)[\\/]route\.js$/.test(f));
  assert.ok(rutes.length >= 5);
  for (const f of rutes) {
    const codi = readFileSync(f, "utf8");
    const funcions = codi.match(/export async function \w+\(/g) || [];
    const tanques = codi.match(/const rebuig = await nomesAdmin\(\);\s+if \(rebuig\) return rebuig;/g) || [];
    assert.ok(funcions.length > 0, f);
    assert.equal(tanques.length, funcions.length, `${f}: cada funció ha de començar per nomesAdmin()`);
  }
});

/* ---------- Les dades tenen la forma que esperen les pagines ---------- */

test("altes, missatges i contactes: els comptadors quadren amb les llistes", () => {
  const altes = gestio.llistarSolicituds(null, null, ARA);
  const c = gestio.comptarPerEstat(ARA);
  assert.equal(c.pendent + c.validada + c.rebutjada, altes.length);
  assert.equal(gestio.llistarSolicituds("pendent", null, ARA).length, c.pendent);
  assert.ok(c.pendent >= 3);
  assert.ok(altes.every(a => cataleg.some(x => x.slug === a.app)), "una alta apunta a una app que no es al cataleg");
  assert.ok(altes.every(a => a.creada_el <= ARA && (!a.resolta_el || a.resolta_el <= ARA)));

  const m = gestio.comptarMissatges(ARA);
  assert.equal(m.pendent + m.respost + m.arxivat, gestio.llistarMissatges({}, ARA).length);
  assert.equal(gestio.llistarMissatges({ tipus: "incidencia" }, ARA).every(x => x.tipus === "incidencia"), true);

  const contactes = gestio.llistarContactes({}, ARA);
  const k = gestio.comptarContactes(ARA);
  assert.equal(Object.values(k).reduce((a, b) => a + b, 0), contactes.length);
  assert.ok(contactes.length >= 50);
  assert.equal(new Set(contactes.map(x => x.correu)).size, contactes.length, "hi ha correus repetits");
  assert.ok(gestio.llistarContactes({ comarca: "Osona" }, ARA).every(x => x.comarca === "Osona"));
  assert.ok(gestio.llistarContactes({ q: "crp" }, ARA).length > 0);
  assert.ok(gestio.properPendents({}, 5, ARA).every(x => x.estat === "pendent"));
  assert.equal(gestio.properPendents({}, 5, ARA).length, 5);
});

test("infraestructura: projectes, avisos i cost", () => {
  const d = infra.getPanelData({ ambCost: true }, ARA);
  assert.equal(d.apps.length, 15);
  const serveis = d.apps.flatMap(a => a.services);
  assert.equal(serveis.filter(s => s.deploy.status === "FAILED").length, 1);
  assert.equal(serveis.flatMap(s => s.customDomains).filter(x => x.cert !== "CERTIFICATE_STATUS_TYPE_VALID").length, 1);
  assert.ok(d.cost.actual > 5 && d.cost.previst > d.cost.actual);
  assert.ok(d.cost.factura >= 20);
  assert.ok(d.cost.esborrats > 0.5);
  assert.ok(d.apps.every(a => a.cost && a.cost.previst >= a.cost.actual));
  assert.equal(infra.getPanelData({}, ARA).cost, null);
});

test("trafic: els totals son la suma de les apps i la corba te tots els punts", () => {
  for (const [dies, punts] of [[1, 96], [7, 168], [30, 120]]) {
    const t = infra.getTrafficData(dies, ARA);
    assert.equal(t.serie.length, punts);
    assert.equal(t.total, t.apps.reduce((n, a) => n + a.total, 0));
    assert.equal(t.total, t.serie.reduce((n, s) => n + s.ok + s.err, 0));
    assert.ok(t.servidor > 0 && t.noTrobat > 0);
    assert.ok(t.apps.every(a => a.total === a.ok + a.errors));
  }
});

test("cerca: set propietats amb la serie sencera", () => {
  for (const dies of [7, 28, 90]) {
    const s = mesures.getSeoData(dies, cataleg, ARA);
    assert.equal(s.llocs.length, 7);
    assert.ok(s.llocs.every(l => l.serie.length === dies && l.clicks === l.serie.reduce((n, p) => n + p.clicks, 0)));
    assert.ok(s.inici < s.fi);
  }
});

test("activitat: el resum de debo hi troba apps que informen, una de callada i una sense estrenar", () => {
  const files = mesures.llegirActivitat(finestra(), ARA);
  const r = resumirActivitat({ ...files, slugs: mesures.slugsActivitat(), cataleg, ara: ARA });
  assert.ok(r.total.actiusAvui > 100);
  assert.ok(r.total.actiusHora > 0 && r.total.actiusHora <= r.total.actiusAvui);
  assert.ok(r.total.cost > 0);
  assert.deepEqual(r.callades.map(a => a.slug), ["la-claqueta"]);
  assert.deepEqual(r.senseEstrenar.map(a => a.slug), ["matescac"]);
  assert.ok(r.apps.some(a => a.sensePreu.length > 0));
  assert.ok(r.perCentre.every(c => c.domini === "altres" || c.domini.endsWith(".test")));
  // Una mateixa fila (app, dia, domini) no pot sortir dues vegades: a la taula de debo es clau primaria.
  const claus = files.dies.map(f => `${f.app}|${f.dia}|${f.domini}`);
  assert.equal(new Set(claus).size, claus.length);
});

test("correus: el resum de debo els reparteix per app i per tipus", () => {
  const c = mesures.getCorreus(cataleg, ARA);
  assert.ok(c.total > 120);
  assert.equal(c.perDia.length, 30);
  assert.ok(c.perApp.some(a => a.app === "pla-lector" && a.propis > 0));
  assert.ok(c.perApp.every(a => !a.desconegut), "hi ha un remitent que no s'ha reconegut");
  for (const tipus of ["alta-verif", "alta-rebuda", "alta-avis-intern", "presentacio"]) {
    assert.ok(c.perTipus.some(t => t.tipus === tipus), `falta el tipus ${tipus}`);
  }
  assert.ok(c.correus.every(x => x.quan <= ARA.getTime()));
});

test("cost d'IA: trenta dies, cinc claus i imports amb sentit", () => {
  const c = mesures.getCostAnthropic(ARA);
  assert.equal(c.perDia.length, 30);
  assert.equal(c.perClau.length, 5);
  assert.ok(c.total > 5 && c.total < 200);
  assert.ok(c.avui > 0 && c.mes > c.avui);
  assert.ok(Math.abs(c.perModel.reduce((n, m) => n + m.usd, 0) - c.total) < 1e-6);
});

test("avisos: la demo té els tres grups i els comptadors quadren", () => {
  const a = avisos.llegirAvisos({}, ARA);
  assert.equal(a.disponible, true);
  assert.ok(a.avisos.length > 0);
  assert.equal(a.perGrup.altes + a.perGrup.rols + a.perGrup.errors, a.total);
  for (const grup of ["altes", "rols", "errors"]) assert.ok(a.perGrup[grup] > 0, `falta el grup ${grup}`);
  assert.ok(a.avisos.every(x => cataleg.some(c => c.slug === x.app)), "un aviso apunta a una app que no es al cataleg");
  const text = JSON.stringify(a).toLowerCase();
  for (const prohibit of ["escolaindustrial", "fabio", "railway.app"]) assert.equal(text.includes(prohibit), false, prohibit);
});

test("fonaments: hi ha de tot, i canvis respecte de la setmana anterior", () => {
  const [actual, anterior] = mesures.ultimesRevisionsFonaments(2, cataleg, ARA);
  const railway = infra.getPanelData({}, ARA);
  const estats = new Set();
  for (const app of actual.dades.apps) {
    const v = veredictes(app, railway);
    for (const x of Object.values(v)) {
      assert.ok(ESTATS[x.estat], `estat desconegut a ${app.slug}`);
      estats.add(x.estat);
    }
    // Si no troba el projecte o el servei, la columna de produccio queda «sense dades».
    assert.notEqual(v.produccio.estat, "nd", `${app.slug}: ${v.produccio.resum}`);
  }
  for (const e of ["ok", "mig", "falta", "nocal"]) assert.ok(estats.has(e), `cap app en estat ${e}`);
  const abans = new Map(anterior.dades.apps.map(a => [a.slug, veredictes(a, null)]));
  const canvis = actual.dades.apps.filter(a => {
    const v = veredictes(a, railway);
    return ["copies", "secrets", "proves", "menors"].some(p => v[p].estat !== abans.get(a.slug)[p].estat);
  });
  assert.equal(canvis.length, 3);
});
