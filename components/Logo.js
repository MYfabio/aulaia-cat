export default function Logo({ size = 36, dark = false }) {
  const roof = dark ? '#7FA3E8' : '#2D4A8A';
  const ia = dark ? '#2DD4B8' : '#14A085';
  const ink = dark ? '#FFFFFF' : '#22303A';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <svg width={size} height={size} viewBox="0 0 64 72" aria-hidden="true">
        <path d="M4 62 L32 22 L60 62 Z" fill="none" stroke={roof} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="32" cy="22" r="10" fill="#F2A63B" />
        <line x1="32" y1="22" x2="32" y2="0" stroke="#F2A63B" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="32" cy="4" r="4.5" fill={ia} />
      </svg>
      <span style={{ fontWeight: 600, fontSize: size * 0.62, letterSpacing: '-0.02em', color: ink }}>
        aula<span style={{ color: ia }}>ia</span>
        <span style={{ fontWeight: 400, opacity: 0.55 }}>.cat</span>
      </span>
    </span>
  );
}