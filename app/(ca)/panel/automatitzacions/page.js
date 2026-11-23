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
          <p className="panel-sub">Les feines que n8n fa soles</p>
        </div>
      </div>

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
                  <td><span className={`pbadge ${ESTATS_FLUX[f.estat].cls}`}>{ESTATS_FLUX[f.estat].text}</span></td>
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
