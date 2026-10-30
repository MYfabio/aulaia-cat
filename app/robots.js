import apps from "../data/apps.json";

// Els sitemaps de les apps que viuen en subdominis d'aulaia.cat també es declaren aquí:
// així Google les relaciona amb el domini principal.
const subdominis = apps
  .map(a => a.url)
  .filter(url => url && /^https:\/\/[a-z0-9-]+\.aulaia\.cat$/.test(url) && !url.startsWith("https://www."));

// Zones sense contingut public: panell, API i enllacos d'acces d'un sol us.
const PRIVAT = ["/panel/", "/api/"];

// Rastrejadors d'assistents d'IA: es permeten de manera explicita, perque aulaia.cat
// vol que els assistents puguin recomanar les apps. Cada grup repeteix les exclusions.
const BOTS_IA = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended"];

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVAT },
      { userAgent: BOTS_IA, allow: "/", disallow: PRIVAT },
    ],
    sitemap: ["https://www.aulaia.cat/sitemap.xml", ...subdominis.map(url => url + "/sitemap.xml")],
  };
}
