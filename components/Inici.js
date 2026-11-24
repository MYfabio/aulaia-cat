import Link from "next/link";
import CatalegApps from "./CatalegApps";
import { mapaCaptures } from "../lib/captures";
import { TEXTOS, base, appsEn } from "../lib/i18n";
import { comptarCentres } from "../lib/db";
import ComptadorCentres from "./ComptadorCentres";
import XarxaIdees from "./XarxaIdees";
import { ID_ORG, ID_WEB } from "./Marc";

const SITE = "https://www.aulaia.cat";

export function metadataInici(lang) {
  const t = TEXTOS[lang].inici;
  const url = SITE + (base(lang) || "/");
  return {
    title: t.metaTitol,
    description: t.metaDesc,
    alternates: { canonical: base(lang) || "/", languages: { ca: "/", es: "/es", "x-default": "/" } },
    openGraph: {
      type: "website", siteName: "aulaia.cat", locale: TEXTOS[lang].locale, url,
      title: t.metaTitol, description: t.metaDesc,
      images: [{ url: "/og-aulaia.png", width: 1200, height: 630, alt: "aulaia.cat" }],
    },
  };
}

const CENTRES = {
  ca: {
    tag: "Un projecte que creix",
    titol: n => `Ja som ${n} centres a aulaia.cat`,
    text: "Aplicacions gratuïtes i funcionals per a l'escola pública, fetes des de dins de l'aula. Demana el teu accés a un projecte innovador i ajuda'ns a millorar-lo.",
    boto: "Demana el teu accés",
    nota: "Respost personalment, sense compromís.",
  },
  es: {
    tag: "Un proyecto que crece",
    titol: n => `Ya somos ${n} centros en aulaia.cat`,
    text: "Aplicaciones gratuitas y funcionales para la escuela pública, hechas desde dentro del aula. Pide tu acceso a un proyecto innovador y ayúdanos a mejorarlo.",
    boto: "Pide tu acceso",
    nota: "Respondido personalmente, sin compromiso.",
  },
};

/** El contador no es critic: si la base no respon, la portada surt igual sense ell. */
async function centresDemanats() {
  try {
    return await comptarCentres();
  } catch {
    return 0;
  }
}

export default async function Inici({ lang }) {
  const nCentres = await centresDemanats();
  const c = CENTRES[lang];
  const t = TEXTOS[lang].inici;
  const b = base(lang);
  const apps = appsEn(lang);
  const enLinia = apps.filter(a => a.estat === "produccio");

  // Portada: la pàgina, la llista d'apps en línia i les preguntes freqüents, en un sol @graph.
  // Tot el text surt del mateix lloc que el que es veu a pantalla (catàleg i TEXTOS).
  const urlPagina = SITE + (b || "/");
  const grafInici = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": urlPagina + "#pagina",
        url: urlPagina,
        name: t.metaTitol,
        description: t.metaDesc,
        inLanguage: lang,
        isPartOf: { "@id": ID_WEB },
        about: { "@id": ID_ORG },
        mainEntity: { "@id": urlPagina + "#apps" },
      },
      {
        "@type": "ItemList",
        "@id": urlPagina + "#apps",
        name: lang === "es" ? "Aplicaciones educativas gratuitas de aulaia.cat" : "Aplicacions educatives gratuïtes d'aulaia.cat",
        numberOfItems: enLinia.length,
        itemListElement: enLinia.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "WebApplication",
            "@id": SITE + b + "/apps/" + a.slug + "#app",
            name: a.nom,
            url: a.url,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            description: a.resum,
            inLanguage: lang,
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
            audience: { "@type": "EducationalAudience", educationalRole: "teacher" },
            provider: { "@id": ID_ORG },
          },
        })),
      },
      {
        "@type": "FAQPage",
        "@id": urlPagina + "#preguntes",
        inLanguage: lang,
        isPartOf: { "@id": urlPagina + "#pagina" },
        mainEntity: t.faq.map(f => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(grafInici) }} />
      <div className="hero-fons">
      <section className="hero">
        <span className="hero-tag">{t.tag}</span>
        <h1>{t.h1a}<span>{t.h1b}</span></h1>
        <p>{t.intro}</p>
        <div className="hero-actions">
          <Link href={b + "/#apps"} className="btn btn-primary">{t.veure}</Link>
          <Link href={b + "/alta"} className="btn btn-outline">{t.demo}</Link>
        </div>
        <div className="hero-badges">
          {t.badges(enLinia.length).map(x => <span key={x} className="badge">{x}</span>)}
        </div>
      </section>
      <div className="hero-xarxa"><XarxaIdees lang={lang} quina={0} /></div>
      </div>

      {nCentres > 0 && <ComptadorCentres n={nCentres} t={{ ...c, titol: c.titol(nCentres) }} href={b + "/alta"} />}

      <CatalegApps apps={apps} captures={mapaCaptures(apps)} lang={lang} />

      <section className="seo-intro" aria-labelledby="que-es">
        <div className="seo-intro-inner">
          <h2 id="que-es">{t.seoTitol}</h2>
          <p className="seo-intro-resposta">{t.seoResposta}</p>
          <h3 className="seo-intro-lema">{t.seoLema}</h3>
          <p>{t.seoP1}</p>
          <p>{t.seoP2}</p>
          <div className="seo-intro-tags">
            {t.seoTags.map(x => <span key={x} className="badge">{x}</span>)}
          </div>
        </div>
      </section>

      <section className="section" id="per-a-qui" aria-labelledby="per-a-qui-titol">
        <div className="section-header">
          <h2 id="per-a-qui-titol">{t.perAQuiTitol}</h2>
          <p>{t.perAQuiText}</p>
        </div>
        <div className="who-grid">
          {t.perAQui.map(w => (
            <div key={w.title} className="who-card">
              <div className="who-card-icon">{w.n}</div>
              <h3>{w.title}</h3><p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="preguntes" aria-labelledby="preguntes-titol" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <h2 id="preguntes-titol">{t.faqTitol}</h2>
        </div>
        <div className="inici-faq">
          {t.faq.map(f => (
            <article key={f.p} className="inici-faq-item">
              <h3>{f.p}</h3>
              <p>{f.r}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="landing-final-cta">
          <p className="landing-final-title">{t.ctaTitol}</p>
          <p className="landing-final-sub">{t.ctaText}</p>
          <Link href={b + "/alta"} className="btn btn-primary">{t.ctaBoto}</Link>
        </div>
      </section>
    </>
  );
}
