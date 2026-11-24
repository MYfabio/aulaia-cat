import Link from "next/link";
import { llegirAvisos } from "../../../../lib/panell-fonts";
import { GRUPS, ORIGENS, filtrarOrigen } from "../../../../lib/avisos.mjs";

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

export default async function AvisosPage({ searchParams }) {
  const sp = await searchParams;
  // Per defecte, l'Escola Industrial: és el que es mira cada dia.
  const origen = ORIGENS.some(o => o.clau === sp?.origen) ? sp.origen : "escola";

  let tots = null;
  let error = null;
  try {
    tots = await llegirAvisos({ limit: 200 });
  } catch (e) {
    error = e.message;
  }

  if (error || !tots) {
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

  const dades = filtrarOrigen(tots, origen);
  const titolOrigen = ORIGENS.find(o => o.clau === origen).titol;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Avisos</h1>
          <p className="panel-sub">Altes, canvis de rol i errors que envien les apps</p>
        </div>
        <div className="panel-accions">
          <a href={`/panel/avisos?origen=${origen}`} className="btn btn-outline">Actualitzar</a>
        </div>
      </div>

      <p className="panel-nota">
        Cada aviso diu l'app, el tipus i el centre (només la part del correu que va darrere de la @). Mai el nom
        ni el correu de la persona. Aquesta pàgina només llegeix.
      </p>

      {!tots.disponible && (
        <div className="panel-avis">
          <strong>Encara no hi ha connexió amb la base de dades d'estat</strong>
          <ul>
            <li>Cal la variable <code>ESTAT_DATABASE_URL</code> al servei d'aulaia.cat perquè es vegin els avisos.</li>
          </ul>
        </div>
      )}

      <div className="periodes">
        {ORIGENS.map(o => (
          <Link
            key={o.clau}
            href={`/panel/avisos?origen=${o.clau}`}
            className={"periode" + (o.clau === origen ? " is-actiu" : "")}
          >
            {o.titol} <span style={{ opacity: 0.6, fontSize: "0.85em" }}>({tots.perOrigen?.[o.clau] ?? 0})</span>
          </Link>
        ))}
      </div>

      <div className="panel-stats">
        {GRUPS.map(g => (
          <div className="pstat" key={g.clau}>
            <span className="pstat-n">{dades.perGrup[g.clau] ?? 0}</span>
            <span className="pstat-k">{g.titol}</span>
          </div>
        ))}
      </div>

      {dades.total === 0 ? (
        <div className="panel-buit">
          <p><strong>Cap aviso de «{titolOrigen}» encara.</strong></p>
          <p>Quan una app enviï una alta, un canvi de rol o un error d'aquí, sortirà en aquesta pestanya.</p>
        </div>
      ) : (
        GRUPS.map(g => {
          const llista = dades.avisos.filter(a => a.grup === g.clau);
          if (llista.length === 0) return null;
          return (
            <section className="panel-sec" key={g.clau}>
              <div className="panel-sec-head">
                <h2>{g.titol}</h2>
                <span className="panel-sub">{llista.length} {llista.length === 1 ? "aviso" : "avisos"}</span>
              </div>
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
            </section>
          );
        })
      )}
    </div>
  );
}
