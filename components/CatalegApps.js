"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TEXTOS, base } from "../lib/textos";

const NIVELLS = ["Primària", "ESO", "Batxillerat", "FP", "Centre"];

const SECCIONS = [
  { id: "apps", estats: ["produccio"] },
  { id: "en-construccio", estats: ["construccio", "desenvolupament"] },
  { id: "en-preparacio", estats: ["presentacio"] },
];

export function Fitxa({ app, captura, lang = "ca" }) {
  const t = TEXTOS[lang].cataleg;
  return (
    <Link href={base(lang) + "/apps/" + app.slug} className="app-fitxa">
      <span className="app-fitxa-imatge">
        <span className="app-fitxa-icona" aria-hidden="true">{app.icona}</span>
        {captura && <img src={captura} alt={t.captura + app.nom} loading="lazy" width="800" height="500" />}
      </span>
      <span className="app-fitxa-cos">
        <span className="app-fitxa-cat">{app.categoria}</span>
        <span className="app-fitxa-nom">{app.nom}</span>
        <span className="app-fitxa-resum">{app.resum}</span>
        <span className="app-fitxa-nivells">
          {(app._nivells || app.nivells || []).map(n => <span key={n}>{t.nivells[n] || n}</span>)}
        </span>
        <span className="app-fitxa-peu">
          <span className="app-fitxa-domini">{app.domini || ""}</span>
          <span className={"proj-state" + (app.estat === "produccio" ? " is-live" : "")}>
            {t.estats[app.estat] || t.estatDefecte}
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function CatalegApps({ apps, captures, lang = "ca" }) {
  const t = TEXTOS[lang].cataleg;
  const [nivell, setNivell] = useState("");
  const [materia, setMateria] = useState("");

  const materies = useMemo(
    () => [...new Set(apps.flatMap(a => a.materies || []))].sort((a, b) => a.localeCompare(b, lang)),
    [apps, lang]
  );

  const visibles = apps.filter(a =>
    (!nivell || (a._nivells || a.nivells || []).includes(nivell)) &&
    (!materia || (a.materies || []).includes(materia))
  );

  return (
    <div className="cataleg-fons">
      <div className="cataleg-filtres section">
        <div className="cataleg-nivells" role="group" aria-label={t.etapa}>
          {["", ...NIVELLS].map(n => (
            <button key={n || "tots"} type="button" aria-pressed={nivell === n} onClick={() => setNivell(n)}>
              {n ? t.nivells[n] : t.totes}
            </button>
          ))}
        </div>
        <label className="cataleg-materia">
          <span>{t.materia}</span>
          <select value={materia} onChange={e => setMateria(e.target.value)}>
            <option value="">{t.totesM}</option>
            {materies.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      {visibles.length === 0 && (
        <section className="section"><p className="cataleg-buit">{t.buit}</p></section>
      )}

      {SECCIONS.map((s, i) => {
        const llista = visibles.filter(a => s.estats.includes(a.estat));
        if (llista.length === 0) return null;
        const [titol, text] = t.seccions[s.id];
        return (
          <section key={s.id} className="section" id={s.id} style={i > 0 ? { paddingTop: 0 } : undefined}>
            <div className="section-header">
              <h2>{titol}</h2>
              <p>{text}</p>
            </div>
            <div className="app-graella">
              {llista.map(app => <Fitxa key={app.slug} app={app} captura={captures[app.slug]} lang={lang} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
