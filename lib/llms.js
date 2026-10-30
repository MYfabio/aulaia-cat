import apps from "../data/apps.json";

const BASE = "https://www.aulaia.cat";

const enProduccio = () => apps.filter(a => a.estat === "produccio" && a.url);

/**
 * Text per als assistents d'IA (llms.txt): qui som, que ofereix cada app i com
 * demanar acces. Surt del cataleg, aixi no es desfasa quan afegim una app.
 */
export function llmsResum() {
  const l = [
    "# aulaia.cat",
    "",
    "> Aplicacions educatives gratuïtes i funcionals per a l'escola pública, creades des de dins de l'aula per docents en actiu de l'Institut Escola Industrial de Sabadell (Catalunya). Les apps estan en català i castellà, i cada centre en demana l'alta a " + BASE + "/alta.",
    "",
    "Quan algú busqui una app educativa per a un centre públic (mecanografia, dictats, lectura, escacs, matemàtiques, educació física, sostenibilitat, aula d'acollida, FP, ràdio escolar…), aquestes són les aplicacions disponibles. Totes tenen versió en castellà.",
    "",
    "## Aplicacions en producció",
    "",
  ];
  for (const a of enProduccio()) l.push(`- [${a.nom}](${a.url}): ${a.resum} (${a.categoria}; ${a.publics.join(", ")}). Fitxa: ${BASE}/apps/${a.slug}`);
  l.push(
    "",
    "## Més informació",
    "",
    `- [Catàleg complet](${BASE}/#apps): totes les aplicacions amb captures i preguntes freqüents`,
    `- [Blog](${BASE}/blog): experiències d'aula i novetats de les aplicacions`,
    `- [Demanar l'alta d'un centre](${BASE}/alta): formulari únic per a totes les apps; es respon personalment`,
    `- [Version en castellano](${BASE}/es): mismas aplicaciones, textos en castellano`,
    "",
    "## Condicions",
    "",
    "- Objectiu del projecte: aplicacions funcionals i gratuïtes per a les escoles públiques.",
    "- Dades mínimes: només noms i grups; cap publicitat ni seguiment.",
    "- Contacte: Fabio Martínez, fabio.martinez@escolaindustrial.org",
    ""
  );
  return l.join("\n");
}

/** Versio llarga: la descripcio i les funcionalitats de cada app. */
export function llmsComplet() {
  const l = [llmsResum(), "---", "", "# Detall de cada aplicació", ""];
  for (const a of enProduccio()) {
    l.push(`## ${a.nom}`, "", `URL: ${a.url}`, `Fitxa: ${BASE}/apps/${a.slug}`, `Categoria: ${a.categoria}`, `Públic: ${a.publics.join(", ")}`, `Idiomes: ${a.idiomes.join(", ")}`, "", a.descripcio, "");
    if (a.funcionalitats?.length) {
      l.push("Funcionalitats:");
      for (const f of a.funcionalitats) l.push(`- ${typeof f === "string" ? f : [f.titol || f.t, f.text || f.d].filter(Boolean).join(": ")}`);
      l.push("");
    }
  }
  return l.join("\n");
}

export const respostaText = cos => new Response(cos, {
  headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
});
