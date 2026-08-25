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

/**
 * Origens que poden enviar altes des del seu propi formulari.
 * Surten del cataleg: cada app amb domini propi, amb i sense www.
 * Aixi no cal mantenir dues llistes quan donem d alta una app nova.
 */
const ORIGENS = new Set(
  apps
    .filter(a => a.domini)
    .flatMap(a => [`https://${a.domini}`, `https://www.${a.domini}`])
    .concat(["https://aulaia.cat", "https://www.aulaia.cat"])
);

function capsCors(origen) {
  if (!origen || !ORIGENS.has(origen)) return {};
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(request) {
  const caps = capsCors(request.headers.get("origin"));
  // Sense capçaleres el navegador ja bloqueja la peticio: no cal donar mes pistes.
  return new NextResponse(null, { status: Object.keys(caps).length ? 204 : 403, headers: caps });
}

function tornar(request, params) {
  const url = new URL("/alta", baseUrl(request));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, { status: 303 });
}

/**
 * Els formularis de les apps ja tenen els seus noms de camp i no els volem
 * reescriure tots: acceptem els sinonims habituals en catala i castella.
 */
const ALIES = {
  app: ["app", "aplicacio", "slug"],
  centre: ["centre", "centro", "escola", "organitzacio"],
  codiCentre: ["codiCentre", "codi_centre", "codi"],
  localitat: ["localitat", "localidad", "poblacio"],
  contacteNom: ["contacteNom", "contacte_nom", "nom", "name", "nombre"],
  contacteRol: ["contacteRol", "contacte_rol", "rol", "carrec", "cargo", "profile"],
  contacteEmail: ["contacteEmail", "contacte_email", "correu", "email", "mail"],
  missatge: ["missatge", "mensaje", "message", "comentari"],
};

function llegir(get) {
  const dades = {};
  for (const [camp, noms] of Object.entries(ALIES)) {
    let v = "";
    for (const n of noms) {
      const x = get(n);
      if (x != null && String(x).trim()) { v = String(x).trim(); break; }
    }
    dades[camp] = v;
  }
  return dades;
}

const LIMITS = { centre: 200, codiCentre: 40, localitat: 120, contacteNom: 160, contacteRol: 120, contacteEmail: 200, missatge: 2000 };

/** Retorna el motiu del rebuig, o null si les dades son bones. */
function validar(dades) {
  if (!apps.some(a => a.slug === dades.app)) return "camps";
  if (!dades.centre || !dades.contacteNom || !dades.contacteRol || !dades.contacteEmail) return "camps";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(dades.contacteEmail)) return "email";
  return null;
}

function retallar(dades) {
  for (const [k, max] of Object.entries(LIMITS)) {
    if (dades[k] && dades[k].length > max) dades[k] = dades[k].slice(0, max);
  }
  return dades;
}

/** Enviament JSON des del formulari d una altra app: responem JSON, no redirecció. */
async function altaJson(request, origen) {
  const caps = { ...capsCors(origen), "Content-Type": "application/json" };
  const json = (cos, status) => new NextResponse(JSON.stringify(cos), { status, headers: caps });

  if (!capsCors(origen)["Access-Control-Allow-Origin"]) {
    return json({ ok: false, error: "origen" }, 403);
  }

  let cos;
  try {
    cos = await request.json();
  } catch {
    return json({ ok: false, error: "peticio" }, 400);
  }

  const dades = retallar(llegir(k => cos?.[k]));
  const motiu = validar(dades);
  if (motiu) return json({ ok: false, error: motiu }, 400);

  try {
    await crearSolicitud(dades);
  } catch (e) {
    console.error("No s ha pogut desar la sol·licitud:", e.message);
    return json({ ok: false, error: "desar" }, 500);
  }
  return json({ ok: true }, 201);
}

export async function POST(request) {
  const tipus = request.headers.get("content-type") || "";
  if (tipus.includes("application/json")) {
    return altaJson(request, request.headers.get("origin"));
  }

  let f;
  try {
    f = await request.formData();
  } catch {
    return tornar(request, { error: "desar" });
  }

  const dades = retallar(llegir(k => f.get(k)));
  const motiu = validar(dades);
  if (motiu) {
    return tornar(request, { error: motiu, ...(dades.app ? { app: dades.app } : {}) });
  }

  try {
    await crearSolicitud(dades);
  } catch (e) {
    console.error("No s ha pogut desar la sol·licitud:", e.message);
    return tornar(request, { error: "desar", app: dades.app });
  }

  return tornar(request, { enviat: "1" });
}
