import Link from "next/link";
import { notFound } from "next/navigation";
import { llegirArticle, llistarArticles, traduccio } from "../lib/blog";
import { appsEn, base } from "../lib/i18n";

const SITE = "https://www.aulaia.cat";

const T = {
  ca: {
    locale: "ca_ES", dataLocale: "ca-ES",
    metaTitol: "Blog · aulaia.cat",
    metaDesc: "Articles sobre coordinació digital, pla lector, ràdio escolar i eines d'aula, escrits des de dins d'un centre educatiu.",
    tornar: "← Tornar a l'inici", kicker: "Blog", h1: "Del que fem servir a l'aula",
    lede: "Coses que hem hagut de resoldre en un centre de veritat: com es coordina la digitalització, què costa muntar un pla lector, què funciona i què no. Sense promeses que no puguem sostenir.",
    buit: "Encara no hi ha cap article publicat.", lectura: "min de lectura", hiSurten: "Hi surten:",
    llegir: "Llegeix l'article", tots: "← Tots els articles", eines: "Les eines que hi surten",
    continua: "Continua llegint", altreIdioma: "Llegeix-lo en castellà",
  },
  es: {
    locale: "es_ES", dataLocale: "es-ES",
    metaTitol: "Blog · aulaia.cat",
    metaDesc: "Artículos sobre coordinación digital, plan lector, radio escolar y herramientas de aula, escritos desde dentro de un centro educativo.",
    tornar: "← Volver al inicio", kicker: "Blog", h1: "Lo que usamos en el aula",
    lede: "Cosas que hemos tenido que resolver en un centro de verdad: cómo se coordina la digitalización, qué cuesta montar un plan lector, qué funciona y qué no. Sin promesas que no podamos sostener.",
    buit: "Todavía no hay ningún artículo publicado.", lectura: "min de lectura", hiSurten: "Aparecen:",
    llegir: "Lee el artículo", tots: "← Todos los artículos", eines: "Las herramientas que aparecen",
    continua: "Sigue leyendo", altreIdioma: "Llegeix-lo en català",
  },
};

const dataLlegible = (iso, lang) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString(T[lang].dataLocale, { day: "numeric", month: "long", year: "numeric" }) : "";

/* ---------- Llistat ---------- */

export function metadataBlog(lang) {
  const t = T[lang];
  const url = SITE + base(lang) + "/blog";
  return {
    title: t.metaTitol,
    description: t.metaDesc,
    alternates: { canonical: url, languages: { ca: "/blog", es: "/es/blog", "x-default": "/blog" } },
    openGraph: { title: t.metaTitol, description: t.metaDesc, url, siteName: "aulaia.cat", locale: t.locale, type: "website" },
  };
}

export function BlogIndex({ lang }) {
  const t = T[lang];
  const b = base(lang);
  const articles = llistarArticles(lang);
  const apps = appsEn(lang);
  const nomApp = slug => apps.find(a => a.slug === slug)?.nom;

  return (
    <div className="landing landing-ample">
      <Link href={b || "/"} className="landing-back">{t.tornar}</Link>

      <header className="blog-head">
        <p className="blog-kicker">{t.kicker}</p>
        <h1>{t.h1}</h1>
        <p className="blog-lede">{t.lede}</p>
      </header>

      {articles.length === 0 ? (
        <div className="blog-buit"><p>{t.buit}</p></div>
      ) : (
        <div className="blog-llista">
          {articles.map(a => (
            <article key={a.slug} className="blog-fitxa">
              {a.imatge && (
                <Link href={b + "/blog/" + a.slug} className="blog-fitxa-imatge" tabIndex={-1} aria-hidden="true">
                  <img src={a.imatge} alt="" width={1200} height={630} loading="lazy" />
                </Link>
              )}
              {a.etiquetes.length > 0 && <p className="blog-categoria"><span>{a.etiquetes[0]}</span></p>}
              <p className="blog-meta">
                <time dateTime={a.data}>{dataLlegible(a.data, lang)}</time>
                <span aria-hidden="true"> · </span>
                <span>{a.minuts} {t.lectura}</span>
              </p>
              <h2><Link href={b + "/blog/" + a.slug}>{a.titol}</Link></h2>
              <p className="blog-resum">{a.resum}</p>
              {a.apps.length > 0 && (
                <p className="blog-apps">
                  {t.hiSurten}{" "}
                  {a.apps.map((s, i) => (
                    <span key={s}>{i > 0 && ", "}<Link href={b + "/apps/" + s}>{nomApp(s) || s}</Link></span>
                  ))}
                </p>
              )}
              <p className="blog-llegir"><Link href={b + "/blog/" + a.slug}>{t.llegir}</Link></p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Article ---------- */

export function metadataArticle(lang, slug) {
  const a = llegirArticle(slug, lang);
  if (!a) return {};
  const url = SITE + base(lang) + "/blog/" + a.slug;
  const altre = traduccio(slug, lang);
  const languages = lang === "ca"
    ? { ca: "/blog/" + slug, ...(altre ? { es: "/es/blog/" + altre } : {}), "x-default": "/blog/" + slug }
    : { es: "/es/blog/" + slug, ...(altre ? { ca: "/blog/" + altre, "x-default": "/blog/" + altre } : {}) };
  return {
    title: a.titol + " · aulaia.cat",
    description: a.resum,
    keywords: a.etiquetes,
    alternates: { canonical: url, languages },
    openGraph: {
      title: a.titol, description: a.resum, url, siteName: "aulaia.cat", locale: T[lang].locale, type: "article",
      publishedTime: a.data, authors: [a.autor],
      ...(a.imatge ? { images: [{ url: SITE + a.imatge, width: 1200, height: 630, alt: a.imatgeAlt }] } : {}),
    },
  };
}

export function BlogArticle({ lang, slug }) {
  const t = T[lang];
  const b = base(lang);
  const a = llegirArticle(slug, lang);
  if (!a) notFound();

  const apps = appsEn(lang);
  const relacionades = a.apps.map(s => apps.find(x => x.slug === s)).filter(Boolean);
  const altres = llistarArticles(lang).filter(x => x.slug !== a.slug).slice(0, 2);
  const altre = traduccio(slug, lang);

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titol,
    description: a.resum,
    datePublished: a.data,
    dateModified: a.data,
    inLanguage: lang,
    author: { "@type": "Person", name: a.autor },
    publisher: { "@type": "Organization", name: "aulaia.cat", url: SITE },
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + b + "/blog/" + a.slug },
    ...(a.imatge ? { image: SITE + a.imatge } : {}),
    ...(a.etiquetes.length ? { keywords: a.etiquetes.join(", ") } : {}),
  };

  return (
    <div className="landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />

      <Link href={b + "/blog"} className="landing-back">{t.tots}</Link>

      <header className="blog-head">
        <p className="blog-meta">
          <time dateTime={a.data}>{dataLlegible(a.data, lang)}</time>
          <span aria-hidden="true"> · </span>
          <span>{a.minuts} {t.lectura}</span>
          {altre && (
            <>
              <span aria-hidden="true"> · </span>
              <a href={(lang === "ca" ? "/es" : "") + "/blog/" + altre} hrefLang={lang === "ca" ? "es" : "ca"}>{t.altreIdioma}</a>
            </>
          )}
        </p>
        <h1>{a.titol}</h1>
        <p className="blog-lede">{a.resum}</p>
      </header>

      {a.imatge && (
        <figure className="blog-figura">
          <img className="blog-imatge" src={a.imatge} alt={a.imatgeAlt} width={1200} height={630} />
          {a.imatgeCredit && <figcaption className="blog-peu">{a.imatgeCredit}</figcaption>}
        </figure>
      )}

      <div className="blog-cos" dangerouslySetInnerHTML={{ __html: a.html }} />

      {relacionades.length > 0 && (
        <section className="blog-relacionades">
          <h2>{t.eines}</h2>
          <div className="rel-grid">
            {relacionades.map(r => (
              <Link key={r.slug} href={b + "/apps/" + r.slug} className="rel-card">
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
          <h2>{t.continua}</h2>
          <div className="rel-grid">
            {altres.map(o => (
              <Link key={o.slug} href={b + "/blog/" + o.slug} className="rel-card">
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
