"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Dues xarxes per idioma: identitat del projecte i enfocament estatal (adaptacio, NESE, inclusio).
// Cada frase enllaça a una pàgina real de la web.
const XARXES = {
  ca: [
    { titol: "Un projecte de l'escola pública", frases: [
      { t: "Gratuïtes per a l'escola pública", h: "/#apps" },
      { t: "Fetes des de dins de l'aula", h: "/#per-a-qui" },
      { t: "Un sol accés per a tot el centre", h: "/alta" },
      { t: "Privacitat de l'alumnat, primer", h: "/privacitat" },
      { t: "La IA proposa, el docent decideix", h: "/blog" },
      { t: "Català i castellà, sense canvis", h: "/es" },
      { t: "Demana el teu accés", h: "/alta" },
      { t: "Respost personalment, sense compromís", h: "/contacte" },
    ] },
    { titol: "Per a tot l'alumnat, a tot l'Estat", frases: [
      { t: "Cada alumne al seu ritme", h: "/#apps" },
      { t: "Adaptacions per a NESE sense etiquetes", h: "/#apps" },
      { t: "Accessible per a tothom", h: "/#per-a-qui" },
      { t: "Pensat per a escoles de tot l'Estat", h: "/alta" },
      { t: "Tecnologia amb sentit pedagògic", h: "/blog" },
      { t: "Famílies i escola, connectades", h: "/#apps" },
      { t: "S'adapta al currículum de cada territori", h: "/contacte" },
      { t: "Inclusió a l'aula, cada dia", h: "/blog" },
    ] },
  ],
  es: [
    { titol: "Un proyecto de la escuela pública", frases: [
      { t: "Gratuitas para la escuela pública", h: "/es/#apps" },
      { t: "Hechas desde dentro del aula", h: "/es/#per-a-qui" },
      { t: "Un solo acceso para todo el centro", h: "/es/alta" },
      { t: "Privacidad del alumnado, primero", h: "/es/privacitat" },
      { t: "La IA propone, el docente decide", h: "/es/blog" },
      { t: "Castellano y catalán, sin cambios", h: "/" },
      { t: "Pide tu acceso", h: "/es/alta" },
      { t: "Respondido personalmente, sin compromiso", h: "/es/contacte" },
    ] },
    { titol: "Para todo el alumnado, en todo el Estado", frases: [
      { t: "Cada alumno a su ritmo", h: "/es/#apps" },
      { t: "Adaptaciones para NEAE sin etiquetas", h: "/es/#apps" },
      { t: "Accesible para todos", h: "/es/#per-a-qui" },
      { t: "Pensado para escuelas de todo el Estado", h: "/es/alta" },
      { t: "Tecnología con sentido pedagógico", h: "/es/blog" },
      { t: "Familias y escuela, conectadas", h: "/es/#apps" },
      { t: "Se adapta al currículo de cada territorio", h: "/es/contacte" },
      { t: "Inclusión en el aula, cada día", h: "/es/blog" },
    ] },
  ],
};

const TEAL = "6, 163, 181";
const BLAU = "11, 74, 138";
const TINTA = "11, 37, 64";

/** Punts repartits per una esfera (espiral de Fibonacci). */
function puntEsfera(i, n) {
  const y = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(1 - y * y);
  const a = i * 2.399963;
  return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
}

function Malla({ frases, titol }) {
  const refCanvas = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = refCanvas.current;
    const ctx = canvas.getContext("2d");
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Nodes: primer les frases, després punts decoratius.
    const total = frases.length + 26;
    // Les frases van repartides per tota l'esfera (una de cada 4 punts, aprox.).
    const pas = total / frases.length;
    const posFrase = new Map(frases.map((f, k) => [Math.floor(k * pas + pas / 2), f]));
    const nodes = Array.from({ length: total }, (_, i) => ({
      ...puntEsfera(i, total),
      frase: posFrase.get(i) || null,
      r: posFrase.has(i) ? 4.5 : 2 + (i % 3) * 0.7,
    }));
    // Arestes: cada node amb els seus 3 veïns més propers.
    const arestes = new Set();
    nodes.forEach((a, i) => {
      nodes
        .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
        .filter(o => o.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 3)
        .forEach(o => arestes.add(i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`));
    });
    const llista = [...arestes].map(k => k.split("-").map(Number));

    let w = 0, h = 0, dpr = 1;
    let ay = 0, ax = -0.25;
    let vy = quiet ? 0 : 0.0022;
    let arrossega = null, mogut = 0;
    let sobre = -1, visible = true, raf = 0;
    let caixes = [];

    function mida() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function projecta() {
      const sx = w * 0.34, sy = h * 0.4, sz = Math.min(w, h) * 0.4;
      const ca = Math.cos(ay), sa = Math.sin(ay), cx = Math.cos(ax), sx2 = Math.sin(ax);
      return nodes.map(n => {
        const x1 = n.x * ca + n.z * sa;
        const z1 = -n.x * sa + n.z * ca;
        const y2 = n.y * cx - z1 * sx2;
        const z2 = n.y * sx2 + z1 * cx;
        const f = 1 / (1.9 - z2 * 0.55);
        return { x: w / 2 + x1 * sx * f * 1.9, y: h / 2 + y2 * sy * f * 1.9, z: z2, f, sz };
      });
    }

    function pinta() {
      ctx.clearRect(0, 0, w, h);
      const p = projecta();
      // Línies
      llista.forEach(([i, j]) => {
        const a = p[i], b = p[j];
        const prof = ((a.z + b.z) / 2 + 1) / 2;
        const viu = sobre === i || sobre === j;
        ctx.strokeStyle = `rgba(${viu ? TEAL : BLAU}, ${viu ? 0.75 : 0.08 + prof * 0.3})`;
        ctx.lineWidth = viu ? 1.6 : 0.8 + prof * 0.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      // Nodes i frases, de darrere cap endavant
      caixes = [];
      const ordre = p.map((_, i) => i).sort((a, b) => p[a].z - p[b].z);
      const petit = w < 520;
      ordre.forEach(i => {
        const n = nodes[i], q = p[i];
        const prof = (q.z + 1) / 2;
        const rad = n.r * (0.6 + q.f * 1.1);
        const viu = sobre === i;
        ctx.fillStyle = `rgba(${n.frase ? TEAL : BLAU}, ${0.35 + prof * 0.65})`;
        if (n.frase) { ctx.shadowColor = `rgba(${TEAL}, 0.6)`; ctx.shadowBlur = 10 * prof; }
        ctx.beginPath(); ctx.arc(q.x, q.y, rad, 0, 6.2832); ctx.fill();
        ctx.shadowBlur = 0;
        if (!n.frase) return;
        const mida = (petit ? 11 : 13) * (0.8 + q.f * 0.7);
        ctx.font = `600 ${mida}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        const tw = ctx.measureText(n.frase.t).width;
        const bw = tw + 18, bh = mida + 12;
        const bx = Math.max(4, Math.min(w - bw - 4, q.x - bw / 2)), by = q.y - rad - bh - 6;
        const alfa = viu ? 1 : 0.18 + prof * 0.82;
        ctx.globalAlpha = alfa;
        ctx.fillStyle = viu ? `rgb(${TEAL})` : "rgba(255,255,255,0.92)";
        ctx.strokeStyle = `rgba(${viu ? TEAL : BLAU}, 0.35)`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = viu ? "#fff" : `rgb(${TINTA})`;
        ctx.textBaseline = "middle"; ctx.textAlign = "center";
        ctx.fillText(n.frase.t, bx + bw / 2, by + bh / 2 + 0.5);
        ctx.globalAlpha = 1;
        if (prof > 0.35) caixes.push({ i, x: bx, y: by, w: bw, h: bh, h2: n.frase.h });
      });
    }

    function bucle() {
      if (visible) {
        if (!arrossega) { ay += vy; vy += ((quiet ? 0 : 0.0022) - vy) * 0.03; }
        pinta();
      }
      raf = requestAnimationFrame(bucle);
    }

    const pos = e => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const caixaA = pt => [...caixes].reverse().find(c => pt.x >= c.x && pt.x <= c.x + c.w && pt.y >= c.y && pt.y <= c.y + c.h);

    const onDown = e => { arrossega = pos(e); mogut = 0; canvas.setPointerCapture(e.pointerId); };
    const onMove = e => {
      const pt = pos(e);
      if (arrossega) {
        const dx = pt.x - arrossega.x, dy = pt.y - arrossega.y;
        mogut += Math.abs(dx) + Math.abs(dy);
        ay += dx * 0.006; vy = dx * 0.0006;
        ax = Math.max(-0.9, Math.min(0.9, ax + dy * 0.004));
        arrossega = pt;
      }
      const c = caixaA(pt);
      sobre = c ? c.i : -1;
      canvas.style.cursor = c ? "pointer" : arrossega ? "grabbing" : "grab";
    };
    const onUp = e => {
      const pt = pos(e);
      const c = caixaA(pt);
      arrossega = null;
      if (c && mogut < 6) router.push(c.h2);
    };
    const onLeave = () => { sobre = -1; };

    const ro = new ResizeObserver(mida);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    mida();
    raf = requestAnimationFrame(bucle);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [frases, router]);

  return (
    <figure className="xarxa-malla">
      <canvas ref={refCanvas} className="xarxa-canvas" aria-hidden="true" />
      <figcaption>{titol}</figcaption>
      {/* Alternativa accessible: els mateixos enllaços, sense canvas */}
      <ul className="xarxa-sr">
        {frases.map(f => <li key={f.t}><a href={f.h}>{f.t}</a></li>)}
      </ul>
    </figure>
  );
}

/** `quina`: 0 = identitat (al hero), 1 = enfocament estatal; sense valor, les dues. */
export default function XarxaIdees({ lang = "ca", quina }) {
  const totes = XARXES[lang] || XARXES.ca;
  const xarxes = quina === undefined ? totes : [totes[quina]];
  return (
    <section className={quina === undefined ? "xarxa" : "xarxa xarxa-una"} aria-label={lang === "es" ? "Redes de ideas de aulaia.cat" : "Xarxes d'idees d'aulaia.cat"}>
      {xarxes.map(x => <Malla key={x.titol} frases={x.frases} titol={x.titol} />)}
    </section>
  );
}
