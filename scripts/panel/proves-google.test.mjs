// Proves de l entrada amb Google del panell (sense xarxa).
// Executa amb: node --test scripts/panel/proves-google.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { llistaAdmins, esAdminAutoritzat, urlAutoritzacio, stateValid } from "../../lib/panel-google.mjs";

test("llista d admins: separa per comes i espais, en minúscules, i descarta el que no és correu", () => {
  const llista = llistaAdmins({ PANEL_ADMINS: " Fabio@escolaindustrial.org, direccio@escolaindustrial.org ;  bad " });
  assert.deepEqual(llista, ["fabio@escolaindustrial.org", "direccio@escolaindustrial.org"]);
  assert.deepEqual(llistaAdmins({}), []);
});

test("autoritzat només si el correu és a la llista i Google l ha verificat", () => {
  const llista = ["fabio@escolaindustrial.org"];
  assert.equal(esAdminAutoritzat({ email: "Fabio@escolaindustrial.org", email_verified: true }, llista), true);
  assert.equal(esAdminAutoritzat({ email: "fabio@escolaindustrial.org", email_verified: false }, llista), false);
  assert.equal(esAdminAutoritzat({ email: "altre@escolaindustrial.org", email_verified: true }, llista), false);
  assert.equal(esAdminAutoritzat({ email_verified: true }, llista), false);
  assert.equal(esAdminAutoritzat(null, llista), false);
  assert.equal(esAdminAutoritzat({ email: "fabio@escolaindustrial.org", email_verified: true }, []), false);
});

test("adreça de Google: porta el client, la destinació de tornada i el state", () => {
  const url = new URL(urlAutoritzacio({ clientId: "ID", redirectUri: "https://www.aulaia.cat/api/panel/google/retorn", state: "abc" }));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), "ID");
  assert.equal(url.searchParams.get("redirect_uri"), "https://www.aulaia.cat/api/panel/google/retorn");
  assert.equal(url.searchParams.get("state"), "abc");
  assert.equal(url.searchParams.get("response_type"), "code");
});

test("state: només coincideix amb el mateix valor, i mai amb buit", () => {
  assert.equal(stateValid("abc123", "abc123"), true);
  assert.equal(stateValid("abc124", "abc123"), false);
  assert.equal(stateValid("abc", "abc123"), false);
  assert.equal(stateValid("", ""), false);
  assert.equal(stateValid(undefined, "abc"), false);
  assert.equal(stateValid("abc", undefined), false);
});
