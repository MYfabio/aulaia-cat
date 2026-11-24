/**
 * Proves de les regles de l'endoll comú.  node --test scripts/endoll/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { revisaFitxerAvisos, cridesEnviarAvis, revisaCrida } from "./revisa-lib.mjs";

const BO = `
const APP = 1;
export function dominiDe(c) {}
export function rolComu(r) {}
export async function enviarAvis(avis) { return JSON.stringify({ app: "dictats", ...avis }); }`;

test("fitxer d'avisos complet i amb slug del catàleg", () => {
  assert.deepEqual(revisaFitxerAvisos(BO, ["dictats"]).problemes, []);
});

test("detecta slug desconegut i funcions que falten", () => {
  const r = revisaFitxerAvisos(`export async function enviarAvis(a){ ({ app: "inventada" }) }`, ["dictats"]);
  assert.ok(r.problemes.some(p => p.includes("no és al catàleg")));
  assert.ok(r.problemes.some(p => p.includes("dominiDe")));
  assert.ok(r.problemes.some(p => p.includes("rolComu")));
});

test("troba les crides i salta la definició", () => {
  const text = `export async function enviarAvis(avis) {}\nawait enviarAvis({ tipus: "error", centre: null, datos: { on: f(1) } });`;
  const c = cridesEnviarAvis(text);
  assert.equal(c.length, 1);
  assert.equal(c[0].linia, 2);
  assert.ok(c[0].cos.includes("f(1)"));
});

test("una crida bona no té problemes", () => {
  assert.deepEqual(revisaCrida(`{ tipus: "alta.validada", centre: dominiDe(email), datos: { rol: rolComu(role) } }`).problemes, []);
  assert.deepEqual(revisaCrida(`{ tipus: "error", centre: null, datos: { on: "importacio" } }`).problemes, []);
});

test("detecta centre buit, rol sense traduir, tipus no permès i dades personals", () => {
  assert.ok(revisaCrida(`{ tipus: "alta.validada", centre: null, datos: {} }`).problemes.some(p => p.includes("centre buit")));
  assert.ok(revisaCrida(`{ tipus: "alta.validada", centre: d, datos: { rol: role } }`).problemes.some(p => p.includes("rolComu")));
  assert.ok(revisaCrida(`{ tipus: "alta.validada", centre: d, datos: { rol } }`).problemes.some(p => p.includes("rolComu")));
  assert.ok(revisaCrida(`{ tipus: "usuari.nou", centre: d, datos: {} }`).problemes.some(p => p.includes("no permès")));
  assert.ok(revisaCrida(`{ tipus: "baixa", centre: d, datos: { email: e } }`).problemes.some(p => p.includes("correu")));
});
