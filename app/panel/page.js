import { getPanelData } from "../../lib/railway";

export const metadata = {
  title: "Panell de control",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ESTAT_DESPLEGAMENT = {
  SUCCESS:      { text: "Actiu",      cls: "ok" },
  DEPLOYING:    { text: "Desplegant", cls: "wait" },
  BUILDING:     { text: "Construint", cls: "wait" },
  INITIALIZING: { text: "Iniciant",   cls: "wait" },
  QUEUED:       { text: "En cua",     cls: "wait" },
  FAILED:       { text: "Fallat",     cls: "bad" },
  CRASHED:      { text: "Caigut",     cls: "bad" },
  REMOVED:      { text: "Retirat",    cls: "off" },
  SKIPPED:      { text: "Omes",       cls: "off" },
  SLEEPING:     { text: "Adormit",    cls: "off" },
};

const ESTAT_CERT = {
  CERTIFICATE_STATUS_TYPE_VALID:                { text: "Certificat OK",      cls: "ok" },
  CERTIFICATE_STATUS_TYPE_VALIDATING_OWNERSHIP: { text: "Validant propietat", cls: "wait" },
  CERTIFICATE_STATUS_TYPE_ISSUING:              { text: "Emetent",            cls: "wait" },
};

function fmtData(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const dies = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dies === 0) return "avui";
  if (dies === 1) return "ahir";
  if (dies < 30) return `fa ${dies} dies`;
  return d.toLocaleDateString("ca-ES", { day: "2-digit", month: "short" });
}

/** Numero llegible sense inventar-nos conversions d unitats. */
function num(v, dec = 1) {
  if (v == null) return "—";
  if (v === 0) return "0";
  if (v < 0.01) return "<0,01";
  return v.toLocaleString("ca-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default async function PanellPage() {
  let dades = null;
  let error = null;
  try {
    dades = await getPanelData();
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="panel">
        <h1>Panell de control</h1>
        <div className="panel-error-box">
          <strong>No s han pogut carregar les dades</strong>
          <p>{error}</p>
          <p className="panel-hint">
            Comprova que el servei te configurades <code>RAILWAY_API_TOKEN</code> i{" "}
            <code>RAILWAY_WORKSPACE_ID</code>. El token s ha de crear a Railway amb el workspace
            seleccionat, no amb «No workspace».
          </p>
        </div>
      </div>
    );
  }

  const { apps, workspace, generatedAt } = dades;
  const totalServeis = apps.reduce((n, a) => n + a.services.length, 0);
  const totalBd = apps.reduce((n, a) => n + a.databases, 0);
  const ambProblema = apps.filter(a =>
    a.services.some(s => s.deploy && ["FAILED", "CRASHED"].includes(s.deploy.status))
  );
  const certsPendents = apps.flatMap(a =>
    a.services.flatMap(s =>
      (s.customDomains || [])
        .filter(d => d.cert !== "CERTIFICATE_STATUS_TYPE_VALID")
        .map(d => ({ app: a.name, ...d }))
    )
  );

  // Rànquing de consum: qui gasta mes recursos del periode en curs.
  const consum = apps
    .filter(a => a.usage)
    .map(a => ({
      name: a.name,
      cpu: a.usage.CPU_USAGE ?? 0,
      mem: a.usage.MEMORY_USAGE_GB ?? 0,
      disc: a.usage.DISK_USAGE_GB ?? 0,
      xarxa: a.usage.NETWORK_TX_GB ?? 0,
    }))
    .sort((a, b) => b.mem - a.mem);

  const totals = consum.reduce(
    (t, c) => ({ cpu: t.cpu + c.cpu, mem: t.mem + c.mem, disc: t.disc + c.disc, xarxa: t.xarxa + c.xarxa }),
    { cpu: 0, mem: 0, disc: 0, xarxa: 0 }
  );
  const memMax = Math.max(...consum.map(c => c.mem), 1);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Panell de control</h1>
          <p className="panel-sub">
            {workspace} · actualitzat {new Date(generatedAt).toLocaleTimeString("ca-ES")}
          </p>
        </div>
        <div className="panel-accions">
          <a href="/panel/trafic" className="btn btn-primary">Veure el trafic</a>
          <a href="/panel" className="btn btn-outline">Actualitzar</a>
        </div>
      </div>

      <div className="panel-stats">
        <div className="pstat"><span className="pstat-n">{apps.length}</span><span className="pstat-k">Projectes</span></div>
        <div className="pstat"><span className="pstat-n">{totalServeis}</span><span className="pstat-k">Serveis</span></div>
        <div className="pstat"><span className="pstat-n">{totalBd}</span><span className="pstat-k">Bases de dades</span></div>
        <div className={"pstat" + (ambProblema.length ? " is-bad" : "")}>
          <span className="pstat-n">{ambProblema.length}</span><span className="pstat-k">Amb incidencia</span>
        </div>
        <div className={"pstat" + (certsPendents.length ? " is-wait" : "")}>
          <span className="pstat-n">{certsPendents.length}</span><span className="pstat-k">Certificats pendents</span>
        </div>
      </div>

      {certsPendents.length > 0 && (
        <div className="panel-avis">
          <strong>Certificats sense emetre</strong>
          <ul>
            {certsPendents.map(c => (
              <li key={c.app + c.domain}>
                <span className="mono">{c.domain}</span> a <b>{c.app}</b>
                {!c.verified && " · domini sense verificar"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- Consum ---------- */}
      {consum.length > 0 && (
        <section className="panel-sec">
          <div className="panel-sec-head">
            <h2>Consum del periode</h2>
            <a href="https://railway.com/workspace/usage" target="_blank" rel="noopener" className="btn-ghost">
              Veure la factura a Railway
            </a>
          </div>

          <p className="panel-nota">
            Railway no exposa l import en euros per API: nomes el consum. Aquests valors son els que
            reporta com a acumulat del periode de facturacio en curs, i serveixen per veure{" "}
            <b>quin projecte gasta mes</b>, no quant costa. La xifra en euros es a la seva pagina de facturacio.
          </p>

          <div className="scrollx">
            <table className="ptable">
              <thead>
                <tr>
                  <th>Projecte</th>
                  <th className="r">CPU</th>
                  <th className="r">Memoria</th>
                  <th className="r">Disc</th>
                  <th className="r">Xarxa sortint</th>
                  <th className="w">Pes relatiu</th>
                </tr>
              </thead>
              <tbody>
                {consum.map(c => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="r n">{num(c.cpu, 2)}</td>
                    <td className="r n">{num(c.mem)}</td>
                    <td className="r n">{num(c.disc)}</td>
                    <td className="r n">{num(c.xarxa, 3)}</td>
                    <td className="w">
                      <span className="bar" style={{ width: `${Math.round((c.mem / memMax) * 100)}%` }} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="r n">{num(totals.cpu, 2)}</td>
                  <td className="r n">{num(totals.mem)}</td>
                  <td className="r n">{num(totals.disc)}</td>
                  <td className="r n">{num(totals.xarxa, 3)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* ---------- Estat per projecte ---------- */}
      <section className="panel-sec">
        <div className="panel-sec-head"><h2>Estat dels projectes</h2></div>

        <div className="panel-list">
          {apps.map(app => (
            <article key={app.id} className="papp">
              <div className="papp-head">
                <h3>{app.name}</h3>
                {app.databases > 0 && <span className="papp-db">{app.databases} BD</span>}
              </div>
              {app.description && <p className="papp-desc">{app.description}</p>}

              {app.services.length === 0 && <p className="papp-buit">Sense serveis d aplicacio</p>}

              {app.services.map(s => {
                const st = s.deploy
                  ? (ESTAT_DESPLEGAMENT[s.deploy.status] || { text: s.deploy.status, cls: "off" })
                  : null;
                return (
                  <div key={s.id} className="psvc">
                    <div className="psvc-top">
                      <span className="psvc-name">{s.name}</span>
                      {st && <span className={"pbadge " + st.cls}>{st.text}</span>}
                      {s.deploy && <span className="psvc-when">{fmtData(s.deploy.at)}</span>}
                    </div>

                    {s.deploy?.commit && (
                      <p className="psvc-commit">
                        {s.deploy.hash && <span className="mono">{s.deploy.hash}</span>} {s.deploy.commit}
                      </p>
                    )}

                    {(s.customDomains?.length > 0 || s.serviceDomains?.length > 0) && (
                      <div className="psvc-doms">
                        {s.customDomains?.map(d => {
                          const c = ESTAT_CERT[d.cert] || { text: "Sense certificat", cls: "bad" };
                          return (
                            <span key={d.domain} className="pdom">
                              <a href={`https://${d.domain}`} target="_blank" rel="noopener">{d.domain}</a>
                              <span className={"pbadge " + c.cls}>{c.text}</span>
                            </span>
                          );
                        })}
                        {s.serviceDomains?.map(d => (
                          <span key={d} className="pdom pdom-railway">
                            <a href={`https://${d}`} target="_blank" rel="noopener">{d}</a>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
