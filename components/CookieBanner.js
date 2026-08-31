"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("aulaia-cookies");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("aulaia-cookies", "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem("aulaia-cookies", "rejected");
    setVisible(false);
  }

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
