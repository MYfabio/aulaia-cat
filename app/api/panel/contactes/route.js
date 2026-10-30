import { NextResponse } from "next/server";
import {
  afegirContacte, esborrarContacte, llistarContactes, registrarEventContacte, eventsDeContactes,
} from "../../../../lib/db";

/** Directori oficial de centres docents (Dades obertes de la Generalitat): curs actual. */
const DIRECTORI = "https://analisi.transparenciacatalunya.cat/resource/kvmv-ahh4.json";

/** Contactes que ja tenim comprovats a les webs dels serveis educatius. */
const LLAVOR = [
  { tipus: "crp", nom: "CRP de Sabadell (Servei Educatiu del Vallès Occidental I)", municipi: "Sabadell", comarca: "Vallès Occidental", correu: "crp-sabadell@xtec.cat" },
  { tipus: "crp", nom: "CRP de Cerdanyola (Servei Educatiu del Vallès Occidental V)", municipi: "Cerdanyola del Vallès", comarca: "Vallès Occidental", correu: "crp-cerdanyola@xtec.cat" },
  { tipus: "crp", nom: "CRP de Rubí (Servei Educatiu del Vallès Occidental III)", municipi: "Rubí", comarca: "Vallès Occidental", correu: "crp-rubi@xtec.cat" },
  { tipus: "servei", nom: "Secció de Serveis Educatius i Formació Permanent, ST d'Educació al Vallès Occidental", municipi: "Sabadell", comarca: "Vallès Occidental", correu: "sefp_vall.educacio@xtec.cat" },
];

function baseUrl(request) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const ESTATS = ["pendent", "enviat", "respost", "interessat", "baixa"];

function csv(valor) {
  return '"' + String(valor ?? "").replace(/"/g, '""') + '"';
}

/** Exportacio: respecta els filtres de la pantalla. */
export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const filtre = {
    estat: ESTATS.includes(sp.get("estat")) ? sp.get("estat") : null,
    tipus: sp.get("tipus") || null,
    comarca: sp.get("comarca") || null,
    q: sp.get("q") || null,
  };
  const files = await llistarContactes(filtre);
  const events = await eventsDeContactes(files.map(f => f.id));
  const ultim = new Map();
  for (const e of events) if (!ultim.has(e.contacte_id)) ultim.set(e.contacte_id, e);

  const cap = ["tipus", "nom", "municipi", "comarca", "correu", "estat", "ultim_moviment", "data", "nota"];
  const linies = [cap.join(",")].concat(files.map(f => {
    const e = ultim.get(f.id);
    return [f.tipus, f.nom, f.municipi, f.comarca, f.correu, f.estat, e?.tipus, e ? new Date(e.quan).toISOString().slice(0, 10) : "", e?.text].map(csv).join(",");
  }));
  return new NextResponse("﻿" + linies.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="contactes-aulaia.csv"' },
  });
}

/** Importa els centres publics del directori; si hi ha comarca, nomes aquella. */
async function importar(comarca) {
  const params = new URLSearchParams({ nom_naturalesa: "Públic", $limit: "6000" });
  if (comarca) params.set("nom_comarca", comarca);
  const res = await fetch(`${DIRECTORI}?${params}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`El directori ha respost ${res.status}`);
  const centres = await res.json();

  let nous = 0;
  for (const c of centres) {
    const correu = String(c.e_mail_centre || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correu)) continue;
    const fila = await afegirContacte({
      tipus: "centre",
      nom: c.denominaci_completa,
      municipi: c.nom_municipi,
      comarca: c.nom_comarca,
      codiCentre: c.codi_centre,
      correu,
      font: "Directori de centres docents, Dades obertes Generalitat (curs " + (c.curs || "") + ")",
    });
    if (fila) nous++;
  }
  return { llegits: centres.length, nous };
}

export async function POST(request) {
  const base = baseUrl(request);
  let f;
  try {
    f = await request.formData();
  } catch {
    return NextResponse.redirect(new URL("/panel/contactes?error=peticio", base), { status: 303 });
  }

  const tornarA = String(f.get("tornar") || "");
  const tornar = params => {
    const url = new URL("/panel/contactes", base);
    // Es conserven els filtres de la pantalla perque no es perdi el lloc.
    if (tornarA.startsWith("?")) for (const [k, v] of new URLSearchParams(tornarA)) if (!["fet", "error", "info"].includes(k)) url.searchParams.set(k, v);
    for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 303 });
  };

  const accio = String(f.get("accio") || "");
  const id = Number(f.get("id"));
  const text = String(f.get("text") || "").trim().slice(0, 500);

  try {
    if (accio === "llavor") {
      let nous = 0;
      for (const c of LLAVOR) {
        const fila = await afegirContacte({ ...c, font: "Web del servei educatiu de zona" });
        if (fila) {
          nous++;
          await registrarEventContacte(fila.id, "enviat", "Presentació d'aulaia.cat enviada des de fmarti84@xtec.cat", "enviat");
        }
      }
      return tornar({ info: `llavor-${nous}` });
    }

    if (accio === "importar") {
      const comarca = String(f.get("comarca") || "").trim();
      const r = await importar(comarca);
      return tornar({ info: `importats-${r.nous}-de-${r.llegits}` });
    }

    if (accio === "afegir") {
      const correu = String(f.get("correu") || "").trim();
      const nom = String(f.get("nom") || "").trim();
      if (!nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correu)) return tornar({ error: "dades" });
      const fila = await afegirContacte({
        tipus: String(f.get("tipus") || "altre").slice(0, 20), nom: nom.slice(0, 200),
        municipi: String(f.get("municipi") || "").trim().slice(0, 100), comarca: String(f.get("comarca") || "").trim().slice(0, 100),
        correu: correu.slice(0, 200), font: "Afegit a mà",
      });
      return tornar(fila ? { info: "afegit" } : { error: "repetit" });
    }

    if (!Number.isInteger(id)) return tornar({ error: "peticio" });

    if (accio === "esborrar") {
      await esborrarContacte(id);
      return tornar({ info: "esborrat" });
    }
    const moviments = {
      enviat: ["enviat", "Presentació enviada", "enviat"],
      resposta: ["resposta", text || "Ha respost", "respost"],
      interessat: ["nota", text || "Interessat", "interessat"],
      baixa: ["nota", text || "Demana no rebre més correus", "baixa"],
      nota: ["nota", text, null],
    };
    const m = moviments[accio];
    if (!m || (accio === "nota" && !text)) return tornar({ error: "peticio" });
    await registrarEventContacte(id, m[0], accio === "enviat" && text ? text : m[1], m[2]);
    return tornar({ fet: accio });
  } catch (e) {
    console.error("Contactes: " + e.message);
    return tornar({ error: "desar" });
  }
}
