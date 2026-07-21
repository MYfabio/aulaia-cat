export default function Logo({ size = 36, dark = false }) {
  const marc = '#3B5BDB';
  const pissarra = '#1C2B5E';
  const ia = '#0EC6A2';
  const ink = dark ? '#FFFFFF' : '#1C2B5E';
  const sub = dark ? '#64748B' : '#9AA5AE';
  const w = size;
  const h = size * 0.88;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
      <svg width={w} height={h} viewBox="0 0 52 46" aria-hidden="true">
        <rect x="0" y="0" width="52" height="40" rx="9" fill={marc}/>
        <rect x="6" y="5" width="40" height="30" rx="6" fill={pissarra}/>
        <line x1="6" y1="26" x2="46" y2="26" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.1"/>
        <path d="M14 34 L26 8 L38 34" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="18" y1="26" x2="34" y2="26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="26" cy="5" r="6" fill={ia}/>
        <text x="26" y="8.5" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="6" fill="#FFFFFF">ia</text>
        <rect x="14" y="40" width="24" height="4" rx="2" fill={marc} opacity="0.5"/>
        <rect x="20" y="44" width="12" height="2" rx="1" fill={marc} opacity="0.3"/>
      </svg>
      <span style={{ fontWeight: 600, fontSize: size * 0.58, letterSpacing: '-0.02em', color: ink, lineHeight: 1 }}>
        aula<span style={{ color: ia }}>ia</span>
        <span style={{ fontWeight: 400, opacity: 0.45, fontSize: size * 0.48 }}>.cat</span>
      </span>
    </span>
  );
}
