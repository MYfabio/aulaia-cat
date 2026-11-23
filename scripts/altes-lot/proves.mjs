/**
 * Proves de les altes en lot del panell: lectura del text, regles per fila i
 * que cap error no porti dades personals.
 * Sense dependencies:  node --test scripts/altes-lot/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { analitzarText, validarLot, validarFila, centreValid, construirOrdre, appAltesLot, MAX_USUARIS_LOT } from "../../lib/altes-lot.mjs";
import { enviarOrdre as enviarDemo } from "../../lib/demo/altes-lot.mjs";

const APP = "pla-lector";

test("el text es llegeix amb punt i coma, tabulador o coma, i es salta la capçalera", () => {
  const files = analitzarText("nom;correu;rol;grup\nAina;aina@escolaindustrial.org;alumne;1r\nJoan\tjoan@escolaindustrial.org\tdocent\n\nMaria,maria@escolaindustrial.org,docent_aula,");
  assert.equal(files.length, 3);
  assert.equal(files[0].nom, "Aina");
  assert.equal(files[0].grup, "1r");
  assert.equal(files[1].rol, "docent");
  assert.equal(files[2].rol, "docent_aula");
  assert.equal(files[2].linia, 5, "el número de línia compta les línies buides");
});

test("una fila bona passa, amb el correu en minúscules i el grup buit com a null", () => {
  const lot = validarLot("Aina;AINA@Escolaindustrial.org;alumne;", APP);
  assert.equal(lot.valides.length, 1);
  assert.equal(lot.valides[0].email, "aina@escolaindustrial.org");
  assert.equal(lot.valides[0].grup, null);
  assert.deepEqual(lot.perRol, { alumne: 1 });
});

test("cada tipus de problema té el seu motiu i no es repeteix el correu dins del lot", () => {
  const text = [
    "Aina;aina@escolaindustrial.org;alumne",
    "Pere;pere@gmail.com;alumne",
    "Joan;joan@escolaindustrial.org;superheroi",
    ";nom@escolaindustrial.org;alumne",
    "Clara;no-es-correu;alumne",
    "Eva;eva@escolaindustrial.org;alumne",
    "Aina Bis;aina@escolaindustrial.org;docent",
  ].join("\n");
  const lot = validarLot(text, APP);
  assert.equal(lot.valides.length, 2);
  const motius = lot.errors.map(e => e.motiu);
  assert.deepEqual(motius, [
    "correu fora del domini @escolaindustrial.org",
    "rol desconegut",
    "falta el nom",
    "correu no vàlid",
    "correu repetit dins del lot",
  ]);
});

test("els motius d'error no contenen el correu ni el nom", () => {
  const lot = validarLot("Pere Garcia;pere.garcia@gmail.com;alumne\nAina;aina@escolaindustrial.org;xxx", APP);
  const text = JSON.stringify(lot.errors);
  assert.equal(text.includes("Pere"), false);
  assert.equal(text.includes("gmail"), false);
  assert.equal(text.includes("aina@"), false);
});

test("un lot buit, una app desconeguda o massa files es rebutgen", () => {
  assert.throws(() => validarLot("   \n\n", APP), /no hi ha cap fila/);
  assert.throws(() => validarLot("Aina;aina@escolaindustrial.org;alumne", "altra-app"), /no admet altes en lot/);
  const massa = Array.from({ length: MAX_USUARIS_LOT + 1 }, (_, i) => `U${i};u${i}@escolaindustrial.org;alumne`).join("\n");
  assert.throws(() => validarLot(massa, APP), /massa files/);
});

test("el nom del centre és obligatori i té límit", () => {
  assert.equal(centreValid("   "), null);
  assert.equal(centreValid(null), null);
  assert.equal(centreValid(" IES Escola Industrial "), "IES Escola Industrial");
  assert.equal(centreValid("x".repeat(121)), null);
});

test("l'ordre que s'envia porta l'app, l'identificador del lot, el centre i només les files bones", () => {
  const lot = validarLot("Aina;aina@escolaindustrial.org;alumne;1r", APP);
  const ordre = construirOrdre({ slug: APP, idLot: "lot-1", centre: "Centre", usuaris: lot.valides });
  assert.deepEqual(Object.keys(ordre).sort(), ["app", "centre", "id_lot", "usuaris"]);
  assert.equal(ordre.usuaris.length, 1);
});

test("la demo simula un enviament correcte sense tocar res", async () => {
  const lot = validarLot("Aina;aina@escolaindustrial.org;alumne\nPere;pere@escolaindustrial.org;docent", APP);
  const ordre = construirOrdre({ slug: APP, idLot: "lot-demo", centre: "Centre", usuaris: lot.valides });
  const r = await enviarDemo(ordre);
  assert.equal(r.ok, true);
  assert.equal(r.resultat.altes, 2);
  assert.equal(r.resultat.ja_existents, 0);
});

test("només El Pla Lector és disponible al pilot", () => {
  assert.ok(appAltesLot("pla-lector"));
  assert.equal(appAltesLot("kiosko"), null);
  assert.equal(appAltesLot("__proto__"), null);
});
