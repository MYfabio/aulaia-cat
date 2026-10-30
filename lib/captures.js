import fs from "node:fs";
import path from "node:path";

// Les captures es fan a mà (Chrome headless, 1280×800) i es desen a public/captures/<slug>.jpg.
export function capturaDe(slug) {
  return fs.existsSync(path.join(process.cwd(), "public", "captures", slug + ".jpg"))
    ? "/captures/" + slug + ".jpg"
    : null;
}

export function mapaCaptures(apps) {
  return Object.fromEntries(apps.map(a => [a.slug, capturaDe(a.slug)]).filter(([, c]) => c));
}
