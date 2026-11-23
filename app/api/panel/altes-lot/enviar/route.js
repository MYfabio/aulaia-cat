import { NextResponse } from "next/server";
import { nomesAdmin } from "../../../../../lib/panell-rol";
import {
  validarLot,
  appAltesLot,
  centreValid,
  construirOrdre,
  nouIdLot,
} from "../../../../../lib/altes-lot.mjs";
import { enviarOrdre } from "../../../../../lib/altes-lot-envio";

/**
 * Envia un lot d'altes a n8n, que el passa a l'app. Només l'administrador.
 * El lot es torna a validar aquí: no es confia en la vista prèvia del navegador.
 */
export async function POST(request) {
  const rebuig = await nomesAdmin();
  if (rebuig) return rebuig;

  let cos;
  try {
    cos = await request.json();
  } catch {
    return NextResponse.json({ error: "Petició no vàlida." }, { status: 400 });
  }

  const slug = typeof cos?.app === "string" ? cos.app : "";
  if (!appAltesLot(slug)) {
    return NextResponse.json({ error: "Aquesta app no admet altes en lot." }, { status: 400 });
  }

  const centre = centreValid(cos.centre);
  if (!centre) {
    return NextResponse.json({ error: "Cal escriure el nom del centre per confirmar." }, { status: 400 });
  }

  let lot;
  try {
    lot = validarLot(typeof cos.text === "string" ? cos.text : "", slug);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  if (lot.valides.length === 0) {
    return NextResponse.json({ error: "No hi ha cap fila correcta per enviar." }, { status: 400 });
  }

  const idLot = nouIdLot();
  const enviat = await enviarOrdre(construirOrdre({ slug, idLot, centre, usuaris: lot.valides }));
  if (!enviat.ok) {
    return NextResponse.json({ error: enviat.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    id_lot: idLot,
    enviades: lot.valides.length,
    descartades: lot.errors.length,
    resultat: enviat.resultat ?? null,
  });
}
