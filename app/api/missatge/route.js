import { NextResponse } from "next/server";
import { crearMissatge, contarMissatgesPerEmail } from "../../../lib/db";
import apps from "../../../data/apps.json";
import { enviarTransaccional } from "../../../lib/correu-central";
import { validarRateLimit, extraerIp, validarEmailReal } from "../../../lib/rate-limit";
import { motiuSpam } from "../../../lib/anti-spam";

/**
 * Missatges de l assistent: dubtes, incidencies i col·laboracions. Les altes de
 * centre NO passen per aqui: l assistent porta a /alta, que es el tramit.
 *
 * Nomes es crida des del propi web (mateix origen), per aixo no hi ha CORS.
 * Tota la validacio es aqui: el client nomes guia.
 */

export const dynamic = "force-dynamic";

const TIPUS = ["dubte", "incidencia", "collaboracio"];
const PERFILS = ["docent", "direccio", "altre"];
const VIES = ["buscador", "recomanacio", "xarxes", "blog", "altre"];
const SLUGS = new Set(apps.map(a => a.slug));

const LIMITS = { nom: 160, centre: 200, correu: 200, text: 2000 };
const MAXIM_APPS = 12;
const MAXIM_CORREUS_HORA = 3;
const MIDA_MAXIMA_COS = 20000;

const json = (cos, status) => NextResponse.json(cos, { status });

/** Retorna les dades netes, o el codi d error si no son valides. */
function validar(cos) {
  const text = v => (typeof v === "string" ? v.trim() : "");

  const tipus = text(cos.tipus);
  if (!TIPUS.includes(tipus)) return { error: "camps" };

  // Un valor desconegut de perfil o via es descarta, no fa fallar el missatge.
  const perfil = PERFILS.includes(text(cos.perfil)) ? text(cos.perfil) : "";
  const via = VIES.includes(text(cos.via)) ? text(cos.via) : "";

  const llistaApps = Array.isArray(cos.apps) ? cos.apps : [];
  const appsTriades = [...new Set(llistaApps.filter(s => typeof s === "string" && SLUGS.has(s)))].slice(0, MAXIM_APPS);

  const nom = text(cos.nom).slice(0, LIMITS.nom);
  const centre = text(cos.centre).slice(0, LIMITS.centre);
  const correu = text(cos.correu).slice(0, LIMITS.correu);
  const missatge = text(cos.text).slice(0, LIMITS.text);

  if (!nom || !missatge) return { error: "camps" };
  if (tipus === "incidencia" && appsTriades.length === 0) return { error: "camps" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(correu)) return { error: "email" };
  if (cos.consentiment !== true) return { error: "consentiment" };

  return {
    dades: {
      tipus, perfil, via, apps: appsTriades, nom, centre, correu, text: missatge,
      idioma: cos.idioma === "es" ? "es" : "ca",
    },
  };
}

export async function POST(request) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return json({ ok: false, error: "peticio" }, 400);
  }
  if (Number(request.headers.get("content-length")) > MIDA_MAXIMA_COS) {
    return json({ ok: false, error: "peticio" }, 413);
  }

  const cos = await request.json().catch(() => null);
  if (!cos || typeof cos !== "object" || Array.isArray(cos)) {
    return json({ ok: false, error: "peticio" }, 400);
  }

  // Spam: es descarta sense desar ni avisar i es respon com si fos bo, perque
  // un bot que veu un error en prova una altra variant. Va abans de validar.
  const spam = motiuSpam(
    { centre: cos.centre, contacteNom: cos.nom, contacteEmail: cos.correu, missatge: cos.text },
    { honeypot: cos.web }
  );
  if (spam) {
    console.warn("Missatge descartat per spam: " + spam);
    return json({ ok: true }, 201);
  }

  const { dades, error } = validar(cos);
  if (error) return json({ ok: false, error }, 400);

  if (!validarEmailReal(dades.correu)) return json({ ok: false, error: "email" }, 400);

  try {
    const ip = extraerIp(request);
    const limit = await validarRateLimit(ip, dades.correu);
    // Els missatges tenen el seu propi topall per adreça: el de validarRateLimit
    // compta altes, no missatges.
    const perCorreu = await contarMissatgesPerEmail(dades.correu);
    if (!limit.errors.includes("ip-limit") && perCorreu < MAXIM_CORREUS_HORA) {
      await crearMissatge(dades);
    } else {
      console.warn(`Limit de missatges superat (IP ${ip})`);
      return json({ ok: false, error: "limit" }, 429);
    }
  } catch (e) {
    console.error("No s ha pogut desar el missatge:", e.message);
    return json({ ok: false, error: "desar" }, 500);
  }

  await avisar(dades);
  return json({ ok: true }, 201);
}

/**
 * Despres de desar i sense poder tombar el missatge: si el correu falla, ja es
 * a la base i es veu a /panel/missatges. Dos correus: l avis intern i
 * l acusament de rebuda, que a mes diu que les apps son gratuites i en prova.
 */
async function avisar(dades) {
  const intern = process.env.AVIS_ALTES_EMAIL || "fabio.martinez@escolaindustrial.org";
  const comunes = {
    nom: dades.nom, centre: dades.centre, correu: dades.correu, idioma: dades.idioma,
    motiu: dades.tipus, perfil: dades.perfil, via: dades.via, apps: dades.apps, text: dades.text,
  };

  const resultats = await Promise.allSettled([
    enviarTransaccional({ tipus: "missatge-rebut", per: dades.correu, dades: comunes }),
    enviarTransaccional({ tipus: "missatge-avis-intern", per: intern, dades: comunes }),
  ]);

  for (const r of resultats) {
    if (r.status === "rejected") console.error("Avis de missatge: " + r.reason?.message);
    else if (!r.value?.ok) console.error("Avis de missatge no enviat: " + r.value?.motiu);
  }
}
