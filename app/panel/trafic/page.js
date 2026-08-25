import Link from "next/link";
import { getTrafficData } from "../../../lib/railway";

export const metadata = {
  title: "Trafic",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PERIODES = [
  { d: 1, text: "24 hores" },
  { d: 7, text: "7 dies" },
  { d: 30, text: "30 dies" },
];

function fmt(n) {
  return (n ?? 0).toLocaleString("ca-ES");
}

/** Grafic d area apilada: peticions correctes i errors. Sense llibreries. */
function Grafic({ serie, dies }) {
  if (serie.length < 2) return <p className="papp-buit">Encara no hi ha prou dades per dibuixar la corba.</p>;

  const W = 1000, H = 200, P = 4;
  const max = Math.max(...serie.map(s => s.ok + s.err), 1);
  const x = i => (i / (serie.length - 1)) * W;
  const y = v => H - (v / max) * (H - P);

  const areaTotal = `M0,${H} ` + serie.map((s, i) => `L${x(i).toFixed(1)},${y(s.ok + s.err).toFixed(1)}`).join(" ") + ` L${W},${H} Z`;
  const areaErr = `M0,${H} ` + serie.map((s, i) => `L${x(i).toFixed(1)},${y(s.err).toFixed(1)}`).join(" ") + ` L${W},${H} Z`;
  const linia = serie.map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(s.ok + s.err).toFixed(1)}`).join(" ");

  const etiqueta = ts => {
    const d = new Date(ts * 1000);
    return dies <= 1
      ? d.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ca-ES", { day: "2-digit", month: "short" });
  };

  return (
    <div className="graf">
      <div className="graf-y"><span>{fmt(max)}</span><span>0</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Peticions al llarg del temps">
        <path d={areaTotal} className="graf-area" />
        <path d={areaErr} className="graf-area-err" />
        <path d={linia} className="graf-linia" />
      </svg>
      <div className="graf-x">
        <span>{etiqueta(serie[0].ts)}</span>
        <span>{etiqueta(serie[Math.floor(serie.length / 2)].ts)}</span>
        <span>{etiqueta(serie[serie.length - 1].ts)}</span>
      </div>
    </div>
  );
}

/** Barra de volum relatiu d una app. */
function Pics({ pics }) {
  if (!pics || pics.length === 0) return null;
  const max = Math.max(...pics, 1);
  const mostra = pics.slice(-40);
  return (
    <span className="pics" aria-hidden="true">
      {mostra.map((v, i) => (
        <span key={i} className="pic" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </span>
  );
}

export default async function TraficPage({ searchParams }) {
  const sp = await searchParams;
  const dies = [1, 7, 30].includes(Number(sp?.dies)) ? Number(sp.dies) : 7;

  let d = null;
  let error = null;
  try {
    d = await getTrafficData(dies);
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="panel">
        <h1>Trafic</h1>
        <div className="panel-error-box">
          <strong>No s han pogut carregar les dades</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }



  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Trafic</h1>
          <p className="panel-sub">Peticions HTTP de totes les apps · dades de Railway</p>
        </div>
        <Link href="/panel" className="btn btn-outline">Tornar al panell</Link>
      </div>

      <div className="periodes">
        {PERIODES.map(p => (
          <Link
            key={p.d}
            href={`/panel/trafic?dies=${p.d}`}
            className={"periode" + (p.d === dies ? " is-actiu" : "")}
          >
            {p.text}
          </Link>
        ))}
      </div>

      {d.indisponible && (
        <div className="panel-avis">
          <strong>Railway no ha retornat metriques</strong>
          <ul><li>Pot passar si el token no te acces a l espai de treball o si encara no hi ha trafic registrat.</li></ul>
        </div>
      )}

      <div className="panel-stats">
        <div className="pstat"><span className="pstat-n">{fmt(d.total)}</span><span className="pstat-k">Peticions</span></div>
        <div className={"pstat" + (d.servidor > 0 ? " is-bad" : "")}>
          <span className="pstat-n">{fmt(d.servidor)}</span><span className="pstat-k">Errors de servidor 5xx</span>
        </div>
        <div className={"pstat" + (d.limit > 0 ? " is-wait" : "")}>
          <span className="pstat-n">{fmt(d.limit)}</span><span className="pstat-k">Limit superat 429</span>
        </div>
        <div className="pstat"><span className="pstat-n">{fmt(d.noTrobat)}</span><span className="pstat-k">No trobat 404</span></div>
        <div className="pstat"><span className="pstat-n">{d.apps.length}</span><span className="pstat-k">Apps amb trafic</span></div>
      </div>

      <p className="panel-nota">
        Els separem a proposit: un <b>404</b> sol ser un robot buscant rutes que no existeixen i
        rarament vol dir res; un <b>429</b> indica que alguna cosa esta topant amb un limit de
        peticions; un <b>5xx</b> es un error real del teu servidor. Nomes els dos ultims demanen
        atencio.
      </p>

      <section className="panel-sec">
        <div className="panel-sec-head">
          <h2>Peticions al llarg del temps</h2>
          <span className="graf-llegenda">
            <span className="ll ll-ok" /> correctes
            <span className="ll ll-err" /> errors
          </span>
        </div>
        <Grafic serie={d.serie} dies={dies} />
      </section>

      <section className="panel-sec">
        <div className="panel-sec-head"><h2>Per aplicacio</h2></div>
        {d.apps.length === 0 ? (
          <p className="papp-buit">Cap app ha registrat trafic en aquest periode.</p>
        ) : (
          <div className="scrollx">
            <table className="ptable">
              <thead>
                <tr>
                  <th>Aplicacio</th>
                  <th className="r">Peticions</th>
                  <th className="r">Correctes</th>
                  <th className="r">404</th>
                  <th className="r">429</th>
                  <th className="r">5xx</th>
                  <th className="w">Activitat</th>
                </tr>
              </thead>
              <tbody>
                {d.apps.map(a => (
                  <tr key={a.name + a.service}>
                    <td>
                      {a.name}
                      {a.service !== a.name && <span className="psvc-when"> · {a.service}</span>}
                    </td>
                    <td className="r n">{fmt(a.total)}</td>
                    <td className="r n">{fmt(a.ok)}</td>
                    <td className="r n">{a.noTrobat > 0 ? fmt(a.noTrobat) : "—"}</td>
                    <td className="r n">
                      {a.limit > 0 ? <span className="pbadge wait">{fmt(a.limit)}</span> : "—"}
                    </td>
                    <td className="r n">
                      {a.servidor > 0 ? <span className="pbadge bad">{fmt(a.servidor)}</span> : "—"}
                    </td>
                    <td className="w"><Pics pics={a.pics} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="panel-nota">
        Aquestes dades venen de la infraestructura: son les peticions que arriben als servidors,
        incloent-hi bots, monitors i fitxers estatics. <b>No son visites de persones</b>: per a
        aixo cal una analitica de client com Search Console o Plausible.
      </p>
    </div>
  );
}
