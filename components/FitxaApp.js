import Link from "next/link";
import { notFound } from "next/navigation";
import { Fitxa } from "./CatalegApps";
import { capturaDe } from "../lib/captures";
import { TEXTOS, base, appsEn } from "../lib/i18n";

// Relacionats triats a mà; si en falten, es completa amb els que comparteixen més etapes i matèries.
function relacionatsDe(app, apps) {
  const triats = (app.relacionats || []).map(s => apps.find(a => a.slug === s)).filter(Boolean);
  if (triats.length >= 3) return triats.slice(0, 3);
  const comuns = a =>
    (a._nivells || []).filter(n => (app._nivells || []).includes(n)).length +
    2 * (a.materies || []).filter(m => (app.materies || []).includes(m)).length;
  const resta = apps
    .filter(a => a.slug !== app.slug && !triats.includes(a))
    .sort((a, b) => comuns(b) - comuns(a) || (b.estat === "produccio") - (a.estat === "produccio"));
  return [...triats, ...resta].slice(0, 3);
}

export function metadataFitxa(lang, slug) {
  const app = appsEn(lang).find(a => a.slug === slug);
  if (!app) return {};
  const url = "https://www.aulaia.cat" + base(lang) + "/apps/" + app.slug;
  return {
    title: app.seo.title,
    description: app.seo.description,
    keywords: app.seo.keywords,
    alternates: { canonical: url, languages: { ca: "/apps/" + slug, es: "/es/apps/" + slug, "x-default": "/apps/" + slug } },
    openGraph: {
      title: app.seo.title,
      description: app.seo.description,
      url,
      siteName: "aulaia.cat",
      locale: TEXTOS[lang].locale,
      type: "website",
      ...(capturaDe(slug) ? { images: [{ url: capturaDe(slug), width: 800, height: 500 }] } : {}),
    },
  };
}

function Jsonld({ app, lang }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.nom,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: app.seo.description,
    inLanguage: lang,
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
    ...(app.url ? { url: app.url } : {}),
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    provider: { "@type": "Organization", name: "aulaia.cat", url: "https://www.aulaia.cat" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function FitxaApp({ lang, slug }) {
  const t = TEXTOS[lang].fitxa;
  const tn = TEXTOS[lang].cataleg.nivells;
  const b = base(lang);
  const apps = appsEn(lang);
  const app = apps.find(a => a.slug === slug);
  if (!app) notFound();
  const relacionats = relacionatsDe(app, apps);
  const captura = capturaDe(app.slug);

  return (
    <div className="landing">
      <Jsonld app={app} lang={lang} />
      <Link href={b + "/#apps"} className="landing-back">{t.tots}</Link>
      <span className="landing-tag">{app.categoria}</span>
      <h1>{app.nom}</h1>
      <p className="landing-desc">{app.descripcio}</p>

      {app.problema && (
        <>
          <h2>{t.problema}</h2>
          <p className="seo-text">{app.problema}</p>
        </>
      )}
      {app.perfil && (
        <>
          <h2>{t.perfil}</h2>
          <p className="seo-text">{app.perfil}</p>
        </>
      )}

      {app.url && (
        <div className={"live-banner" + (captura ? " amb-captura" : "")}>
          {captura && (
            <a href={app.url} target="_blank" rel="noopener" className="live-banner-captura" aria-hidden="true" tabIndex={-1}>
              <img src={captura} alt="" width="800" height="500" />
            </a>
          )}
          <div className="live-banner-text">
            <strong>{t.web}</strong>
            <span>{app.domini}{app.centre ? " · " + app.centre : ""}</span>
          </div>
          <a href={app.url} target="_blank" rel="noopener" className="btn btn-primary">{t.visita}{app.domini}</a>
        </div>
      )}

      {!app.url && (
        <div className="wip-banner">
          <span className="wip-label">{t.wip}</span>
          <p>{app.estatText}{app.domini ? t.wipPublicara(app.domini) : "."}{t.wipText}</p>
        </div>
      )}

      <div className="fact-grid">
        {app._nivells?.length > 0 && <div className="fact"><span className="fact-k">{t.etapes}</span><span className="fact-v">{app._nivells.map(n => tn[n] || n).join(" · ")}</span></div>}
        {app.materies?.length > 0 && <div className="fact"><span className="fact-k">{t.materies}</span><span className="fact-v">{app.materies.join(" · ")}</span></div>}
        {app.idiomes?.length > 0 && <div className="fact"><span className="fact-k">{t.idiomes}</span><span className="fact-v">{app.idiomes.join(" · ")}</span></div>}
        <div className="fact"><span className="fact-k">{t.estat}</span><span className="fact-v">{app.estatText}</span></div>
      </div>

      <div className="landing-cta-bar">
        <Link href={b + "/alta?app=" + app.slug} className="btn btn-primary">{t.alta}</Link>
        <a href={"mailto:hola@aulaia.cat?subject=" + encodeURIComponent(app.nom)} className="btn btn-outline">{t.dubtes}</a>
      </div>

      <h2>{t.funcionalitats}</h2>
      <ul className="features-list">
        {app.funcionalitats.map(f => (
          <li key={f} className="feature-item"><span className="feature-check">✓</span><span>{f}</span></li>
        ))}
      </ul>

      {app.seoLlarg && (
        <>
          <h2>{t.mesInfo}{app.nom}</h2>
          <p className="seo-text">{app.seoLlarg}</p>
        </>
      )}

      {app.faq?.length > 0 && (
        <>
          <h2>{t.faq}</h2>
          <div className="faq-list">
            {app.faq.map(f => (
              <details key={f.p} className="faq-item">
                <summary>{f.p}</summary>
                <p>{f.r}</p>
              </details>
            ))}
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "FAQPage",
            mainEntity: app.faq.map(f => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
          }) }} />
        </>
      )}

      {relacionats.length > 0 && (
        <>
          <h2>{t.altres}</h2>
          <div className="app-graella rel-graella">
            {relacionats.map(r => <Fitxa key={r.slug} app={r} captura={capturaDe(r.slug)} lang={lang} />)}
          </div>
        </>
      )}

      <div className="landing-final-cta">
        <p className="landing-final-title">{t.ctaTitol(app.nom)}</p>
        <p className="landing-final-sub">{t.ctaText}</p>
        <Link href={b + "/alta?app=" + app.slug} className="btn btn-primary" style={{ fontSize: "1rem", padding: ".75rem 2rem" }}>{t.ctaBoto(app.nom)}</Link>
      </div>
    </div>
  );
}
