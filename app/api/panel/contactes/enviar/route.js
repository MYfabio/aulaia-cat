import { NextResponse } from "next/server";
import { nomesAdmin } from "../../../../../lib/panell-rol";
import { enviarTanda, remitentConfigurat } from "../../../../../lib/contactes-correu";

function baseUrl(request) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Enviament d'una tanda: la sessio del panell la comprova proxy.js. */
export async function POST(request) {
  // Nomes l administrador: la demostracio no desa, no envia ni exporta res.
  const rebuig = await nomesAdmin();
  if (rebuig) return rebuig;
  const base = baseUrl(request);
  const torna = params => {
    const url = new URL("/panel/contactes/enviar", base);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 303 });
  };

  let f;
  try { f = await request.formData(); } catch { return torna({ error: "peticio" }); }

  // Sense la casella marcada no s'envia res.
  if (f.get("confirmo") !== "si") return torna({ error: "confirma" });
  if (!remitentConfigurat()) return torna({ error: "remitent" });

  const assumpte = String(f.get("assumpte") || "").trim();
  const plantilla = String(f.get("plantilla") || "").trim().slice(0, 4000);
  const ids = f.getAll("id").map(Number);
  if (!assumpte || !plantilla || !ids.length) return torna({ error: "peticio" });

  try {
    const r = await enviarTanda(ids, { assumpte, plantilla });
    const ok = r.filter(x => x.ok).length;
    return torna({ fet: `${ok}-${r.length - ok}` });
  } catch (e) {
    console.error("Tanda: " + e.message);
    return torna({ error: "enviar" });
  }
}
