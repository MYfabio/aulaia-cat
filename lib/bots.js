/**
 * Bots que poden llegir aulaia.cat i bots que no.
 *
 * Criteri: el web es vol trobable (Google, Bing i els assistents que citen la
 * pagina amb enllac quan algu pregunta), pero no copiable en bloc (bots que
 * descarreguen el web per entrenar models i programes que en fan una copia
 * sencera). Les previsualitzacions d'enllacos (LinkedIn, WhatsApp, Telegram,
 * Slack...) no es toquen: cap nom d'aquesta llista hi coincideix.
 *
 * Els que respecten robots.txt ja no entren gracies a app/robots.js. El proxy
 * torna un 403 als que se'l salten. No es pot fer res mes per user-agent: qui
 * vulgui copiar una pagina publica pot fer-se passar per un navegador.
 */

// Assistents que llegeixen una pagina per respondre i la citen amb enllac.
export const BOTS_CERCA_IA = [
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User", "DuckAssistBot", "MistralAI-User",
];

// Rastrejadors que recullen webs per entrenar models d'IA o per vendre'n les dades.
const RASTREJADORS_ENTRENAMENT = [
  "GPTBot", "ClaudeBot", "anthropic-ai", "CCBot", "Bytespider", "TikTokSpider",
  "meta-externalagent", "FacebookBot", "Amazonbot", "cohere-ai",
  "cohere-training-data-crawler", "Diffbot", "omgili", "omgilibot", "AI2Bot",
  "Ai2Bot-Dolma", "ImagesiftBot", "Timpibot", "VelenPublicWebCrawler", "PanguBot",
  "img2dataset", "ICC-Crawler", "Kangaroo Bot",
];

// Noms que nomes existeixen dins robots.txt: Google i Apple rastregen amb el seu
// bot de sempre (que ha de poder entrar pel cercador) i aquest nom diu si el
// contingut pot servir per entrenar la seva IA.
const NOMS_NOMES_ROBOTS = ["Google-Extended", "Applebot-Extended", "Webzio-Extended"];

// Programes que descarreguen un web sencer per tenir-ne una copia.
const COPIADORS = [
  "HTTrack", "Wget", "Scrapy", "WebCopier", "WebZIP", "Teleport Pro", "Offline Explorer",
  "SiteSnagger", "WebStripper", "WebReaper", "SiteSucker", "WebWhacker",
];

export const BOTS_ENTRENAMENT = [...RASTREJADORS_ENTRENAMENT, ...NOMS_NOMES_ROBOTS, ...COPIADORS];

const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATRO_BLOQUEJAT = new RegExp([...RASTREJADORS_ENTRENAMENT, ...COPIADORS].map(escapar).join("|"), "i");

export function esBotBloquejat(userAgent) {
  return Boolean(userAgent) && PATRO_BLOQUEJAT.test(userAgent);
}
