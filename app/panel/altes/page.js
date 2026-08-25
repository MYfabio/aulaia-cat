import Link from "next/link";
import { llistarSolicituds, comptarPerEstat } from "../../../lib/db";
import apps from "../../../data/apps.json";

export const metadata = {
  title: "Altes de centres",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ESTATS = {
  pendent:   { text: "Pendent",   cls: "wait" },
  validada:  { text: "Validada",  cls: "ok" },
  rebutjada: { text: "Rebutjada", cls: "off" },
};

const nomApp = slug => apps.find(a => a.slug === slug)?.nom || slug;

function quan(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 60) return `fa ${Math.max(1, min)} min`;
  if (min < 1440) return `fa ${Math.floor(min / 60)} h`;
  const dies = Math.floor(min / 1440);
  if (dies < 30) return `fa ${dies} dies`;
  return d.toLocaleDateString("ca-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AltesPage({ searchParams }) {
  const sp = await searchParams;
  const filtre = ["pendent", "validada", "rebutjada"].includes(sp?.estat) ? sp.estat : null;

  let solicituds = [];
  let comptes = { pendent: 0, validada: 0, rebutjada: 0 };
  let error = null;
  try {
    [solicituds, comptes] = await Promise.all([llistarSolicituds(filtre), comptarPerEstat()]);
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <div className="panel">
        <h1>Altes de centres</h1>
        <div className="panel-error-box">
          <strong>No s ha pogut llegir la base de dades</strong>
          <p>{error}</p>
          <p className="panel-hint">
            Comprova que el servei té <code>DATABASE_URL</code> apuntant al Postgres del projecte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Altes de centres</h1>
          <p className="panel-sub">Sol·licituds rebudes des del formulari únic</p>
        </div>
        <Link href="/panel" className="btn btn-outline">Tornar al panell</Link>
      </div>

      <div className="panel-stats">
        <div className={"pstat" + (comptes.pendent > 0 ? " is-wait" : "")}>
          <span className="pstat-n">{comptes.pendent}</span><span className="pstat-k">Pendents</span>
        </div>
        <div className="pstat"><span className="pstat-n">{comptes.validada}</span><span className="pstat-k">Validades</span></div>
        <div className="pstat"><span className="pstat-n">{comptes.rebutjada}</span><span className="pstat-k">Rebutjades</span></div>
      </div>

      <div className="periodes">
        <Link href="/panel/altes" className={"periode" + (!filtre ? " is-actiu" : "")}>Totes</Link>
        <Link href="/panel/altes?estat=pendent" className={"periode" + (filtre === "pendent" ? " is-actiu" : "")}>Pendents</Link>
        <Link href="/panel/altes?estat=validada" className={"periode" + (filtre === "validada" ? " is-actiu" : "")}>Validades</Link>
        <Link href="/panel/altes?estat=rebutjada" className={"periode" + (filtre === "rebutjada" ? " is-actiu" : "")}>Rebutjades</Link>
      </div>

      {solicituds.length === 0 && (
        <div className="panel-buit">
          <p><strong>Encara no hi ha cap sol·licitud{filtre ? ` ${filtre}` : ""}.</strong></p>
          <p>
            El formulari està a <Link href="/alta">aulaia.cat/alta</Link>. Enllaça-hi des del botó
            de «demana accés» de cada app amb <code>?app=el-slug</code> perquè arribi ja triada.
          </p>
        </div>
      )}

      <div className="panel-list">
        {solicituds.map(s => {
          const e = ESTATS[s.estat] || { text: s.estat, cls: "off" };
          return (
            <article key={s.id} className="alta-fitxa">
              <div className="alta-fitxa-head">
                <div>
                  <h2>{s.centre}</h2>
                  <p className="alta-fitxa-sub">
                    {nomApp(s.app)} · {quan(s.creada_el)}
                    {s.localitat ? ` · ${s.localitat}` : ""}
                    {s.codi_centre ? ` · codi ${s.codi_centre}` : ""}
                  </p>
                </div>
                <span className={"pbadge " + e.cls}>{e.text}</span>
              </div>

              <dl className="alta-dades">
                <div><dt>Contacte</dt><dd>{s.contacte_nom} · {s.contacte_rol}</dd></div>
                <div>
                  <dt>Correu</dt>
                  <dd><a href={`mailto:${s.contacte_email}`}>{s.contacte_email}</a></dd>
                </div>
              </dl>

              {s.missatge && <p className="alta-missatge">{s.missatge}</p>}

              {s.estat === "pendent" && (
                <form method="POST" action="/api/panel/altes" className="alta-accions">
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" name="accio" value="validar" className="btn btn-primary">
                    Validar i avisar
                  </button>
                  <button type="submit" name="accio" value="rebutjar" className="btn btn-outline">
                    Rebutjar
                  </button>
                </form>
              )}

              {s.estat !== "pendent" && s.resolta_el && (
                <p className="alta-resolta">Resolta {quan(s.resolta_el)}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
