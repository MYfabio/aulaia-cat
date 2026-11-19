#!/usr/bin/env node
/**
 * Prova de la lectura dels correus enviats: pregunta a Resend el mateix que la
 * pagina /panel/correus i ensenya el resum per terminal.
 *
 * NOMES LLEGEIX. No envia ni canvia res a Resend, i no imprimeix mai la clau,
 * ni cap destinatari, ni cap assumpte: nomes recomptes i adreces de remitent.
 *
 * Us, des de la carpeta aulaia-cat:
 *   node scripts/correus/provar.mjs
 *
 * La clau es llegeix de l'entorn (RESEND_PANEL_KEY) o de
 * %USERPROFILE%\.aulaia\resend-panel.env, que viu FORA de la carpeta del
 * projecte a proposit: `railway up` puja la carpeta sencera.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { clientResend, llegirCorreus, resumir, quanDe, ErrorResend, DIES_SERIE, AULAIA } from "../../lib/correus.mjs";

function carregarEnvLocal() {
  const f = join(homedir(), ".aulaia", "resend-panel.env");
  if (!existsSync(f)) return;
  for (const linia of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = linia.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

carregarEnvLocal();
const clau = process.env.RESEND_PANEL_KEY;
if (!clau) {
  console.error("Falta RESEND_PANEL_KEY (a l'entorn o a %USERPROFILE%\\.aulaia\\resend-panel.env).");
  process.exit(2);
}
if (!clau.startsWith("re_") && !process.env.RESEND_API_BASE) {
  console.error("La clau no comença per re_: no sembla una clau de Resend.");
  process.exit(2);
}

const arrel = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cataleg = JSON.parse(readFileSync(join(arrel, "data", "apps.json"), "utf8"));
const num = n => String(n).padStart(5);

try {
  const ara = new Date();
  const base = process.env.RESEND_API_BASE;
  const { correus, pagines, incomplet } = await llegirCorreus(clientResend(clau, base ? { base } : {}), ara);
  const r = resumir({ correus, cataleg, ara, opcions: { remitentContactes: process.env.RESEND_FROM_CONTACTES } });

  const dates = correus.map(c => quanDe(c.created_at)).filter(t => t !== null);
  const ordenat = dates.every((t, i) => i === 0 || t <= dates[i - 1]);
  console.log(`Llegits: ${correus.length} correus en ${pagines} ${pagines === 1 ? "pàgina" : "pàgines"}${incomplet ? " (INCOMPLET: s'ha arribat al topall)" : ""}`);
  if (dates.length) {
    console.log(`Del ${new Date(Math.min(...dates)).toISOString().slice(0, 10)} al ${new Date(Math.max(...dates)).toISOString().slice(0, 10)}`);
    console.log(`Ordre del més nou al més antic: ${ordenat ? "sí" : "NO (la lectura per pàgines ho dona per fet!)"}`);
  }
  console.log(`\nÚltims ${DIES_SERIE} dies: ${r.total}   avui: ${r.avui}   lliurats: ${r.ok}   pendents: ${r.pendents}   amb problemes: ${r.problemes}`);

  console.log("\nPer app:                          total lliur. probl.  qui els envia");
  for (const a of r.perApp) {
    const qui = a.desconegut ? "(remitent no reconegut)"
      : a.app === AULAIA ? a.remitents.join(", ")
      : [a.propis ? `l'app: ${a.propis}` : "", a.perAulaia ? `aulaia.cat: ${a.perAulaia}` : ""].filter(Boolean).join(", ") + "  [" + a.remitents.join(", ") + "]";
    console.log(`  ${a.nom.slice(0, 30).padEnd(30)} ${num(a.total)} ${num(a.ok)} ${num(a.problemes)}   ${qui}`);
  }

  if (r.perTipus.length) {
    console.log("\nEl que envia aulaia.cat, per tipus:");
    for (const t of r.perTipus) console.log(`  ${t.text.padEnd(30)} ${num(t.total)} ${num(t.ok)} ${num(t.problemes)}`);
  }

  const estats = new Map();
  for (const c of correus) estats.set(c.last_event, (estats.get(c.last_event) || 0) + 1);
  console.log("\nEstats tal com els dona Resend: " + [...estats].map(([k, n]) => `${k}=${n}`).join(", "));
  console.log(`Dies amb enviaments: ${r.perDia.filter(d => d.n > 0).length} de ${r.perDia.length}`);
  if (r.senseCorreu.length) console.log(`Sense cap correu: ${r.senseCorreu.join(", ")}`);
} catch (e) {
  // Mai e.message sencer d'una crida amb credencials: n'hi ha prou amb el codi.
  console.error(`No s'han pogut llegir els enviaments: ${e instanceof ErrorResend ? "Resend ha respost " + e.estat + (e.nom ? " (" + e.nom + ")" : "") : e.name}.`);
  process.exit(3);
}
