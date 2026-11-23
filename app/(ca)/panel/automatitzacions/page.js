import { FLUXOS, ESTATS_FLUX } from "../../../../lib/automatitzacions.mjs";

export const metadata = {
  title: "Automatitzacions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AutomatitzacionsPage() {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Automatitzacions</h1>
          <p className="panel-sub">Els fluxos d'n8n que fa servir aulaia.cat</p>
        </div>
      </div>

      <p className="panel-nota">
        Aquesta llista es revisa a mà. No llegeix l'estat en directe d'n8n. Només es veu aquí; no es pot canviar des d'aquí.
      </p>

      <section className="panel-sec">
        <div className="scrollx">
          <table className="ptable">
            <thead>
              <tr>
                <th scope="col">Flux</th>
                <th scope="col">Què fa</th>
                <th scope="col">Estat</th>
                <th scope="col">Nota</th>
              </tr>
            </thead>
            <tbody>
              {FLUXOS.map(f => (
                <tr key={f.clau}>
                  <td>{f.pagina ? <a href={f.pagina}>{f.nom}</a> : f.nom}</td>
                  <td>{f.funcio}</td>
                  <td><span className={`badge ${ESTATS_FLUX[f.estat].cls}`}>{ESTATS_FLUX[f.estat].text}</span></td>
                  <td>{f.motiu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
