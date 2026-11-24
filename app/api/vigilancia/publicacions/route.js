import { NextResponse } from "next/server";
import apps from "../../../../data/apps.json";
import { getPanelData } from "../../../../lib/railway";
import { publicacionsDelCataleg } from "../../../../lib/publicacions.mjs";
import { dataRecent, signaturaValida } from "../../../../lib/vigilancia.mjs";

export const dynamic = "force-dynamic";

/**
 * n8n pregunta aquí, cada 5 minuts, quina és l'última publicació de cada app a
 * Railway (flux «Comprovació de publicacions»). Només respon a missatges
 * signats amb AULAIA_WEBHOOK_SECRET i recents: { "data": "<ISO>" }.
 * Torna només noms d'app, estats i versions: res de secrets ni dades personals.
 */
export async function POST(request) {
  const cos = await request.text();
  if (cos.length > 1000 || !signaturaValida(cos, request.headers.get("x-aulaia-signature"), process.env.AULAIA_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, motiu: "signatura" }, { status: 401 });
  }
  let data;
  try { data = JSON.parse(cos)?.data; } catch { data = null; }
  if (!dataRecent(data)) return NextResponse.json({ ok: false, motiu: "data" }, { status: 400 });

  try {
    const { apps: projectes } = await getPanelData();
    return NextResponse.json({ ok: true, apps: publicacionsDelCataleg(apps, projectes) });
  } catch (e) {
    console.error("Publicacions: no s'ha pogut llegir Railway:", e.message);
    return NextResponse.json({ ok: false, motiu: "railway" }, { status: 502 });
  }
}
