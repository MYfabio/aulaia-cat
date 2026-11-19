import { ultimesRevisionsFonaments, getPanelData } from "../../../../lib/panell-fonts";
import { PREGUNTES, ESTATS, veredictes, resumPerPregunta, prioritats } from "../../../../lib/fonaments.mjs";

export const metadata = {
  title: "Fonaments",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Si l agent fa mes de 8 dies que no passa, la taula ja no diu la veritat. */
const DIES_CADUCA = 8;

function fmtData(d) {
  return new Date(d).toLocaleString("ca-ES", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
  });
}

function Badge({ estat }) {
  const e = ESTATS[estat] || ESTATS.nd;
  return <span className={"pbadge " + e.cls}>{e.text}</span>;
}

function SenseRevisio({ errorBd }) {
  return (
    <div className="panel">
      <h1>Fonaments</h1>
      {errorBd ? (
        <div className="panel-error-box">
          <strong>No s'ha pogut llegir la base de dades</strong>
          <p>{errorBd}</p>
        </div>
      ) : (
        <div className="panel-buit" style={{ marginTop: "1.5rem" }}>
          <p><strong>Encara no ha arribat cap revisió.</strong></p>
          <p>
            L'agent de fonaments corre en local i envia aquí el resultat. Per llançar-lo a mà, a la carpeta
            d'aulaia-cat: <code>node scripts/fonaments/revisar.mjs --enviar</code>
          </p>
        </div>
      )}
    </div>
  );
}

export default async function FonamentsPage() {
  let revisions = [];
  let errorBd = null;
  try {
    revisions = await ultimesRevisionsFonaments(2);
  } catch (e) {
    errorBd = e.message;
  }
  if (!revisions.length) return <SenseRevisio errorBd={errorBd} />;

  let railway;
  try {
    railway = await getPanelData();
  } catch (e) {
    railway = { error: e.message };
  }

  const [actual, anterior] = revisions;
  const files = actual.dades.apps.map(app => ({ app, v: veredictes(app, railway) }));
  const perPregunta = resumPerPregunta(files);
  const primer = prioritats(files);

  const dies = Math.floor((Date.now() - new Date(actual.creada_el).getTime()) / 86400000);
  const caducada = dies > DIES_CADUCA;

  // Canvis respecte de la revisio anterior. La columna de produccio no es compara:
  // depen de Railway en aquest moment, no del que va veure l agent aquell dia.
  const canvis = [];
  if (anterior) {
    const abans = new Map(anterior.dades.apps.map(app => [app.slug, veredictes(app, null)]));
    for (const f of files) {
      const vell = abans.get(f.app.slug);
      if (!vell) continue;
      for (const p of PREGUNTES) {
        if (p.id === "produccio") continue;
        const a = vell[p.id].estat;
        const b = f.v[p.id].estat;
        if (a === b || ESTATS[a].pes < 0 || ESTATS[b].pes < 0) continue;
        canvis.push({ nom: f.app.nom, pregunta: p.titol, abans: a, ara: b, millora: ESTATS[b].pes < ESTATS[a].pes });
      }
    }
  }

  const posats = perPregunta.reduce((n, p) => n + p.ok, 0);
  const necessaris = perPregunta.reduce((n, p) => n + p.aplicables, 0);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Fonaments</h1>
          <p className="panel-sub">
            Revisió del {fmtData(actual.creada_el)} · {files.length} apps
            {actual.origen ? ` · ${actual.origen}` : ""}
          </p>
        </div>
        <div className="panel-accions">
          <a href="/panel/fonaments" className="btn btn-outline">Actualitzar</a>
        </div>
      </div>

      {caducada && (
        <div className="panel-avis">
          <strong>Fa {dies} dies que l'agent no passa</strong>
          <ul>
            <li>La taula és de l'última revisió que va arribar. Mira que la tasca programada de l'ordinador segueixi activa.</li>
          </ul>
        </div>
      )}

      <p className="panel-nota">
        Cinc preguntes per app, les mateixes cada setmana. Mesuren <b>hàbits</b>, no la qualitat del codi:
        si hi ha manera de tornar enrere, de recuperar les dades i de saber què corre. Hi ha{" "}
        <b>{posats} pilots posats de {necessaris}</b> que caldrien.
      </p>

      <div className="panel-stats">
        {perPregunta.map(p => {
          const ratio = p.aplicables ? p.ok / p.aplicables : 1;
          const cls = ratio < 0.5 ? " is-bad" : ratio < 1 ? " is-wait" : "";
          return (
            <div key={p.id} className={"pstat" + cls} title={p.pregunta}>
              <span className="pstat-n">{p.ok}<small className="fon-de">/{p.aplicables}</small></span>
              <span className="pstat-k">{p.titol}</span>
            </div>
          );
        })}
      </div>

      {railway?.error && (
        <div className="panel-avis panel-avis-info">
          <strong>Railway no respon</strong>
          <p>La columna «Producció = git» només fa servir les dades de la carpeta. ({railway.error})</p>
        </div>
      )}

      {primer.length > 0 && (
        <section className="panel-sec">
          <div className="panel-sec-head"><h2>Què arreglar primer</h2></div>
          <ol className="avisos">
            {/* prioritats() torna grups (pregunta + estat) amb la llista d apps, no una fila per app. */}
            {primer.map(p => (
              <li key={p.id + ":" + p.estat} className={"avis-fila " + ESTATS[p.estat].cls}>
                <span className="avis-punt" aria-hidden="true" />
                <span>
                  <b>{p.pregunta}</b> · {ESTATS[p.estat].text.toLowerCase()} a{" "}
                  {p.apps.length === 1 ? "1 app" : `${p.apps.length} apps`}:{" "}
                  {p.apps.map((a, i) => (
                    <span key={a.slug}>
                      {i > 0 && ", "}
                      <a href={`#fon-${a.slug}`} title={a.resum}>{a.nom}</a>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="panel-sec">
        <div className="panel-sec-head"><h2>Per app</h2></div>
        <div className="scrollx">
          <table className="ptable fon-taula">
            <thead>
              <tr>
                <th scope="col">App</th>
                {PREGUNTES.map(p => <th key={p.id} scope="col" title={p.pregunta}>{p.titol}</th>)}
              </tr>
            </thead>
            <tbody>
              {files.map(({ app, v }) => (
                <tr key={app.slug}>
                  <th scope="row">
                    <a href={`#fon-${app.slug}`}>{app.nom}</a>
                    {app.menors === true && <small className="fon-etiqueta">alumnat</small>}
                  </th>
                  {PREGUNTES.map(p => (
                    <td key={p.id}>
                      <div className="fon-cel">
                        <Badge estat={v[p.id].estat} />
                        <small>{v[p.id].resum}</small>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {canvis.length > 0 && (
        <section className="panel-sec">
          <div className="panel-sec-head"><h2>Canvis des de la revisió anterior</h2></div>
          <ul className="avisos">
            {canvis.map(c => (
              <li key={c.nom + c.pregunta} className={"avis-fila " + (c.millora ? "ok" : "bad")}>
                <span className="avis-punt" aria-hidden="true" />
                <span>
                  <b>{c.nom}</b> · {c.pregunta}: {ESTATS[c.abans].text} → {ESTATS[c.ara].text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel-sec">
        <div className="panel-sec-head"><h2>Detall</h2></div>
        <div className="fon-detalls">
          {files.map(({ app, v }) => (
            <details key={app.slug} id={`fon-${app.slug}`} className="fon-detall">
              <summary>
                <span className="fon-detall-nom">{app.nom}</span>
                <span className="fon-detall-badges">
                  {PREGUNTES.map(p => <Badge key={p.id} estat={v[p.id].estat} />)}
                </span>
              </summary>
              <div className="fon-detall-cos">
                {app.carpeta && <p className="fon-meta">Carpeta <code>{app.carpeta}</code>{app.git?.remot && <> · <code>{app.git.remot}</code></>}</p>}
                {app.nota && <p className="fon-meta">{app.nota}</p>}
                <dl>
                  {PREGUNTES.map(p => (
                    <div key={p.id}>
                      <dt>{p.titol} <Badge estat={v[p.id].estat} /></dt>
                      <dd>
                        <ul>
                          {(v[p.id].detall.length ? v[p.id].detall : [v[p.id].resum]).map((linia, i) => (
                            <li key={i}>{linia}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          ))}
        </div>
      </section>

      <p className="panel-nota" style={{ marginTop: "2.5rem" }}>
        Ho omple l'agent local <code>scripts/fonaments/revisar.mjs</code>, que llegeix les carpetes de cada app en
        aquest ordinador i GitHub, i ho envia aquí. Només llegeix: no toca cap app. La columna «Producció = git»
        es calcula en obrir aquesta pàgina, comparant amb el que corre ara a Railway.
      </p>
    </div>
  );
}
