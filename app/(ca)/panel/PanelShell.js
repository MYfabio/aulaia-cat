"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONS = [
  { href: "/panel", text: "Resum", icona: "M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/panel/altes", text: "Altes de centres", icona: "M4 5h16v14H4zM4 9h16M8 14h4" },
  { href: "/panel/missatges", text: "Missatges", icona: "M4 5h16v11H9l-5 4z" },
  { href: "/panel/contactes", text: "Contactes", icona: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21c0-4 4-6 8-6s8 2 8 6" },
  { href: "/panel/accessos", text: "Accessos", icona: "M15 7a4 4 0 1 1-3.5 6L4 20.5V17h3v-3h3l1.5-1.5A4 4 0 0 1 15 7" },
  { href: "/panel/trafic", text: "Trafic", icona: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/panel/seo", text: "Cerca a Google", icona: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M21 21l-5-5" },
  { href: "/panel/infraestructura", text: "Infraestructura", icona: "M4 6h16v5H4zM4 13h16v5H4zM8 8.5h.01M8 15.5h.01" },
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

export default function PanelShell({ children }) {
  const ruta = usePathname();
  const [tema, setTema] = useState("sistema");
  const [fosc, setFosc] = useState(false);
  const [obert, setObert] = useState(false);

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
              <span>aulaia<small>panell</small></span>
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
              <a href="/" className="pl-top-web" target="_blank" rel="noopener">Veure la web</a>
            </header>
            <main className="pl-main">{children}</main>
          </div>
        </>
      )}
    </div>
  );
}
