import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { desarInformeActivitat } from "../../../lib/db";
import { llegirClaus, netejarInforme, MAX_BYTES_INFORME, VERSIO_INFORME } from "../../../lib/activitat.mjs";

/**
 * Hi escriuen els servidors de les apps: usuaris actius i tokens d IA de
 * l ultima hora, per domini de centre. Nomes xifres (docs/informe-activitat.md).
 *
 * Com /api/correu, aqui NO hi ha CORS ni s accepten peticions des del
 * navegador: qui crida es el servidor de cada app. La diferencia es que cada
 * app te la seva clau i aqui nomes se n guarda l empremta SHA-256
 * (ACTIVITAT_CLAUS): si una clau es filtra, no serveix per a les altres apps, i
 * si es filtra la variable, no serveix per enviar res.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Les empremtes ja llegides, per no tornar a interpretar el JSON a cada peticio. */
let memoriaClaus = { text: null, claus: [] };

function clausConfigurades() {
  const text = process.env.ACTIVITAT_CLAUS || "";
  if (memoriaClaus.text !== text) {
    const claus = llegirClaus(text).map(([slug, empremta]) => [slug, Buffer.from(empremta, "hex")]);
    // Es diu que alguna cosa no quadra, mai el contingut de la variable.
    if (text && claus.length === 0) console.error("Activitat: ACTIVITAT_CLAUS no te cap empremta valida");
    memoriaClaus = { text, claus };
  }
  return memoriaClaus.claus;
}

/**
 * De quina app es aquesta clau. Es comparen empremtes de mida fixa, en temps
 * constant i sense aturar-se a la primera que coincideix: el temps de resposta
 * no diu ni quantes apps hi ha ni quina s ha encertat.
 */
function appDeLaClau(clau) {
  const claus = clausConfigurades();
  if (!clau || clau.length < 32 || clau.length > 200) return null;
  const rebuda = createHash("sha256").update(clau).digest();
  let trobada = null;
  for (const [slug, esperada] of claus) {
    if (timingSafeEqual(rebuda, esperada)) trobada = slug;
  }
  return trobada;
}

/** Topall per app: un bucle en un emissor no ha d ocupar la base de dades de tothom. */
const FINESTRA_MS = 10 * 60 * 1000;
const MAXIM_PER_APP = 60;
const enviaments = new Map();

function passaElTopall(app, ara = Date.now()) {
  const recents = (enviaments.get(app) || []).filter(t => ara - t < FINESTRA_MS);
  if (recents.length >= MAXIM_PER_APP) {
    enviaments.set(app, recents);
    return false;
  }
  recents.push(ara);
  enviaments.set(app, recents);
  return true;
}

/**
 * Llegeix el cos fins al topall i prou. `request.text()` el carregaria sencer
 * a la memoria abans de poder dir que es massa gran.
 */
async function llegirCos(request, maxim) {
  const declarada = Number(request.headers.get("content-length"));
  if (Number.isFinite(declarada) && declarada > maxim) return null;
  if (!request.body) return "";
  const lector = request.body.getReader();
  const trossos = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxim) {
      await lector.cancel().catch(() => {});
      return null;
    }
    trossos.push(value);
  }
  return Buffer.concat(trossos).toString("utf8");
}

const resposta = (cos, status) => NextResponse.json(cos, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  const auth = request.headers.get("authorization") || "";
  const clau = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  // L slug surt de la clau, mai del cos: una app no pot escriure en nom d una altra.
  const app = appDeLaClau(clau);
  if (!app) return resposta({ ok: false, motiu: "no-autoritzat" }, 401);

  if (!passaElTopall(app)) {
    return NextResponse.json(
      { ok: false, motiu: "massa-peticions" },
      { status: 429, headers: { "Retry-After": String(FINESTRA_MS / 1000), "Cache-Control": "no-store" } }
    );
  }

  const text = await llegirCos(request, MAX_BYTES_INFORME).catch(() => null);
  if (text === null) return resposta({ ok: false, motiu: "massa-gran", maxim: MAX_BYTES_INFORME }, 413);

  let cos;
  try {
    cos = JSON.parse(text);
  } catch {
    return resposta({ ok: false, motiu: "json" }, 400);
  }

  const net = netejarInforme(cos, { app });
  if (!net.ok) {
    // La clau d una app amb l slug d una altra es un error de configuracio, no de format.
    return resposta(net, net.motiu === "app-no-coincideix" ? 403 : 400);
  }

  try {
    await desarInformeActivitat(app, net.informe);
  } catch (e) {
    console.error("Activitat: no s'ha pogut desar l'informe de", app + ":", e.message);
    return resposta({ ok: false, motiu: "no-desat" }, 500);
  }
  return resposta({ ok: true, app, hora: net.informe.hora, dominis: net.informe.dominis.length, agrupats: net.agrupats }, 200);
}

/** Perque una app pugui comprovar l adreça i la versio del contracte sense enviar res. */
export async function GET() {
  return resposta({ servei: "informe d'activitat d'aulaia.cat", versio: VERSIO_INFORME, maxim: MAX_BYTES_INFORME }, 200);
}
