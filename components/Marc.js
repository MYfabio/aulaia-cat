import Link from "next/link";
import Logo from "./Logo";
import CookieBanner from "./CookieBanner";
import Assistent from "./Assistent";
import { TEXTOS, base, appsEn } from "../lib/i18n";
import { llistarArticles } from "../lib/blog";

const orgJsonld = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "aulaia.cat",
  url: "https://www.aulaia.cat",
  logo: "https://www.aulaia.cat/icon-512.png",
  email: "hola@aulaia.cat",
  description: "Apps educatives creades des de dins de l'aula per docents en actiu.",
  address: { "@type": "PostalAddress", addressLocality: "Sabadell", addressCountry: "ES" },
  areaServed: "ES",
  founder: { "@type": "Person", name: "Fabio Martínez", jobTitle: "Docent", worksFor: { "@type": "EducationalOrganization", name: "Institut Escola Industrial de Sabadell", url: "https://www.escolaindustrial.org" } },
  parentOrganization: { "@type": "EducationalOrganization", name: "Institut Escola Industrial de Sabadell", url: "https://www.escolaindustrial.org" },
  sameAs: ["https://www.escolaindustrial.org"],
  brand: ["radioescolar.cat", "dictats.cat", "aulessostenibles.cat", "elplalector.cat", "typeedu.com"],
};

// Capçalera, peu i banner de galetes comuns als dos idiomes.
export default function Marc({ lang, children }) {
  const t = TEXTOS[lang];
  const b = base(lang);
  // Enllaços interns reals i descriptius: cada app i els articles més nous, perquè el buscador (i les IA) arribin a tot.
  const appsPeu = appsEn(lang).filter(a => a.estat === "produccio");
  const articlesPeu = llistarArticles(lang).slice(0, 6);
  // Les apps que un centre pot demanar avui o aviat, com al formulari d'alta.
  const appsAssistent = appsEn(lang)
    .filter(a => a.estat === "produccio" || a.estat === "construccio")
    .map(a => ({ slug: a.slug, nom: a.nom, estat: a.estat }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonld) }} />
      <header className="nav">
        <Link href={b || "/"} aria-label={t.nav.inici}><Logo size={34} /></Link>
        <nav className="nav-links">
          <Link href={b + "/#apps"}>{t.nav.projectes}</Link>
          <Link href={b + "/#per-a-qui"}>{t.nav.perAQui}</Link>
          <Link href={b + "/blog"}>{t.nav.blog}</Link>
          <Link href={b + "/alta"}>{t.nav.contacte}</Link>
          <a href={t.canviIdioma.href} className="nav-idioma" hrefLang={lang === "ca" ? "es" : "ca"} title={t.canviIdioma.etiqueta}>
            {t.canviIdioma.curt}
          </a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="footer-inner">
          <div><Logo size={28} dark={true} /><p className="footer-text">{t.peu.text}</p>
            <div className="footer-xarxes">
              <a href="https://www.linkedin.com/company/145386477/" target="_blank" rel="noopener noreferrer" aria-label="aulaia a LinkedIn">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" /></svg>
              </a>
            </div></div>
          <div className="footer-links">
            <strong>{t.peu.navegacio}</strong>
            <Link href={b + "/#apps"}>{t.nav.projectes}</Link>
            <Link href={b + "/blog"}>{t.nav.blog}</Link>
            <Link href={b + "/alta"}>{t.peu.demo}</Link>
            <Link href="/privacitat">{t.peu.privacitat}</Link>
            <a href={t.canviIdioma.href} hrefLang={lang === "ca" ? "es" : "ca"}>{t.canviIdioma.etiqueta}</a>
          </div>
          <div className="footer-links"><strong>{t.peu.contacte}</strong><a href="mailto:hola@aulaia.cat">hola@aulaia.cat</a><span>{t.peu.on}</span></div>
        </div>
        <div className="footer-seo">
          <div className="footer-links">
            <strong>{t.peu.apps}</strong>
            {appsPeu.map(a => <Link key={a.slug} href={`${b}/apps/${a.slug}`}>{a.nom}: {a.categoria}</Link>)}
          </div>
          <div className="footer-links">
            <strong>{t.peu.articles}</strong>
            {articlesPeu.map(a => <Link key={a.slug} href={`${b}/blog/${a.slug}`}>{a.titol}</Link>)}
            <span>{t.peu.zona}</span>
          </div>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} {t.peu.copy}
          <Link href="/panel" className="footer-panel" rel="nofollow">{t.peu.panell}</Link>
        </p>
      </footer>
      <CookieBanner />
      <Assistent lang={lang} apps={appsAssistent} />
    </>
  );
}
