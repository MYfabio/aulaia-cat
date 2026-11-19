import { getCostAnthropic, teClauAdmin } from "../../../../lib/panell-fonts";
import { canviEurUsd } from "../../../../lib/canvi.mjs";
import { DIES_SERIE } from "../../../../lib/cost-ia.mjs";

export const metadata = {
  title: "Cost d'IA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function import2(v) {
  return v.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** «14 nov», a partir d'un dia «2026-11-14» que ja ve en UTC. */
function fmtDia(dia) {
  return new Date(dia + "T00:00:00Z")
    .toLocaleDateString("ca-ES", { day: "numeric", month: "short", timeZone: "UTC" })
    .replace(/\.$/, "");
}

function fmtDataHora(iso) {
  return new Date(iso).toLocaleString("ca-ES", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
  });
}

const ESTAT_CLAU = {
  archived: "arxivada",
  expired: "caducada",
  inactive: "desactivada",
};

function SenseClau() {
  return (
    <div className="panel">
      <h1>Cost d'IA</h1>
      <div className="panel-buit" style={{ marginTop: "1.5rem" }}>
        <p><strong>Encara no hi ha cap clau per llegir el cost.</strong></p>
        <p>
          Cal una clau d'administrador d'Anthropic (Console → Claus → Claus d'administrador) desada al servei
          com a <code>ANTHROPIC_ADMIN_KEY</code>. Només es fa servir per llegir el cost: no es crea ni es canvia res.
        </p>
      </div>
    </div>
  );
}

export default async function CostIaPage() {
  if (!(await teClauAdmin())) return <SenseClau />;

  let cost = null;
  let error = null;
  // canviEurUsd no llança mai: si el BCE no respon torna null i tot va en dolars.
  const [resultat, canvi] = await Promise.all([
    getCostAnthropic().catch(e => { error = e.message; return null; }),
    canviEurUsd(),
  ]);
  cost = resultat;

  if (error || !cost) {
    return (
      <div className="panel">
        <h1>Cost d'IA</h1>
        <div className="panel-error-box">
          <strong>No s'ha pogut llegir el cost d'Anthropic</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Anthropic factura en dolars. Si se sap el canvi del dia, tot va en euros.
  const taxa = canvi?.eurPerUsd || null;
  const diners = v => (taxa ? import2(v * taxa) + " €" : import2(v) + " $");

  const maxDia = Math.max(...cost.perDia.map(d => d.usd), 0.0001);
  const maxClau = Math.max(...cost.perClau.map(c => c.usd), 0.0001);
  const diaMesCar = cost.perDia.reduce((a, b) => (b.usd > a.usd ? b : a), cost.perDia[0]);
  const nomMes = new Date(cost.iniciMes + "T00:00:00Z").toLocaleDateString("ca-ES", { month: "long", timeZone: "UTC" });

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Cost d'IA</h1>
          <p className="panel-sub">
            Anthropic{cost.refrescat ? ` · dades fins al ${fmtDataHora(cost.refrescat)}` : ""}
          </p>
        </div>
        <div className="panel-accions">
          <a href="/panel/ia" className="btn btn-outline">Actualitzar</a>
        </div>
      </div>

      <p className="panel-nota">
        És <b>el que factura Anthropic</b>, llegit del seu compte, no el que cada app diu que ha gastat.
        Arriba amb entre 4 i 24 hores de retard i es llegeix com a molt un cop cada mitja hora.
        Els dies van en hora UTC, com els compta Anthropic.
      </p>

      <div className="panel-stats">
        <div className="pstat">
          <span className="pstat-n">{diners(cost.total)}</span>
          <span className="pstat-k">Últims {DIES_SERIE} dies</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{diners(cost.mes)}</span>
          <span className="pstat-k">Aquest {nomMes}</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{diners(cost.avui)}</span>
          <span className="pstat-k">Avui, fins ara</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{cost.perClau.length}</span>
          <span className="pstat-k">Claus amb despesa</span>
        </div>
      </div>

      {cost.total === 0 ? (
        <div className="panel-buit">
          <p><strong>Cap despesa en els últims {DIES_SERIE} dies.</strong></p>
          <p>Si acabes de posar la clau, les primeres dades poden trigar unes hores a arribar.</p>
        </div>
      ) : (
        <>
          <section className="panel-sec">
            <div className="panel-sec-head"><h2>Per dia</h2></div>
            <div className="ia-dies" role="img"
                 aria-label={`Cost per dia dels últims ${DIES_SERIE} dies. El dia més car va ser el ${fmtDia(diaMesCar.dia)}, amb ${diners(diaMesCar.usd)}.`}>
              {cost.perDia.map(d => (
                <div key={d.dia} className="ia-dia" title={`${fmtDia(d.dia)}: ${diners(d.usd)}`}>
                  <span className="ia-dia-barra" style={{ height: `${Math.max(d.usd > 0 ? 3 : 0, Math.round((d.usd / maxDia) * 100))}%` }} />
                </div>
              ))}
            </div>
            <div className="ia-dies-peu">
              <span>{fmtDia(cost.perDia[0].dia)}</span>
              <span>El dia més car: {fmtDia(diaMesCar.dia)}, {diners(diaMesCar.usd)}</span>
              <span>{fmtDia(cost.perDia[cost.perDia.length - 1].dia)}</span>
            </div>
          </section>

          <section className="panel-sec">
            <div className="panel-sec-head"><h2>Per clau</h2></div>
            <p className="panel-nota">
              Cada app fa servir la seva clau, així que el cost per clau és el cost per app.
              El nom és el que té la clau a la consola d'Anthropic.
            </p>
            <div className="scrollx">
              <table className="ptable">
                <thead>
                  <tr>
                    <th scope="col">Clau</th>
                    <th scope="col" className="r">Últims {DIES_SERIE} dies</th>
                    <th scope="col" className="r">Aquest mes</th>
                    <th scope="col" className="r">Avui</th>
                    <th scope="col">Models</th>
                    <th scope="col" style={{ width: "14%" }}>Pes relatiu</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.perClau.map(c => (
                    <tr key={c.id || "sense"}>
                      <td>
                        <b>{c.nom}</b>
                        {ESTAT_CLAU[c.estat] && <small className="fon-etiqueta">{ESTAT_CLAU[c.estat]}</small>}
                      </td>
                      <td className="r n">{diners(c.usd)}</td>
                      <td className="r n">{diners(c.usdMes)}</td>
                      <td className="r n">{c.usdAvui > 0 ? diners(c.usdAvui) : "—"}</td>
                      <td>{c.models.map(m => m.model).join(", ")}</td>
                      <td><span className="bar" style={{ width: `${Math.round((c.usd / maxClau) * 100)}%` }} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="r n">{diners(cost.total)}</td>
                    <td className="r n">{diners(cost.mes)}</td>
                    <td className="r n">{cost.avui > 0 ? diners(cost.avui) : "—"}</td>
                    <td colSpan={2}>{taxa ? `${import2(cost.total)} $ en dòlars` : ""}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="panel-sec">
            <div className="panel-sec-head"><h2>Per model</h2></div>
            <div className="scrollx">
              <table className="ptable">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col" className="r">Últims {DIES_SERIE} dies</th>
                    <th scope="col" className="r">Part del total</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.perModel.map(m => (
                    <tr key={m.model}>
                      <td>{m.model}</td>
                      <td className="r n">{diners(m.usd)}</td>
                      <td className="r n">{Math.round((m.usd / cost.total) * 100)} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <p className="panel-nota" style={{ marginTop: "2.5rem" }}>
        {taxa
          ? <>Anthropic factura en dòlars; aquí va <b>en euros</b>, al canvi de referència del Banc Central Europeu{canvi.data ? ` del ${fmtDia(canvi.data)}` : ""}. És orientatiu: el banc hi aplica el seu canvi. </>
          : <>Imports en dòlars: no s'ha pogut llegir el canvi a euros d'avui. </>}
        És el cost abans d'aplicar el saldo de prepagament. <b>Gemini encara no hi surt</b>: Google no dona el cost
        per API i cal llegir-lo de la facturació de Google Cloud.
      </p>
    </div>
  );
}
