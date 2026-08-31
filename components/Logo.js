export default function Logo({ size = 36, dark = false }) {
  const ink = dark ? '#F7F3E8' : '#183129';
  const soft = dark ? 'rgba(247,243,232,0.55)' : 'rgba(24,49,41,0.45)';
  const m = size * 0.62;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>
      <svg width={m} height={m} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
        <rect x="0" y="0" width="24" height="24" fill={ink} />
        <path d="M6 17 L12 7 L18 17" fill="none" stroke={dark ? '#153F2E' : '#F7F3E8'} strokeWidth="2.4" strokeLinecap="square" />
        <line x1="9" y1="13.5" x2="15" y2="13.5" stroke={dark ? '#153F2E' : '#F7F3E8'} strokeWidth="2.4" strokeLinecap="square" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: size * 0.5, letterSpacing: '-0.045em', color: ink, lineHeight: 1 }}>
        aulaia<span style={{ fontWeight: 500, color: soft }}>.cat</span>
      </span>
    </span>
  );
}
