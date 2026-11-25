/**
 * Proves del resum setmanal.  node --test scripts/resum-setmanal/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { caigudes, construirCorreu, costIaPerApp, errors, inicDiaLocal, persones, publicacions, setmanaAnterior } from "../../lib/resum-setmanal.mjs";

const setmana = setmanaAnterior(new Date("2026-11-30T07:00:00Z")); // dilluns 30/11, 8:00 a Catalunya
const nom = s => ({ ullada: "Ullada", dictats: "dictats", fpsegura: "FP Segura" })[s] ?? s;
const ev = (app, tipus, dades, data) => ({ app, tipus, dades, data });

test("la setmana anterior va de dilluns a diumenge, hora de Catalunya", () => {
  assert.deepEqual(setmana.dies, ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"]);
  assert.equal(setmana.inici.toISOString(), "2026-11-22T23:00:00.000Z");
  assert.equal(setmana.fi.toISOString(), "2026-11-29T23:00:00.000Z");
  assert.equal(inicDiaLocal("2026-07-06").toISOString(), "2026-07-05T22:00:00.000Z");
  // Un diumenge també dona la setmana que s'acaba el diumenge anterior.
  assert.equal(setmanaAnterior(new Date("2026-11-29T20:00:00Z")).dies[0], "2026-11-16");
});

test("caigudes: vegades i minuts, també si ja venia caiguda o encara ho està", () => {
  const c = caigudes([
    ev("ullada", "error", { on: "vigilancia", estat: "caiguda" }, "2026-11-24T10:00:00Z"),
    ev("ullada", "error", { on: "vigilancia", estat: "recuperada" }, "2026-11-24T10:30:00Z"),
    ev("dictats", "error", { on: "vigilancia", estat: "recuperada" }, "2026-11-23T00:00:00Z"),
    ev("fpsegura", "error", { on: "vigilancia", estat: "caiguda" }, "2026-11-29T22:00:00Z"),
  ], setmana);
  assert.deepEqual(c.find(x => x.app === "ullada"), { app: "ullada", vegades: 1, minuts: 30, seguiaCaiguda: false });
  assert.equal(c.find(x => x.app === "dictats").minuts, 60);
  assert.equal(c.find(x => x.app === "fpsegura").seguiaCaiguda, true);
});

test("publicacions, errors d'IA per motiu i persones amb recomptes", () => {
  const files = [
    ev("ullada", "error", { on: "publicacions", estat: "publicacio-fallida" }),
    ev("ullada", "error", { on: "ia", motiu: "cupo-dia" }),
    ev("ullada", "error", { on: "ia", motiu: "cupo-dia" }),
    ev("ullada", "error", { on: "ia", motiu: "temps" }),
    ev("dictats", "error", { on: "importacio" }),
    ev("fpsegura", "alta.validada", { rol: "docent" }),
    ev("fpsegura", "alta.solicitud", { rol: "alumne", invitacions: 25 }),
    ev("fpsegura", "baixa", { rol: "alumne" }),
  ];
  assert.deepEqual(publicacions(files), [{ app: "ullada", fallida: 1, encallada: 0, noRespon: 0 }]);
  const e = errors(files);
  assert.deepEqual(e.ia, [{ app: "ullada", total: 3, motius: { "cupo-dia": 2, temps: 1 } }]);
  assert.deepEqual(e.altres, [{ app: "dictats", n: 1 }]);
  assert.deepEqual(persones(files), [{ app: "fpsegura", invitades: 25, altes: 1, baixes: 1, canvisRol: 0 }]);
});

test("cost per app: només els dies de la setmana; models sense tarifa es diuen", () => {
  const c = costIaPerApp([
    { app: "ullada", dia: "2026-11-24", model: "gemini-2.5-flash", e: 1_000_000, s: 0, l: 0, w: 0 },
    { app: "ullada", dia: "2026-11-30", model: "gemini-2.5-flash", e: 9_000_000, s: 0, l: 0, w: 0 },
    { app: "dictats", dia: "2026-11-25", model: "model-inventat-xyz", e: 10, s: 10, l: 0, w: 0 },
  ], setmana.dies);
  const u = c.find(x => x.app === "ullada");
  assert.ok(u.usd > 0 && u.usd < 1, `cost raonable: ${u.usd}`);
  assert.equal(c.find(x => x.app === "dictats").senseTarifa, true);
});

test("el correu: setmana tranquil·la, i sense noms ni correus de persones", () => {
  const buit = { setmana, caigudes: [], publicacions: [], errors: { ia: [], altres: [] }, persones: [], solicituds: { noves: [], pendents: 0 }, cost: { railway: { actual: 4.2, previst: 9.8 }, anthropic: 1.5, perApp: [] }, noDisponible: [] };
  const c = construirCorreu(buit, nom);
  assert.match(c.assumpte, /tot ha anat bé/);
  assert.match(c.text, /Cap app ha caigut/);
  assert.match(c.text, /Railway aquest mes: 4,20 \$ gastats; previsió a final de mes 9,80 \$/);
  assert.doesNotMatch(c.text, /per sobre del límit/);

  const ple = { ...buit, caigudes: [{ app: "ullada", vegades: 2, minuts: 150, seguiaCaiguda: false }], solicituds: { noves: [{ app: "ullada", centre: "Institut Ca n'Oriac" }], pendents: 3 }, cost: { railway: { actual: 10, previst: 18 }, anthropic: null, perApp: [{ app: "ullada", usd: 0.42, senseTarifa: false }] } };
  const d = construirCorreu(ple, nom);
  assert.doesNotMatch(d.assumpte, /tot ha anat bé/);
  assert.match(d.text, /Ullada: 2 vegades, uns 3 h sense respondre/);
  assert.match(d.text, /Institut Ca n'Oriac → Ullada/);
  assert.match(d.text, /per revisar al panell: 3/);
  assert.match(d.text, /per sobre del límit/);
  assert.match(d.text, /Claude \(Anthropic\): no s'ha pogut llegir/);
  assert.doesNotMatch(d.text, /@/);
});
