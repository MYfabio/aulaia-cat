import Link from "next/link";
import apps from "../../data/apps.json";

const URL = "https://www.aulaia.cat/primera-setmana";
const TITOL = "Recursos per a la primera setmana de curs";
const RESUM =
  "Eines d'aula llestes per fer servir els primers dies: dictats en català generats per curs i regla, i teoria de sistema dièdric interactiva. Sense instal·lar res.";

export const metadata = {
  title: TITOL + " · aulaia.cat",
  description: RESUM,
  keywords: [
    "recursos primera setmana de curs",
    "recursos educatius en català",
    "material inici de curs",
    "eines d'aula gratuïtes",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: TITOL,
    description: RESUM,
    url: URL,
    siteName: "aulaia.cat",
    locale: "ca_ES",
    type: "website",
  },
};

/**
 * El que es pot obrir i fer servir sense cap compte. Nomes hi ha d haver
 * coses comprovades: si algu arriba d un enllaç compartit i el primer que
 * troba es una pantalla d entrada, no torna.
 */
const SENSE_COMPTE = [
  {
    app: "dictats",
    titol: "Un dictat per al teu curs, ara mateix",
    url: "https://www.dictats.cat/",
    que: "Tries curs i regla ortogràfica i surt un dictat de la llargada que toca al cicle. El llegeixes en veu alta i ja tens l'activitat.",
    per: "De 1r de primària a 4t d'ESO · l·l, b/v, dièresi, accentuació, h muda i set regles més",
  },
  {
    app: "diedric3d",
    titol: "Sistema dièdric explicat amb coses que es mouen",
    url: "https://www.diedric3d.com/teoria",
    que: "Nou mòduls interactius amb la vista de l'espai i la vista dièdrica al costat: projecció ortogonal, punt, recta, pla, gir, abatiment i canvi de pla. Es projecta i es toca.",
    per: "Dibuix tècnic d'ESO i Batxillerat",
  },
  {
    app: "dictats",
    titol: "Preparació del C1 i el C2",
    url: "https://www.dictats.cat/dictats-c1-c2",
    que: "Dictats pensats per als nivells alts de català, per a qui prepara la prova oficial o per a cicles on cal el certificat.",
    per: "Batxillerat, cicles i formació d'adults",
  },
];

/** Les altres no s obren i prou: cal demanar l alta del centre. Val mes dir-ho. */
const AMB_ALTA = ["typeedu", "radio-escolar", "pla-lector", "chefboss", "aules-sostenibles"];

function Jsonld() {
  const dades = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITOL,
    description: RESUM,
    url: URL,
    inLanguage: "ca",
    isPartOf: { "@type": "WebSite", name: "aulaia.cat", url: "https://www.aulaia.cat" },
    hasPart: SENSE_COMPTE.map(r => ({
      "@type": "LearningResource",
      name: r.titol,
      url: r.url,
      inLanguage: "ca",
      isAccessibleForFree: true,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dades) }}
    />
  );
}

export default function PrimeraSetmana() {
  const nomDe = slug => apps.find(a => a.slug === slug);
  const ambAlta = AMB_ALTA.map(nomDe).filter(Boolean);

  return (
    <div className="landing">
      <Jsonld />

      <Link href="/" className="landing-back">← Tornar a l&apos;inici</Link>

      <header className="blog-head">
        <p className="blog-kicker">Inici de curs</p>
        <h1>{TITOL}</h1>
        <p className="blog-lede">
          Els primers dies no hi ha temps de muntar res. Això és el que pots obrir
          avui, projectar a classe i fer servir sense instal·lar res, sense donar
          d&apos;alta ningú i sense repartir contrasenyes.
        </p>
      </header>

      <section className="setmana-sec">
        <h2>Sense cap compte</h2>
        <p className="setmana-nota">
          Obres l&apos;enllaç i ja hi ets. No demanen registre ni deixen res
          pendent de configurar.
        </p>

        <div className="setmana-llista">
          {SENSE_COMPTE.map(r => {
            const app = nomDe(r.app);
            return (
              <article key={r.url} className="setmana-fitxa">
                <p className="setmana-per">{r.per}</p>
                <h3>
                  <a href={r.url} target="_blank" rel="noopener">{r.titol}</a>
                </h3>
                <p className="setmana-que">{r.que}</p>
                {app && (
                  <p className="setmana-app">
                    De <Link href={"/apps/" + app.slug}>{app.nom}</Link>
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="setmana-sec">
        <h2>Amb l&apos;alta del centre</h2>
        <p className="setmana-nota">
          Aquestes treballen amb grups i seguiment de l&apos;alumnat, així que
          necessiten saber de quin centre veniu. S&apos;entra amb el compte de
          Google que ja fa servir el centre: no generem contrasenyes noves.
        </p>

        <div className="rel-grid">
          {ambAlta.map(a => (
            <Link key={a.slug} href={"/apps/" + a.slug} className="rel-card">
              <span className="rel-icona" aria-hidden="true">{a.icona}</span>
              <span className="rel-nom">{a.nom}</span>
              <span className="rel-resum">{a.resum}</span>
            </Link>
          ))}
        </div>

        <p className="setmana-cta">
          <Link href="/alta" className="btn btn-primary">Demanar l&apos;alta del centre</Link>
        </p>
      </section>

      <section className="setmana-sec">
        <h2>Abans d&apos;adoptar res</h2>
        <p className="setmana-nota">
          Val la pena decidir amb calma què entra al centre aquest curs. Al blog
          hi ha el criteri que fem servir nosaltres i què implica per a qui
          coordina la digitalització.
        </p>
        <p className="setmana-cta">
          <Link href="/blog" className="btn btn-outline">Llegir el blog</Link>
        </p>
      </section>
    </div>
  );
}
