import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { desarRevisioFonaments } from "../../../lib/db";
import { netejarRevisio } from "../../../lib/fonaments.mjs";

/**
 * Hi escriu l agent local de fonaments (scripts/fonaments/revisar.mjs).
 * No va sota /api/panel perque l agent no te la cookie del panell: s identifica
 * amb FONAMENTS_TOKEN. Sense aquesta variable (o massa curta) no entra ningu.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 512 * 1024;

function tokenValid(rebut) {
  const esperat = process.env.FONAMENTS_TOKEN;
  if (!esperat || esperat.length < 32 || !rebut) return false;
  // Comparem resums de mida fixa: temps constant i sense filtrar la llargada.
  const a = createHash("sha256").update(rebut).digest();
  const b = createHash("sha256").update(esperat).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!tokenValid(token)) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const text = await request.text();
  if (text.length > MAX_BYTES) {
    return NextResponse.json({ error: "Revisió massa gran" }, { status: 413 });
  }

  let cos;
  try {
    cos = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON no vàlid" }, { status: 400 });
  }

  const revisio = netejarRevisio(cos);
  if (!revisio) {
    return NextResponse.json({ error: "La revisió no té el format esperat" }, { status: 400 });
  }

  try {
    const fila = await desarRevisioFonaments(revisio);
    return NextResponse.json({ ok: true, id: fila.id, apps: revisio.apps.length });
  } catch (e) {
    console.error("Fonaments: no s'ha pogut desar la revisió:", e.message);
    return NextResponse.json({ error: "No s'ha pogut desar" }, { status: 500 });
  }
}
