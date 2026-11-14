import { getPanelData } from "../../../../lib/railway";
import { canviEurUsd } from "../../../../lib/canvi.mjs";
import { appDelProjecte } from "../../../../lib/noms-projectes.mjs";
import cataleg from "../../../../data/apps.json";
import accessos from "../../../../data/accessos.json";

export const metadata = {
  title: "Infraestructura",
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

/** Dia i mes, per dir de quan a quan va el cicle de facturacio. */
function fmtDia(iso) {
  // «16 de nov.» porta el seu punt, i darrere sovint n hi va un altre: es treu.
  return new Date(iso).toLocaleDateString("ca-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" }).replace(/\.$/, "");
}

function import2(v) {
  return v.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Import en dolars, que es com factura Railway. */
function usd(v) {
  if (v == null) return "—";
  return import2(v) + " $";
}

/** Import en euros. */
function eur(v) {
  if (v == null) return "—";
  return import2(v) + " €";
}

/** Memoria en MB sencers: es com la mostra Railway a cada servei. */
function mb(gb) {
  if (gb == null) return "—";
  return Math.round(gb * 1024).toLocaleString("ca-ES") + " MB";
}

export default async function PanellPage() {
  let dades = null;
  let canvi = null;
  let error = null;
  try {
    // canviEurUsd no llança mai: si el BCE no respon torna null i tot va en dolars.
    [dades, canvi] = await Promise.all([getPanelData({ ambCost: true }), canviEurUsd()]);
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="panel">
        <h1>Infraestructura</h1>
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

  const { apps, workspace, generatedAt, cost } = dades;
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

  // Cost per projecte, del que mes costa al que menys.
  const files = cost
    ? apps
        .filter(a => a.cost)
        .map(a => {
          const adreces = a.services.flatMap(s => [
            ...(s.customDomains || []).map(d => d.domain),
            ...(s.serviceDomains || []),
          ]);
          return { a, adreces };
        })
        .map(({ a, adreces }) => ({
          id: a.id,
          name: a.name,
          // El nom amb que es coneix l app, tret de les seves adreces; a Railway
          // el projecte porta el nom del dia que es va crear.
          app: appDelProjecte(adreces, cataleg, accessos)?.nom || null,
          adreca: (a.services.flatMap(s => (s.customDomains || []).map(d => d.domain))[0]) || null,
          ...a.cost,
          // Un projecte amb serveis i cap adreça sol ser una copia creada per error.
          senseDomini:
            a.services.length > 0 &&
            a.services.every(s => !s.customDomains?.length && !s.serviceDomains?.length),
          gros: a.cost.serveis.some(s => (s.gb || 0) > 1),
        }))
        .sort((a, b) => b.previst - a.previst)
    : [];
  const previstMax = Math.max(...files.map(f => f.previst), 0.01);
  const costMemoria = files.reduce((n, f) => n + f.desglos.memoria, 0);
  const pesMemoria = cost && cost.actual > 0 ? Math.round((costMemoria / cost.actual) * 100) : null;

  // Railway factura en dolars. Si se sap el canvi del dia, la taula va en euros
  // i els dolars queden a la fila de sota, que es la que quadra amb la factura.
  const taxa = canvi?.eurPerUsd || null;
  const diners = v => (v == null ? "—" : taxa ? eur(v * taxa) : usd(v));

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Infraestructura</h1>
          <p className="panel-sub">
            {workspace} · actualitzat {new Date(generatedAt).toLocaleTimeString("ca-ES")}
          </p>
        </div>
        <div className="panel-accions">
          <a href="/panel/infraestructura" className="btn btn-outline">Actualitzar</a>
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
        {cost && (
          <div className={"pstat" + (cost.avis != null && cost.factura > cost.avis ? " is-wait" : "")}>
            <span className="pstat-n">{taxa ? `${Math.round(cost.factura * taxa)} €` : `${Math.round(cost.factura)} $`}</span>
            <span className="pstat-k">Factura prevista</span>
          </div>
        )}
        {cost && !cost.senseMemoria && (
          <div className="pstat">
            <span className="pstat-n">
              {cost.memoriaAra.toLocaleString("ca-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} GB
            </span>
            <span className="pstat-k">Memoria ocupada</span>
          </div>
        )}
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

      {/* ---------- Cost ---------- */}
      {cost && (
        <section className="panel-sec">
          <div className="panel-sec-head">
            <h2>Cost per projecte</h2>
            <a href="https://railway.com/workspace/usage" target="_blank" rel="noopener" className="btn-ghost">
              Veure la factura a Railway
            </a>
          </div>

          <p className="panel-nota">
            {cost.cicle
              ? <>Cicle de facturacio del {fmtDia(cost.cicle.start)} al {fmtDia(cost.cicle.end)}. </>
              : <>Cicle de facturacio en curs. </>}
            {taxa
              ? <>Railway factura en dolars; aqui va <b>en euros</b>, al canvi de referencia del Banc Central
                Europeu{canvi.data ? <> del {fmtDia(canvi.data)}</> : null} (1 $ = {taxa.toLocaleString("ca-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €).
                El banc hi aplica el seu canvi i la seva comissio, aixi que el carrec real pot variar una mica. </>
              : <>Imports en dolars: no s ha pogut llegir el canvi a euros d avui. </>}
            Railway dona el consum de cada projecte i no l import: aqui es multiplica pels preus del
            pla Pro. La xifra oficial es la de la seva pagina d Usage.
            {pesMemoria != null && <> <b>La memoria es el {pesMemoria} % del cost</b>: cada GB ocupat tot el mes
            son uns {diners(10)}, encara que no hi entri ningu.</>}{" "}
            «Si segueix aixi» es el que costaria durant un mes sencer la memoria que el projecte ocupa ara mateix.
            {cost.avis != null && <> Hi ha un avis de despesa posat a <b>{cost.avis} $</b>{taxa ? <> (uns {Math.round(cost.avis * taxa)} €)</> : null}{cost.tall != null ? <> i un tall a <b>{cost.tall} $</b></> : <>, sense tall</>}.</>}
            {cost.senseFacturacio && <> No s ha pogut llegir la facturacio del workspace: el total no inclou el que
            hagin gastat aquest cicle els projectes esborrats.</>}
          </p>

          <div className="scrollx">
            <table className="ptable">
              <thead>
                <tr>
                  {/* La primera columna porta el desglos per servei: li cal amplada. */}
                  <th style={{ width: "38%" }}>Projecte</th>
                  <th className="r">Fins ara</th>
                  <th className="r">Previst al tancament</th>
                  <th className="r">Memoria ara</th>
                  <th className="r">Si segueix aixi</th>
                  <th style={{ width: "12%" }}>Pes relatiu</th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id}>
                    <td>
                      {f.app || f.name}
                      {(f.app || f.adreca) && (
                        <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                          {" · "}{f.app ? f.name : f.adreca}
                        </span>
                      )}
                      {f.gros && <> <span className="pbadge bad">Mes d 1 GB</span></>}
                      {f.senseDomini && <> <span className="pbadge wait">Sense domini</span></>}
                      {!cost.senseMemoria && f.serveis.length > 0 && (
                        <div className="papp-desc">
                          {f.serveis.map(s => `${s.name} ${mb(s.gb)}`).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="r n">{diners(f.actual)}</td>
                    <td className="r n">{diners(f.previst)}</td>
                    <td className="r n">{cost.senseMemoria ? "—" : mb(f.memoriaAra)}</td>
                    <td className="r n">{cost.senseMemoria ? "—" : `${diners(f.ritmeMes)} / mes`}</td>
                    <td>
                      <span className="bar" style={{ width: `${Math.round((f.previst / previstMax) * 100)}%` }} />
                    </td>
                  </tr>
                ))}
                {cost.esborrats > 0.005 && (
                  <tr>
                    <td>Projectes esborrats aquest cicle</td>
                    <td className="r n">{diners(cost.esborrats)}</td>
                    <td className="r n">{diners(cost.esborrats)}</td>
                    <td className="r n">—</td>
                    <td className="r n">—</td>
                    <td />
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="r n">{diners(cost.actual)}</td>
                  <td className="r n">{diners(cost.previst)}</td>
                  <td className="r n">{cost.senseMemoria ? "—" : mb(cost.memoriaAra)}</td>
                  <td className="r n">{cost.senseMemoria ? "—" : `${diners(cost.ritmeMes)} / mes`}</td>
                  <td />
                </tr>
                {taxa && (
                  <tr>
                    <td>Total en dolars, que es el que cobra Railway</td>
                    <td className="r n">{usd(cost.actual)}</td>
                    <td className="r n">{usd(cost.previst)}</td>
                    <td />
                    <td className="r n">{cost.senseMemoria ? "—" : `${usd(cost.ritmeMes)} / mes`}</td>
                    <td />
                  </tr>
                )}
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
