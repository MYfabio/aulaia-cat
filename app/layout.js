import Link from "next/link";
import Logo from "../components/Logo";
import CookieBanner from "../components/CookieBanner";
import "./globals.css";
export const metadata = {
  metadataBase: new URL("https://aulaia.cat"),
  title: { default: "aulaia.cat - Apps educatives per a escoles de Catalunya", template: "%s | aulaia.cat" },
  description: "Cataleg d aplicacions i projectes de software per a escoles, instituts i centres educatius de Catalunya.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }) {
  return (
    <html lang="ca">
      <body>
        <header className="nav">
          <Link href="/" aria-label="aulaia.cat - inici"><Logo size={34} /></Link>
          <nav className="nav-links">
            <Link href="/#apps">Apps</Link>
            <Link href="/#per-a-qui">Per a qui</Link>
            <Link href="/contacte">Contacte</Link>
          </nav>
          <Link href="/contacte" className="btn btn-primary" style={{marginLeft:"auto"}}>Demana una demo</Link>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <div><Logo size={28} dark={true} /><p className="footer-text">Apps de software educatiu per a escoles de Catalunya.</p></div>
            <div className="footer-links">
              <strong>aulaia.cat</strong>
              <Link href="/#apps">Cataleg</Link>
              <Link href="/contacte">Demo</Link>
              <Link href="/privacitat">Privacitat i cookies</Link>
            </div>
            <div className="footer-links"><strong>Contacte</strong><a href="mailto:hola@aulaia.cat">hola@aulaia.cat</a><span>Sabadell · Catalunya</span></div>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} aulaia.cat · <Link href="/privacitat" style={{color:"#4A6080"}}>Privacitat i cookies</Link></p>
        </footer>
        <CookieBanner />
      </body>
    </html>
  );
}
