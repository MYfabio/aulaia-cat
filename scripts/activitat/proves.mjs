/**
 * Proves de les funcions pures de l'informe d'activitat i dels preus d'IA.
 * Sense dependencies:  node --test scripts/activitat/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  netejarInforme,
  llegirClaus,
  resumirActivitat,
  estatEnviament,
  esLectiu,
  horesLectivesEntre,
  horaDeReferencia,
  diaLocal,
  ALTRES,
} from "../../lib/activitat.mjs";
import { costTokens, modelDeLaTaula, preuDelModel } from "../../lib/preus-ia.mjs";

// Dissabte 14/11/2026 a les 11:30 de Catalunya.
const ARA = new Date("2026-11-14T10:30:00Z");
const HORA = "2026-11-14T09:00:00Z";

const base = (dominis, extra = {}) => ({ versio: 1, app: "memoria", hora: HORA, dominis, ...extra });
const net = (cos, app = "memoria") => netejarInforme(cos, { app, ara: ARA });
const centre = (extra = {}) => ({ domini: "escola.cat", actiusHora: 4, actiusDia: 9, ...extra });

test("un informe correcte es desa net", () => {
  const r = net(base([centre({ ia: [{ model: "claude-haiku-5-5", entrada: 1200, sortida: 300 }] })]));
  assert.equal(r.ok, true);
  assert.equal(r.informe.hora, "2026-11-14T09:00:00.000Z");
  assert.deepEqual(r.informe.dominis, [
    { domini: "escola.cat", actiusHora: 4, actiusDia: 9, ia: { "claude-haiku-5-5": { e: 1200, s: 300, l: 0, w: 0 } } },
  ]);
});

test("l'slug del cos ha de ser el de la clau", () => {
  assert.equal(net(base([centre()]), "dictats").motiu, "app-no-coincideix");
});

test("un camp que no es del contracte fa rebutjar l'informe, i no se'n repeteix el valor", () => {
  const arrel = net(base([centre()], { correus: ["algu@escola.cat"] }));
  assert.deepEqual(arrel, { ok: false, motiu: "camp-desconegut", on: "arrel" });
  const dins = net(base([centre({ nom: "Algu" })]));
  assert.deepEqual(dins, { ok: false, motiu: "camp-desconegut", on: "dominis[0]" });
  const ia = net(base([centre({ ia: [{ model: "x", entrada: 1, sortida: 1, prompt: "hola" }] })]));
  assert.deepEqual(ia, { ok: false, motiu: "camp-desconegut", on: "dominis[0].ia[0]" });
  assert.ok(!JSON.stringify([arrel, dins, ia]).includes("algu"));
});

test("un correu no passa per domini ni per model", () => {
  assert.equal(net(base([centre({ domini: "algu@escola.cat" })])).motiu, "domini");
  assert.equal(net(base([centre({ ia: [{ model: "algu@escola.cat", entrada: 1, sortida: 1 }] })])).motiu, "model");
});

test("xifres impossibles", () => {
  assert.equal(net(base([centre({ actiusHora: 10, actiusDia: 9 })])).motiu, "actius");
  assert.equal(net(base([centre({ actiusHora: -1 })])).motiu, "actius");
  assert.equal(net(base([centre({ actiusDia: 2.5 })])).motiu, "actius");
  assert.equal(net(base([centre({ actiusDia: "9" })])).motiu, "actius");
  assert.equal(net(base([centre({ ia: [{ model: "m", entrada: 1e13, sortida: 0 }] })])).motiu, "tokens");
  assert.equal(net(base([centre(), centre()])).motiu, "domini-repetit");
  assert.equal(net(base([])).motiu, "dominis");
});

test("l'hora ha de ser en punt, no futura i no gaire vella", () => {
  assert.equal(net(base([centre()], { hora: "2026-11-14T09:30:00Z" })).motiu, "hora");
  assert.equal(net(base([centre()], { hora: "2026-02-31T09:00:00Z" })).motiu, "hora");
  assert.equal(net(base([centre()], { hora: "2026-11-14T12:00:00Z" })).motiu, "hora-futura");
  assert.equal(net(base([centre()], { hora: "2026-11-01T09:00:00Z" })).motiu, "hora-antiga");
  // L'hora en curs s'accepta: una app pot avancar un informe i tornar-lo a enviar sencer.
  assert.equal(net(base([centre()], { hora: "2026-11-14T10:00:00Z" })).ok, true);
});

test("els dominis amb menys de tres persones al dia es fonen dins d'«altres»", () => {
  const r = net(base([
    centre(),
    { domini: "petit.cat", actiusHora: 1, actiusDia: 2, ia: [{ model: "claude-haiku-5-5", entrada: 100, sortida: 10 }] },
    { domini: "minim.cat", actiusHora: 1, actiusDia: 1 },
    { domini: ALTRES, actiusHora: 2, actiusDia: 5, ia: [{ model: "claude-haiku-5-5", entrada: 50, sortida: 5 }] },
  ]));
  assert.equal(r.ok, true);
  assert.equal(r.agrupats, 2);
  assert.deepEqual(r.informe.dominis.map(d => d.domini).sort(), [ALTRES, "escola.cat"]);
  const altres = r.informe.dominis.find(d => d.domini === ALTRES);
  assert.equal(altres.actiusHora, 4);
  assert.equal(altres.actiusDia, 8);
  assert.deepEqual(altres.ia["claude-haiku-5-5"], { e: 150, s: 15, l: 0, w: 0 });
});

test("les claus: nomes empremtes ben formades, i cap de repetida", () => {
  const e1 = "a".repeat(64);
  const e2 = "b".repeat(64);
  assert.deepEqual(llegirClaus(JSON.stringify({ memoria: e1, dictats: e2 })), [["memoria", e1], ["dictats", e2]]);
  assert.deepEqual(llegirClaus(JSON.stringify({ memoria: e1, dictats: e1 })), [["memoria", e1]]);
  assert.deepEqual(llegirClaus(JSON.stringify({ "Mal Slug": e1, curta: "abc" })), []);
  assert.deepEqual(llegirClaus("no es json"), []);
  assert.deepEqual(llegirClaus(undefined), []);
});

test("dies lectius i silenci", () => {
  assert.equal(esLectiu("2026-11-13"), true);   // divendres
  assert.equal(esLectiu("2026-11-14"), false);  // dissabte
  assert.equal(esLectiu("2026-12-28"), false);  // Nadal
  assert.equal(esLectiu("2026-08-12"), false);  // agost
  // De divendres a les 17 h a dilluns a les 8 h: 7 hores de divendres i 8 de dilluns.
  const divendres = new Date("2026-11-13T16:00:00Z");
  assert.equal(horesLectivesEntre(divendres, new Date("2026-11-16T07:00:00Z")), 15);
  assert.equal(estatEnviament(new Date("2026-11-13T15:00:00Z"), new Date("2026-11-16T07:00:00Z")).estat, "ok");
  assert.equal(estatEnviament(new Date("2026-11-13T15:00:00Z"), new Date("2026-11-16T19:00:00Z")).estat, "callada");
  assert.equal(estatEnviament(null, ARA).estat, "mai");
});

test("l'hora de referencia deixa deu minuts de marge", () => {
  assert.equal(horaDeReferencia(new Date("2026-11-14T10:30:00Z")).toISOString(), "2026-11-14T09:00:00.000Z");
  assert.equal(horaDeReferencia(new Date("2026-11-14T10:05:00Z")).toISOString(), "2026-11-14T08:00:00.000Z");
  assert.equal(diaLocal(new Date("2026-11-14T23:30:00Z")), "2026-11-15");
});

test("preus: variants del nom del model, trams amb data i models desconeguts", () => {
  assert.equal(modelDeLaTaula("claude-haiku-4-5-20251001"), "claude-haiku-4-5");
  assert.equal(modelDeLaTaula("eu.anthropic.claude-haiku-5-5-v1:0"), "claude-haiku-5-5");
  assert.equal(modelDeLaTaula("models/gemini-3.6-flash"), "gemini-3.6-flash");
  assert.equal(modelDeLaTaula("claude-opus-5"), "claude-opus-5");
  assert.equal(modelDeLaTaula("claude-opus-5-5"), "claude-opus-5-5");
  assert.equal(modelDeLaTaula("gemini-2.5-flash-preview-tts"), "gemini-2.5-flash-preview-tts");
  assert.equal(modelDeLaTaula("inventat-9"), null);
  // Un sufix de versio no canvia el model; un altre model que comenca igual, si.
  assert.equal(modelDeLaTaula("gemini-2.5-flash-001"), "gemini-2.5-flash");
  assert.equal(modelDeLaTaula("gemini-3.6-flash-preview-09-2026"), "gemini-3.6-flash");
  assert.equal(modelDeLaTaula("gemini-2.5-flash-image"), null);
  assert.equal(modelDeLaTaula("gemini-flash-latest"), null);
  assert.equal(modelDeLaTaula("gpt-5.6-sol"), "gpt-5.6-sol");

  // 1 M d'entrada i 1 M de sortida d'Haiku 5.5: 0,10 + 0,50.
  assert.equal(costTokens("claude-haiku-5-5", { e: 1e6, s: 1e6 }, "2026-11-14"), 0.6);
  // La lectura de cau val el seu preu, i sense preu propi, el d'entrada.
  assert.equal(costTokens("claude-opus-5", { l: 1e6 }, "2026-11-14"), 0.5);
  assert.equal(costTokens("gemini-2.5-flash-preview-tts", { w: 1e6 }, "2026-11-14"), 0.5);
  // Gemini 3.6 Flash puja l'1 de gener de 2027.
  assert.equal(preuDelModel("gemini-3.6-flash", "2026-12-31").e, 0.75);
  assert.equal(preuDelModel("gemini-3.6-flash", "2027-01-01").e, 1.5);
  assert.equal(costTokens("inventat-9", { e: 1e6 }, "2026-11-14"), null);
});

test("el resum per al panell", () => {
  const r = resumirActivitat({
    ara: ARA,
    slugs: ["memoria", "dictats"],
    cataleg: [{ slug: "dictats", nom: "dictats.cat" }, { slug: "kipuk", nom: "KIPUK" }],
    dies: [
      { app: "memoria", dia: "2026-11-14", domini: "escola.cat", actius_dia: 9 },
      { app: "memoria", dia: "2026-11-14", domini: ALTRES, actius_dia: 4 },
      { app: "memoria", dia: "2026-11-13", domini: "escola.cat", actius_dia: 30 },
      { app: "memoria", dia: "2026-09-01", domini: "escola.cat", actius_dia: 99 }, // fora dels 30 dies
    ],
    recents: [
      { app: "memoria", hora: new Date(HORA), domini: "escola.cat", actius_hora: 4 },
      { app: "memoria", hora: new Date("2026-11-14T10:00:00Z"), domini: "escola.cat", actius_hora: 7 }, // hora oberta
    ],
    tokens: [
      { app: "memoria", domini: "escola.cat", dia: "2026-11-13", model: "claude-haiku-5-5", e: "1000000", s: "1000000", l: "0", w: "0" },
      { app: "memoria", domini: "escola.cat", dia: "2026-11-14", model: "inventat-9", e: "500", s: "0", l: "0", w: "0" },
    ],
    ultims: [{ app: "memoria", hora: new Date(HORA) }],
  });
  const memoria = r.apps.find(a => a.slug === "memoria");
  assert.equal(memoria.actiusHora, 4);
  assert.equal(memoria.actiusAvui, 13);
  assert.equal(memoria.pic, 30);
  assert.equal(memoria.serie.at(-1), 13);
  assert.equal(memoria.serie.at(-2), 30);
  assert.equal(memoria.cost, 0.6);
  assert.deepEqual(memoria.sensePreu, ["inventat-9"]);
  assert.equal(memoria.dominis.at(-1).domini, ALTRES);
  assert.equal(memoria.enviament.estat, "ok");
  assert.equal(r.total.actiusAvui, 13);
  assert.deepEqual(r.senseEstrenar.map(a => a.slug), ["dictats"]);
  assert.deepEqual(r.senseClau.map(a => a.slug), ["kipuk"]);
  assert.equal(r.perCentre[0].domini, "escola.cat");
});
