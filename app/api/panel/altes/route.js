import { NextResponse } from "next/server";
import { nomesAdmin } from "../../../../lib/panell-rol";
import { canviarEstat, esborrarSolicitud, llistarSolicituds } from "../../../../lib/db";
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
  // Nomes l administrador: la demostracio no desa, no envia ni exporta res.
  const rebuig = await nomesAdmin();
  if (rebuig) return rebuig;
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
  if (!Number.isInteger(id) || !["validar", "rebutjar", "esborrar"].includes(accio)) {
    return tornar({ error: "peticio" });
  }

  if (accio === "esborrar") {
    try {
      const fora = await esborrarSolicitud(id);
      if (!fora) return tornar({ error: "nofound" });
    } catch (e) {
      console.error("No s ha pogut esborrar la sol·licitud:", e.message);
      return tornar({ error: "desar" });
    }
    return tornar({ fet: "esborrar" });
  }

  let fila;
  try {
    fila = await canviarEstat(id, accio === "validar" ? "validada" : "rebutjada");
  } catch (e) {
    console.error("No s ha pogut canviar l estat:", e.message);
    return tornar({ error: "desar" });
  }
  if (!fila) return tornar({ error: "nofound" });

  // El correu no ha de fer fallar la validacio: si no surt, l estat ja ha
  // canviat i la solicitud es a la base.
  //
  // Validar NO crea cap usuari a l app. Hi havia un esborrany que ho intentava
  // (lib/provisioning.js) amb una sola clau per a totes les apps i enviant com
  // a rol el carrec que algu escriu al formulari public; s ha tret abans que
  // cap app el fes servir. L alta a cada app es fa al seu panell de superadmin
  // (docs/superadmin-alta-baja-usuarios.md) i, si arriba, pel connector signat
  // de docs/cambio-de-curso-automatizado.md.
  if (accio === "validar") {
    // Enviar email de confirmacio
    try {
      await enviarCorreuValidacio(fila);
    } catch (e) {
      console.error("No s ha pogut enviar el correu:", e.message);
      return tornar({ avis: "correu" });
    }
  }

  return tornar({ fet: accio });
}
