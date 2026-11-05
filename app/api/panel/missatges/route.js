import { NextResponse } from "next/server";
import { canviarEstatMissatge, esborrarMissatge } from "../../../../lib/db";

const ESTATS = ["pendent", "respost", "arxivat"];
const TIPUS = ["dubte", "incidencia", "collaboracio"];
const ACCIONS = { pendent: "pendent", respost: "respost", arxivar: "arxivat" };

function baseUrl(request) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Canvia l estat d un missatge o l esborra. La ruta esta sota /api/panel, que
 * el proxy ja protegeix amb la cookie de sessio.
 */
export async function POST(request) {
  const base = baseUrl(request);
  let f;
  try {
    f = await request.formData();
  } catch {
    f = null;
  }

  // Els filtres es tornen a validar abans de posar-los a la URL: aixi la
  // redireccio no pot dur res que no sigui una llista tancada.
  const filtres = {};
  const estatFiltre = String(f?.get("fEstat") || "");
  const tipusFiltre = String(f?.get("fTipus") || "");
  if (ESTATS.includes(estatFiltre)) filtres.estat = estatFiltre;
  if (TIPUS.includes(tipusFiltre)) filtres.tipus = tipusFiltre;

  const tornar = params => {
    const url = new URL("/panel/missatges", base);
    for (const [k, v] of Object.entries({ ...filtres, ...params })) url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 303 });
  };

  if (!f) return tornar({ error: "peticio" });

  const id = Number(f.get("id"));
  const accio = String(f.get("accio") || "");
  if (!Number.isInteger(id) || id <= 0 || !(accio in ACCIONS || accio === "esborrar")) {
    return tornar({ error: "peticio" });
  }

  try {
    const fet = accio === "esborrar" ? await esborrarMissatge(id) : await canviarEstatMissatge(id, ACCIONS[accio]);
    if (!fet) return tornar({ error: "nofound" });
  } catch (e) {
    console.error("No s ha pogut actualitzar el missatge:", e.message);
    return tornar({ error: "desar" });
  }
  return tornar({ fet: accio });
}
