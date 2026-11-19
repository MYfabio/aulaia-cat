import { NextResponse } from "next/server";
import { registrarEventContacte } from "../../../lib/db";
import { signaturaValida } from "../../../lib/contactes-correu";

export const dynamic = "force-dynamic";

function pagina(titol, text, estat = 200) {
  const html = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titol}</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1.25rem;line-height:1.6;color:#0B2540"><h1 style="font-size:1.4rem">${titol}</h1><p>${text}</p></body></html>`;
  return new NextResponse(html, { status: estat, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Baixa d'un contacte amb l'enllac signat que va al peu del correu. */
export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const id = Number(sp.get("c"));
  if (!Number.isInteger(id) || !signaturaValida(id, sp.get("s"))) {
    return pagina("Enllaç no vàlid", "Aquest enllaç de baixa no és correcte.", 400);
  }
  try {
    await registrarEventContacte(id, "nota", "S'ha donat de baixa des de l'enllaç del correu", "baixa");
  } catch (e) {
    console.error("Baixa: " + e.message);
    return pagina("No s'ha pogut fer", "Torna-ho a provar d'aquí a una estona o respon el correu que has rebut.", 500);
  }
  return pagina("Fet", "No tornareu a rebre correus d'aulaia.cat. Gràcies.");
}
