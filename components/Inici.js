import Link from "next/link";
import CatalegApps from "./CatalegApps";
import { mapaCaptures } from "../lib/captures";
import { TEXTOS, base, appsEn } from "../lib/i18n";
import { comptarCentres } from "../lib/db";

export function metadataInici(lang) {
  const t = TEXTOS[lang].inici;
  return {
    title: t.metaTitol,
    description: t.metaDesc,
    alternates: { canonical: base(lang) || "/", languages: { ca: "/", es: "/es", "x-default": "/" } },
  };
}

const CENTRES = {
  ca: {
    un: "Ja hi ha 1 centre que ens ha demanat accés",
    molts: n => `Ja hi ha ${n} centres que ens han demanat accés`,
    text: "Gràcies a les escoles que ho proven, aquestes aplicacions milloren cada setmana. El teu centre també hi pot ser: et responem personalment.",
    boto: "Uneix-te",
  },
  es: {
    un: "Ya hay 1 centro que nos ha pedido acceso",
    molts: n => `Ya hay ${n} centros que nos han pedido acceso`,
    text: "Gracias a las escuelas que lo prueban, estas aplicaciones mejoran cada semana. Tu centro también puede estar: te respondemos personalmente.",
    boto: "Únete",
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

  return (
    <>
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

      {nCentres > 0 && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="landing-final-cta">
            <p className="landing-final-title">{nCentres === 1 ? c.un : c.molts(nCentres)}</p>
            <p className="landing-final-sub">{c.text}</p>
            <Link href={b + "/alta"} className="btn btn-primary">{c.boto}</Link>
          </div>
        </section>
      )}

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
          <Link href={b + "/alta"} className="btn btn-primary">{t.ctaBoto}</Link>
        </div>
      </section>
    </>
  );
}
