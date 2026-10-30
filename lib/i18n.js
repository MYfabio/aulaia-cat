import apps from "../data/apps.json";
import appsEs from "../data/apps.es.json";
export { IDIOMES, TEXTOS, base } from "./textos";

// Catàleg en l'idioma demanat: els camps de text es substitueixen per la traducció si n'hi ha.
// `nivells` i `materies` originals es conserven a `_nivells` perquè els filtres treballin amb claus estables.
export function appsEn(lang) {
  if (lang !== "es") return apps.map(a => ({ ...a, _nivells: a.nivells, _materies: a.materies }));
  return apps.map(a => {
    const t = appsEs[a.slug] || {};
    return { ...a, ...t, seo: { ...a.seo, ...(t.seo || {}) }, _nivells: a.nivells, _materies: t.materies || a.materies };
  });
}
