"use client";

import { useState } from "react";

const MOTIU_TEXT = "Hi ha files que no es poden donar d'alta";

export function AltesLotFormulari({ apps, demo = false, connectat = false }) {
  const [app, setApp] = useState(apps[0]?.slug || "");
  const [text, setText] = useState("");
  const [previa, setPrevia] = useState(null);
  const [centre, setCentre] = useState("");
  const [error, setError] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const [resultat, setResultat] = useState(null);

  const nomApp = apps.find(a => a.slug === app)?.nom || app;

  async function veurePrevia(e) {
    e.preventDefault();
    setError(null);
    setResultat(null);
    setOcupat(true);
    try {
      const res = await fetch("/api/panel/altes-lot/vista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app, text }),
      });
      const dades = await res.json();
      if (!res.ok) {
        setPrevia(null);
        setError(dades.error || "No s'ha pogut fer la vista prèvia.");
      } else {
        setPrevia(dades);
      }
    } catch (err) {
      setError("Error de connexió: " + err.message);
    } finally {
      setOcupat(false);
    }
  }

  async function enviar() {
    if (demo) {
      alert("Això és la demostració: aquí s'enviaria el lot. No s'envia res.");
      return;
    }
    const confirma = confirm(
      `Enviar ${previa.valides} persones a ${nomApp} des de «${centre.trim()}»? Això donarà d'alta els usuaris.`
    );
    if (!confirma) return;

    setError(null);
    setOcupat(true);
    try {
      const res = await fetch("/api/panel/altes-lot/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app, text, centre }),
      });
      const dades = await res.json();
      if (!res.ok) {
        setError(dades.error || "No s'ha pogut enviar el lot.");
      } else {
        setResultat(dades);
        setPrevia(null);
        setText("");
        setCentre("");
      }
    } catch (err) {
      setError("Error de connexió: " + err.message);
    } finally {
      setOcupat(false);
    }
  }

  const potEnviar = Boolean(previa && previa.valides > 0 && centre.trim() && !ocupat);

  return (
    <div>
      {resultat && (
        <div className="panel-avis">
          <strong>Lot enviat</strong>
          <p>
            Identificador del lot: <code>{resultat.id_lot}</code>. Enviades: {resultat.enviades}.
            {resultat.descartades > 0 && ` Descartades abans d'enviar: ${resultat.descartades}.`}
          </p>
          {resultat.resultat && (
            <p>
              Resposta de l'app: {resultat.resultat.altes ?? 0} d'alta,
              {" "}{resultat.resultat.ja_existents ?? 0} ja existents.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="panel-error-box">
          <strong>No s'ha pogut fer</strong>
          <p>{error}</p>
        </div>
      )}

      <section className="panel-sec">
        <h2>1. Llista d'usuaris</h2>
        <form onSubmit={veurePrevia}>
          <p>
            <label>
              App{" "}
              <select value={app} onChange={e => { setApp(e.target.value); setPrevia(null); }}>
                {apps.map(a => <option key={a.slug} value={a.slug}>{a.nom}</option>)}
              </select>
            </label>
          </p>
          <p>
            Rols possibles: {apps.find(a => a.slug === app)?.rols.join(", ")}. Domini: @{apps.find(a => a.slug === app)?.domini}.
          </p>
          <p>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setPrevia(null); }}
              rows={12}
              aria-label="Llista d'usuaris"
              placeholder={"nom;correu;rol;grup\nAina Puig;aina.puig@escolaindustrial.org;alumne;1r ESO A"}
              style={{ width: "100%", fontFamily: "monospace" }}
              required
            />
          </p>
          <button type="submit" className="btn btn-outline" disabled={ocupat || !text.trim()}>
            Veure vista prèvia
          </button>
        </form>
      </section>

      {previa && (
        <section className="panel-sec">
          <h2>2. Vista prèvia</h2>
          <div className="panel-stats">
            <div className="pstat"><span className="pstat-n">{previa.total}</span><span className="pstat-k">Files</span></div>
            <div className="pstat"><span className="pstat-n">{previa.valides}</span><span className="pstat-k">Bones</span></div>
            <div className="pstat"><span className="pstat-n">{previa.errors.length}</span><span className="pstat-k">Amb errors</span></div>
          </div>
          {Object.keys(previa.perRol).length > 0 && (
            <p>Per rol: {Object.entries(previa.perRol).map(([r, n]) => `${r} ${n}`).join(", ")}.</p>
          )}
          {previa.errors.length > 0 && (
            <>
              <p><strong>{MOTIU_TEXT}:</strong> només les bones s'enviaran.</p>
              <ul>
                {previa.errors.map(e => <li key={e.fila}>Fila {e.fila}: {e.motiu}</li>)}
              </ul>
            </>
          )}

          <h2>3. Confirmació</h2>
          <p>Per enviar, escriu el nom del centre. Així queda constància de per a quin centre és el lot.</p>
          <p>
            <label>
              Nom del centre{" "}
              <input type="text" value={centre} onChange={e => setCentre(e.target.value)} maxLength={120} />
            </label>
          </p>
          <button type="button" className="btn btn-primary" disabled={!potEnviar || !connectat} onClick={enviar}>
            Enviar {previa.valides} a {nomApp}
          </button>
          {!connectat && <p className="panel-nota">Encara no està connectat: no es pot enviar.</p>}
        </section>
      )}
    </div>
  );
}
