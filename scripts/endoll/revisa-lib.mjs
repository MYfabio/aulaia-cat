/**
 * Regles de l'endoll comú (docs/endoll-comu.md), sense tocar disc: les fa servir
 * revisa.mjs i les seves proves.
 */
export const TIPUS_PERMESOS = ["alta.solicitud", "alta.validada", "baixa", "rol.canvi", "error"];
export const ROLS_COMUNS = ["alumne", "docent", "coordinacio", "admin", "altre"];
export const FITXERS_AVISOS = ["lib/avisos.ts", "src/lib/avisos.ts", "lib/avisos.js", "src/lib/avisos.js", "lib/avisos.mjs", "src/lib/avisos.mjs"];

/** Revisa el fitxer d'avisos: slug, i les tres funcions exportades. */
export function revisaFitxerAvisos(text, slugsCataleg) {
  const problemes = [];
  const slug = text.match(/\bapp:\s*["']([a-z0-9-]+)["']/)?.[1] ?? null;
  if (!slug) problemes.push("no s'hi troba l'slug de l'app");
  else if (!slugsCataleg.includes(slug)) problemes.push(`l'slug «${slug}» no és al catàleg`);
  for (const f of ["enviarAvis", "dominiDe", "rolComu"]) {
    if (!new RegExp(`export\\s+(async\\s+)?function\\s+${f}\\b`).test(text)) problemes.push(`falta la funció ${f}`);
  }
  return { slug, problemes };
}

/** Totes les crides enviarAvis({...}) d'un text, amb el contingut entre parèntesis. */
export function cridesEnviarAvis(text) {
  const crides = [];
  const re = /\benviarAvis\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    // Salta la definició de la funció.
    const abans = text.slice(Math.max(0, m.index - 30), m.index);
    if (/function\s*$/.test(abans)) continue;
    let nivell = 1, i = re.lastIndex;
    while (i < text.length && nivell > 0) {
      if (text[i] === "(") nivell++;
      else if (text[i] === ")") nivell--;
      i++;
    }
    const linia = text.slice(0, m.index).split("\n").length;
    crides.push({ linia, cos: text.slice(re.lastIndex, i - 1) });
  }
  return crides;
}

/** Revisa una crida: tipus permès, centre (excepte errors) i rol passat per rolComu. */
export function revisaCrida(cos) {
  const problemes = [];
  const tipus = cos.match(/\btipus:\s*["']([^"']+)["']/)?.[1] ?? null;
  if (!tipus) problemes.push("no es veu el tipus");
  else if (!TIPUS_PERMESOS.includes(tipus)) problemes.push(`tipus «${tipus}» no permès`);
  if (tipus !== "error" && /\bcentre:\s*null\b/.test(cos)) problemes.push("centre buit (ha de portar el domini)");
  if (!/\bcentre\s*[:,}]/.test(cos)) problemes.push("no porta centre");
  if (/\brol\s*[:,}]/.test(cos) && !/rolComu\s*\(/.test(cos)) problemes.push("el rol no passa per rolComu");
  if (/\b(email|correu|nom|name)\s*:/.test(cos.replace(/datos\s*:/, ""))) problemes.push("sembla que envia un nom o un correu");
  return { tipus, problemes };
}
