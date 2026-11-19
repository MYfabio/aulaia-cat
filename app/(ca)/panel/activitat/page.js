import cataleg from "../../../../data/apps.json";
import { llegirActivitat, slugsActivitat } from "../../../../lib/panell-fonts";
import {
  resumirActivitat,
  diaLocal,
  sumarDies,
  horaDeReferencia,
  totalTokens,
  ALTRES,
  HORES_SILENCI,
  MINIM_PER_DOMINI,
  ZONA,
} from "../../../../lib/activitat.mjs";
import { PREUS_COMPROVATS_EL } from "../../../../lib/preus-ia.mjs";
import { canviEurUsd } from "../../../../lib/canvi.mjs";

export const metadata = {
  title: "Activitat",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const HORA_MS = 60 * 60 * 1000;

const enter = n => (n ?? 0).toLocaleString("ca-ES");

/** Espai que no es parteix: «17,2 M» i «91 $» no han de quedar en dues linies. */
const NBSP = String.fromCharCode(160);

/** Tokens en curt: 950, 12,4 k, 3,21 M. */
function curt(n, decimalsM = 2) {
  if (!n) return "0";
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toLocaleString("ca-ES", { maximumFractionDigits: 1 }) + NBSP + "k";
  return (n / 1e6).toLocaleString("ca-ES", { minimumFractionDigits: decimalsM, maximumFractionDigits: decimalsM }) + NBSP + "M";
}

/** Un import amb la seva moneda. */
function importAmb(v, moneda) {
  if (!v) return "0,00" + NBSP + moneda;
  if (v < 0.01) return "<" + NBSP + "0,01" + NBSP + moneda;
  return v.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + NBSP + moneda;
}

/** En dolars, que es com facturen Anthropic i Google. */
const usd = v => importAmb(v, "$");

/** Apps que informen i no tenen fitxa al cataleg public. */
const NOMS_FORA_DEL_CATALEG = [{ slug: "memoria", nom: "Memòria" }];

const horaDelDia = d => Number(new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", hourCycle: "h23" }).format(d));

/** «de 15 a 16 h» */
function franja(inici) {
  return `de ${horaDelDia(inici)} a ${horaDelDia(new Date(inici.getTime() + HORA_MS))} h`;
}

function fmtDia(dia) {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("ca-ES", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Quan va ser l ultima hora informada: «avui, de 15 a 16 h», «ahir…», «12 nov…». */
function fmtUltima(hora, avui) {
  if (!hora) return "—";
  const dia = diaLocal(hora);
  const quan = dia === avui ? "avui" : dia === sumarDies(avui, -1) ? "ahir" : fmtDia(dia);
  return `${quan}, ${franja(hora)}`;
}

/** Trenta barres, una per dia. Mateix dibuix que la columna d activitat de Trafic. */
function Barres({ serie, etiqueta }) {
  const max = Math.max(...serie, 1);
  return (
    <span className="pics" role="img" aria-label={etiqueta} style={{ minWidth: 120 }}>
      {serie.map((v, i) => (
        <span key={i} className="pic" style={{ height: v > 0 ? `${Math.max(10, (v / max) * 100)}%` : "2px" }} />
      ))}
    </span>
  );
}

/** El nom del domini, sense partir-lo pel guio; «altres» no es cap centre. */
function Domini({ nom }) {
  if (nom === ALTRES) return <i style={{ whiteSpace: "nowrap" }}>altres (dominis petits)</i>;
  return <span className="mono" style={{ whiteSpace: "nowrap" }}>{nom}</span>;
}

function Enviament({ app }) {
  const e = app.enviament;
  if (e.estat === "mai") return <span className="pbadge off">Sense informes</span>;
  if (e.estat === "callada") return <span className="pbadge wait">Callada</span>;
  return <span className="pbadge ok">Informa</span>;
}

function Buit({ errorBd, senseClaus }) {
  return (
    <div className="panel">
      <h1>Activitat</h1>
      {errorBd ? (
        <div className="panel-error-box">
          <strong>No s'ha pogut llegir la base de dades</strong>
          <p>{errorBd}</p>
        </div>
      ) : (
        <div className="panel-buit" style={{ marginTop: "1.5rem" }}>
          <p><strong>Encara no informa cap app.</strong></p>
          {senseClaus ? (
            <p>
              Falta la variable <code>ACTIVITAT_CLAUS</code> amb l'empremta de la clau de cada app. Els passos
              són a <code>docs/informe-activitat.md</code>.
            </p>
          ) : (
            <p>
              Hi ha claus configurades, però encara no ha arribat cap informe. Les apps n'envien un per hora,
              i només si hi ha entrat algú.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default async function ActivitatPage() {
  const ara = new Date();
  const avui = diaLocal(ara);
  const slugs = await slugsActivitat();

  let files = null;
  let canvi = null;
  let errorBd = null;
  try {
    // canviEurUsd no llança mai: si el BCE no respon torna null i tot va en dolars.
    [files, canvi] = await Promise.all([
      llegirActivitat({
        desDeDia: sumarDies(avui, -29),
        mesDesDe: avui.slice(0, 8) + "01",
        horesDesDe: horaDeReferencia(ara),
      }),
      canviEurUsd(),
    ]);
  } catch (e) {
    errorBd = e.message;
  }
  if (errorBd) return <Buit errorBd={errorBd} />;

  // Els proveidors facturen en dolars. Si se sap el canvi del dia, la pagina va
  // en euros i els dolars queden a la fila de sota del total, com a Infraestructura.
  const taxa = canvi?.eurPerUsd || null;
  const moneda = taxa ? "€" : "$";
  const diners = v => importAmb(taxa ? v * taxa : v, moneda);
  // A les targetes de dalt no hi caben els centims: a partir de 10, sencers.
  const dinersCurt = v => {
    const x = taxa ? v * taxa : v;
    return x >= 10 ? Math.round(x).toLocaleString("ca-ES") + NBSP + moneda : importAmb(x, moneda);
  };

  const noms = [...cataleg.map(a => ({ slug: a.slug, nom: a.nom })), ...NOMS_FORA_DEL_CATALEG];
  const r = resumirActivitat({ ...files, slugs, cataleg: noms, ara });
  if (r.apps.length === 0) return <Buit senseClaus={slugs.length === 0} />;

  const informen = r.apps.filter(a => a.ultimaHora);
  const tokensTotal = totalTokens(r.total.tokens);
  const sensePreu = [...new Set(r.apps.flatMap(a => a.sensePreu))];
  const mes = ara.toLocaleDateString("ca-ES", { month: "long", timeZone: ZONA });
  const [pa, pm, pd] = PREUS_COMPROVATS_EL.split("-");

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Activitat</h1>
          <p className="panel-sub">
            Usuaris actius i tokens d'IA que informa cada app · actualitzat{" "}
            {ara.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit", timeZone: ZONA })}
          </p>
        </div>
        <div className="panel-accions">
          <a href="/panel/activitat" className="btn btn-outline">Actualitzar</a>
        </div>
      </div>

      {r.callades.length > 0 && (
        <div className="panel-avis">
          <strong>
            {r.callades.length === 1 ? "Una app fa" : `${r.callades.length} apps fan`} més de {HORES_SILENCI} hores
            lectives que no envien res
          </strong>
          <ul>
            {r.callades.map(a => (
              <li key={a.slug}>
                <b>{a.nom}</b>: últim informe {fmtUltima(a.ultimaHora, avui)} ({a.enviament.hores} hores lectives)
              </li>
            ))}
            <li>
              Les apps només envien quan hi ha entrat algú: o no l'ha fet servir ningú, o l'enviament ha deixat
              de funcionar. Des d'aquí no es pot distingir; a Tràfic es veu si hi arriben peticions.
            </li>
          </ul>
        </div>
      )}

      <div className="panel-stats">
        <div className="pstat" title={`Persones actives ${franja(r.referencia)}, sumant totes les apps`}>
          <span className="pstat-n">{enter(r.total.actiusHora)}</span>
          <span className="pstat-k">Actius {franja(r.referencia)}</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{enter(r.total.actiusAvui)}</span><span className="pstat-k">Actius avui</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{curt(tokensTotal, 1)}</span><span className="pstat-k">Tokens d'IA · {mes}</span>
        </div>
        <div className="pstat">
          <span className="pstat-n">{dinersCurt(r.total.cost)}</span><span className="pstat-k">Cost d'IA estimat</span>
        </div>
        <div className={"pstat" + (r.callades.length ? " is-wait" : "")}>
          <span className="pstat-n">{informen.length}<small className="fon-de">/{r.apps.length}</small></span>
          <span className="pstat-k">Apps que informen</span>
        </div>
      </div>

      <p className="panel-nota">
        Cada app envia aquí, un cop per hora i només si hi ha entrat algú, <b>quantes persones</b> han estat actives
        i <b>quants tokens d'IA</b> ha gastat, per domini de centre. Només xifres: ni noms ni correus. Aquest panell
        no consulta mai cap app. Els totals sumen les apps: <b>qui entra a dues apps hi compta dues vegades</b>.
        El cost de la IA el facturen Anthropic i Google a part de Railway; aquí s'estima amb els preus públics
        comprovats el {Number(pd)}/{Number(pm)}/{pa}.{" "}
        {taxa
          ? <>Facturen en dòlars; aquí va <b>en euros</b>, al canvi de referència del Banc Central
            Europeu{canvi.data ? <> del {fmtDia(canvi.data)}</> : null} (1 $ = {taxa.toLocaleString("ca-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €).
            El banc hi aplica el seu canvi i la seva comissió, així que el càrrec real pot variar una mica. </>
          : <>Imports en dòlars: no s'ha pogut llegir el canvi a euros d'avui. </>}
        El cost de Railway és a <a href="/panel/infraestructura">Infraestructura</a>.
      </p>

      {/* ---------- Per app ---------- */}
      <section className="panel-sec">
        <div className="panel-sec-head">
          <h2>Per app</h2>
          <span className="graf-llegenda"><span className="ll ll-ok" /> actius per dia, últims 30 dies</span>
        </div>
        <div className="scrollx">
          <table className="ptable">
            <thead>
              <tr>
                <th scope="col">App</th>
                <th scope="col" className="r">Última hora</th>
                <th scope="col" className="r">Avui</th>
                <th scope="col">30 dies</th>
                <th scope="col" className="r">Pic</th>
                <th scope="col" className="r">Tokens · {mes}</th>
                <th scope="col" className="r">Cost estimat</th>
              </tr>
            </thead>
            <tbody>
              {r.apps.map(a => (
                <tr key={a.slug}>
                  <td>
                    <a href={`#act-${a.slug}`}>{a.nom}</a> <Enviament app={a} />
                    {a.sensePreu.length > 0 && <> <span className="pbadge off">Model sense preu</span></>}
                    {a.ultimaHora && <div className="papp-desc">Últim informe: {fmtUltima(a.ultimaHora, avui)}</div>}
                  </td>
                  <td className="r n">{a.ultimaHora ? enter(a.actiusHora) : "—"}</td>
                  <td className="r n">{a.ultimaHora ? enter(a.actiusAvui) : "—"}</td>
                  <td>{a.ultimaHora ? <Barres serie={a.serie} etiqueta={`Actius per dia de ${a.nom}, últims 30 dies`} /> : "—"}</td>
                  <td className="r n">{a.ultimaHora ? enter(a.pic) : "—"}</td>
                  <td className="r n" title={`Entrada ${enter(a.tokens.e + a.tokens.l + a.tokens.w)} · sortida ${enter(a.tokens.s)}`}>
                    {a.ultimaHora ? curt(totalTokens(a.tokens)) : "—"}
                  </td>
                  <td className="r n">{a.ultimaHora ? diners(a.cost) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td className="r n">{enter(r.total.actiusHora)}</td>
                <td className="r n">{enter(r.total.actiusAvui)}</td>
                <td><Barres serie={r.total.serie} etiqueta="Actius per dia de totes les apps, últims 30 dies" /></td>
                <td className="r n">{enter(Math.max(...r.total.serie, 0))}</td>
                <td className="r n">{curt(tokensTotal)}</td>
                <td className="r n">{diners(r.total.cost)}</td>
              </tr>
              {taxa && (
                <tr>
                  <td colSpan={6}>Total en dòlars, que és com cobren Anthropic i Google</td>
                  <td className="r n">{usd(r.total.cost)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
        {sensePreu.length > 0 && (
          <p className="panel-nota" style={{ marginTop: "1rem" }}>
            Hi ha tokens de models que no són a la taula de preus i no entren al cost:{" "}
            {sensePreu.map((m, i) => <span key={m}>{i > 0 && ", "}<code>{m}</code></span>)}. S'afegeixen a{" "}
            <code>lib/preus-ia.mjs</code>.
          </p>
        )}
      </section>

      {/* ---------- Per domini de centre, dins de cada app ---------- */}
      <section className="panel-sec">
        <div className="panel-sec-head"><h2>Per domini de centre</h2></div>
        <p className="panel-nota">
          El domini és el del compte de Google del centre. Un domini amb menys de {MINIM_PER_DOMINI} persones
          en tot el dia no surt amb el seu nom: compta dins d'«{ALTRES}», perquè la xifra no assenyali ningú.
          «Dies actius» i «pic» són dels últims 30 dies.
        </p>
        {informen.length === 0 && <p className="papp-buit">Encara no ha arribat cap informe.</p>}
        {/* minmax(0, 1fr): sense aixo, la taula de dins eixampla la graella mes enlla de la pagina. */}
        <div className="fon-detalls" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          {informen.map(a => (
            <details key={a.slug} id={`act-${a.slug}`} className="fon-detall" open={informen.length <= 3}>
              <summary>
                <span className="fon-detall-nom">{a.nom}</span>
                <span className="fon-meta" style={{ marginTop: 0 }}>
                  {a.dominis.length === 1 ? "1 domini" : `${a.dominis.length} dominis`} · {enter(a.actiusAvui)} actius avui ·{" "}
                  {diners(a.cost)}
                </span>
              </summary>
              <div className="fon-detall-cos">
                <div className="scrollx">
                  <table className="ptable">
                    <thead>
                      <tr>
                        {/* La primera columna porta els models a sota: li cal amplada. */}
                        <th scope="col" style={{ width: "42%" }}>Domini i models</th>
                        <th scope="col" className="r">Última hora</th>
                        <th scope="col" className="r">Avui</th>
                        <th scope="col" className="r">Dies actius</th>
                        <th scope="col" className="r">Pic</th>
                        <th scope="col" className="r">Tokens · {mes}</th>
                        <th scope="col" className="r">Cost estimat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.dominis.map(d => (
                        <tr key={d.domini}>
                          <td>
                            <Domini nom={d.domini} />
                            {d.models.length > 0 && (
                              <div className="papp-desc">
                                {d.models.map((m, i) => (
                                  <span key={m.model}>
                                    {i > 0 && " · "}
                                    <span style={{ whiteSpace: "nowrap" }}>
                                      {m.model} {curt(totalTokens(m.tokens))}
                                      {!m.ambPreu && " (sense preu)"}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="r n">{enter(d.actiusHora)}</td>
                          <td className="r n">{enter(d.actiusAvui)}</td>
                          <td className="r n">{d.diesActius}</td>
                          <td className="r n">{enter(d.pic)}</td>
                          <td className="r n">{curt(totalTokens(d.tokens))}</td>
                          <td className="r n">{diners(d.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- Per centre, totes les apps ---------- */}
      {r.perCentre.length > 0 && (
        <section className="panel-sec">
          <div className="panel-sec-head"><h2>Què fa servir cada centre</h2></div>
          <div className="scrollx">
            <table className="ptable">
              <thead>
                <tr>
                  <th scope="col">Domini</th>
                  <th scope="col">Apps i actius avui</th>
                  <th scope="col" className="r">Tokens · {mes}</th>
                  <th scope="col" className="r">Cost estimat</th>
                </tr>
              </thead>
              <tbody>
                {r.perCentre.map(c => (
                  <tr key={c.domini}>
                    <td><Domini nom={c.domini} /></td>
                    <td>
                      {c.apps.map((x, i) => (
                        <span key={x.slug}>{i > 0 && " · "}{x.nom} <b>{enter(x.actiusAvui)}</b></span>
                      ))}
                    </td>
                    <td className="r n">{curt(totalTokens(c.tokens))}</td>
                    <td className="r n">{diners(c.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="panel-nota" style={{ marginTop: "2.5rem" }}>
        «Actiu» vol dir una persona amb sessió que ha fet alguna cosa a l'app dins d'aquella hora; «avui» és el
        dia de Catalunya. L'última hora és l'última tancada, amb deu minuts de marge perquè arribin els informes.
        {r.senseEstrenar.length > 0 && (
          <> Tenen clau però encara no han enviat res en 45 dies: <b>{r.senseEstrenar.map(a => a.nom).join(", ")}</b>.</>
        )}
        {r.senseClau.length > 0 && (
          <> Encara no hi estan connectades {r.senseClau.length} apps del catàleg: {r.senseClau.map(a => a.nom).join(", ")}.</>
        )}{" "}
        Com connectar-ne una: <code>docs/informe-activitat.md</code>.
      </p>
    </div>
  );
}
