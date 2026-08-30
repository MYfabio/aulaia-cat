/**
 * Capçaleres de seguretat.
 *
 * No n hi havia cap: el navegador no rebia cap instruccio i qualsevol web
 * podia carregar aulaia.cat dins d un marc invisible. Aqui hi ha el panell
 * de control i les altes de centres, o sigui que val la pena tancar-ho.
 *
 * La CSP es limita a frame-ancestors a proposit. Una politica completa
 * trencaria els estils en linia de les pagines i el guany no compensa el
 * risc de deixar el web mig pintat; el que si tanca es l emmarcat.
 */
const capçaleresSeguretat = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Si un fitxer diu que es una imatge, s ha de tractar com a imatge i no
  // executar-lo mai com a codi.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Aquest web no necessita camera, ni microfon, ni ubicacio.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Un cop s ha entrat per https, el navegador no ho torna a provar per http.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: capçaleresSeguretat },
      {
        // El domini de Railway serveix el mateix contingut que aulaia.cat. Si
        // un cercador l indexa, el web competeix amb ell mateix i l autoritat
        // es reparteix entre dues adreces.
        source: "/:path*",
        has: [{ type: "host", value: "aulaia-cat-production-978b.up.railway.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

module.exports = nextConfig;
