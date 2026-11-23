/**
 * Proves de la llista d'automatitzacions del panell.
 * Sense dependencies:  node --test scripts/automatitzacions/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLUXOS, ESTATS_FLUX, estatFlux } from "../../lib/automatitzacions.mjs";

test("cada flux té nom, funció, estat conegut i motiu", () => {
  assert.equal(FLUXOS.length, 3);
  for (const f of FLUXOS) {
    assert.ok(f.nom && f.funcio && f.motiu, f.clau);
    assert.ok(ESTATS_FLUX[f.estat], `estat desconegut a ${f.clau}`);
  }
});

test("les claus són úniques i els fluxos de la llista existeixen", () => {
  const claus = FLUXOS.map(f => f.clau);
  assert.equal(new Set(claus).size, claus.length);
  assert.equal(estatFlux("altes-lot"), "apagat");
  assert.equal(estatFlux("no-existeix"), null);
});

test("cap flux surt activat sense haver-ho decidit a mà", () => {
  assert.ok(FLUXOS.every(f => f.estat === "apagat"));
});
