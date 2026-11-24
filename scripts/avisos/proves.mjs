/**
 * Proves de la separació d'avisos per origen (Escola Industrial / altres / sense centre).
 * Sense dependències:  node --test scripts/avisos/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { origenDe, resumAvisos, filtrarOrigen } from "../../lib/avisos.mjs";

test("el domini de l'Escola Industrial i els seus subdominis són «escola»", () => {
  assert.equal(origenDe("escolaindustrial.org"), "escola");
  assert.equal(origenDe("ESCOLAINDUSTRIAL.ORG "), "escola");
  assert.equal(origenDe("alumnes.escolaindustrial.org"), "escola");
});

test("un domini que només s'hi assembla no es barreja amb l'escola", () => {
  assert.equal(origenDe("noescolaindustrial.org"), "altres");
  assert.equal(origenDe("escolaindustrial.org.fals.cat"), "altres");
  assert.equal(origenDe("xtec.cat"), "altres");
});

test("sense centre va a part", () => {
  assert.equal(origenDe(null), "sense");
  assert.equal(origenDe(""), "sense");
});

test("filtrar per origen refà els comptadors", () => {
  const ara = new Date();
  const resum = resumAvisos([
    { id: 1, app: "a", tipus: "alta.validada", centre: "escolaindustrial.org", quan: ara },
    { id: 2, app: "a", tipus: "alta.validada", centre: "altre.cat", quan: ara },
    { id: 3, app: "a", tipus: "error", centre: null, quan: ara },
  ]);
  assert.deepEqual(resum.perOrigen, { escola: 1, altres: 1, sense: 1 });
  const escola = filtrarOrigen(resum, "escola");
  assert.equal(escola.total, 1);
  assert.equal(escola.perGrup.altes, 1);
  assert.equal(escola.perGrup.errors, 0);
});
