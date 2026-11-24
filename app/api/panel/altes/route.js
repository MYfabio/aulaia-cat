import { NextResponse } from "next/server";
import { nomesAdmin } from "../../../../lib/panell-rol";
import { canviarEstat, esborrarSolicitud, query } from "../../../../lib/db";
import { enviarCorreuValidacio } from "../../../../lib/correu";
import { appAltaCompte, construirOrdreAlta, resumResultat } from "../../../../lib/alta-compte.mjs";
import { enviarOrdreAlta } from "../../../../lib/alta-compte-envio";

/**
 * Demana a l app que crei el compte del docent (via n8n) i apunta el resultat
 * a la nota de la sol·licitud. Mai llança. Retorna l estat del resum.
 */
async function demanarCompte(fila) {
  const resum = resumResultat(appAltaCompte(fila.app).nom, await enviarOrdreAlta(construirOrdreAlta(fila)));
  try {
    await query("UPDATE solicituds SET nota_interna = $2 WHERE id = $1", [fila.id, resum.nota]);
  } catch (e) {
    console.error("No s ha pogut desar la nota del compte:", e.message);
  }
  return resum.estat;
}

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
  if (!Number.isInteger(id) || !["validar", "rebutjar", "esborrar", "compte"].includes(accio)) {
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

  // Tornar a demanar el compte d una sol·licitud ja validada (el primer intent
  // ha fallat, o es va validar abans que l app sabes rebre l ordre).
  if (accio === "compte") {
    let validada;
    try {
      validada = (await query("SELECT * FROM solicituds WHERE id = $1 AND estat = 'validada'", [id]))[0];
    } catch (e) {
      console.error("No s ha pogut llegir la sol·licitud:", e.message);
      return tornar({ error: "desar" });
    }
    if (!validada || !appAltaCompte(validada.app)) return tornar({ error: "nofound" });
    return tornar({ compte: await demanarCompte(validada) });
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
  // Validar crea el compte nomes a les apps de lib/alta-compte.mjs: el panell
  // envia una ordre signada a n8n i es l app qui crea el docent i li envia el
  // correu «ja tens compte» (docs/alta-compte-automatica.md). L ordre no porta
  // cap rol: el carrec que algu escriu al formulari public no decideix res.
  // A la resta d apps, l alta es fa al seu panell de superadmin
  // (docs/superadmin-alta-baja-usuarios.md).
  if (accio === "validar" && appAltaCompte(fila.app)) {
    const compte = await demanarCompte(fila);
    // Amb el compte creat i el correu d acces enviat, el de validacio sobra:
    // el docent rep un sol correu. Si ja existia, tampoc cal dir-li res.
    if (compte === "creat" || compte === "ja-existia") return tornar({ fet: accio, compte });
    try {
      await enviarCorreuValidacio(fila);
    } catch (e) {
      console.error("No s ha pogut enviar el correu:", e.message);
      return tornar({ avis: "correu", compte });
    }
    return tornar({ fet: accio, compte });
  }

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
