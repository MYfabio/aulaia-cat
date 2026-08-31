import { NextResponse } from "next/server";
import { enviarTransaccional, potEnviar, TIPUS_VALIDS } from "../../../lib/correu-central";

/**
 * Servei central de correu transaccional per a les apps del cataleg.
 *
 * A diferencia de /api/alta, aqui NO hi ha CORS ni s accepten peticions des
 * del navegador: qui crida es el servidor de cada app, amb una clau
 * compartida. Un formulari public que pogues enviar correu seria un rele
 * obert, i el que hi perdriem es la reputacio del domini del qual depen
 * l acces a totes les apps.
 */

export const dynamic = "force-dynamic";

/**
 * Comparacio en temps constant. Amb `===`, el temps que triga a fallar depen
 * de quants caracters coincideixen, i aixo deixa endevinar la clau caracter
 * a caracter.
 */
function clauCorrecta(rebuda) {
  const esperada = process.env.CORREU_API_KEY || "";
  if (!esperada || typeof rebuda !== "string" || rebuda.length !== esperada.length) return false;
  let diferencia = 0;
  for (let i = 0; i < esperada.length; i++) {
    diferencia |= esperada.charCodeAt(i) ^ rebuda.charCodeAt(i);
  }
  return diferencia === 0;
}

/** Topall per adreça: un bucle en una app no ha de cremar la quota de tothom. */
const MEMORIA = new Map();
const FINESTRA_MS = 60 * 60 * 1000;
const MAXIM_PER_ADRECA = 10;

function passaEIToball(adreca) {
  const ara = Date.now();
  const previs = (MEMORIA.get(adreca) || []).filter(t => ara - t < FINESTRA_MS);
  if (previs.length >= MAXIM_PER_ADRECA) return false;
  previs.push(ara);
  MEMORIA.set(adreca, previs);
  // La memoria es d aquest proces i no creix gaire, pero convé buidar-la.
  if (MEMORIA.size > 5000) {
    for (const [k, v] of MEMORIA) if (!v.some(t => ara - t < FINESTRA_MS)) MEMORIA.delete(k);
  }
  return true;
}

export async function POST(request) {
  if (!process.env.CORREU_API_KEY) {
    return NextResponse.json({ ok: false, motiu: "servei-tancat" }, { status: 503 });
  }

  const clau = request.headers.get("x-correu-key");
  if (!clauCorrecta(clau)) {
    return NextResponse.json({ ok: false, motiu: "no-autoritzat" }, { status: 401 });
  }

  // La peticio es valida ABANS de mirar si el proveidor esta configurat: aixi
  // una app pot integrar-se i comprovar que envia be els camps encara que
  // Resend no estigui llest, en lloc de rebre sempre el mateix 503.
  const cos = await request.json().catch(() => null);
  if (!cos || typeof cos !== "object") {
    return NextResponse.json({ ok: false, motiu: "cos-invalid" }, { status: 400 });
  }

  const { tipus, per, app, dades } = cos;
  if (!TIPUS_VALIDS.includes(tipus)) {
    return NextResponse.json(
      { ok: false, motiu: "tipus-desconegut", valids: TIPUS_VALIDS },
      { status: 400 }
    );
  }

  if (typeof per !== "string" || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(per)) {
    return NextResponse.json({ ok: false, motiu: "adreca-invalida" }, { status: 400 });
  }

  if (!potEnviar()) {
    return NextResponse.json({ ok: false, motiu: "sense-configurar" }, { status: 503 });
  }

  // El topall es consumeix nomes quan la peticio ja podria enviar de debo.
  if (!passaEIToball(per.toLowerCase())) {
    return NextResponse.json({ ok: false, motiu: "massa-peticions" }, { status: 429 });
  }

  const resultat = await enviarTransaccional({ tipus, per, app, dades });
  // Un fallo del proveidor no es culpa de qui crida: 502, no 400.
  const estat = resultat.ok ? 200 : resultat.motiu === "proveidor" ? 502 : 400;
  return NextResponse.json(resultat, { status: estat });
}

/** Perque una app pugui comprovar si el servei esta llest sense enviar res. */
export async function GET() {
  return NextResponse.json({
    servei: "correu transaccional d aulaia.cat",
    llest: !!(process.env.CORREU_API_KEY && potEnviar()),
    tipus: TIPUS_VALIDS,
  });
}
