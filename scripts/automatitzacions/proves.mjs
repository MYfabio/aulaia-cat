/**
 * Proves de la llista d'automatitzacions del panell.
 * Sense dependencies:  node --test scripts/automatitzacions/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLUXOS, ESTATS_FLUX, estatFlux } from "../../lib/automatitzacions.mjs";

test("cada flux té nom, funció, estat conegut i motiu", () => {
  assert.equal(FLUXOS.length, 4);
  for (const f of FLUXOS) {
    assert.ok(f.nom && f.funcio && f.motiu, f.clau);
    assert.ok(ESTATS_FLUX[f.estat], `estat desconegut a ${f.clau}`);
  }
});

test("les claus són úniques i els fluxos de la llista existeixen", () => {
  const claus = FLUXOS.map(f => f.clau);
  assert.equal(new Set(claus).size, claus.length);
  assert.equal(estatFlux("altes-lot"), "actiu");
  assert.equal(estatFlux("no-existeix"), null);
});

test("només hi ha encesos els fluxos que s'han encès a mà a n8n", () => {
  const encesos = FLUXOS.filter(f => f.estat === "actiu").map(f => f.clau).sort();
  assert.deepEqual(encesos, ["alta-compte", "altes-lot", "avisos"]);
});
