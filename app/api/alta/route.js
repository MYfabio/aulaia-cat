import { NextResponse } from "next/server";
import { crearSolicitud } from "../../../lib/db";
import apps from "../../../data/apps.json";

/** URL publica real: dins del contenidor request.url apunta a localhost. */
function baseUrl(request) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function tornar(request, params) {
  const url = new URL("/alta", baseUrl(request));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request) {
  let f;
  try {
    f = await request.formData();
  } catch {
    return tornar(request, { error: "desar" });
  }

  const val = k => String(f.get(k) || "").trim();
  const dades = {
    app: val("app"),
    centre: val("centre"),
    codiCentre: val("codiCentre"),
    localitat: val("localitat"),
    contacteNom: val("contacteNom"),
    contacteRol: val("contacteRol"),
    contacteEmail: val("contacteEmail"),
    missatge: val("missatge"),
  };

  // L app ha d existir al cataleg: no acceptem valors arbitraris.
  const appValida = apps.some(a => a.slug === dades.app);
  if (!appValida || !dades.centre || !dades.contacteNom || !dades.contacteRol || !dades.contacteEmail) {
    return tornar(request, { error: "camps", ...(dades.app ? { app: dades.app } : {}) });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(dades.contacteEmail)) {
    return tornar(request, { error: "email", app: dades.app });
  }

  // Limits de longitud per no acceptar textos desmesurats.
  for (const [k, max] of Object.entries({ centre: 200, contacteNom: 160, contacteEmail: 200, missatge: 2000 })) {
    if (dades[k] && dades[k].length > max) dades[k] = dades[k].slice(0, max);
  }

  try {
    await crearSolicitud(dades);
  } catch (e) {
    console.error("No s ha pogut desar la sol·licitud:", e.message);
    return tornar(request, { error: "desar", app: dades.app });
  }

  return tornar(request, { enviat: "1" });
}
