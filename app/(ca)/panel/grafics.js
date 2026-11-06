/** Grafics SVG propis: el projecte no porta cap llibreria de grafics. */

/** Anell de percentatge. `valor` va de 0 a 100; si es null, es mostra buit. */
export function Anell({ valor, mida = 180, gruix = 18, etiqueta, to = "auto", subtitol }) {
  const r = (mida - gruix) / 2;
  const c = 2 * Math.PI * r;
  const te = valor != null;
  const v = te ? Math.max(0, Math.min(100, valor)) : 0;
  const color = !te ? "var(--rule)" : v >= 80 ? "var(--ok)" : v >= 50 ? "var(--avis)" : "var(--mal)";
  return (
    <div className="anell" style={{ width: mida, height: mida }}>
      <svg viewBox={`0 0 ${mida} ${mida}`} width={mida} height={mida} role="img"
           aria-label={te ? `${etiqueta}: ${Math.round(v)} per cent` : `${etiqueta}: sense dades`}>
        <circle cx={mida / 2} cy={mida / 2} r={r} fill="none" stroke="var(--rule-soft)" strokeWidth={gruix} />
        {te && (
          <circle cx={mida / 2} cy={mida / 2} r={r} fill="none" stroke={color} strokeWidth={gruix}
                  strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`}
                  transform={`rotate(-90 ${mida / 2} ${mida / 2})`} />
        )}
      </svg>
      <div className="anell-text" data-mida={to}>
        <b>{te ? `${Math.round(v)}%` : "—"}</b>
        {subtitol && <span>{subtitol}</span>}
      </div>
    </div>
  );
}

/** Mini grafic de linia amb area, com els de les targetes. */
export function Mini({ serie, etiqueta }) {
  if (!serie || serie.length < 2) return <div className="mini mini-buit" aria-hidden="true" />;
  const w = 200, h = 56;
  const max = Math.max(...serie, 1);
  const pts = serie.map((v, i) => `${((i / (serie.length - 1)) * w).toFixed(1)},${(h - (v / max) * (h - 6) - 3).toFixed(1)}`);
  return (
    <svg className="mini" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={etiqueta}>
      <polyline points={`0,${h} ${pts.join(" ")} ${w},${h}`} className="mini-fons" />
      <polyline points={pts.join(" ")} className="mini-trac" />
    </svg>
  );
}
