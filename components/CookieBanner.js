"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const CLAU = "aulaia-cookies";

// Amb «bloquejar totes les galetes» (Safari, Firefox, Chrome) el navegador llança
// un SecurityError només de tocar localStorage. Sense aquesta protecció l'error
// pujava fins al marc comú i tombava tota la pàgina.
function llegeixConsentiment() {
  try { return localStorage.getItem(CLAU); } catch { return "inaccessible"; }
}

function desaConsentiment(valor) {
  try { localStorage.setItem(CLAU, valor); } catch {}
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  // Si no es pot llegir, tampoc es podria recordar la resposta: no es mostra el
  // bàner, que si no tornaria a sortir a cada càrrega.
  useEffect(() => {
    if (!llegeixConsentiment()) setVisible(true);
  }, []);

  function accept() {
    desaConsentiment("accepted");
    setVisible(false);
  }

  function reject() {
    desaConsentiment("rejected");
    setVisible(false);
  }

  // Reserva l'espai del bàner al final de la pàgina perquè no tapi el contingut
  useEffect(() => {
    if (!visible) return;
    const banner = document.querySelector(".cookie-banner");
    if (!banner) return;
    const ajusta = () => { document.body.style.paddingBottom = banner.offsetHeight + "px"; };
    ajusta();
    const observador = new ResizeObserver(ajusta);
    observador.observe(banner);
    return () => { observador.disconnect(); document.body.style.paddingBottom = ""; };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Avís de cookies" aria-live="polite">
      <div className="cookie-inner">
        <div className="cookie-text">
          <strong>🍪 Utilitzem cookies</strong>
          <p>
            Usem cookies tecnicament necessaries per al funcionament del web.
            No fem servir cookies de seguiment ni publicitat.{" "}
            <Link href="/privacitat" className="cookie-link">Mes informacio</Link>
          </p>
        </div>
        <div className="cookie-actions">
          <button onClick={reject} className="cookie-btn-reject">Rebutjar</button>
          <button onClick={accept} className="cookie-btn-accept">Acceptar</button>
        </div>
      </div>
    </div>
  );
}
