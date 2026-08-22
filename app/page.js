import Link from "next/link";
import apps from "../data/apps.json";

export const metadata = {
  title: "Apps i software educatiu per a escoles de Catalunya",
  description: "Cataleg d aplicacions i projectes digitals per a centres educatius de Catalunya. Radio escolar, dictats amb IA, sostenibilitat, pla lector i mecanografia.",
  alternates: { canonical: "/" },
};

function AppCard({ app }) {
  return (
    <Link href={"/apps/"+app.slug} className="app-card">
      <div className="app-card-icon">{app.icona}</div>
      <div className="app-card-cat">{app.categoria}</div>
      <div className="app-card-name">{app.nom}</div>
      <div className="app-card-desc">{app.resum}</div>
      {app.domini && <div className="app-card-domain">{app.domini}</div>}
      <div className="app-card-footer">
        {app.estat==="produccio" && <span className="app-card-live">En produccio</span>}
        {app.estat==="desenvolupament" && <span className="app-card-soon">Properament</span>}
        <span className="btn btn-ghost">Veure detall</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const enLinia = apps.filter(a=>a.domini);
  const enPreparacio = apps.filter(a=>!a.domini);

  return (
    <>
      <section className="hero">
        <span className="hero-tag">Apps educatives · Catalunya</span>
        <h1>Aprofitem la tecnologia<br/>per als nostres <span>alumnes</span></h1>
        <p>Projectes digitals per a centres escolars i instituts de Catalunya. Cada app neix d una necessitat real de l aula i posa la tecnologia al servei de l aprenentatge.</p>
        <div className="hero-actions">
          <Link href="#apps" className="btn btn-primary">Descobreix les apps</Link>
          <Link href="/contacte" className="btn btn-outline">Demana una demo</Link>
        </div>
        <div className="hero-badges">
          {["Projectes reals en us","Per a escoles i instituts","Fet a Catalunya","Amb suport d IA"].map(b=>(
            <span key={b} className="badge">{b}</span>
          ))}
        </div>
      </section>

      <section className="seo-intro">
        <div className="seo-intro-inner">
          <h2>Software educatiu per aprofitar la tecnologia a les aules de Catalunya</h2>
          <p>A aulaia.cat dissenyem i desenvolupem aplicacions digitals pensades especificament per a la realitat dels centres educatius catalans. No adaptem eines generals: creem solucions que neixen de les necessitats reals dels docents, dels equips directius i, sobretot, de l alumnat.</p>
          <p>La tecnologia, per si sola, no transforma l educacio. El que la transforma es posar-la al servei d un proposit pedagogic clar. Cada projecte d aulaia.cat neix d una pregunta concreta que es fa un docent o un equip directiu: com fem que l alumnat millori l ortografia sense hores de correccio manual? Com donem veu a l alumnat mes enlla de l aula? Com convertim la sostenibilitat en un projecte real i no en un exercici fictici?</p>
          <p>Cada projecte te el seu propi domini i la seva propia web, i des d aqui pots veure que fa cadascun abans d entrar-hi. Totes comparteixen el mateix principi: la tecnologia ha de ser invisible. El que ha de brillar es l aprenentatge.</p>
          <div className="seo-intro-tags">
            {["Apps per a ESO","Cicles Formatius","Primaria","Batxillerat","Escola Verda","Aprenentatge Servei","Competencia Digital","STEM"].map(t=>(
              <span key={t} className="badge">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider"/>

      <section className="section" id="apps">
        <div className="section-header">
          <h2>Els nostres projectes en linia</h2>
          <p>Cada projecte te el seu domini propi. Fes clic per veure el detall abans de visitar-lo.</p>
        </div>
        <div className="apps-grid">
          {enLinia.map(app=><AppCard key={app.slug} app={app} />)}
        </div>
      </section>

      {enPreparacio.length>0 && (
        <section className="section" id="en-preparacio">
          <div className="section-header">
            <h2>En preparacio</h2>
            <p>Projectes que estem presentant als centres i encara no tenen web publica.</p>
          </div>
          <div className="apps-grid">
            {enPreparacio.map(app=><AppCard key={app.slug} app={app} />)}
          </div>
        </section>
      )}

      <hr className="divider"/>

      <section className="section" id="per-a-qui">
        <div className="section-header">
          <h2>Per a qui es aulaia.cat?</h2>
          <p>Dissenyem per als professionals que fan possible la transformacio digital dels centres educatius.</p>
        </div>
        <div className="who-grid">
          {[
            {icon:"👩‍💼",title:"Equips directius",desc:"Eines per prendre decisions agils amb dades reals del centre."},
            {icon:"💻",title:"Coordinadors digitals",desc:"Apps facils d integrar sense trencar la rutina del claustre."},
            {icon:"✏️",title:"Docents innovadors",desc:"Projectes que amplien les possibilitats de l aprenentatge a l aula."},
            {icon:"🏢",title:"Escoles i instituts",desc:"Solucions adaptades a la realitat dels centres publics i concertats."},
          ].map(w=>(
            <div key={w.title} className="who-card">
              <div className="who-card-icon">{w.icon}</div>
              <h3>{w.title}</h3><p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider"/>

      <section className="section" style={{textAlign:"center"}}>
        <h2 style={{fontSize:"1.6rem",fontWeight:600,marginBottom:".75rem",color:"var(--navy)"}}>Vols veure alguna app en accio?</h2>
        <p style={{color:"var(--muted)",marginBottom:"1.5rem",maxWidth:"480px",margin:"0 auto 1.5rem"}}>Demana una demo gratuita i t expliquem com s adapta al teu centre. Sense compromis.</p>
        <Link href="/contacte" className="btn btn-primary" style={{fontSize:"1rem",padding:".75rem 2rem"}}>Contactans</Link>
      </section>
    </>
  );
}
