/**
 * Comprova si una o més apps compleixen l'endoll comú (docs/endoll-comu.md).
 * Només llegeix. Ús:  node scripts/endoll/revisa.mjs <carpeta-app> [<carpeta-app> ...]
 * Acaba amb 0 si totes compleixen la peça 1 (avisos) i amb 1 si alguna no.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FITXERS_AVISOS, revisaFitxerAvisos, cridesEnviarAvis, revisaCrida } from "./revisa-lib.mjs";

const arrel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const slugs = JSON.parse(fs.readFileSync(path.join(arrel, "data/apps.json"), "utf8")).map(a => a.slug);
const IGNORA = new Set(["node_modules", ".next", ".git", "dist", "build", "out", "coverage", ".turbo", ".vercel"]);
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function* fitxers(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORA.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* fitxers(p);
    else if (EXT.test(e.name)) yield p;
  }
}

function revisaApp(carpeta) {
  const res = { carpeta, slug: null, problemes: [], crides: 0, altaCompte: false, activitat: false };
  const fitxerAvisos = FITXERS_AVISOS.map(f => path.join(carpeta, f)).find(f => fs.existsSync(f));
  if (!fitxerAvisos) {
    res.problemes.push("no té el fitxer d'avisos");
  } else {
    const r = revisaFitxerAvisos(fs.readFileSync(fitxerAvisos, "utf8"), slugs);
    res.slug = r.slug;
    res.problemes.push(...r.problemes);
  }
  for (const f of fitxers(carpeta)) {
    const rel = path.relative(carpeta, f).replace(/\\/g, "/");
    if (/api\/alta-compte\/route\.(t|j)s$/.test(rel)) res.altaCompte = true;
    if (f === fitxerAvisos || /(^|\/)(tests?|__tests__)\/|\.test\.|\.spec\./.test(rel)) continue;
    const text = fs.readFileSync(f, "utf8");
    if (text.includes("AULAIA_ACTIVITAT_CLAU")) res.activitat = true;
    for (const c of cridesEnviarAvis(text)) {
      res.crides++;
      for (const p of revisaCrida(c.cos).problemes) res.problemes.push(`${rel}:${c.linia} ${p}`);
    }
  }
  if (fitxerAvisos && res.crides === 0) res.problemes.push("no crida enviarAvis enlloc");
  return res;
}

const carpetes = process.argv.slice(2);
if (!carpetes.length) {
  console.log("Ús: node scripts/endoll/revisa.mjs <carpeta-app> [...]");
  process.exit(2);
}
let totesBe = true;
for (const c of carpetes) {
  if (!fs.existsSync(c)) { console.log(`✖ ${c}: la carpeta no existeix`); totesBe = false; continue; }
  const r = revisaApp(c);
  const be = r.problemes.length === 0;
  totesBe &&= be;
  console.log(`${be ? "✔" : "✖"} ${r.slug ?? path.basename(c)}  avisos: ${be ? "compleix" : "falta"} (${r.crides} crides) · alta de compte: ${r.altaCompte ? "sí" : "no"} · informe d'activitat: ${r.activitat ? "sí" : "no"}`);
  for (const p of r.problemes) console.log(`    - ${p}`);
}
process.exit(totesBe ? 0 : 1);
