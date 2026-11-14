/**
 * Canvi dolar → euro, per ensenyar en euros el que Railway factura en dolars.
 *
 * Surt del canvi de referencia que el Banc Central Europeu publica cada dia
 * feiner: un fitxer public, sense clau, i no se li envia cap dada. Es demana
 * com a molt un cop cada dotze hores (memoria cau de Next).
 *
 * Es orientatiu: el banc que paga la targeta hi aplica el seu canvi i la seva
 * comissio. Si el BCE no respon, no s'inventa cap canvi: es torna null i el
 * panell ensenya dolars.
 *
 * Sense "server-only" perque es pugui provar amb node tot sol.
 */

const URL_BCE = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

/**
 * Llegeix el canvi del fitxer del BCE, que dona dolars per euro.
 * @returns {{eurPerUsd: number, data: string|null}|null}
 */
export function llegirTaxaBce(xml) {
  if (typeof xml !== "string") return null;
  const m = xml.match(/currency=['"]USD['"]\s+rate=['"]([0-9]+(?:\.[0-9]+)?)['"]/);
  if (!m) return null;
  const usdPerEur = Number(m[1]);
  // Fora d'aquest marge no es un canvi: es un fitxer trencat.
  if (!Number.isFinite(usdPerEur) || usdPerEur < 0.5 || usdPerEur > 2) return null;
  const data = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1] || null;
  return { eurPerUsd: 1 / usdPerEur, data };
}

/** El canvi d'avui, o null si no s'ha pogut saber. No llança mai. */
export async function canviEurUsd() {
  try {
    const res = await fetch(URL_BCE, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 43200 },
    });
    if (!res.ok) return null;
    return llegirTaxaBce(await res.text());
  } catch {
    return null;
  }
}
