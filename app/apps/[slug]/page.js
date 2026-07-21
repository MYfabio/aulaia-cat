import Link from "next/link";
import { notFound } from "next/navigation";
import apps from "../../../data/apps.json";
export function generateStaticParams() { return apps.map(a=>({slug:a.slug})); }
export function generateMetadata({params}) {
  const app=apps.find(a=>a.slug===params.slug);
  if(!app) return {};
  return {title:app.seo.title, description:app.seo.description, keywords:app.seo.keywords};
}
export default function AppLanding({params}) {
  const app=apps.find(a=>a.slug===params.slug);
  if(!app) notFound();
  return (
    <div className="landing">
      <Link href="/#apps" className="landing-back">← Torna al cataleg</Link>
      <span className="landing-tag">{app.icona} {app.categoria}</span>
      <h1>{app.nom}</h1>
      <p className="landing-desc">{app.descripcio}</p>
      {app.estat==="produccio"&&app.urlDemo&&(
        <div className="live-banner">
          <div className="live-banner-text">
            <strong>Projecte en produccio</strong>
            <span>{app.centre||"Disponible i funcionant"}</span>
          </div>
          <a href={app.urlDemo} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Visita el projecte</a>
        </div>
      )}
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
      {app.seoLlarg&&(
        <>
          <h2>Mes informacio sobre {app.nom}</h2>
          <p className="seo-text">{app.seoLlarg}</p>
        </>
      )}
      <div style={{background:"var(--teal-light)",border:"1px solid #A8DECE",borderRadius:"var(--radius)",padding:"2rem",textAlign:"center",marginTop:"2rem"}}>
        <p style={{fontSize:"1.1rem",fontWeight:600,marginBottom:".5rem",color:"var(--navy)"}}>Vols veure {app.nom} al teu centre?</p>
        <p style={{color:"var(--muted)",marginBottom:"1.25rem",fontSize:".9rem"}}>Demo gratuita sense compromis. T expliquem com s adapta a la teva realitat.</p>
        <Link href={"/contacte?app="+encodeURIComponent(app.nom)} className="btn btn-primary" style={{fontSize:"1rem",padding:".75rem 2rem"}}>Contactans sobre {app.nom}</Link>
      </div>
    </div>
  );
}
