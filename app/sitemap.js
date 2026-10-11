import apps from "../data/apps.json";
import { llistarArticles, traduccio } from "../lib/blog";

export default function sitemap() {
  const base = "https://www.aulaia.cat";
  const now = new Date().toISOString();
  const articles = llistarArticles("ca");
  const articlesEs = llistarArticles("es");

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1, alternates: { languages: { es: base + "/es" } } },
    { url: base + "/es", lastModified: now, changeFrequency: "weekly", priority: 0.9, alternates: { languages: { ca: base } } },
    // Pagina d entrada de setembre: es el que s enllaça als grups de docents.
    { url: base + "/primera-setmana", lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: base + "/alta", lastModified: now, changeFrequency: "monthly", priority: 0.8, alternates: { languages: { es: base + "/es/alta" } } },
    { url: base + "/es/alta", lastModified: now, changeFrequency: "monthly", priority: 0.7, alternates: { languages: { ca: base + "/alta" } } },
    { url: base + "/privacitat", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...(articles.length
      ? [{ url: base + "/blog", lastModified: now, changeFrequency: "weekly", priority: 0.8, alternates: { languages: { es: base + "/es/blog" } } }]
      : []),
    ...apps.flatMap(a => [
      {
        url: base + "/apps/" + a.slug,
        lastModified: now,
        changeFrequency: "monthly",
        priority: a.estat === "produccio" ? 0.9 : 0.7,
        alternates: { languages: { es: base + "/es/apps/" + a.slug } },
      },
      {
        url: base + "/es/apps/" + a.slug,
        lastModified: now,
        changeFrequency: "monthly",
        priority: a.estat === "produccio" ? 0.8 : 0.6,
        alternates: { languages: { ca: base + "/apps/" + a.slug } },
      },
    ]),
    // Un article no canvia despres de publicar-lo: la data que hi posem es la seva.
    ...articles.map(a => {
      const es = traduccio(a.slug, "ca");
      return {
        url: base + "/blog/" + a.slug,
        lastModified: a.data ? new Date(a.data + "T00:00:00").toISOString() : now,
        changeFrequency: "yearly",
        priority: 0.7,
        ...(es ? { alternates: { languages: { es: base + "/es/blog/" + es } } } : {}),
      };
    }),
    ...(articlesEs.length ? [{ url: base + "/es/blog", lastModified: now, changeFrequency: "weekly", priority: 0.7, alternates: { languages: { ca: base + "/blog" } } }] : []),
    ...articlesEs.map(a => ({
      url: base + "/es/blog/" + a.slug,
      lastModified: a.data ? new Date(a.data + "T00:00:00").toISOString() : now,
      changeFrequency: "yearly",
      priority: 0.6,
      ...(a.original ? { alternates: { languages: { ca: base + "/blog/" + a.original } } } : {}),
    })),
  ];
}
