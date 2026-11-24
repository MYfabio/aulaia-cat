/**
 * Proves de l'alta de compte automàtica: ordre i resum del resultat.
 * Sense dependencies:  node --test scripts/alta-compte/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { appAltaCompte, construirOrdreAlta, resumResultat } from "../../lib/alta-compte.mjs";

const SOL = { id: 7, app: "ullada", centre: "Centre\nDemo", contacte_nom: " Docent Prova ", contacte_email: "Docent@Centre.CAT", idioma: "ca" };

test("només les apps de la llista admeten l'alta automàtica", () => {
  assert.ok(appAltaCompte("ullada"));
  assert.equal(appAltaCompte("pla-lector"), null);
  assert.equal(appAltaCompte("constructor"), null);
});

test("l'ordre porta identificador, data, correu en minúscules i text net", () => {
  const ara = new Date("2026-11-24T10:00:00.000Z");
  const o = construirOrdreAlta(SOL, ara);
  assert.equal(o.app, "ullada");
  assert.equal(o.id_alta, `alta-7-${ara.getTime()}`);
  assert.equal(o.data, "2026-11-24T10:00:00.000Z");
  assert.equal(o.centre, "Centre Demo");
  assert.deepEqual(o.usuari, { nom: "Docent Prova", email: "docent@centre.cat" });
  assert.equal(o.idioma, "ca");
});

test("el resum distingeix creat, ja existent, sense correu i error", () => {
  assert.equal(resumResultat("Ullada", { ok: true, resultat: { resultat: "creat", correu: true } }).estat, "creat");
  assert.equal(resumResultat("Ullada", { ok: true, resultat: { resultat: "reactivat", correu: true } }).estat, "creat");
  assert.equal(resumResultat("Ullada", { ok: true, resultat: { resultat: "creat", correu: false } }).estat, "sense-correu");
  assert.equal(resumResultat("Ullada", { ok: true, resultat: { resultat: "ja-existia" } }).estat, "ja-existia");
  assert.equal(resumResultat("Ullada", { ok: false, error: "n8n no respon" }).estat, "error");
  assert.equal(resumResultat("Ullada", { ok: true, resultat: {} }).estat, "error");
});

test("la nota no porta mai el correu ni el nom", () => {
  for (const enviat of [{ ok: true, resultat: { resultat: "creat", correu: true } }, { ok: false, error: "x" }]) {
    const { nota } = resumResultat("Ullada", enviat);
    assert.ok(!nota.includes("@"));
    assert.ok(!nota.includes("Docent"));
  }
});
