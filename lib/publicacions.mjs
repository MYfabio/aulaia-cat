/**
 * Última publicació a Railway de cada app del catàleg, perquè n8n pugui
 * comprovar que cada publicació nova ha anat bé. Aquest fitxer només creua
 * dades (catàleg + Railway); la consulta la fa app/api/vigilancia/publicacions.
 * No conté cap dada personal: només noms d'app, estats i versions.
 */

/** Domini sense «www.» ni majúscules, per comparar adreces. */
export function hostDe(adreca) {
  try {
    return new URL(adreca.includes("://") ? adreca : `https://${adreca}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * cataleg: data/apps.json. projectes: getPanelData().apps (serveis amb
 * customDomains i deploy). Torna una fila per app en producció (i aulaia.cat):
 * { app, url, id, estat, creat, versio }. Si no es troba el servei, id és null.
 */
export function publicacionsDelCataleg(cataleg, projectes) {
  const perHost = new Map();
  for (const p of projectes || []) {
    for (const s of p.services || []) {
      for (const d of s.customDomains || []) {
        const h = hostDe(d.domain);
        if (h && !perHost.has(h)) perHost.set(h, s);
      }
    }
  }
  const apps = [
    { slug: "aulaia-cat", url: "https://www.aulaia.cat" },
    ...cataleg.filter(a => a.estat === "produccio" && a.url),
  ];
  return apps.map(a => {
    const dep = perHost.get(hostDe(a.url))?.deploy || null;
    return {
      app: a.slug,
      url: a.url,
      id: dep?.id || null,
      estat: dep?.status || null,
      creat: dep?.at || null,
      versio: dep?.hash && /^[0-9a-f]{7}$/.test(dep.hash) ? dep.hash : null,
    };
  });
}
