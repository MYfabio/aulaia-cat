/**
 * Proves de la vigilància de les apps.  node --test scripts/vigilancia/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { correuVigilancia, llegirAvis, signaturaValida } from "../../lib/vigilancia.mjs";

const SECRET = "secret-de-prova";
const ARA = Date.parse("2026-11-24T10:00:00Z");
const cos = (canvis, data = "2026-11-24T09:58:00Z") => JSON.stringify({ data, canvis });

test("signatura: bona, dolenta i sense secret", () => {
  const c = cos([{ app: "ullada", estat: "caiguda" }]);
  const sig = createHmac("sha256", SECRET).update(c).digest("hex");
  assert.equal(signaturaValida(c, sig, SECRET), true);
  assert.equal(signaturaValida(c + " ", sig, SECRET), false);
  assert.equal(signaturaValida(c, "abc", SECRET), false);
  assert.equal(signaturaValida(c, sig, ""), false);
});

test("accepta canvis d'apps del catàleg i d'aulaia.cat", () => {
  const r = llegirAvis(cos([{ app: "ullada", estat: "caiguda", codi: 502, segons: 15.04 }, { app: "aulaia-cat", estat: "recuperada", codi: 200 }]), ["ullada"], ARA);
  assert.equal(r.ok, true);
  assert.deepEqual(r.canvis[0], { app: "ullada", estat: "caiguda", codi: 502, segons: 15 });
});

test("rebutja app desconeguda, estat estrany, data vella i llista buida", () => {
  assert.equal(llegirAvis(cos([{ app: "inventada", estat: "caiguda" }]), ["ullada"], ARA).error, "canvi");
  assert.equal(llegirAvis(cos([{ app: "ullada", estat: "explotada" }]), ["ullada"], ARA).error, "canvi");
  assert.equal(llegirAvis(cos([{ app: "ullada", estat: "caiguda" }], "2026-11-24T08:00:00Z"), ["ullada"], ARA).error, "data");
  assert.equal(llegirAvis(cos([]), ["ullada"], ARA).error, "canvis");
  assert.equal(llegirAvis("no és json", ["ullada"], ARA).error, "json");
});

test("el correu diu què ha caigut i què torna, amb el nom de l'app", () => {
  const nom = s => ({ ullada: "Ullada", dictats: "dictats" })[s];
  const c = correuVigilancia([{ app: "ullada", estat: "caiguda", codi: 0, segons: null }, { app: "dictats", estat: "recuperada", codi: 200, segons: 0.5 }], nom);
  assert.match(c.assumpte, /Caiguda: Ullada/);
  assert.match(c.assumpte, /Torna: dictats/);
  assert.match(c.text, /Ullada: no respon \(sense resposta\)/);
  assert.match(c.text, /dictats: torna a respondre \(codi 200, 0.5 s\)/);
});
