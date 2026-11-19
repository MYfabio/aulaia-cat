import Link from "next/link";
import {
  TANDA, comarquesDeContactes, comptarContactes, properPendents, remitentConfigurat, plantillaTanda,
} from "../../../../../lib/panell-fonts";

export const metadata = {
  title: "Enviar a contactes",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MISSATGES = {
  confirma: "Marca la casella de confirmació: sense ella no s'envia res.",
  remitent: "Falta la variable RESEND_FROM_CONTACTES: no hi ha remitent configurat.",
  peticio: "Petició no vàlida o sense text.",
  enviar: "No s'ha pogut enviar. Mira els registres del servei.",
};

export default async function EnviarPage({ searchParams }) {
  const sp = await searchParams;
  const comarca = typeof sp?.comarca === "string" && sp.comarca ? sp.comarca : null;
  const tipus = typeof sp?.tipus === "string" && sp.tipus ? sp.tipus : null;

  let pendents = [], comptes = null, comarques = [], error = null;
  try {
    [pendents, comptes, comarques] = await Promise.all([
      properPendents({ comarca, tipus }), comptarContactes(), comarquesDeContactes(),
    ]);
  } catch (e) {
    error = e.message;
  }

  const remitent = await remitentConfigurat();
  const plantilla = await plantillaTanda();
  let resultat = null;
  if (typeof sp?.fet === "string") {
    const [ok, fallats] = sp.fet.split("-").map(Number);
    resultat = `Enviats: ${ok}.${fallats ? ` Han fallat: ${fallats} (segueixen pendents).` : ""}`;
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Enviar a contactes</h1>
          <p className="panel-sub">Tandes de {TANDA} correus, sempre amb la teva confirmació</p>
        </div>
        <Link href="/panel/contactes" className="btn btn-outline">Tornar als contactes</Link>
      </div>

      {resultat && <p className="panel-hint">{resultat}</p>}
      {sp?.error && <p className="alta-error">{MISSATGES[sp.error] || "Error."}</p>}
      {error && <div className="panel-error-box"><strong>No s'ha pogut llegir la base de dades</strong><p>{error}</p></div>}

      {!remitent && (
        <div className="panel-avis">
          <strong>Remitent sense configurar</strong>
          <p className="panel-hint">Cal la variable <code>RESEND_FROM_CONTACTES</code>, per exemple <code>Fabio Martínez &lt;fabio@aulaia.cat&gt;</code>. Mentre no hi sigui, el botó d'enviar no funciona.</p>
        </div>
      )}

      <form method="GET" className="alta-accions" style={{ flexWrap: "wrap" }}>
        <select name="comarca" defaultValue={comarca || ""} aria-label="Comarca">
          <option value="">Totes les comarques</option>
          {comarques.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="tipus" defaultValue={tipus || ""} aria-label="Tipus">
          <option value="">Tots els tipus</option>
          <option value="crp">CRP</option>
          <option value="servei">Servei educatiu</option>
          <option value="centre">Centre</option>
        </select>
        <button type="submit" className="btn btn-outline">Triar</button>
        {comptes && <span className="panel-hint">{comptes.pendent} pendents en total</span>}
      </form>

      {pendents.length === 0 ? (
        <div className="panel-buit"><p><strong>No queda cap contacte pendent amb aquest filtre.</strong></p></div>
      ) : (
        <form method="POST" action="/api/panel/contactes/enviar">
          <section className="panel-sec">
            <div className="panel-sec-head"><h2>Aquesta tanda ({pendents.length})</h2></div>
            <ul className="avisos">
              {pendents.map(c => (
                <li key={c.id} className="avis-fila">
                  <input type="hidden" name="id" value={c.id} />
                  <span className="avis-text"><b>{c.nom}</b> · {c.municipi || "—"}{c.comarca ? ` (${c.comarca})` : ""}</span>
                  <span className="avis-etiq">{c.correu}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-sec">
            <div className="panel-sec-head"><h2>Missatge</h2></div>
            <p className="panel-hint">Remitent: <b>{remitent || "sense configurar"}</b>. A cada contacte, <code>{"{{nom}}"}</code> es canvia pel nom del centre i s'afegeix al peu l'enllaç de baixa.</p>
            <p><input type="text" name="assumpte" defaultValue={plantilla.assumpte} required maxLength={150} aria-label="Assumpte" style={{ width: "100%" }} /></p>
            <p><textarea name="plantilla" defaultValue={plantilla.text} required rows={12} aria-label="Cos del missatge" style={{ width: "100%", fontFamily: "inherit" }} /></p>
            <label style={{ display: "flex", gap: ".6rem", alignItems: "center", margin: "1rem 0" }}>
              <input type="checkbox" name="confirmo" value="si" />
              He revisat el missatge i vull enviar-lo ara a aquests {pendents.length} contactes.
            </label>
            <button type="submit" className="btn btn-primary" disabled={!remitent}>Enviar aquests {pendents.length}</button>
          </section>
        </form>
      )}
    </div>
  );
}
