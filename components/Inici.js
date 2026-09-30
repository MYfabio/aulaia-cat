import Link from "next/link";
import CatalegApps from "./CatalegApps";
import { mapaCaptures } from "../lib/captures";
import { TEXTOS, base, appsEn } from "../lib/i18n";

export function metadataInici(lang) {
  const t = TEXTOS[lang].inici;
  return {
    title: t.metaTitol,
    description: t.metaDesc,
    alternates: { canonical: base(lang) || "/", languages: { ca: "/", es: "/es", "x-default": "/" } },
  };
}

export default function Inici({ lang }) {
  const t = TEXTOS[lang].inici;
  const b = base(lang);
  const apps = appsEn(lang);
  const enLinia = apps.filter(a => a.estat === "produccio");

  return (
    <>
      <section className="hero">
        <span className="hero-tag">{t.tag}</span>
        <h1>{t.h1a}<span>{t.h1b}</span></h1>
        <p>{t.intro}</p>
        <div className="hero-actions">
          <Link href={b + "/#apps"} className="btn btn-primary">{t.veure}</Link>
          <Link href="/contacte" className="btn btn-outline">{t.demo}</Link>
        </div>
        <div className="hero-badges">
          {t.badges(enLinia.length).map(x => <span key={x} className="badge">{x}</span>)}
        </div>
      </section>

      <CatalegApps apps={apps} captures={mapaCaptures(apps)} lang={lang} />

      <section className="seo-intro">
        <div className="seo-intro-inner">
          <h2>{t.seoTitol}</h2>
          <p>{t.seoP1}</p>
          <p>{t.seoP2}</p>
          <div className="seo-intro-tags">
            {t.seoTags.map(x => <span key={x} className="badge">{x}</span>)}
          </div>
        </div>
      </section>

      <section className="section" id="per-a-qui">
        <div className="section-header">
          <h2>{t.perAQuiTitol}</h2>
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

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="landing-final-cta">
          <p className="landing-final-title">{t.ctaTitol}</p>
          <p className="landing-final-sub">{t.ctaText}</p>
          <Link href="/contacte" className="btn btn-primary">{t.ctaBoto}</Link>
        </div>
      </section>
    </>
  );
}
