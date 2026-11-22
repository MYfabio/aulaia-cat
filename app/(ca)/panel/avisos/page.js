import { llegirAvisos } from "../../../../lib/panell-fonts";
import { GRUPS } from "../../../../lib/avisos.mjs";

export const metadata = {
  title: "Avisos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ZONA = "Europe/Madrid";

function fmtDataHora(iso) {
  return new Date(iso).toLocaleString("ca-ES", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ZONA,
  });
}

export default async function AvisosPage() {
  let dades = null;
  let error = null;
  try {
    dades = await llegirAvisos({ limit: 200 });
  } catch (e) {
    error = e.message;
  }

  if (error || !dades) {
    return (
      <div className="panel">
        <h1>Avisos</h1>
        <div className="panel-error-box">
          <strong>No s'han pogut llegir els avisos</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Avisos</h1>
          <p className="panel-sub">Altes de centres, canvis de rol i errors que envien les apps via n8n</p>
        </div>
        <div className="panel-accions">
          <a href="/panel/avisos" className="btn btn-outline">Actualitzar</a>
        </div>
      </div>

      <p className="panel-nota">
        Aquesta pàgina només llegeix. No envia cap correu ni canvia res. Els avisos no mostren el contingut
        de les dades personals.
      </p>

      {!dades.disponible && (
        <div className="panel-avis">
          <strong>Encara no hi ha connexió amb la base de dades d'estat</strong>
          <ul>
            <li>Cal la variable <code>ESTAT_DATABASE_URL</code> al servei d'aulaia.cat perquè es vegin els avisos.</li>
          </ul>
        </div>
      )}

      <div className="panel-stats">
        <div className="pstat">
          <span className="pstat-n">{dades.total}</span>
          <span className="pstat-k">Avisos recents</span>
        </div>
        {GRUPS.map(g => (
          <div className="pstat" key={g.clau}>
            <span className="pstat-n">{dades.perGrup[g.clau] ?? 0}</span>
            <span className="pstat-k">{g.titol}</span>
          </div>
        ))}
      </div>

      {dades.total === 0 ? (
        <div className="panel-buit">
          <p><strong>Cap aviso encara.</strong></p>
          <p>Quan una app enviï una alta, un canvi de rol o un error, sortirà aquí.</p>
        </div>
      ) : (
        GRUPS.map(g => {
          const llista = dades.avisos.filter(a => a.grup === g.clau);
          return (
            <section className="panel-sec" key={g.clau}>
              <div className="panel-sec-head">
                <h2>{g.titol}</h2>
                <span className="panel-sub">{llista.length} {llista.length === 1 ? "aviso" : "avisos"}</span>
              </div>
              {llista.length === 0 ? (
                <div className="panel-buit"><p>Cap aviso d'aquest tipus.</p></div>
              ) : (
                <div className="scrollx">
                  <table className="ptable">
                    <thead>
                      <tr>
                        <th scope="col">Quan</th>
                        <th scope="col">App</th>
                        <th scope="col">Tipus</th>
                        <th scope="col">Centre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {llista.map(a => (
                        <tr key={a.id}>
                          <td className="n" style={{ whiteSpace: "nowrap" }}>{fmtDataHora(a.quan)}</td>
                          <td>{a.app}</td>
                          <td>{a.tipusText}</td>
                          <td>{a.centre || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
