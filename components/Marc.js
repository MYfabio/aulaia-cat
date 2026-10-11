import Link from "next/link";
import Logo from "./Logo";
import CookieBanner from "./CookieBanner";
import { TEXTOS, base } from "../lib/i18n";

const orgJsonld = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "aulaia.cat",
  url: "https://www.aulaia.cat",
  email: "hola@aulaia.cat",
  description: "Apps educatives creades des de dins de l'aula per docents en actiu.",
  address: { "@type": "PostalAddress", addressLocality: "Sabadell", addressCountry: "ES" },
  areaServed: "ES",
  brand: ["radioescolar.cat", "dictats.cat", "aulessostenibles.cat", "elplalector.cat", "typeedu.com"],
};

// Capçalera, peu i banner de galetes comuns als dos idiomes.
export default function Marc({ lang, children }) {
  const t = TEXTOS[lang];
  const b = base(lang);
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
          <div><Logo size={28} dark={true} /><p className="footer-text">{t.peu.text}</p></div>
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
        <p className="footer-copy">
          © {new Date().getFullYear()} {t.peu.copy}
          <Link href="/panel" className="footer-panel" rel="nofollow">{t.peu.panell}</Link>
        </p>
      </footer>
      <CookieBanner />
    </>
  );
}
