import { NextResponse } from "next/server";
import { canviarEstat } from "../../../../lib/db";
import { enviarCorreuValidacio } from "../../../../lib/correu";

function baseUrl(request) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Canvia l estat d una sol·licitud. La ruta esta sota /api/panel, que el
 * proxy ja protegeix amb la cookie de sessio.
 */
export async function POST(request) {
  const base = baseUrl(request);
  const tornar = params => {
    const url = new URL("/panel/altes", base);
    for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 303 });
  };

  let f;
  try {
    f = await request.formData();
  } catch {
    return tornar({ error: "peticio" });
  }

  const id = Number(f.get("id"));
  const accio = String(f.get("accio") || "");
  if (!Number.isInteger(id) || !["validar", "rebutjar"].includes(accio)) {
    return tornar({ error: "peticio" });
  }

  let fila;
  try {
    fila = await canviarEstat(id, accio === "validar" ? "validada" : "rebutjada");
  } catch (e) {
    console.error("No s ha pogut canviar l estat:", e.message);
    return tornar({ error: "desar" });
  }
  if (!fila) return tornar({ error: "nofound" });

  // El correu no ha de fer fallar la validacio: si no surt, l estat ja ha canviat.
  if (accio === "validar") {
    try {
      await enviarCorreuValidacio(fila);
    } catch (e) {
      console.error("No s ha pogut enviar el correu:", e.message);
      return tornar({ avis: "correu" });
    }
  }

  return tornar({ fet: accio });
}
