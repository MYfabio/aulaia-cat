/**
 * Proves de les funcions pures dels correus enviats.
 * Sense dependencies:  node --test scripts/correus/proves.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  quanDe,
  diaLocal,
  llegirRemitent,
  indexCataleg,
  classificar,
  estatDe,
  emmascarar,
  resumir,
  llegirCorreus,
  AULAIA,
  PER_PAGINA,
  MAX_PAGINES,
} from "../../lib/correus.mjs";

const CATALEG = [
  { slug: "pla-lector", nom: "El Pla Lector", domini: "elplalector.cat" },
  { slug: "dictats", nom: "dictats.cat", domini: "dictats.cat" },
  { slug: "la-claqueta", nom: "La Claqueta", domini: "laclaqueta.aulaia.cat" },
  { slug: "la-cantina", nom: "La Cantina", domini: "lacantina.aulaia.cat" },
  { slug: "ciutatviva", nom: "CiutatViva", domini: "ciutatviva.aulaia.cat" },
  { slug: "kipuk", nom: "KIPUK", domini: "kipuk.cat" },
];
const INDEX = indexCataleg(CATALEG);
const AULA = "aulaia.cat <hola@aulaia.cat>";

// Dilluns 16/11/2026 a les 11:30 de Catalunya.
const ARA = new Date("2026-11-16T10:30:00Z");

const de = (from, subject, opcions) => classificar({ from, subject }, INDEX, opcions);

test("les dates de Resend, que no son ISO", () => {
  assert.equal(quanDe("2026-11-14 09:12:33.123456+00"), Date.parse("2026-11-14T09:12:33.123Z"));
  assert.equal(quanDe("2026-11-14T09:12:33Z"), Date.parse("2026-11-14T09:12:33Z"));
  assert.equal(quanDe("2026-11-14 09:12:33+01:00"), Date.parse("2026-11-14T08:12:33Z"));
  assert.equal(quanDe("2026-11-14 09:12:33+0100"), Date.parse("2026-11-14T08:12:33Z"));
  assert.equal(quanDe("demà"), null);
  assert.equal(quanDe(null), null);
});

test("el dia es el de Catalunya, no el d'UTC", () => {
  assert.equal(diaLocal(Date.parse("2026-11-14T23:30:00Z")), "2026-11-15");
  assert.equal(diaLocal(Date.parse("2026-07-14T21:59:00Z")), "2026-07-14");
});

test("el remitent, amb nom i sense", () => {
  assert.deepEqual(llegirRemitent("Pla Lector <PlaLector@aulaia.cat>"), {
    nom: "Pla Lector", adreca: "plalector@aulaia.cat", local: "plalector", domini: "aulaia.cat",
  });
  assert.equal(llegirRemitent('"La Cantina" <avisos@aulaia.cat>').nom, "La Cantina");
  assert.equal(llegirRemitent("acces@chefboss.es").domini, "chefboss.es");
  assert.equal(llegirRemitent("").adreca, "");
});

test("una app que envia amb la seva adreça es reconeix pel remitent", () => {
  assert.deepEqual(de("Pla Lector <plalector@aulaia.cat>", "Reunió de famílies"), {
    app: "pla-lector", nom: "El Pla Lector", via: "propia", tipus: null,
  });
  assert.equal(de("acces@dictats.cat", "Entra a dictats").app, "dictats");
  assert.equal(de("no-reply@send.dictats.cat", "Entra").app, "dictats");
  assert.equal(de("avisos@lacantina.aulaia.cat", "Comanda").app, "la-cantina");
  assert.equal(de("lacantina@aulaia.cat", "Comanda").app, "la-cantina");
  assert.equal(de("Ciutat Viva <onboarding@resend.dev>", "Resum").app, "ciutatviva");
});

test("l'assumpte no decideix res si el remitent ja es d'una app", () => {
  // Un docent pot escriure qualsevol assumpte a la missatgeria.
  assert.equal(de("Pla Lector <plalector@aulaia.cat>", "Verifica la teva adreça · La Claqueta").app, "pla-lector");
});

test("les altes que envia aulaia.cat van a l'app de l'assumpte", () => {
  assert.deepEqual(de(AULA, "Verifica la teva adreça · La Claqueta"), {
    app: "la-claqueta", nom: "La Claqueta", via: "aulaia", tipus: "alta-verif",
  });
  assert.equal(de(AULA, "Verifica tu dirección · La Claqueta").tipus, "alta-verif");
  assert.equal(de(AULA, "Hem rebut la teva sol·licitud · El Pla Lector").app, "pla-lector");
  assert.equal(de(AULA, "Hemos recibido tu solicitud · KIPUK").tipus, "alta-rebuda");
  assert.deepEqual(de(AULA, "🔔 Alta nova: Institut A · Sabadell · La Claqueta"), {
    app: "la-claqueta", nom: "La Claqueta", via: "aulaia", tipus: "alta-avis-intern",
  });
  assert.deepEqual(de(AULA, "Accés validat a dictats.cat · aulaia.cat"), {
    app: "dictats", nom: "dictats.cat", via: "aulaia", tipus: "alta-validada",
  });
  assert.equal(de(AULA, "El teu enllaç d'accés a La Cantina").tipus, "enllac-acces");
  assert.equal(de("onboarding@resend.dev", "Accés validat a La Claqueta · aulaia.cat").app, "la-claqueta");
});

test("el que es d'aulaia.cat i de cap app", () => {
  assert.deepEqual(de(AULA, "Hem rebut el teu missatge · aulaia.cat"), {
    app: AULAIA, nom: "aulaia.cat", via: "aulaia", tipus: "missatge-rebut",
  });
  assert.equal(de(AULA, "💬 Dubte: Maria · Institut A").tipus, "missatge-avis-intern");
  assert.equal(de(AULA, "Una cosa que no es cap plantilla").tipus, "altres");
  // Una app que ja no es al cataleg: el tipus es coneix, l'app no.
  assert.deepEqual(de(AULA, "Verifica la teva adreça · App Antiga"), {
    app: AULAIA, nom: "aulaia.cat", via: "aulaia", tipus: "alta-verif",
  });
});

test("les presentacions a centres es reconeixen pel remitent, no per l'assumpte", () => {
  const opcions = { remitentContactes: "Fabio <presentacio@aulaia.cat>" };
  assert.equal(de("Fabio <presentacio@aulaia.cat>", "Aplicacions gratuïtes · La Claqueta", opcions).tipus, "presentacio");
  assert.equal(de("Fabio <presentacio@aulaia.cat>", "Hola", opcions).app, AULAIA);
});

test("un remitent que no es de ningu s'ensenya tal qual", () => {
  assert.deepEqual(de("Algu <algu@altrelloc.com>", "Verifica la teva adreça · La Claqueta"), {
    app: "remitent:algu@altrelloc.com", nom: "algu@altrelloc.com", via: "desconeguda", tipus: null,
  });
});

test("estats i adreces", () => {
  assert.deepEqual(estatDe("delivered"), { text: "Lliurat", grup: "ok" });
  assert.equal(estatDe("bounced").grup, "problema");
  assert.equal(estatDe("delivery_delayed").grup, "pendent");
  assert.deepEqual(estatDe("cosa_nova"), { text: "cosa nova", grup: "pendent" });
  assert.equal(emmascarar("joan.perez@escola.cat"), "jo•••@escola.cat");
  assert.equal(emmascarar("jp@escola.cat"), "j•••@escola.cat");
  assert.equal(emmascarar("sense-arrova"), "•••");
});

const correu = (id, quan, from, subject, last_event = "delivered", to = ["algu@escola.cat"]) => ({
  id, created_at: quan, from, subject, last_event, to,
});

test("el resum per app, per tipus i per dia", () => {
  const r = resumir({
    cataleg: CATALEG,
    ara: ARA,
    correus: [
      correu("1", "2026-11-16 09:00:00.000000+00", AULA, "Verifica la teva adreça · La Claqueta"),
      correu("2", "2026-11-16 08:00:00.000000+00", AULA, "🔔 Alta nova: Institut A · La Claqueta"),
      correu("3", "2026-11-15 08:00:00.000000+00", "Pla Lector <plalector@aulaia.cat>", "Reunió", "bounced"),
      correu("4", "2026-11-14 08:00:00.000000+00", "Pla Lector <plalector@aulaia.cat>", "Reunió", "sent"),
      correu("5", "2026-11-10 08:00:00.000000+00", AULA, "Hem rebut el teu missatge · aulaia.cat", "opened"),
      // Fora dels 30 dies i amb una data que no ho es: no compten.
      correu("6", "2026-09-01 08:00:00.000000+00", AULA, "Accés validat a KIPUK · aulaia.cat"),
      correu("7", "no es una data", AULA, "Accés validat a KIPUK · aulaia.cat"),
    ],
  });

  assert.equal(r.total, 5);
  assert.equal(r.avui, 2);
  assert.equal(r.ok, 3);
  assert.equal(r.problemes, 1);
  assert.equal(r.pendents, 1);

  // Amb els mateixos enviaments, per ordre alfabetic del nom: «El Pla Lector» abans que «La Claqueta».
  assert.deepEqual(r.perApp.map(a => [a.app, a.total]), [["pla-lector", 2], ["la-claqueta", 2], [AULAIA, 1]]);
  const claqueta = r.perApp[1];
  assert.equal(claqueta.perAulaia, 2);
  assert.equal(claqueta.propis, 0);
  assert.equal(claqueta.avui, 2);
  assert.deepEqual(claqueta.remitents, ["hola@aulaia.cat"]);
  const pla = r.perApp[0];
  assert.equal(pla.propis, 2);
  assert.equal(pla.problemes, 1);
  assert.equal(pla.ultim, Date.parse("2026-11-15T08:00:00Z"));

  assert.deepEqual(r.perTipus.map(t => [t.tipus, t.total]).sort(), [
    ["alta-avis-intern", 1], ["alta-verif", 1], ["missatge-rebut", 1],
  ]);

  assert.equal(r.perDia.length, 30);
  assert.deepEqual(r.perDia[29], { dia: "2026-11-16", n: 2 });
  assert.deepEqual(r.perDia[28], { dia: "2026-11-15", n: 1 });
  assert.equal(r.perDia[0].dia, "2026-10-18");

  assert.deepEqual(r.senseCorreu, ["dictats.cat", "La Cantina", "CiutatViva", "KIPUK"]);
  assert.deepEqual(r.correus.map(c => c.id), ["1", "2", "3", "4", "5"]);
  assert.deepEqual(r.correus[0].per, ["algu@escola.cat"]);
});

test("la lectura s'atura quan passa dels 30 dies", async () => {
  const pagines = [
    { has_more: true, data: [correu("a", "2026-11-16 09:00:00+00"), correu("b", "2026-11-01 09:00:00+00")] },
    { has_more: true, data: [correu("c", "2026-10-20 09:00:00+00"), correu("d", "2026-09-01 09:00:00+00")] },
    { has_more: true, data: [correu("e", "2026-08-01 09:00:00+00")] },
  ];
  const demanat = [];
  const r = await llegirCorreus(async p => { demanat.push(p); return pagines[demanat.length - 1]; }, ARA, { pausaMs: 0 });
  assert.equal(r.pagines, 2);
  assert.equal(r.incomplet, false);
  assert.deepEqual(demanat, [{ limit: PER_PAGINA }, { limit: PER_PAGINA, after: "b" }]);
  assert.deepEqual(r.correus.map(c => c.id), ["a", "b", "c", "d"]);
});

test("la lectura te topall de pagines i ho diu", async () => {
  let n = 0;
  const r = await llegirCorreus(async () => ({ has_more: true, data: [correu("x" + ++n, "2026-11-16 09:00:00+00")] }), ARA, { pausaMs: 0 });
  assert.equal(r.pagines, MAX_PAGINES);
  assert.equal(r.incomplet, true);
});

test("una llista buida no es cap error", async () => {
  const r = await llegirCorreus(async () => ({ has_more: false, data: [] }), ARA, { pausaMs: 0 });
  assert.deepEqual(r, { correus: [], pagines: 1, incomplet: false });
  assert.equal(resumir({ correus: [], cataleg: CATALEG, ara: ARA }).total, 0);
});
