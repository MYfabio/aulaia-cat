import { Inter } from "next/font/google";
import Marc from "../../components/Marc";
import { TEXTOS } from "../../lib/i18n";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const t = TEXTOS.ca;

export const metadata = {
  metadataBase: new URL("https://www.aulaia.cat"),
  title: { default: t.titolSite, template: "%s | aulaia.cat" },
  description: t.descSite,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/", languages: { ca: "/", es: "/es" } },
  openGraph: { type: "website", locale: t.locale, siteName: "aulaia.cat", url: "https://www.aulaia.cat", title: t.titolSite, description: t.descSite },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca" className={inter.variable}>
      <body><Marc lang="ca">{children}</Marc></body>
    </html>
  );
}
