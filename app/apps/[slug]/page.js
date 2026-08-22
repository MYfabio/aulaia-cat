import Link from "next/link";
import { notFound } from "next/navigation";
import apps from "../../../data/apps.json";

export function generateStaticParams() { return apps.map(a=>({slug:a.slug})); }

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const app = apps.find(a=>a.slug===slug);
  if(!app) return {};
  const url = "https://www.aulaia.cat/apps/"+app.slug;
  return {
    title: app.seo.title,
    description: app.seo.description,
    keywords: app.seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: app.seo.title,
      description: app.seo.description,
      url,
      siteName: "aulaia.cat",
      locale: "ca_ES",
      type: "website",
    },
  };
}

function Jsonld({ app }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.nom,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: app.seo.description,
    inLanguage: app.idiomes,
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
    ...(app.url ? { url: app.url } : {}),
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    provider: { "@type": "Organization", name: "aulaia.cat", url: "https://www.aulaia.cat" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />;
}

export default async function AppLanding({ params }) {
  const { slug } = await params;
  const app = apps.find(a=>a.slug===slug);
  if(!app) notFound();
  const relacionats = (app.relacionats||[]).map(s=>apps.find(a=>a.slug===s)).filter(Boolean);

  return (
    <div className="landing">
      <Jsonld app={app} />
      <Link href="/#apps" className="landing-back">← Torna al cataleg</Link>
      <span className="landing-tag">{app.icona} {app.categoria}</span>
      <h1>{app.nom}</h1>
      <p className="landing-desc">{app.descripcio}</p>

      {app.url && (
        <div className="live-banner">
          <div className="live-banner-text">
            <strong>Projecte en produccio</strong>
            <span>{app.domini}{app.centre ? " · "+app.centre : ""}</span>
          </div>
          <a href={app.url} target="_blank" rel="noopener" className="btn btn-primary">Visita {app.domini}</a>
        </div>
      )}

      <div className="fact-grid">
        {app.publics?.length>0 && <div className="fact"><span className="fact-k">Etapes</span><span className="fact-v">{app.publics.join(" · ")}</span></div>}
        {app.idiomes?.length>0 && <div className="fact"><span className="fact-k">Idiomes</span><span className="fact-v">{app.idiomes.join(" · ")}</span></div>}
        <div className="fact"><span className="fact-k">Estat</span><span className="fact-v">{app.estatText}</span></div>
      </div>

      <div className="landing-cta-bar">
        <Link href={"/contacte?app="+encodeURIComponent(app.nom)} className="btn btn-primary">M interessa per a la meva escola</Link>
        <Link href={"/contacte?app="+encodeURIComponent(app.nom)} className="btn btn-outline">Demana una demo gratuita</Link>
      </div>

      <h2>Funcionalitats principals</h2>
      <ul className="features-list">
        {app.funcionalitats.map(f=>(
          <li key={f} className="feature-item"><span className="feature-check">✓</span><span>{f}</span></li>
        ))}
      </ul>

      {app.seoLlarg && (
        <>
          <h2>Mes informacio sobre {app.nom}</h2>
          <p className="seo-text">{app.seoLlarg}</p>
        </>
      )}

      {app.faq?.length>0 && (
        <>
          <h2>Preguntes frequents</h2>
          <div className="faq-list">
            {app.faq.map(f=>(
              <details key={f.p} className="faq-item">
                <summary>{f.p}</summary>
                <p>{f.r}</p>
              </details>
            ))}
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
            "@context":"https://schema.org","@type":"FAQPage",
            mainEntity: app.faq.map(f=>({"@type":"Question",name:f.p,acceptedAnswer:{"@type":"Answer",text:f.r}}))
          })}} />
        </>
      )}

      {relacionats.length>0 && (
        <>
          <h2>Altres projectes d aulaia.cat</h2>
          <div className="rel-grid">
            {relacionats.map(r=>(
              <Link key={r.slug} href={"/apps/"+r.slug} className="rel-card">
                <span className="rel-icon">{r.icona}</span>
                <span className="rel-name">{r.nom}</span>
                <span className="rel-desc">{r.resum}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="landing-final-cta">
        <p className="landing-final-title">Vols veure {app.nom} al teu centre?</p>
        <p className="landing-final-sub">Demo gratuita sense compromis. T expliquem com s adapta a la teva realitat.</p>
        <Link href={"/contacte?app="+encodeURIComponent(app.nom)} className="btn btn-primary" style={{fontSize:"1rem",padding:".75rem 2rem"}}>Contactans sobre {app.nom}</Link>
      </div>
    </div>
  );
}
