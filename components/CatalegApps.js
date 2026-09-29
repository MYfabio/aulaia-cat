"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const NIVELLS = ["Primària", "ESO", "Batxillerat", "FP", "Centre"];

const ESTATS = {
  produccio: "En línia",
  construccio: "En construcció",
  desenvolupament: "Properament",
  presentacio: "En presentació",
};

const SECCIONS = [
  { id: "apps", titol: "Projectes en línia", text: "Cadascun té el seu domini propi i funciona de manera independent.", estats: ["produccio"] },
  { id: "en-construccio", titol: "En construcció", text: "Projectes amb l'abast ja definit que estem desenvolupant ara mateix.", estats: ["construccio", "desenvolupament"] },
  { id: "en-preparacio", titol: "En preparació", text: "Els estem presentant als centres. Encara no tenen web pública.", estats: ["presentacio"] },
];

function Fitxa({ app, captura }) {
  return (
    <Link href={"/apps/" + app.slug} className="app-fitxa">
      <span className="app-fitxa-imatge">
        {captura
          ? <img src={captura} alt={"Pàgina d'inici de " + app.nom} loading="lazy" width="800" height="500" />
          : <span className="app-fitxa-icona" aria-hidden="true">{app.icona}</span>}
      </span>
      <span className="app-fitxa-cos">
        <span className="app-fitxa-cat">{app.categoria}</span>
        <span className="app-fitxa-nom">{app.nom}</span>
        <span className="app-fitxa-resum">{app.resum}</span>
        <span className="app-fitxa-nivells">
          {(app.nivells || []).map(n => <span key={n}>{n}</span>)}
        </span>
        <span className="app-fitxa-peu">
          <span className="app-fitxa-domini">{app.domini || ""}</span>
          <span className={"proj-state" + (app.estat === "produccio" ? " is-live" : "")}>
            {ESTATS[app.estat] || "En preparació"}
          </span>
        </span>
      </span>
    </Link>
  );
}

export default function CatalegApps({ apps, captures }) {
  const [nivell, setNivell] = useState("");
  const [materia, setMateria] = useState("");

  const materies = useMemo(
    () => [...new Set(apps.flatMap(a => a.materies || []))].sort((a, b) => a.localeCompare(b, "ca")),
    [apps]
  );

  const visibles = apps.filter(a =>
    (!nivell || (a.nivells || []).includes(nivell)) &&
    (!materia || (a.materies || []).includes(materia))
  );

  return (
    <>
      <div className="cataleg-filtres section">
        <div className="cataleg-nivells" role="group" aria-label="Filtra per etapa">
          {["", ...NIVELLS].map(n => (
            <button key={n || "tots"} type="button" aria-pressed={nivell === n} onClick={() => setNivell(n)}>
              {n || "Totes les etapes"}
            </button>
          ))}
        </div>
        <label className="cataleg-materia">
          <span>Matèria</span>
          <select value={materia} onChange={e => setMateria(e.target.value)}>
            <option value="">Totes</option>
            {materies.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      {visibles.length === 0 && (
        <section className="section"><p className="cataleg-buit">Cap projecte amb aquest filtre.</p></section>
      )}

      {SECCIONS.map((s, i) => {
        const llista = visibles.filter(a => s.estats.includes(a.estat));
        if (llista.length === 0) return null;
        return (
          <section key={s.id} className="section" id={s.id} style={i > 0 ? { paddingTop: 0 } : undefined}>
            <div className="section-header">
              <h2>{s.titol}</h2>
              <p>{s.text}</p>
            </div>
            <div className="app-graella">
              {llista.map(app => <Fitxa key={app.slug} app={app} captura={captures[app.slug]} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
