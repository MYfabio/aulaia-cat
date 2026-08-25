import Link from "next/link";
import { getSeoData, teClaus } from "../../../lib/search-console";

export const metadata = {
  title: "Cerca a Google",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PERIODES = [
  { dies: 7,  text: "7 dies" },
  { dies: 28, text: "28 dies" },
  { dies: 90, text: "90 dies" },
];

const num = n => (n ?? 0).toLocaleString("ca-ES");
const pct = n => ((n ?? 0) * 100).toFixed(1).replace(".", ",") + " %";
const pos = n => (n ? n.toFixed(1).replace(".", ",") : "—");

/** Variacio respecte del periode anterior, en text curt. */
function delta(ara, abans) {
  if (abans == null || abans === 0) return null;
  const v = ((ara - abans) / abans) * 100;
  if (Math.abs(v) < 1) return { text: "igual", cls: "pla" };
  return { text: (v > 0 ? "+" : "") + v.toFixed(0) + " %", cls: v > 0 ? "puja" : "baixa" };
}

/** Linia de clics del periode. Sense eixos: aqui nomes importa la forma. */
function Linia({ serie }) {
  if (!serie || serie.length < 2) return null;
  const w = 260, h = 46;
  const max = Math.max(...serie.map(p => p.clicks), 1);
  const punts = serie.map((p, i) => {
    const x = (i / (serie.length - 1)) * w;
    const y = h - (p.clicks / max) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg className="seo-linia" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img"
         aria-label={`Evolució dels clics, amb un màxim de ${max} en un dia`}>
      <polyline points={`0,${h} ${punts.join(" ")} ${w},${h}`} className="seo-linia-fons" />
      <polyline points={punts.join(" ")} className="seo-linia-trac" />
    </svg>
  );
}

function SenseClaus() {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Cerca a Google</h1>
          <p className="panel-sub">Encara no està connectat</p>
        </div>
        <Link href="/panel" className="btn btn-outline">Tornar al panell</Link>
      </div>

      <div className="panel-avis">
        <strong>Falten les credencials del compte de servei</strong>
        <p className="panel-hint">
          Aquesta pàgina llegeix Search Console amb un <b>compte de servei</b> de Google, no amb el
          teu compte personal: així no caduca la sessió ni cal tornar a autoritzar res cada dos per tres.
        </p>
      </div>

      <section className="panel-sec">
        <div className="panel-sec-head"><h2>Què cal fer, una sola vegada</h2></div>
        <ol className="seo-passos">
          <li>
            A <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener">Google Cloud</a>{" "}
            crea un projecte, o fes servir un que ja tinguis.
          </li>
          <li>
            Activa la <a href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" target="_blank" rel="noopener">Google Search Console API</a>.
          </li>
          <li>
            A <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener">Comptes de servei</a>{" "}crea&apos;n un.
            No li cal cap rol d&apos;IAM. Apunta&apos;t l&apos;adreça, que acaba en <code>.iam.gserviceaccount.com</code>.
          </li>
          <li>
            Dins del compte de servei: <b>Claus</b> → <b>Afegir clau</b> → <b>Crear clau nova</b> → <b>JSON</b>. Es descarrega un fitxer.
          </li>
          <li>
            A <a href="https://search.google.com/search-console" target="_blank" rel="noopener">Search Console</a>, per{" "}
            <b>cada propietat</b>: Configuració → Usuaris i permisos → Afegeix un usuari, amb l&apos;adreça del
            compte de servei i permís <b>Complet</b> o <b>Restringit</b>.
            <br />
            <span className="panel-hint">Aquest pas és el que s&apos;oblida: sense ell la clau és bona però no veu cap propietat.</span>
          </li>
          <li>
            A les variables del servei <code>aulaia-cat</code> de Railway, tret del fitxer JSON:
            <br /><code>GOOGLE_SA_EMAIL</code> = el camp <code>client_email</code>
            <br /><code>GOOGLE_SA_PRIVATE_KEY</code> = el camp <code>private_key</code>, tal qual, amb els <code>\n</code> inclosos
          </li>
        </ol>
        <p className="panel-nota">
          El fitxer JSON és una credencial: no el deixis dins del repositori ni l&apos;enviïs per correu.
        </p>
      </section>
    </div>
  );
}

export default async function SeoPage({ searchParams }) {
  if (!teClaus()) return <SenseClaus />;

  const sp = await searchParams;
  const dies = PERIODES.some(p => String(p.dies) === sp?.dies) ? Number(sp.dies) : 28;

  let dades = null;
  let error = null;
  try {
    dades = await getSeoData(dies);
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="panel">
        <h1>Cerca a Google</h1>
        <div className="panel-error-box">
          <strong>No s&apos;han pogut llegir les dades</strong>
          <p>{error}</p>
          <p className="panel-hint">
            Si diu <code>invalid_grant</code>, la clau privada no ha arribat sencera a la variable.
            Si diu <code>403</code>, el compte de servei encara no és usuari de cap propietat de Search Console.
          </p>
        </div>
      </div>
    );
  }

  const { llocs, inici, fi } = dades;
  const totals = llocs.reduce(
    (t, l) => ({ clicks: t.clicks + (l.clicks || 0), impressions: t.impressions + (l.impressions || 0) }),
    { clicks: 0, impressions: 0 }
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Cerca a Google</h1>
          <p className="panel-sub">Del {inici} al {fi} · Search Console</p>
        </div>
        <Link href="/panel" className="btn btn-outline">Tornar al panell</Link>
      </div>

      <div className="periodes">
        {PERIODES.map(p => (
          <Link key={p.dies} href={`/panel/seo?dies=${p.dies}`}
                className={"periode" + (dies === p.dies ? " is-actiu" : "")}>
            {p.text}
          </Link>
        ))}
      </div>

      <div className="panel-stats">
        <div className="pstat"><span className="pstat-n">{num(totals.clicks)}</span><span className="pstat-k">Clics</span></div>
        <div className="pstat"><span className="pstat-n">{num(totals.impressions)}</span><span className="pstat-k">Impressions</span></div>
        <div className="pstat"><span className="pstat-n">{llocs.length}</span><span className="pstat-k">Propietats</span></div>
      </div>

      {llocs.length === 0 && (
        <div className="panel-buit">
          <p><strong>El compte de servei no veu cap propietat.</strong></p>
          <p>
            Les credencials funcionen, però encara no l&apos;has afegit com a usuari a Search Console.
            A cada propietat: Configuració → Usuaris i permisos → Afegeix un usuari, amb l&apos;adreça
            que acaba en <code>.iam.gserviceaccount.com</code>.
          </p>
        </div>
      )}

      <p className="panel-nota">
        Google tanca les dades amb un parell de dies de retard, així que el període acaba fa tres dies:
        comparar-lo amb dies encara a mig processar faria pensar que el trànsit ha caigut.
      </p>

      <div className="panel-list">
        {llocs.map(l => {
          const dClicks = delta(l.clicks, l.abans?.clicks);
          const dImpr = delta(l.impressions, l.abans?.impressions);
          return (
            <article key={l.siteUrl} className="seo-fitxa">
              <div className="seo-fitxa-head">
                <div>
                  <h2>{l.nom}</h2>
                  <p className="seo-host mono">{l.siteUrl}</p>
                </div>
                {l.slug && <Link href={"/apps/" + l.slug} className="btn-ghost">Fitxa</Link>}
              </div>

              {l.error ? (
                <p className="seo-error">{l.error}</p>
              ) : (
                <>
                  <div className="seo-xifres">
                    <div>
                      <span className="seo-k">Clics</span>
                      <b>{num(l.clicks)}</b>
                      {dClicks && <em className={"seo-delta " + dClicks.cls}>{dClicks.text}</em>}
                    </div>
                    <div>
                      <span className="seo-k">Impressions</span>
                      <b>{num(l.impressions)}</b>
                      {dImpr && <em className={"seo-delta " + dImpr.cls}>{dImpr.text}</em>}
                    </div>
                    <div><span className="seo-k">CTR</span><b>{pct(l.ctr)}</b></div>
                    <div><span className="seo-k">Posició mitjana</span><b>{pos(l.position)}</b></div>
                  </div>

                  <Linia serie={l.serie} />

                  <div className="seo-taules">
                    <div>
                      <h3>Què busca la gent</h3>
                      {l.consultes.length === 0 ? (
                        <p className="seo-buit">Encara no hi ha consultes amb prou volum.</p>
                      ) : (
                        <div className="scrollx">
                          <table className="ptable">
                            <thead><tr><th>Consulta</th><th className="r">Clics</th><th className="r">Impr.</th><th className="r">Pos.</th></tr></thead>
                            <tbody>
                              {l.consultes.map(c => (
                                <tr key={c.text}>
                                  <td>{c.text}</td>
                                  <td className="r n">{num(c.clicks)}</td>
                                  <td className="r n">{num(c.impressions)}</td>
                                  <td className="r n">{pos(c.position)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3>Pàgines que entren</h3>
                      {l.pagines.length === 0 ? (
                        <p className="seo-buit">Cap pàgina amb dades al període.</p>
                      ) : (
                        <div className="scrollx">
                          <table className="ptable">
                            <thead><tr><th>Pàgina</th><th className="r">Clics</th><th className="r">Impr.</th></tr></thead>
                            <tbody>
                              {l.pagines.map(p => (
                                <tr key={p.url}>
                                  <td className="seo-pagina">{p.url.replace(/^https?:\/\/[^/]+/, "") || "/"}</td>
                                  <td className="r n">{num(p.clicks)}</td>
                                  <td className="r n">{num(p.impressions)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
