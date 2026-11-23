"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONS = [
  { href: "/panel", text: "Resum", icona: "M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/panel/altes", text: "Altes de centres", icona: "M4 5h16v14H4zM4 9h16M8 14h4" },
  { href: "/panel/altes-lot", text: "Altes en lot", icona: "M4 6h16M4 12h16M4 18h10" },
  { href: "/panel/missatges", text: "Missatges", icona: "M4 5h16v11H9l-5 4z" },
  { href: "/panel/contactes", text: "Contactes", icona: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21c0-4 4-6 8-6s8 2 8 6" },
  { href: "/panel/correus", text: "Correus enviats", icona: "M3 6h18v12H3zM3 7l9 6 9-6" },
  { href: "/panel/accessos", text: "Accessos", icona: "M15 7a4 4 0 1 1-3.5 6L4 20.5V17h3v-3h3l1.5-1.5A4 4 0 0 1 15 7" },
  { href: "/panel/trafic", text: "Trafic", icona: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/panel/activitat", text: "Activitat", icona: "M3 12h4l3-8 4 16 3-8h4" },
  { href: "/panel/seo", text: "Cerca a Google", icona: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M21 21l-5-5" },
  { href: "/panel/avisos", text: "Avisos", icona: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0" },
  { href: "/panel/automatitzacions", text: "Automatitzacions", icona: "M5 5h5v5H5zM14 14h5v5h-5zM10 7.5h4M7.5 10v4" },
  { href: "/panel/infraestructura", text: "Infraestructura", icona: "M4 6h16v5H4zM4 13h16v5H4zM8 8.5h.01M8 15.5h.01" },
  { href: "/panel/ia", text: "Cost d'IA", icona: "M12 3v18M17 8c-1-1.5-2.7-2-5-2-2.5 0-4.5 1.2-4.5 3 0 4.5 9.5 2 9.5 6.5 0 2-2 3.5-5 3.5-2.5 0-4.2-.8-5-2.5" },
  { href: "/panel/fonaments", text: "Fonaments", icona: "M3 21h18M5 21V11M10 21V11M14 21V11M19 21V11M2 11l10-7 10 7z" },
];

const TEMES = [
  { id: "sistema", text: "Auto" },
  { id: "clar", text: "Clar" },
  { id: "fosc", text: "Fosc" },
];

function Icona({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
  );
}

export default function PanelShell({ children, demo = false }) {
  const ruta = usePathname();
  const [tema, setTema] = useState("sistema");
  const [fosc, setFosc] = useState(false);
  const [obert, setObert] = useState(false);
  const [aturat, setAturat] = useState(false);

  // A la demostracio, un boto que desa o envia torna aqui amb ?demo=lectura
  // (proxy.js): es diu que no s ha fet res i es neteja l adreça.
  useEffect(() => {
    if (!demo) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("demo") !== "lectura") { setAturat(false); return; }
    setAturat(true);
    p.delete("demo");
    const s = p.toString();
    window.history.replaceState(null, "", window.location.pathname + (s ? "?" + s : ""));
  }, [demo, ruta]);

  useEffect(() => {
    try {
      const g = localStorage.getItem("panel-tema");
      if (g === "clar" || g === "fosc" || g === "sistema") setTema(g);
    } catch {}
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const aplicar = () => setFosc(tema === "fosc" || (tema === "sistema" && mq.matches));
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [tema]);

  useEffect(() => { setObert(false); }, [ruta]);

  function triaTema(id) {
    setTema(id);
    try { localStorage.setItem("panel-tema", id); } catch {}
  }

  // La pantalla d entrada va sola, pero respecta el tema.
  const entrar = ruta === "/panel/entrar";
  const actiu = href => (href === "/panel" ? ruta === "/panel" : ruta === href || ruta.startsWith(href + "/"));

  return (
    <div className="pl-shell" data-theme={fosc ? "dark" : "light"}>
      {entrar ? (
        <main className="pl-main pl-main-sol">{children}</main>
      ) : (
        <>
          <aside className={"pl-side" + (obert ? " is-open" : "")}>
            <div className="pl-brand">
              <span className="pl-brand-marca" aria-hidden="true">a</span>
              <span>aulaia<small>{demo ? "demostració" : "panell"}</small></span>
            </div>

            <nav className="pl-nav" aria-label="Seccions del panell">
              <p className="pl-nav-titol">Gestio</p>
              {SECCIONS.map(s => (
                <Link key={s.href} href={s.href} className={"pl-link" + (actiu(s.href) ? " is-actiu" : "")}
                      aria-current={actiu(s.href) ? "page" : undefined}>
                  <Icona d={s.icona} />{s.text}
                </Link>
              ))}
            </nav>

            <div className="pl-side-peu">
              <div className="pl-tema" role="group" aria-label="Tema de colors">
                {TEMES.map(t => (
                  <button key={t.id} type="button" onClick={() => triaTema(t.id)}
                          className={tema === t.id ? "is-actiu" : ""} aria-pressed={tema === t.id}>
                    {t.text}
                  </button>
                ))}
              </div>
              <form method="post" action="/api/panel/sortir">
                <button type="submit" className="pl-sortir">Sortir del panell</button>
              </form>
            </div>
          </aside>

          {obert && <div className="pl-vel" onClick={() => setObert(false)} aria-hidden="true" />}

          <div className="pl-cos">
            <header className="pl-top">
              <button type="button" className="pl-burger" onClick={() => setObert(o => !o)}
                      aria-label="Obrir el menu" aria-expanded={obert}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              </button>
              <span className="pl-top-titol">{(SECCIONS.find(s => actiu(s.href)) || SECCIONS[0]).text}</span>
              {demo && <span className="pl-demo-marca">Demostració</span>}
              <a href="/" className="pl-top-web" target="_blank" rel="noopener">Veure la web</a>
            </header>
            {demo && (
              <p className={"pl-demo" + (aturat ? " is-aturat" : "")} role="status">
                {aturat
                  ? <><b>No s'ha fet cap canvi.</b> Això és la demostració: es pot mirar tot, però no es desa ni s'envia res.</>
                  : <><b>Dades inventades.</b> Centres, persones, correus i imports són ficticis; el panell és el de debò. Es pot mirar tot i no es desa ni s'envia res.</>}
              </p>
            )}
            <main className="pl-main">{children}</main>
          </div>
        </>
      )}
    </div>
  );
}
