#!/usr/bin/env node
/**
 * Resend de mentida, per veure /panel/correus en aquest ordinador sense cap
 * clau de debo. Respon GET /emails amb correus inventats, paginats com ho fa
 * Resend. Tots els destinataris son de dominis reservats per a proves.
 *
 * Us:
 *   node scripts/correus/servidor-fals.mjs          (port 3239)
 * i arrencar el web amb RESEND_API_BASE=http://localhost:3239 i una
 * RESEND_PANEL_KEY qualsevol (a .claude/launch.json hi ha «aulaia-correus-prova»).
 * RESEND_API_BASE nomes es te en compte fora de produccio.
 *
 * Amb la clau «nomes-enviar» respon com Resend quan la clau no pot llegir.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.PORT) || 3239;
const HORA = 3600000;
const AULA = "aulaia.cat <hola@aulaia.cat>";

/** Aleatori amb llavor: les mateixes dades a cada arrencada. */
let llavor = 20261116;
const atzar = () => ((llavor = (llavor * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const tria = llista => llista[Math.floor(atzar() * llista.length)];

const CENTRES = ["Institut Exemple", "Escola La Prova", "Institut Montserrat de Mostra", "Escola El Turó"];
const PERSONES = ["maria.soler", "joan.vila", "nuria.pons", "pau.ferrer", "laia.costa", "marc.roca"];
const DOMINIS = ["escola-exemple.test", "institut-mostra.test", "example.org"];
const ESTATS = ["delivered", "delivered", "delivered", "delivered", "delivered", "delivered", "opened", "sent", "bounced"];

/** Cada fila: pes (com de sovint surt), remitent i assumpte. */
const MENES = [
  [5, AULA, () => "Verifica la teva adreça · La Claqueta"],
  [5, AULA, () => "Hem rebut la teva sol·licitud · La Claqueta"],
  [5, AULA, () => `🔔 Alta nova: ${tria(CENTRES)} · La Claqueta`],
  [3, AULA, () => "Accés validat a La Claqueta · aulaia.cat"],
  [3, AULA, () => "Verifica la teva adreça · El Pla Lector"],
  [3, AULA, () => `🔔 Alta nova: ${tria(CENTRES)} · El Pla Lector`],
  [2, AULA, () => "Accés validat a dictats.cat · aulaia.cat"],
  [2, AULA, () => "Verifica tu dirección · KIPUK"],
  [2, AULA, () => "Hem rebut el teu missatge · aulaia.cat"],
  [2, AULA, () => `💬 Dubte: ${tria(PERSONES)} · ${tria(CENTRES)}`],
  [14, "Pla Lector <plalector@aulaia.cat>", () => tria(["Reunió de famílies del trimestre", "Llibres pendents de tornar", "Novetats de la biblioteca"])],
  [8, "dictats.cat <acces@dictats.cat>", () => "Entra a dictats.cat"],
  [4, "La Cantina <lacantina@aulaia.cat>", () => "La teva comanda està a punt"],
  [3, "FPSegura <fpsegura@aulaia.cat>", () => "Informe de seguretat del taller"],
];
const BOSSA = MENES.flatMap(([pes, from, assumpte]) => Array(pes).fill([from, assumpte]));

const ARA = Date.now();
const CORREUS = [];
for (let i = 0; i < 268; i++) {
  // Mes enviaments els dies recents, i alguns de fa mes de 30 dies.
  const fa = Math.floor(Math.pow(atzar(), 1.6) * 40 * 24) * HORA + Math.floor(atzar() * HORA);
  const [from, assumpte] = tria(BOSSA);
  CORREUS.push({
    quan: ARA - fa,
    from,
    subject: assumpte(),
    to: [`${tria(PERSONES)}@${tria(DOMINIS)}`],
    last_event: atzar() < 0.02 ? "complained" : tria(ESTATS),
  });
}
// Un remitent que no es de cap app, posat a ma perque hi sigui sempre.
for (const hores of [2, 70, 215]) {
  CORREUS.push({
    quan: ARA - hores * HORA,
    from: "Proves <proves@un-altre-lloc.test>",
    subject: "Correu d'un remitent que no és de cap app",
    to: [`${tria(PERSONES)}@${tria(DOMINIS)}`],
    last_event: "delivered",
  });
}
CORREUS.sort((a, b) => b.quan - a.quan);
const LLISTA = CORREUS.map((c, i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  message_id: `<fals-${i}@resend.test>`,
  to: c.to,
  from: c.from,
  // El format de Resend, que no es ISO.
  created_at: new Date(c.quan).toISOString().replace("T", " ").replace("Z", "000+00"),
  subject: c.subject,
  bcc: null,
  cc: null,
  reply_to: null,
  last_event: c.last_event,
  scheduled_at: null,
}));

function respon(res, estat, cos) {
  res.writeHead(estat, { "Content-Type": "application/json" });
  res.end(JSON.stringify(cos));
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method !== "GET" || url.pathname !== "/emails") {
    return respon(res, 404, { statusCode: 404, name: "not_found", message: "Aquest servidor fals nomes te GET /emails" });
  }
  const clau = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!clau) return respon(res, 401, { statusCode: 401, name: "missing_api_key", message: "Missing API key" });
  if (clau === "nomes-enviar") {
    return respon(res, 401, { statusCode: 401, name: "restricted_api_key", message: "This API key is restricted to only send emails" });
  }

  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);
  const after = url.searchParams.get("after");
  const inici = after ? LLISTA.findIndex(c => c.id === after) + 1 : 0;
  const data = LLISTA.slice(inici, inici + limit);
  respon(res, 200, { object: "list", has_more: inici + limit < LLISTA.length, data });
}).listen(PORT, () => {
  console.log(`Resend fals a http://localhost:${PORT}/emails amb ${LLISTA.length} correus inventats.`);
});
