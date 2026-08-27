import apps from "../data/apps.json";
import { llistarArticles } from "../lib/blog";

export default function sitemap() {
  const base = "https://www.aulaia.cat";
  const now = new Date().toISOString();
  const articles = llistarArticles();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: base + "/contacte", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: base + "/privacitat", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...(articles.length
      ? [{ url: base + "/blog", lastModified: now, changeFrequency: "weekly", priority: 0.8 }]
      : []),
    ...apps.map(a => ({
      url: base + "/apps/" + a.slug,
      lastModified: now,
      changeFrequency: "monthly",
      priority: a.estat === "produccio" ? 0.9 : 0.7,
    })),
    // Un article no canvia despres de publicar-lo: la data que hi posem es la seva.
    ...articles.map(a => ({
      url: base + "/blog/" + a.slug,
      lastModified: a.data ? new Date(a.data + "T00:00:00").toISOString() : now,
      changeFrequency: "yearly",
      priority: 0.7,
    })),
  ];
}
