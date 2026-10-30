import Link from "next/link";
import { llistarContactes, comptarContactes, comarquesDeContactes, eventsDeContactes } from "../../../../lib/db";

export const metadata = {
  title: "Contactes",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ESTATS = {
  pendent:    { text: "Pendent",    cls: "wait" },
  enviat:     { text: "Enviat",     cls: "wait" },
  respost:    { text: "Ha respost", cls: "ok" },
  interessat: { text: "Interessat", cls: "ok" },
  baixa:      { text: "Baixa",      cls: "off" },
};

const TIPUS = { crp: "CRP", servei: "Servei educatiu", centre: "Centre", altre: "Altre" };

const MISSATGES = {
  "info:afegit": "Contacte afegit.",
  "info:esborrat": "Contacte esborrat.",
  "error:repetit": "Aquest correu ja hi era.",
  "error:dades": "Falta el nom o el correu no és vàlid.",
  "error:desar": "No s'ha pogut desar. Mira els registres del servei.",
  "error:peticio": "Petició no vàlida.",
};

function avis(sp) {
  const info = sp?.info;
  if (info?.startsWith("importats-")) {
    const [, nous, , llegits] = info.split("-");
    return `Importació feta: ${nous} contactes nous (${llegits} centres al directori).`;
  }
  if (info?.startsWith("llavor-")) return `Llista inicial: ${info.split("-")[1]} contactes nous, marcats com a enviats.`;
  if (sp?.fet) return "Desat.";
  return MISSATGES["info:" + info] || MISSATGES["error:" + sp?.error] || null;
}

function data(iso) {
  return new Date(iso).toLocaleDateString("ca-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ContactesPage({ searchParams }) {
  const sp = await searchParams;
  const filtre = {
    estat: Object.keys(ESTATS).includes(sp?.estat) ? sp.estat : null,
    tipus: Object.keys(TIPUS).includes(sp?.tipus) ? sp.tipus : null,
    comarca: typeof sp?.comarca === "string" && sp.comarca ? sp.comarca : null,
    q: typeof sp?.q === "string" && sp.q.trim() ? sp.q.trim() : null,
  };

  let contactes = [], comptes = {}, comarques = [], events = [], error = null;
  try {
    [contactes, comptes, comarques] = await Promise.all([llistarContactes(filtre), comptarContactes(), comarquesDeContactes()]);
    events = await eventsDeContactes(contactes.map(c => c.id));
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="panel">
        <h1>Contactes</h1>
        <div className="panel-error-box"><strong>No s'ha pogut llegir la base de dades</strong><p>{error}</p></div>
      </div>
    );
  }

  const perContacte = new Map();
  for (const e of events) {
    if (!perContacte.has(e.contacte_id)) perContacte.set(e.contacte_id, []);
    perContacte.get(e.contacte_id).push(e);
  }

  const qs = new URLSearchParams(Object.entries(filtre).filter(([, v]) => v)).toString();
  const tornar = qs ? "?" + qs : "";
  const enllac = extra => {
    const p = new URLSearchParams(Object.entries({ ...filtre, ...extra }).filter(([, v]) => v));
    const s = p.toString();
    return "/panel/contactes" + (s ? "?" + s : "");
  };
  const total = Object.values(comptes).reduce((a, b) => a + b, 0);
  const missatge = avis(sp);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Contactes</h1>
          <p className="panel-sub">CRP, serveis educatius i centres als quals presentem el projecte</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a href={"/api/panel/contactes" + tornar} className="btn btn-outline">Exportar CSV</a>
          <Link href="/panel" className="btn btn-outline">Tornar al panell</Link>
        </div>
      </div>

      {missatge && <p className={sp?.error ? "alta-error" : "panel-hint"}>{missatge}</p>}

      <div className="panel-stats">
        <div className="pstat"><span className="pstat-n">{total}</span><span className="pstat-k">Total</span></div>
        <div className="pstat"><span className="pstat-n">{comptes.pendent}</span><span className="pstat-k">Pendents</span></div>
        <div className="pstat"><span className="pstat-n">{comptes.enviat}</span><span className="pstat-k">Enviats</span></div>
        <div className={"pstat" + (comptes.respost > 0 ? " is-wait" : "")}><span className="pstat-n">{comptes.respost}</span><span className="pstat-k">Han respost</span></div>
        <div className="pstat"><span className="pstat-n">{comptes.interessat}</span><span className="pstat-k">Interessats</span></div>
        <div className="pstat"><span className="pstat-n">{comptes.baixa}</span><span className="pstat-k">Baixes</span></div>
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

      <form method="GET" className="alta-accions" style={{ flexWrap: "wrap" }}>
        {filtre.estat && <input type="hidden" name="estat" value={filtre.estat} />}
        {filtre.tipus && <input type="hidden" name="tipus" value={filtre.tipus} />}
        <select name="comarca" defaultValue={filtre.comarca || ""} aria-label="Comarca">
          <option value="">Totes les comarques</option>
          {comarques.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="search" name="q" defaultValue={filtre.q || ""} placeholder="Cerca per nom, municipi o correu" aria-label="Cerca" style={{ minWidth: "16rem" }} />
        <button type="submit" className="btn btn-outline">Filtrar</button>
      </form>

      <details className="alta-fitxa" style={{ marginTop: "1rem" }}>
        <summary><strong>Carregar contactes</strong></summary>
        <form method="POST" action="/api/panel/contactes" className="alta-accions" style={{ flexWrap: "wrap", marginTop: "0.75rem" }}>
          <input type="hidden" name="tornar" value={tornar} />
          <input type="text" name="comarca" placeholder="Comarca (buit = tot Catalunya)" aria-label="Comarca a importar" style={{ minWidth: "16rem" }} />
          <button type="submit" name="accio" value="importar" className="btn btn-primary">Importar centres públics</button>
          <button type="submit" name="accio" value="llavor" className="btn btn-outline">Carregar CRP ja enviats</button>
        </form>
        <p className="panel-hint">Els centres surten del directori oficial de centres docents (Dades obertes de la Generalitat), només públics i amb el correu institucional del centre. Es pot repetir sense duplicar.</p>
        <form method="POST" action="/api/panel/contactes" className="alta-accions" style={{ flexWrap: "wrap", marginTop: "0.75rem" }}>
          <input type="hidden" name="tornar" value={tornar} />
          <input type="text" name="nom" placeholder="Nom" required aria-label="Nom" />
          <input type="email" name="correu" placeholder="Correu" required aria-label="Correu" />
          <input type="text" name="municipi" placeholder="Municipi" aria-label="Municipi" />
          <input type="text" name="comarca" placeholder="Comarca" aria-label="Comarca" />
          <select name="tipus" aria-label="Tipus"><option value="crp">CRP</option><option value="servei">Servei educatiu</option><option value="centre">Centre</option><option value="altre">Altre</option></select>
          <button type="submit" name="accio" value="afegir" className="btn btn-outline">Afegir a mà</button>
        </form>
      </details>

      {contactes.length === 0 && (
        <div className="panel-buit">
          <p><strong>Cap contacte amb aquests filtres.</strong></p>
          <p>Obre «Carregar contactes» per importar els centres públics o carregar els CRP ja enviats.</p>
        </div>
      )}
      {contactes.length === 400 && <p className="panel-hint">Es mostren els primers 400. Filtra per comarca o estat per veure'n d'altres.</p>}

      <div className="panel-list">
        {contactes.map(c => {
          const e = ESTATS[c.estat] || { text: c.estat, cls: "off" };
          const moviments = (perContacte.get(c.id) || []).slice(0, 3);
          return (
            <article key={c.id} className="alta-fitxa">
              <div className="alta-fitxa-head">
                <div>
                  <h2>{c.nom}</h2>
                  <p className="alta-fitxa-sub">
                    {TIPUS[c.tipus] || c.tipus}
                    {c.municipi ? ` · ${c.municipi}` : ""}{c.comarca ? ` (${c.comarca})` : ""}
                    {c.codi_centre ? ` · codi ${c.codi_centre}` : ""}
                  </p>
                </div>
                <span className={"pbadge " + e.cls}>{e.text}</span>
              </div>
              <p><a href={`mailto:${c.correu}`}>{c.correu}</a></p>
              {moviments.length > 0 && (
                <ul className="panel-hint" style={{ margin: "0.4rem 0", paddingLeft: "1.1rem" }}>
                  {moviments.map(m => <li key={m.id}>{data(m.quan)} · {m.tipus === "enviat" ? "Enviat" : m.tipus === "resposta" ? "Resposta" : "Nota"}{m.text ? `: ${m.text}` : ""}</li>)}
                </ul>
              )}
              <form method="POST" action="/api/panel/contactes" className="alta-accions" style={{ flexWrap: "wrap" }}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="tornar" value={tornar} />
                <input type="text" name="text" placeholder="Nota o resum de la resposta (opcional)" aria-label="Nota" style={{ minWidth: "18rem", flex: 1 }} />
                <button type="submit" name="accio" value="enviat" className="btn btn-primary">Marcar enviat</button>
                <button type="submit" name="accio" value="resposta" className="btn btn-outline">Ha respost</button>
                <button type="submit" name="accio" value="interessat" className="btn btn-outline">Interessat</button>
                <button type="submit" name="accio" value="baixa" className="btn btn-outline">Baixa</button>
                <button type="submit" name="accio" value="nota" className="btn btn-outline">Només nota</button>
              </form>
              <form method="POST" action="/api/panel/contactes" className="alta-esborrar">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="tornar" value={tornar} />
                <button type="submit" name="accio" value="esborrar">Esborrar contacte</button>
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
