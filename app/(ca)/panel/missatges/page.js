import Link from "next/link";
import { llistarMissatges, comptarMissatges } from "../../../../lib/db";
import apps from "../../../../data/apps.json";

export const metadata = {
  title: "Missatges",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ESTATS = {
  pendent: { text: "Pendent", cls: "wait" },
  respost: { text: "Respost", cls: "ok" },
  arxivat: { text: "Arxivat", cls: "off" },
};

const TIPUS = { dubte: "Dubte", incidencia: "Incidència", collaboracio: "Col·laboració" };
const PERFILS = { docent: "Docent", direccio: "Direcció o coordinació", altre: "Una altra persona" };
const VIES = { buscador: "Buscador", recomanacio: "Recomanació", xarxes: "Xarxes", blog: "Blog", altre: "Altres" };

const MISSATGES = {
  "fet:respost": "Marcat com a respost.",
  "fet:arxivar": "Arxivat.",
  "fet:pendent": "Tornat a pendent.",
  "fet:esborrar": "Missatge esborrat.",
  "error:peticio": "Petició no vàlida.",
  "error:nofound": "Aquest missatge ja no hi és.",
  "error:desar": "No s'ha pogut desar. Mira els registres del servei.",
};

function data(iso) {
  return new Date(iso).toLocaleString("ca-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const nomApp = slug => apps.find(a => a.slug === slug)?.nom || slug;

export default async function MissatgesPage({ searchParams }) {
  const sp = await searchParams;
  const filtre = {
    estat: Object.keys(ESTATS).includes(sp?.estat) ? sp.estat : null,
    tipus: Object.keys(TIPUS).includes(sp?.tipus) ? sp.tipus : null,
  };

  let missatges = [], comptes = {}, error = null;
  try {
    [missatges, comptes] = await Promise.all([llistarMissatges(filtre), comptarMissatges()]);
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="panel">
        <h1>Missatges</h1>
        <div className="panel-error-box"><strong>No s'ha pogut llegir la base de dades</strong><p>{error}</p></div>
      </div>
    );
  }

  const enllac = extra => {
    const s = new URLSearchParams(Object.entries({ ...filtre, ...extra }).filter(([, v]) => v)).toString();
    return "/panel/missatges" + (s ? "?" + s : "");
  };
  const total = Object.values(comptes).reduce((a, b) => a + b, 0);
  const avis = MISSATGES[(sp?.fet ? "fet:" + sp.fet : "error:" + sp?.error)] || null;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Missatges</h1>
          <p className="panel-sub">Dubtes, incidències i col·laboracions de l'assistent del web</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/panel" className="btn btn-outline">Tornar al panell</Link>
        </div>
      </div>

      {avis && <p className={sp?.error ? "alta-error" : "panel-hint"}>{avis}</p>}

      <div className="panel-stats">
        <div className="pstat"><span className="pstat-n">{total}</span><span className="pstat-k">Total</span></div>
        <div className={"pstat" + (comptes.pendent > 0 ? " is-wait" : "")}><span className="pstat-n">{comptes.pendent}</span><span className="pstat-k">Pendents</span></div>
        <div className="pstat"><span className="pstat-n">{comptes.respost}</span><span className="pstat-k">Respostos</span></div>
        <div className="pstat"><span className="pstat-n">{comptes.arxivat}</span><span className="pstat-k">Arxivats</span></div>
      </div>

      <div className="periodes">
        <Link href={enllac({ estat: null })} className={"periode" + (!filtre.estat ? " is-actiu" : "")}>Tots</Link>
        {Object.entries(ESTATS).map(([k, e]) => (
          <Link key={k} href={enllac({ estat: k })} className={"periode" + (filtre.estat === k ? " is-actiu" : "")}>{e.text}</Link>
        ))}
      </div>
      <div className="periodes">
        <strong style={{ paddingRight: "1rem" }}>Tipus:</strong>
        <Link href={enllac({ tipus: null })} className={"periode" + (!filtre.tipus ? " is-actiu" : "")}>Tots</Link>
        {Object.entries(TIPUS).map(([k, t]) => (
          <Link key={k} href={enllac({ tipus: k })} className={"periode" + (filtre.tipus === k ? " is-actiu" : "")}>{t}</Link>
        ))}
      </div>

      {missatges.length === 0 && (
        <div className="panel-buit">
          <p><strong>Cap missatge amb aquests filtres.</strong></p>
          <p>Quan algú escrigui des de l'assistent del web, el veuràs aquí i et n'arribarà l'avís per correu.</p>
        </div>
      )}

      <div className="panel-list">
        {missatges.map(m => {
          const e = ESTATS[m.estat] || { text: m.estat, cls: "off" };
          const assumpte = encodeURIComponent("Re: el teu missatge a aulaia.cat");
          return (
            <article key={m.id} className="alta-fitxa">
              <div className="alta-fitxa-head">
                <div>
                  <h2>{m.nom}{m.centre ? ` · ${m.centre}` : ""}</h2>
                  <p className="alta-fitxa-sub">
                    {TIPUS[m.tipus] || m.tipus} · {data(m.creat_el)}
                    {m.perfil ? ` · ${PERFILS[m.perfil] || m.perfil}` : ""}
                    {m.via ? ` · via ${VIES[m.via] || m.via}` : ""}
                  </p>
                </div>
                <span className={"pbadge " + e.cls}>{e.text}</span>
              </div>
              {m.apps?.length > 0 && <p className="alta-fitxa-sub">Apps: {m.apps.map(nomApp).join(", ")}</p>}
              <p style={{ whiteSpace: "pre-wrap", margin: "0.6rem 0" }}>{m.text}</p>
              <p><a href={`mailto:${m.correu}?subject=${assumpte}`}>{m.correu}</a></p>
              <form method="POST" action="/api/panel/missatges" className="alta-accions">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="fEstat" value={filtre.estat || ""} />
                <input type="hidden" name="fTipus" value={filtre.tipus || ""} />
                {m.estat !== "respost" && <button type="submit" name="accio" value="respost" className="btn btn-primary">Marcar respost</button>}
                {m.estat !== "arxivat" && <button type="submit" name="accio" value="arxivar" className="btn btn-outline">Arxivar</button>}
                {m.estat !== "pendent" && <button type="submit" name="accio" value="pendent" className="btn btn-outline">Tornar a pendent</button>}
              </form>
              <form method="POST" action="/api/panel/missatges" className="alta-esborrar">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="fEstat" value={filtre.estat || ""} />
                <input type="hidden" name="fTipus" value={filtre.tipus || ""} />
                <button type="submit" name="accio" value="esborrar">Esborrar missatge</button>
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
