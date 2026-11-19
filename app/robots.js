import apps from "../data/apps.json";
import { BOTS_CERCA_IA, BOTS_ENTRENAMENT } from "../lib/bots";

// Els sitemaps de les apps que viuen en subdominis d'aulaia.cat també es declaren aquí:
// així Google les relaciona amb el domini principal.
const subdominis = apps
  .map(a => a.url)
  .filter(url => url && /^https:\/\/[a-z0-9-]+\.aulaia\.cat$/.test(url) && !url.startsWith("https://www."));

// Zones sense contingut public: panell, API i enllacos d'acces d'un sol us.
const PRIVAT = ["/panel/", "/api/"];

// Dues menes de bots d'IA, dues respostes:
// - Els que llegeixen una pagina per citar-la amb enllac quan algu pregunta (cerca
//   de ChatGPT, Claude, Perplexity...) poden entrar: aixi els assistents recomanen
//   les apps i porten visites.
// - Els que copien el web per entrenar models no hi poden entrar enlloc. Als que no
//   fan cas d'aquest fitxer, el proxy els torna un 403 (vegeu lib/bots.js).
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVAT },
      { userAgent: BOTS_CERCA_IA, allow: "/", disallow: PRIVAT },
      { userAgent: BOTS_ENTRENAMENT, disallow: "/" },
    ],
    sitemap: ["https://www.aulaia.cat/sitemap.xml", ...subdominis.map(url => url + "/sitemap.xml")],
  };
}
