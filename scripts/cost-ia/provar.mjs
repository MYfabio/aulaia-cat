#!/usr/bin/env node
/**
 * Prova de la lectura del cost d'IA: pregunta a Anthropic el mateix que la
 * pagina /panel/ia i ensenya el resum per terminal, en dolars.
 *
 * NOMES LLEGEIX. No crea ni canvia res a l'organitzacio i no imprimeix mai la clau.
 *
 * Us, des de la carpeta aulaia-cat:
 *   node scripts/cost-ia/provar.mjs
 *
 * La clau d'administrador es llegeix de l'entorn (ANTHROPIC_ADMIN_KEY) o de
 * %USERPROFILE%\.aulaia\anthropic-admin.env, que viu FORA de la carpeta del
 * projecte a proposit: `railway up` puja la carpeta sencera.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import Anthropic from "@anthropic-ai/sdk";
import { llegirCost, DIES_SERIE } from "../../lib/cost-ia.mjs";

function carregarEnvLocal() {
  const f = join(homedir(), ".aulaia", "anthropic-admin.env");
  if (!existsSync(f)) return;
  for (const linia of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = linia.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const dolars = v => v.toFixed(2).padStart(8) + " $";

carregarEnvLocal();
const clau = process.env.ANTHROPIC_ADMIN_KEY;
if (!clau) {
  console.error("Falta ANTHROPIC_ADMIN_KEY (a l'entorn o a %USERPROFILE%\\.aulaia\\anthropic-admin.env).");
  process.exit(2);
}
if (!clau.startsWith("sk-ant-admin") && !process.env.ANTHROPIC_BASE_URL) {
  console.error("La clau no comença per sk-ant-admin: ha de ser una clau d'administrador, no una clau d'API normal.");
  process.exit(2);
}

try {
  const client = new Anthropic({ apiKey: clau, maxRetries: 1, timeout: 20000 });
  const c = await llegirCost(client, new Date(), e => {
    console.error("Avís: no s'han pogut llegir els noms de les claus (" + (e.status ?? e.name) + ").");
  });

  console.log(`Dades fins a: ${c.refrescat || "encara no n'hi ha"}`);
  console.log(`Últims ${DIES_SERIE} dies: ${dolars(c.total)}`);
  console.log(`Aquest mes:      ${dolars(c.mes)}`);
  console.log(`Avui, fins ara:  ${dolars(c.avui)}`);
  console.log("\nPer clau:");
  for (const k of c.perClau) {
    console.log(`  ${k.nom.padEnd(32)} ${dolars(k.usd)}   ${k.models.map(m => m.model).join(", ")}${k.estat && k.estat !== "active" ? "   (" + k.estat + ")" : ""}`);
  }
  console.log("\nPer model:");
  for (const m of c.perModel) console.log(`  ${m.model.padEnd(32)} ${dolars(m.usd)}`);
  const ambDespesa = c.perDia.filter(d => d.usd > 0);
  console.log(`\nDies amb despesa: ${ambDespesa.length} de ${c.perDia.length}`);
} catch (e) {
  // Mai e.message sencer d'una crida amb credencials: n'hi ha prou amb el codi.
  console.error(`No s'ha pogut llegir el cost: ${e instanceof Anthropic.APIError ? "Anthropic ha respost " + (e.status ?? "sense codi") : e.name}.`);
  process.exit(3);
}
