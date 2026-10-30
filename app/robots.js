import apps from "../data/apps.json";

// Els sitemaps de les apps que viuen en subdominis d'aulaia.cat també es declaren aquí:
// així Google les relaciona amb el domini principal.
const subdominis = apps
  .map(a => a.url)
  .filter(url => url && /^https:\/\/[a-z0-9-]+\.aulaia\.cat$/.test(url) && !url.startsWith("https://www."));

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: ["https://www.aulaia.cat/sitemap.xml", ...subdominis.map(url => url + "/sitemap.xml")],
  };
}
