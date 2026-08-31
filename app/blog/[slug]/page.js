import Link from "next/link";
import { notFound } from "next/navigation";
import { llegirArticle, llistarArticles } from "../../../lib/blog";
import apps from "../../../data/apps.json";

export function generateStaticParams() {
  return llistarArticles().map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = llegirArticle(slug);
  if (!a) return {};
  const url = "https://www.aulaia.cat/blog/" + a.slug;
  return {
    title: a.titol + " · aulaia.cat",
    description: a.resum,
    keywords: a.etiquetes,
    alternates: { canonical: url },
    openGraph: {
      title: a.titol,
      description: a.resum,
      url,
      siteName: "aulaia.cat",
      locale: "ca_ES",
      type: "article",
      publishedTime: a.data,
      authors: [a.autor],
      ...(a.imatge
        ? { images: [{ url: "https://www.aulaia.cat" + a.imatge, width: 1200, height: 630, alt: a.imatgeAlt }] }
        : {}),
    },
  };
}

/** Dades estructurades perque Google entengui que aixo es un article. */
function Jsonld({ a }) {
  const dades = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titol,
    description: a.resum,
    datePublished: a.data,
    dateModified: a.data,
    inLanguage: "ca",
    author: { "@type": "Person", name: a.autor },
    publisher: {
      "@type": "Organization",
      name: "aulaia.cat",
      url: "https://www.aulaia.cat",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://www.aulaia.cat/blog/" + a.slug,
    },
    ...(a.imatge ? { image: "https://www.aulaia.cat" + a.imatge } : {}),
    ...(a.etiquetes.length ? { keywords: a.etiquetes.join(", ") } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dades) }}
    />
  );
}

function dataLlegible(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Article({ params }) {
  const { slug } = await params;
  const a = llegirArticle(slug);
  if (!a) notFound();

  const relacionades = a.apps.map(s => apps.find(x => x.slug === s)).filter(Boolean);
  const altres = llistarArticles().filter(x => x.slug !== a.slug).slice(0, 2);

  return (
    <div className="landing">
      <Jsonld a={a} />

      <Link href="/blog" className="landing-back">← Tots els articles</Link>

      <header className="blog-head">
        <p className="blog-meta">
          <time dateTime={a.data}>{dataLlegible(a.data)}</time>
          <span aria-hidden="true"> · </span>
          <span>{a.minuts} min de lectura</span>
        </p>
        <h1>{a.titol}</h1>
        <p className="blog-lede">{a.resum}</p>
      </header>

      {a.imatge && (
        /* Porta l alt que hi hagi a la capçalera del fitxer, perque la imatge
           diu una cosa que el titol no diu. A l index si que va buit: alli el
           titol es al costat i llegir-ho dues vegades nomes fa nosa. */
        <img
          className="blog-imatge"
          src={a.imatge}
          alt={a.imatgeAlt}
          width={1200}
          height={630}
        />
      )}

      <div className="blog-cos" dangerouslySetInnerHTML={{ __html: a.html }} />

      {relacionades.length > 0 && (
        <section className="blog-relacionades">
          <h2>Les eines que hi surten</h2>
          <div className="rel-grid">
            {relacionades.map(r => (
              <Link key={r.slug} href={"/apps/" + r.slug} className="rel-card">
                <span className="rel-icona" aria-hidden="true">{r.icona}</span>
                <span className="rel-nom">{r.nom}</span>
                <span className="rel-resum">{r.resum}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {altres.length > 0 && (
        <section className="blog-relacionades">
          <h2>Continua llegint</h2>
          <div className="rel-grid">
            {altres.map(o => (
              <Link key={o.slug} href={"/blog/" + o.slug} className="rel-card">
                <span className="rel-nom">{o.titol}</span>
                <span className="rel-resum">{o.resum}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
