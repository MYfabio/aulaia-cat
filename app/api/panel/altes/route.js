import { NextResponse } from "next/server";
import { canviarEstat, esborrarSolicitud, llistarSolicituds } from "../../../../lib/db";
import { enviarCorreuValidacio } from "../../../../lib/correu";
import { crearUsuariAlApp, registrarProvisioning } from "../../../../lib/provisioning";

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

  // El correu i el provisioning no han de fer fallar la validacio:
  // si no surten, l estat ja ha canviat i la solicitud es a la base.
  if (accio === "validar") {
    // Intentar crear usuari a l app
    try {
      const resultProvisioning = await crearUsuariAlApp(fila);
      await registrarProvisioning(id, fila.app, resultProvisioning);
      if (!resultProvisioning.ok) {
        console.warn(
          `No s ha creat usuari a ${fila.app}: ${resultProvisioning.motiu}`
        );
      }
    } catch (e) {
      console.error("Error en provisioning:", e.message);
    }

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
