import Link from "next/link";
import { getCorreus, teClauCorreus } from "../../../../lib/panell-fonts";
import { DIES_SERIE, TEXT_TIPUS, AULAIA, emmascarar } from "../../../../lib/correus.mjs";

export const metadata = {
  title: "Correus enviats",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Files de la llista de sota. La resta es veu filtrant per app. */
const MAXIM_FILES = 100;

const ZONA = "Europe/Madrid";

/** «14 nov», a partir d'un dia «2026-11-14». */
function fmtDia(dia) {
  return new Date(dia + "T12:00:00Z")
    .toLocaleDateString("ca-ES", { day: "numeric", month: "short", timeZone: "UTC" })
    .replace(/\.$/, "");
}

function fmtDataHora(quan) {
  return new Date(quan).toLocaleString("ca-ES", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ZONA,
  });
}

function fmtHora(iso) {
  return new Date(iso).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit", timeZone: ZONA });
}

const CLASSE_ESTAT = { ok: "ok", pendent: "wait", problema: "bad", aturat: "off" };

/** Qui ha enviat els correus d'una app: ella mateixa, aulaia.cat en nom seu, o totes dues. */
function quiEnvia(a) {
  if (a.desconegut) return "Remitent que no és de cap app";
  if (a.app === AULAIA) return a.remitents.join(", ");
  if (a.perAulaia && a.propis) return `L'app (${a.propis}) i aulaia.cat en nom seu (${a.perAulaia})`;
  if (a.perAulaia) return "aulaia.cat en nom seu (altes)";
  return a.remitents.join(", ");
}

function SenseClau() {
  return (
    <div className="panel">
      <h1>Correus enviats</h1>
      <div className="panel-buit" style={{ marginTop: "1.5rem" }}>
        <p><strong>Encara no hi ha cap clau per llegir els enviaments.</strong></p>
        <p>
          Cal una clau de Resend amb accés complet (API Keys → Create API Key → Full access) desada al servei
          com a <code>RESEND_PANEL_KEY</code>. Només es fa servir per llegir la llista: no s'envia ni es canvia res.
        </p>
      </div>
    </div>
  );
}

export default async function CorreusPage({ searchParams }) {
  if (!(await teClauCorreus())) return <SenseClau />;

  const sp = await searchParams;
  let dades = null;
  let error = null;
  try {
    dades = await getCorreus();
  } catch (e) {
    error = e.message;
  }

  if (error || !dades) {
    return (
      <div className="panel">
        <h1>Correus enviats</h1>
        <div className="panel-error-box">
          <strong>No s'han pogut llegir els enviaments de Resend</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const filtreApp = typeof sp?.app === "string" && dades.perApp.some(a => a.app === sp.app) ? sp.app : null;
  const nomesProblemes = sp?.estat === "problemes";
  const adreces = sp?.adreces === "1";

  /** Enllaç a aquesta mateixa pagina canviant un filtre i conservant la resta. */
  const enllac = canvis => {
    const p = { app: filtreApp, estat: nomesProblemes ? "problemes" : null, adreces: adreces ? "1" : null, ...canvis };
    const q = new URLSearchParams(Object.entries(p).filter(([, v]) => v));
    return "/panel/correus" + (q.size ? "?" + q : "") + "#enviaments";
  };

  const filtrats = dades.correus.filter(c => (!filtreApp || c.app === filtreApp) && (!nomesProblemes || c.grup === "problema"));
  const files = filtrats.slice(0, MAXIM_FILES);
  const appFiltrada = filtreApp ? dades.perApp.find(a => a.app === filtreApp) : null;

  const maxDia = Math.max(...dades.perDia.map(d => d.n), 1);
  const maxApp = Math.max(...dades.perApp.map(a => a.total), 1);
  const diaMesPle = dades.perDia.reduce((a, b) => (b.n > a.n ? b : a), dades.perDia[0]);
  const percentatge = dades.total ? Math.round((dades.ok / dades.total) * 100) : 0;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Correus enviats</h1>
          <p className="panel-sub">Resend · últims {DIES_SERIE} dies · llegit a les {fmtHora(dades.llegit)}</p>
        </div>
        <div className="panel-accions">
          <a href="/panel/correus" className="btn btn-outline">Actualitzar</a>
        </div>
      </div>

      <p className="panel-nota">
        És <b>el que Resend diu que ha sortit</b> del compte, de totes les apps que hi envien, no el que cada app
        diu que ha enviat. Resend en guarda {DIES_SERIE} dies i la llista es llegeix com a molt un cop cada 5 minuts.
      </p>

      {dades.origenClau === "enviament" && (
        <div className="panel-avis">
          <strong>S'està llegint amb la clau d'enviar</strong>
          <ul>
            <li>
              <code>RESEND_API_KEY</code> té accés complet a Resend. Convé que només pugui enviar i que el panell
              llegeixi amb una clau a part, desada com a <code>RESEND_PANEL_KEY</code>.
            </li>
          </ul>
        </div>
      )}

      {dades.incomplet && (
        <div className="panel-avis">
          <strong>La llista no és sencera</strong>
          <ul><li>Hi ha més correus dels que es llegeixen d'un cop: els dies més antics poden sortir amb menys enviaments dels reals.</li></ul>
        </div>
      )}

      <div className="panel-stats">
        <div className="pstat">
          <span className="pstat-n">{dades.total}</span>
          <span className="pstat-k">Últims {DIES_SERIE} dies</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{dades.avui}</span>
          <span className="pstat-k">Avui, fins ara</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{dades.total ? percentatge + " %" : "—"}</span>
          <span className="pstat-k">Lliurats</span>
        </div>
        <div className={"pstat" + (dades.problemes > 0 ? " is-bad" : "")}>
          <span className="pstat-n">{dades.problemes}</span>
          <span className="pstat-k">Amb problemes</span>
        </div>
      </div>

      {dades.total === 0 ? (
        <div className="panel-buit">
          <p><strong>Cap correu en els últims {DIES_SERIE} dies.</strong></p>
          <p>Si n'esperaves, comprova que les apps envien amb aquest mateix compte de Resend.</p>
        </div>
      ) : (
        <>
          <section className="panel-sec">
            <div className="panel-sec-head"><h2>Per dia</h2></div>
            <div className="ia-dies" role="img"
                 aria-label={`Correus per dia dels últims ${DIES_SERIE} dies. El dia amb més enviaments va ser el ${fmtDia(diaMesPle.dia)}, amb ${diaMesPle.n}.`}>
              {dades.perDia.map(d => (
                <div key={d.dia} className="ia-dia" title={`${fmtDia(d.dia)}: ${d.n}`}>
                  <span className="ia-dia-barra" style={{ height: `${Math.max(d.n > 0 ? 3 : 0, Math.round((d.n / maxDia) * 100))}%` }} />
                </div>
              ))}
            </div>
            <div className="ia-dies-peu">
              <span>{fmtDia(dades.perDia[0].dia)}</span>
              <span>El dia amb més enviaments: {fmtDia(diaMesPle.dia)}, {diaMesPle.n}</span>
              <span>{fmtDia(dades.perDia[dades.perDia.length - 1].dia)}</span>
            </div>
          </section>

          <section className="panel-sec">
            <div className="panel-sec-head"><h2>Per app</h2></div>
            <p className="panel-nota">
              Una app surt aquí tant si envia ella amb la seva adreça com si és aulaia.cat qui envia en nom seu
              els correus de l'alta. Clica el nom per veure'n els enviaments.
            </p>
            <div className="scrollx">
              <table className="ptable">
                <thead>
                  <tr>
                    <th scope="col">App</th>
                    <th scope="col" className="r">Enviats</th>
                    <th scope="col" className="r">Avui</th>
                    <th scope="col" className="r">Lliurats</th>
                    <th scope="col" className="r">Amb problemes</th>
                    <th scope="col">Qui els envia</th>
                    <th scope="col">Últim</th>
                    <th scope="col" style={{ width: "12%" }}>Pes relatiu</th>
                  </tr>
                </thead>
                <tbody>
                  {dades.perApp.map(a => (
                    <tr key={a.app}>
                      <td><Link href={enllac({ app: a.app })}><b>{a.nom}</b></Link></td>
                      <td className="r n">{a.total}</td>
                      <td className="r n">{a.avui || "—"}</td>
                      <td className="r n">{a.ok}</td>
                      <td className="r n">{a.problemes ? <span className="pbadge bad">{a.problemes}</span> : "—"}</td>
                      <td>{quiEnvia(a)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDataHora(a.ultim)}</td>
                      <td><span className="bar" style={{ width: `${Math.round((a.total / maxApp) * 100)}%` }} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="r n">{dades.total}</td>
                    <td className="r n">{dades.avui || "—"}</td>
                    <td className="r n">{dades.ok}</td>
                    <td className="r n">{dades.problemes || "—"}</td>
                    <td colSpan={3}>{dades.pendents ? `${dades.pendents} encara sense confirmar` : ""}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {dades.perTipus.length > 0 && (
            <section className="panel-sec">
              <div className="panel-sec-head"><h2>El que envia aulaia.cat, per tipus</h2></div>
              <p className="panel-nota">
                Els correus del gestor d'altes i de l'assistent de missatges, de totes les apps juntes.
              </p>
              <div className="scrollx">
                <table className="ptable">
                  <thead>
                    <tr>
                      <th scope="col">Tipus de correu</th>
                      <th scope="col" className="r">Enviats</th>
                      <th scope="col" className="r">Lliurats</th>
                      <th scope="col" className="r">Amb problemes</th>
                      <th scope="col">Últim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dades.perTipus.map(t => (
                      <tr key={t.tipus}>
                        <td>{t.text}</td>
                        <td className="r n">{t.total}</td>
                        <td className="r n">{t.ok}</td>
                        <td className="r n">{t.problemes ? <span className="pbadge bad">{t.problemes}</span> : "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{fmtDataHora(t.ultim)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="panel-sec" id="enviaments" style={{ scrollMarginTop: "1rem" }}>
            <div className="panel-sec-head">
              <h2>{appFiltrada ? `Enviaments de ${appFiltrada.nom}` : "Darrers enviaments"}</h2>
              <span className="panel-sub">
                {filtrats.length > files.length
                  ? `Els ${files.length} més recents de ${filtrats.length}`
                  : `${filtrats.length} ${filtrats.length === 1 ? "correu" : "correus"}`}
              </span>
            </div>

            {/* Hi pot haver moltes apps: els filtres han de baixar de linia en lloc d'eixamplar la pagina. */}
            <div className="periodes" style={{ flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <Link href={enllac({ app: null })} className={"periode" + (!filtreApp ? " is-actiu" : "")}>Totes les apps</Link>
              {dades.perApp.map(a => (
                <Link key={a.app} href={enllac({ app: a.app })} className={"periode" + (filtreApp === a.app ? " is-actiu" : "")}>
                  {a.nom} ({a.total})
                </Link>
              ))}
            </div>
            <div className="periodes" style={{ flexWrap: "wrap" }}>
              <Link href={enllac({ estat: null })} className={"periode" + (!nomesProblemes ? " is-actiu" : "")}>Tots els estats</Link>
              <Link href={enllac({ estat: "problemes" })} className={"periode" + (nomesProblemes ? " is-actiu" : "")}>Només amb problemes</Link>
              <Link href={enllac({ adreces: adreces ? null : "1" })} className={"periode" + (adreces ? " is-actiu" : "")}>
                {adreces ? "Amagar les adreces" : "Veure les adreces senceres"}
              </Link>
            </div>

            {files.length === 0 ? (
              <div className="panel-buit"><p><strong>Cap correu amb aquest filtre.</strong></p></div>
            ) : (
              <div className="scrollx">
                <table className="ptable">
                  <thead>
                    <tr>
                      <th scope="col">Quan</th>
                      <th scope="col">App</th>
                      <th scope="col">Assumpte</th>
                      <th scope="col">Per a</th>
                      <th scope="col">Estat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(c => (
                      <tr key={c.id}>
                        <td className="n" style={{ whiteSpace: "nowrap" }}>{fmtDataHora(c.quan)}</td>
                        <td>{c.nomApp}</td>
                        <td>
                          {c.assumpte || "(sense assumpte)"}
                          {c.tipus && c.tipus !== "altres" && <small className="fon-etiqueta">{TEXT_TIPUS[c.tipus] || c.tipus}</small>}
                        </td>
                        <td style={{ overflowWrap: "anywhere" }}>
                          {c.per.map(a => (adreces ? a : emmascarar(a))).join(", ") || "—"}
                        </td>
                        <td><span className={"pbadge " + (CLASSE_ESTAT[c.grup] || "off")}>{c.estat}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <p className="panel-nota" style={{ marginTop: "2.5rem" }}>
        Només hi surt el correu que passa per <b>aquest compte de Resend</b>: el que una app envia per una altra via
        (una bústia de Gmail, un altre compte) no hi és. «Lliurat» vol dir que el servidor de destí l'ha acceptat,
        no que s'hagi llegit. Les adreces surten amagades perquè una part dels destinataris són famílies.
        {dades.senseCorreu.length > 0 && (
          <> <b>Sense cap correu en {DIES_SERIE} dies:</b> {dades.senseCorreu.join(", ")}.</>
        )}
      </p>
    </div>
  );
}
