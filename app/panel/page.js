import { getPanelData } from "../../lib/railway";

export const metadata = {
  title: "Panell de control",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ESTAT_DESPLEGAMENT = {
  SUCCESS:     { text: "Actiu",      cls: "ok" },
  DEPLOYING:   { text: "Desplegant", cls: "wait" },
  BUILDING:    { text: "Construint", cls: "wait" },
  INITIALIZING:{ text: "Iniciant",   cls: "wait" },
  QUEUED:      { text: "En cua",     cls: "wait" },
  FAILED:      { text: "Fallat",     cls: "bad" },
  CRASHED:     { text: "Caigut",     cls: "bad" },
  REMOVED:     { text: "Retirat",    cls: "off" },
  SKIPPED:     { text: "Omes",       cls: "off" },
  SLEEPING:    { text: "Adormit",    cls: "off" },
};

const ESTAT_CERT = {
  CERTIFICATE_STATUS_TYPE_VALID: { text: "Certificat OK", cls: "ok" },
  CERTIFICATE_STATUS_TYPE_VALIDATING_OWNERSHIP: { text: "Validant propietat", cls: "wait" },
  CERTIFICATE_STATUS_TYPE_ISSUING: { text: "Emetent", cls: "wait" },
};

function fmtData(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const dies = Math.floor((Date.now() - d.getTime()) / 86400000);
  const data = d.toLocaleDateString("ca-ES", { day: "2-digit", month: "short" });
  if (dies === 0) return "avui";
  if (dies === 1) return "ahir";
  if (dies < 30) return `fa ${dies} dies`;
  return data;
}

function gb(v) {
  if (v == null) return "-";
  return v >= 1000 ? `${(v / 1024).toFixed(1)} GB` : `${Math.round(v)} MB`;
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
      (s.customDomains || []).filter(d => d.cert !== "CERTIFICATE_STATUS_TYPE_VALID")
        .map(d => ({ app: a.name, ...d }))
    )
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Panell de control</h1>
          <p className="panel-sub">{workspace} · actualitzat {new Date(generatedAt).toLocaleTimeString("ca-ES")}</p>
        </div>
        <a href="/panel" className="btn btn-outline">Actualitzar</a>
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

      <div className="panel-list">
        {apps.map(app => (
          <article key={app.id} className="papp">
            <div className="papp-head">
              <h2>{app.name}</h2>
              {app.databases > 0 && <span className="papp-db">{app.databases} BD</span>}
            </div>
            {app.description && <p className="papp-desc">{app.description}</p>}

            {app.services.length === 0 && <p className="papp-buit">Sense serveis d aplicacio</p>}

            {app.services.map(s => {
              const st = s.deploy ? (ESTAT_DESPLEGAMENT[s.deploy.status] || { text: s.deploy.status, cls: "off" }) : null;
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

            {app.usage && (
              <dl className="papp-usage">
                <div><dt>CPU</dt><dd>{app.usage.CPU_USAGE?.toFixed(1) ?? "-"}</dd></div>
                <div><dt>Memoria</dt><dd>{gb(app.usage.MEMORY_USAGE_GB)}</dd></div>
                <div><dt>Disc</dt><dd>{gb(app.usage.DISK_USAGE_GB)}</dd></div>
                <div><dt>Xarxa</dt><dd>{app.usage.NETWORK_TX_GB != null ? `${app.usage.NETWORK_TX_GB.toFixed(2)} GB` : "-"}</dd></div>
              </dl>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
