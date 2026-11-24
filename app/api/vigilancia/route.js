import { NextResponse } from "next/server";
import apps from "../../../data/apps.json";
import { enviarCorreu } from "../../../lib/correu";
import { correuVigilancia, llegirAvis, signaturaValida } from "../../../lib/vigilancia.mjs";

export const dynamic = "force-dynamic";

/**
 * n8n avisa aquí quan una app cau o torna (flux «Vigilància de les apps»).
 * Només accepta missatges signats amb AULAIA_WEBHOOK_SECRET; el destinatari
 * el decideix aquest servidor, no qui crida. No hi ha cap dada personal.
 */
const nomApp = slug => (slug === "aulaia-cat" ? "aulaia.cat" : apps.find(a => a.slug === slug)?.nom || slug);

export async function POST(request) {
  const cos = await request.text();
  if (cos.length > 8000 || !signaturaValida(cos, request.headers.get("x-aulaia-signature"), process.env.AULAIA_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, motiu: "signatura" }, { status: 401 });
  }
  const r = llegirAvis(cos, apps.map(a => a.slug));
  if (!r.ok) return NextResponse.json({ ok: false, motiu: r.error }, { status: 400 });

  const per = process.env.AVIS_VIGILANCIA_EMAIL || process.env.AVIS_ALTES_EMAIL || "fabio.martinez@escolaindustrial.org";
  const { assumpte, text } = correuVigilancia(r.canvis, nomApp);
  try {
    await enviarCorreu({ to: per, subject: assumpte, text });
  } catch (e) {
    console.error("Vigilància: no s'ha pogut enviar el correu:", e.message);
    return NextResponse.json({ ok: false, motiu: "correu" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, canvis: r.canvis.length });
}
