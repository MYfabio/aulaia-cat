import { NextResponse } from "next/server";
import { validarLot, appAltesLot, MAX_USUARIS_LOT } from "../../../../../lib/altes-lot.mjs";

/**
 * Vista prèvia d'un lot: no desa ni envia res, només comprova el text i torna
 * recomptes i errors per fila. No torna noms ni correus. La demostració també
 * la pot fer, perquè no toca dades reals.
 */
export async function POST(request) {
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

  try {
    const lot = validarLot(typeof cos.text === "string" ? cos.text : "", slug);
    return NextResponse.json({
      total: lot.total,
      valides: lot.valides.length,
      errors: lot.errors,
      perRol: lot.perRol,
      maxim: MAX_USUARIS_LOT,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
