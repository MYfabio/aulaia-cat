import Link from "next/link";
import { getPanelData } from "../../../lib/railway";
import { comptarPerEstat, comptarMissatges, comptarContactes } from "../../../lib/db";
import { getSeoData, teClaus } from "../../../lib/search-console";
import { Anell, Mini } from "./grafics";

export const metadata = {
  title: "Resum del panell",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Una font que falla no ha de tombar el resum: es mostra com a "sense dades". */
async function intenta(fn) {
  try { return await fn(); } catch { return null; }
}

const enter = n => (n ?? 0).toLocaleString("ca-ES");

function delta(ara, abans) {
  if (abans == null || abans === 0) return null;
  const v = ((ara - abans) / abans) * 100;
  if (Math.abs(v) < 1) return { text: "igual", cls: "pla" };
  return { text: (v > 0 ? "+" : "") + v.toFixed(0) + " %", cls: v > 0 ? "puja" : "baixa" };
}

const percent = (part, total) => (total > 0 ? (part / total) * 100 : null);
const mitjana = valors => {
  const v = valors.filter(x => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

function Targeta({ titol, valor, href, canvi, serie, nota, to }) {
  const cos = (
    <>
      <span className="kpi-k">{titol}</span>
      <span className="kpi-v">
        {valor}
        {canvi && <em className={"kpi-d " + canvi.cls}>{canvi.text}</em>}
      </span>
      {serie ? <Mini serie={serie} etiqueta={`Evolucio: ${titol}`} /> : nota && <span className="kpi-nota">{nota}</span>}
    </>
  );
  return href
    ? <Link href={href} className={"kpi" + (to ? " is-" + to : "")}>{cos}</Link>
    : <div className={"kpi" + (to ? " is-" + to : "")}>{cos}</div>;
}

function Mini3({ valor, titol, canvi }) {
  return (
    <div className="mini3">
      <Anell valor={valor} mida={78} gruix={9} etiqueta={titol} />
      <div>
        <b>{titol}</b>
        {canvi && <span>{canvi}</span>}
      </div>
    </div>
  );
}

export default async function ResumPage() {
  const [railway, altes, missatges, contactes, seo] = await Promise.all([
    intenta(getPanelData),
    intenta(comptarPerEstat),
    intenta(comptarMissatges),
    intenta(comptarContactes),
    intenta(() => (teClaus() ? getSeoData(28) : null)),
  ]);

  // ---------- Infraestructura ----------
  const serveis = railway ? railway.apps.flatMap(a => a.services.map(s => ({ ...s, app: a.name }))) : [];
  const amb = serveis.filter(s => s.deploy);
  const actius = amb.filter(s => s.deploy.status === "SUCCESS").length;
  const caiguts = amb.filter(s => ["FAILED", "CRASHED"].includes(s.deploy.status));
  const certs = serveis.flatMap(s => (s.customDomains || []).map(d => ({ app: s.app, ...d })));
  const certsOk = certs.filter(c => c.cert === "CERTIFICATE_STATUS_TYPE_VALID").length;
  const certsPendents = certs.filter(c => c.cert !== "CERTIFICATE_STATUS_TYPE_VALID");

  const pctServeis = railway ? percent(actius, amb.length) : null;
  const pctCerts = railway ? percent(certsOk, certs.length) : null;
  const totalAltes = altes ? altes.pendent + altes.validada + altes.rebutjada : 0;
  const pctAltes = altes ? percent(altes.validada + altes.rebutjada, totalAltes) : null;
  const salut = mitjana([pctServeis, pctCerts, pctAltes]);

  // ---------- Cerca a Google ----------
  const llocsSeo = seo?.llocs?.filter(l => !l.error) ?? [];
  const clics = llocsSeo.reduce((n, l) => n + l.clicks, 0);
  const impr = llocsSeo.reduce((n, l) => n + l.impressions, 0);
  const clicsAbans = llocsSeo.every(l => l.abans) && llocsSeo.length ? llocsSeo.reduce((n, l) => n + l.abans.clicks, 0) : null;
  const imprAbans = llocsSeo.every(l => l.abans) && llocsSeo.length ? llocsSeo.reduce((n, l) => n + l.abans.impressions, 0) : null;
  const perDia = new Map();
  for (const l of llocsSeo) {
    for (const p of l.serie || []) {
      const x = perDia.get(p.data) || { clicks: 0, impressions: 0 };
      x.clicks += p.clicks; x.impressions += p.impressions;
      perDia.set(p.data, x);
    }
  }
  const dies = [...perDia.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v);

  // ---------- Avisos ----------
  const avisos = [];
  for (const s of caiguts) avisos.push({ nivell: "bad", etiqueta: "Infraestructura", text: `${s.app} / ${s.name}: ultim desplegament fallat`, href: "/panel/infraestructura" });
  for (const c of certsPendents) avisos.push({ nivell: "wait", etiqueta: "Infraestructura", text: `Certificat pendent a ${c.domain} (${c.app})`, href: "/panel/infraestructura" });
  if (altes?.pendent) avisos.push({ nivell: "wait", etiqueta: "Gestio", text: `${altes.pendent} sol·licitud${altes.pendent > 1 ? "s" : ""} d alta pendent${altes.pendent > 1 ? "s" : ""} de validar`, href: "/panel/altes" });
  if (missatges?.pendent) avisos.push({ nivell: "wait", etiqueta: "Gestio", text: `${missatges.pendent} missatge${missatges.pendent > 1 ? "s" : ""} de l assistent sense respondre`, href: "/panel/missatges" });
  for (const l of seo?.llocs?.filter(l => l.error) ?? []) avisos.push({ nivell: "bad", etiqueta: "Cerca", text: `Search Console no respon per a ${l.siteUrl}`, href: "/panel/seo" });
  if (!railway) avisos.push({ nivell: "bad", etiqueta: "Infraestructura", text: "No s han pogut llegir les dades de Railway", href: "/panel/infraestructura" });
  if (!altes) avisos.push({ nivell: "bad", etiqueta: "Gestio", text: "No hi ha connexio amb la base de dades", href: "/panel/altes" });
  if (!teClaus()) avisos.push({ nivell: "info", etiqueta: "Cerca", text: "Search Console encara no esta connectat", href: "/panel/seo" });

  const contactesTotal = contactes ? Object.values(contactes).reduce((a, b) => a + b, 0) : null;

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Resum</h1>
          <p className="panel-sub">
            {railway?.workspace ? railway.workspace + " · " : ""}actualitzat {new Date().toLocaleTimeString("ca-ES", { timeZone: "Europe/Madrid" })}
          </p>
        </div>
        <div className="panel-accions"><Link href="/panel" className="btn btn-outline">Actualitzar</Link></div>
      </div>

      {/* Salut global + tres anells, com a la captura de referencia */}
      <section className="salut">
        <div className="salut-esq">
          <p className="eyebrow">Salut de l ecosistema</p>
          <Anell valor={salut} mida={190} gruix={20} etiqueta="Salut global" subtitol="mitjana de 3 indicadors" />
        </div>
        <div className="salut-dre">
          <Mini3 valor={pctServeis} titol="Serveis actius" canvi={railway ? `${actius} de ${amb.length}` : "sense dades"} />
          <Mini3 valor={pctCerts} titol="Certificats valids" canvi={railway ? `${certsOk} de ${certs.length}` : "sense dades"} />
          <Mini3 valor={pctAltes} titol="Altes ateses" canvi={altes ? `${altes.validada + altes.rebutjada} de ${totalAltes}` : "sense dades"} />
        </div>
      </section>

      <div className="kpis">
        <Targeta titol="Clics a Google (28 d)" valor={seo ? enter(clics) : "—"} canvi={delta(clics, clicsAbans)}
                 serie={dies.length > 1 ? dies.map(d => d.clicks) : null} href="/panel/seo" nota="Sense connexio" />
        <Targeta titol="Impressions (28 d)" valor={seo ? enter(impr) : "—"} canvi={delta(impr, imprAbans)}
                 serie={dies.length > 1 ? dies.map(d => d.impressions) : null} href="/panel/seo" nota="Sense connexio" />
        <Targeta titol="Altes pendents" valor={altes ? enter(altes.pendent) : "—"} to={altes?.pendent ? "wait" : undefined}
                 href="/panel/altes" nota={altes ? `${enter(altes.validada)} validades` : "Sense dades"} />
        <Targeta titol="Missatges sense respondre" valor={missatges ? enter(missatges.pendent) : "—"} to={missatges?.pendent ? "wait" : undefined}
                 href="/panel/missatges" nota={missatges ? `${enter(missatges.respost)} respostos` : "Sense dades"} />
        <Targeta titol="Contactes" valor={contactes ? enter(contactesTotal) : "—"} href="/panel/contactes"
                 nota={contactes ? `${enter(contactes.interessat)} interessats` : "Sense dades"} />
        <Targeta titol="Projectes a Railway" valor={railway ? enter(railway.apps.length) : "—"} href="/panel/infraestructura"
                 to={caiguts.length ? "bad" : undefined} nota={railway ? `${enter(serveis.length)} serveis` : "Sense dades"} />
      </div>

      <section className="panel-sec">
        <div className="panel-sec-head">
          <h2>Problemes i avisos</h2>
          <span className="panel-sub">{avisos.filter(a => a.nivell !== "info").length} per revisar</span>
        </div>
        {avisos.length === 0 ? (
          <div className="panel-buit"><p><strong>Tot en ordre.</strong></p><p>No hi ha res pendent ni cap servei amb incidencia.</p></div>
        ) : (
          <ul className="avisos">
            {avisos.map((a, i) => (
              <li key={i} className={"avis-fila " + a.nivell}>
                <span className="avis-punt" aria-hidden="true" />
                <span className="avis-text">{a.text}</span>
                <Link href={a.href} className="avis-etiq">{a.etiqueta}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
