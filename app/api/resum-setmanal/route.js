import { NextResponse } from "next/server";
import apps from "../../../data/apps.json";
import { llegirEsdevenimentsEntre } from "../../../lib/avisos-estat";
import { comptarPerEstat, llegirActivitat, solicitudsEntre } from "../../../lib/db";
import { getPanelData } from "../../../lib/railway";
import { getCostAnthropic, teClauAdmin } from "../../../lib/anthropic-admin";
import { enviarCorreu } from "../../../lib/correu";
import { dataRecent, signaturaValida } from "../../../lib/vigilancia.mjs";
import { caigudes, construirCorreu, costIaPerApp, errors, persones, publicacions, setmanaAnterior } from "../../../lib/resum-setmanal.mjs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const nomApp = slug => (slug === "aulaia-cat" ? "aulaia.cat" : apps.find(a => a.slug === slug)?.nom || slug);

/**
 * n8n crida aquí cada dilluns a les 8:00 (flux «Resum setmanal»), signat amb
 * AULAIA_WEBHOOK_SECRET i recent: { "data": "<ISO>" }. Llegeix la setmana
 * anterior, en fa el correu i l'envia al propietari. Si una font falla, el
 * correu surt igualment i diu què no s'ha pogut llegir.
 */
export async function POST(request) {
  const cos = await request.text();
  if (cos.length > 1000 || !signaturaValida(cos, request.headers.get("x-aulaia-signature"), process.env.AULAIA_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false, motiu: "signatura" }, { status: 401 });
  }
  let data;
  try { data = JSON.parse(cos)?.data; } catch { data = null; }
  if (!dataRecent(data)) return NextResponse.json({ ok: false, motiu: "data" }, { status: 400 });

  const setmana = setmanaAnterior(new Date());
  const noDisponible = [];
  const intenta = async (nom, fn) => {
    try { return await fn(); } catch (e) {
      console.error(`Resum setmanal: ${nom} no disponible:`, e.message);
      noDisponible.push(nom);
      return null;
    }
  };

  const [avisos, noves, estats, activitat, panell, anthropic] = await Promise.all([
    intenta("avisos", async () => {
      const r = await llegirEsdevenimentsEntre(setmana.inici, setmana.fi);
      if (r === null) throw new Error("sense ESTAT_DATABASE_URL");
      return r;
    }),
    intenta("sol·licituds", () => solicitudsEntre(setmana.inici, setmana.fi)),
    intenta("sol·licituds pendents", () => comptarPerEstat()),
    intenta("activitat", () => llegirActivitat({ desDeDia: setmana.dies[0], mesDesDe: setmana.dies[0], horesDesDe: setmana.inici })),
    intenta("Railway", () => getPanelData({ ambCost: true })),
    teClauAdmin() ? intenta("Anthropic", () => getCostAnthropic()) : Promise.resolve(null),
  ]);

  const files = avisos ?? [];
  const dies = new Set(setmana.dies);
  const dades = {
    setmana,
    caigudes: caigudes(files, setmana),
    publicacions: publicacions(files),
    errors: errors(files),
    persones: persones(files),
    solicituds: { noves: noves ?? [], pendents: estats ? estats.pendent : null },
    cost: {
      railway: panell?.cost ? { actual: panell.cost.actual, previst: panell.cost.previst } : null,
      anthropic: anthropic ? anthropic.perDia.filter(d => dies.has(d.dia)).reduce((n, d) => n + d.usd, 0) : null,
      perApp: costIaPerApp(activitat?.tokens ?? [], setmana.dies),
    },
    noDisponible,
  };

  const per = process.env.AVIS_VIGILANCIA_EMAIL || process.env.AVIS_ALTES_EMAIL || "fabio.martinez@escolaindustrial.org";
  const { assumpte, text } = construirCorreu(dades, nomApp, { limitRailway: Number(process.env.LIMIT_RAILWAY_USD) || 15 });
  try {
    await enviarCorreu({ to: per, subject: assumpte, text });
  } catch (e) {
    console.error("Resum setmanal: no s'ha pogut enviar el correu:", e.message);
    return NextResponse.json({ ok: false, motiu: "correu" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, setmana: setmana.dies[0], noDisponible });
}
