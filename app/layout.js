import Link from "next/link";
import { Inter } from "next/font/google";
import Logo from "../components/Logo";
import CookieBanner from "../components/CookieBanner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});
export const metadata = {
  metadataBase: new URL("https://www.aulaia.cat"),
  title: { default: "aulaia.cat - Propostes d'apps educatives · Escola Industrial de Sabadell", template: "%s | aulaia.cat" },
  description: "Espai de propostes d'apps educatives nascudes a l'entorn de l'Institut Escola Industrial de Sabadell, un centre que aposta per un model de projectes que integra apps per millorar l'aprenentatge.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ca_ES",
    siteName: "aulaia.cat",
    url: "https://www.aulaia.cat",
    title: "aulaia.cat - Propostes d'apps educatives · Escola Industrial de Sabadell",
    description: "Espai de propostes d'apps educatives nascudes a l'entorn de l'Institut Escola Industrial de Sabadell, un centre que aposta per un model de projectes que integra apps per millorar l'aprenentatge.",
  },
};

const orgJsonld = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "aulaia.cat",
  url: "https://www.aulaia.cat",
  email: "hola@aulaia.cat",
  description: "Espai de propostes d'apps educatives creades a l'entorn de l'Institut Escola Industrial de Sabadell i obertes a escoles i instituts de Catalunya.",
  address: { "@type": "PostalAddress", addressLocality: "Sabadell", addressRegion: "Catalunya", addressCountry: "ES" },
  brand: ["radioescolar.cat", "dictats.cat", "aulessostenibles.cat", "elplalector.cat", "typeedu.com"],
};
export default function RootLayout({ children }) {
  return (
    <html lang="ca" className={inter.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(orgJsonld)}} />
        <header className="nav">
          <Link href="/" aria-label="aulaia.cat - inici"><Logo size={34} /></Link>
          <nav className="nav-links">
            <Link href="/#apps">Propostes</Link>
            <Link href="/#per-a-qui">Per a qui</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/contacte">Contacte</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <div><Logo size={28} dark={true} /><p className="footer-text">Propostes d'apps educatives nascudes a l'Escola Industrial de Sabadell, obertes a les escoles de Catalunya.</p></div>
            <div className="footer-links">
              <strong>Navegació</strong>
              <Link href="/#apps">Propostes</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/contacte">Demana una demo</Link>
              <Link href="/privacitat">Privacitat i cookies</Link>
            </div>
            <div className="footer-links"><strong>Contacte</strong><a href="mailto:hola@aulaia.cat">hola@aulaia.cat</a><span>Sabadell · Catalunya</span></div>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} aulaia.cat · Sabadell, Catalunya
            <Link href="/panel" className="footer-panel" rel="nofollow">Panell</Link>
          </p>
        </footer>
        <CookieBanner />
      </body>
    </html>
  );
}
