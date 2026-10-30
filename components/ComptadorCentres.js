"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const MAX_PUNTS = 36;

/**
 * Franja de la portada: el nombre de centres puja fins a la xifra real quan
 * es veu a la pantalla, cada centre s'encen com un punt i l'ultim punt, que
 * pampalluga, es el del centre que encara no hi es. Sense JavaScript, o amb
 * "reduir moviment", surt directament la xifra final.
 */
export default function ComptadorCentres({ n, t, href }) {
  const arrel = useRef(null);
  const [valor, setValor] = useState(n);
  const [encesa, setEncesa] = useState(true);

  useEffect(() => {
    const redueix = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (redueix || !("IntersectionObserver" in window)) return;

    setValor(0);
    setEncesa(false);
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      setEncesa(true);
      const durada = 1600;
      const inici = performance.now();
      const pas = ara => {
        const p = Math.min((ara - inici) / durada, 1);
        setValor(Math.round(n * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    }, { threshold: 0.35 });
    obs.observe(arrel.current);
    return () => obs.disconnect();
  }, [n]);

  const punts = Math.min(n, MAX_PUNTS);

  return (
    <section ref={arrel} className={"comptador" + (encesa ? " comptador-on" : "")} aria-label={t.titol}>
      <div className="comptador-inner">
        <span className="comptador-tag">{t.tag}</span>
        <p className="comptador-xifra" aria-hidden="true">{valor}</p>
        <h2 className="comptador-titol">{t.titol}</h2>
        <p className="comptador-text">{t.text}</p>
        <div className="comptador-punts" aria-hidden="true">
          {Array.from({ length: punts }, (_, i) => (
            <span key={i} className="comptador-punt" style={{ "--i": i }} />
          ))}
          <span className="comptador-punt comptador-tu" style={{ "--i": punts }} />
        </div>
        <Link href={href} className="comptador-boto">{t.boto} <span aria-hidden="true">→</span></Link>
        <p className="comptador-nota">{t.nota}</p>
      </div>
    </section>
  );
}
