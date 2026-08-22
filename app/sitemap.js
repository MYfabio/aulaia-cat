import apps from "../data/apps.json";

export default function sitemap() {
  const base = "https://www.aulaia.cat";
  const now = new Date().toISOString();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: base + "/contacte", lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: base + "/privacitat", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...apps.map(a => ({
      url: base + "/apps/" + a.slug,
      lastModified: now,
      changeFrequency: "monthly",
      priority: a.estat === "produccio" ? 0.9 : 0.7,
    })),
  ];
}
