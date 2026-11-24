/**
 * Proves de la vigilància de les apps.  node --test scripts/vigilancia/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { correuVigilancia, dataRecent, llegirAvis, signaturaValida } from "../../lib/vigilancia.mjs";
import { hostDe, publicacionsDelCataleg } from "../../lib/publicacions.mjs";

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
  assert.deepEqual(r.canvis[0], { app: "ullada", estat: "caiguda", codi: 502, segons: 15, versio: null });
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

test("accepta els estats de publicació i només versions de 7 caràcters hex", () => {
  const r = llegirAvis(cos([{ app: "ullada", estat: "publicacio-fallida", versio: "8e01312" }, { app: "ullada", estat: "publicacio-encallada", versio: "<script>" }]), ["ullada"], ARA);
  assert.equal(r.ok, true);
  assert.equal(r.canvis[0].versio, "8e01312");
  assert.equal(r.canvis[1].versio, null);
});

test("la data ha de ser recent", () => {
  assert.equal(dataRecent("2026-11-24T09:55:00Z", ARA), true);
  assert.equal(dataRecent("2026-11-24T09:40:00Z", ARA), false);
  assert.equal(dataRecent(undefined, ARA), false);
});

test("el correu de publicacions diu què ha fallat i amb quina versió", () => {
  const nom = s => ({ ullada: "Ullada", dictats: "dictats" })[s];
  const c = correuVigilancia([{ app: "ullada", estat: "publicacio-fallida", codi: 0, versio: "8e01312" }, { app: "dictats", estat: "publicacio-no-respon", codi: 502, segons: 3 }], nom);
  assert.match(c.assumpte, /Publicació fallida: Ullada/);
  assert.match(c.assumpte, /Publicada però no respon: dictats/);
  assert.match(c.text, /Ullada: la publicació ha fallat \(versió 8e01312\)/);
  assert.match(c.text, /dictats: s'ha publicat però la web no respon \(codi 502, 3 s\)/);
  assert.match(c.text, /última publicació/);
});

test("creua el catàleg amb Railway pel domini", () => {
  assert.equal(hostDe("https://WWW.Kipuk.cat/x"), "kipuk.cat");
  assert.equal(hostDe("ullada.aulaia.cat"), "ullada.aulaia.cat");
  const cataleg = [
    { slug: "ullada", url: "https://ullada.aulaia.cat", estat: "produccio" },
    { slug: "kipuk", url: "https://www.kipuk.cat", estat: "produccio" },
    { slug: "bitacola", url: "https://bitacola.aulaia.cat", estat: "desenvolupament" },
  ];
  const projectes = [
    { services: [{ customDomains: [{ domain: "ullada.aulaia.cat" }], deploy: { id: "d1", status: "SUCCESS", at: "2026-11-24T10:00:00Z", hash: "8e01312" } }] },
    { services: [{ customDomains: [{ domain: "aulaia.cat" }, { domain: "www.aulaia.cat" }], deploy: { id: "d0", status: "BUILDING", at: "x", hash: null } }] },
  ];
  const r = publicacionsDelCataleg(cataleg, projectes);
  assert.deepEqual(r.map(x => x.app), ["aulaia-cat", "ullada", "kipuk"]);
  assert.equal(r[0].estat, "BUILDING");
  assert.deepEqual(r[1], { app: "ullada", url: "https://ullada.aulaia.cat", id: "d1", estat: "SUCCESS", creat: "2026-11-24T10:00:00Z", versio: "8e01312" });
  assert.equal(r[2].id, null);
});
