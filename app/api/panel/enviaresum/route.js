import { NextResponse } from "next/server";
import { llistarSolicituds } from "../../../../lib/db";
import { enviarCorreu } from "../../../../lib/correu";
import apps from "../../../../data/apps.json";

const nomApp = slug => apps.find(a => a.slug === slug)?.nom || slug;

export async function POST(request) {
  // Protecció: només accept peticions del propi panel
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 403 });
  }

  try {
    const solicituds = await llistarSolicituds("pendent");

    if (solicituds.length === 0) {
      return NextResponse.json({
        ok: true,
        missatge: "No hi ha sol·licituds pendents per enviar"
      });
    }

    // Formatar el resum
    const linies = [
      `RESUM DE ${solicituds.length} SOL·LICITUDS PENDENTS`,
      `Generat: ${new Date().toLocaleString("ca-ES")}`,
      "",
      ...solicituds.map(s =>
        `• ${s.centre} (${nomApp(s.app)})\n  ${s.contacte_nom} · ${s.contacte_email}\n  ${s.localitat || ""}${s.codi_centre ? ` · Codi ${s.codi_centre}` : ""}`
      ),
      "",
      "Valida-les des de: aulaia.cat/panel/altes"
    ];

    const text = linies.join("\n");

    // Enviar
    await enviarCorreu({
      to: "fabio.martinez@escolaindustrial.org",
      subject: `Resum: ${solicituds.length} sol·licituds noves a validar`,
      text
    });

    return NextResponse.json({
      ok: true,
      missatge: `Resum enviat a fabio.martinez@escolaindustrial.org (${solicituds.length} sol·licituds)`
    });
  } catch (e) {
    console.error("Error envirant resum:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
