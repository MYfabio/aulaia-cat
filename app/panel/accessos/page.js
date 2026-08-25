import Link from "next/link";
import accessos from "../../../data/accessos.json";
import apps from "../../../data/apps.json";

export const metadata = {
  title: "Accessos d'administració",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TIPUS = {
  ruta:        { text: "Ruta pròpia",   cls: "ok" },
  dins:        { text: "Dins de l'app", cls: "wait" },
  construccio: { text: "En construcció", cls: "off" },
};

export default function AccessosPage() {
  const fila = accessos
    .map(a => ({ ...a, app: apps.find(x => x.slug === a.slug) }))
    .filter(a => a.app);

  const actius = fila.filter(a => a.tipus !== "construccio");
  const enObra = fila.filter(a => a.tipus === "construccio");

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h1>Accessos d&apos;administració</h1>
          <p className="panel-sub">Els panells de cada app, un clic des d&apos;aquí</p>
        </div>
        <Link href="/panel" className="btn btn-outline">Tornar al panell</Link>
      </div>

      <div className="panel-avis panel-avis-info">
        <strong>Per què no cal cap contrasenya</strong>
        <p>
          Cap de les apps demana contrasenya: totes identifiquen amb el compte de Google o amb un
          enllaç enviat al correu. Si ja tens la sessió de Google oberta al navegador, aquests
          enllaços entren directament. Si no la tens, et demanarà el compte una vegada i les altres
          apps ja no.
        </p>
      </div>

      <section className="panel-sec">
        <div className="panel-sec-head"><h2>Apps en servei</h2></div>
        <div className="acces-graella">
          {actius.map(a => {
            const t = TIPUS[a.tipus];
            return (
              <article key={a.slug} className="acces-fitxa">
                <div className="acces-fitxa-head">
                  <span className="acces-icona" aria-hidden="true">{a.app.icona}</span>
                  <div>
                    <h3>{a.app.nom}</h3>
                    <span className={"pbadge " + t.cls}>{t.text}</span>
                  </div>
                </div>
                <dl className="acces-dades">
                  <div><dt>S&apos;hi entra amb</dt><dd>{a.acces}</dd></div>
                </dl>
                <p className="acces-nota">{a.nota}</p>
                <div className="acces-accions">
                  <a href={a.url} target="_blank" rel="noopener" className="btn btn-primary">
                    Obrir el panell
                  </a>
                  <Link href={"/apps/" + a.slug} className="btn-ghost">Fitxa pública</Link>
                </div>
                <p className="acces-url mono">{a.url.replace(/^https:\/\//, "")}</p>
              </article>
            );
          })}
        </div>
      </section>

      {enObra.length > 0 && (
        <section className="panel-sec">
          <div className="panel-sec-head"><h2>Encara en construcció</h2></div>
          <div className="acces-graella">
            {enObra.map(a => (
              <article key={a.slug} className="acces-fitxa is-obra">
                <div className="acces-fitxa-head">
                  <span className="acces-icona" aria-hidden="true">{a.app.icona}</span>
                  <div>
                    <h3>{a.app.nom}</h3>
                    <span className="pbadge off">En construcció</span>
                  </div>
                </div>
                <p className="acces-nota">{a.nota}</p>
                <div className="acces-accions">
                  <a href={a.url} target="_blank" rel="noopener" className="btn btn-outline">
                    Veure com va
                  </a>
                </div>
                <p className="acces-url mono">{a.url.replace(/^https:\/\//, "")}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
