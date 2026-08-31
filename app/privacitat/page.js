export const metadata = {
  title: "Política de privacitat i cookies",
  description: "Informació sobre el tractament de dades personals i l'us de cookies a aulaia.cat, d'acord amb el RGPD.",
};

export default function Privacitat() {
  return (
    <div style={{maxWidth:"720px",margin:"0 auto",padding:"3rem 2rem"}}>
      <h1 style={{fontSize:"1.8rem",fontWeight:600,marginBottom:"0.5rem",color:"var(--navy)"}}>Política de privacitat i cookies</h1>
      <p style={{color:"var(--muted)",marginBottom:"2rem",fontSize:"0.9rem"}}>Darrera actualització: agost 2026</p>

      <h2 style={{fontSize:"1.15rem",fontWeight:600,margin:"2rem 0 0.75rem",color:"var(--navy)"}}>1. Responsable del tractament</h2>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"1rem"}}>El responsable del tractament de les dades personals recollides a través d'aquest lloc web és aulaia.cat, amb adreça de contacte: <a href="mailto:hola@aulaia.cat" style={{color:"var(--blue)"}}>hola@aulaia.cat</a>.</p>

      <h2 style={{fontSize:"1.15rem",fontWeight:600,margin:"2rem 0 0.75rem",color:"var(--navy)"}}>2. Dades que recollim</h2>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"1rem"}}>Només recollim les dades que ens proporciones voluntàriament a través del formulari de contacte: nom, correu electrònic, centre educatiu i missatge. No recollim dades de menors d'edat sense el consentiment dels seus tutors legals.</p>

      <h2 style={{fontSize:"1.15rem",fontWeight:600,margin:"2rem 0 0.75rem",color:"var(--navy)"}}>3. Finalitat del tractament</h2>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"1rem"}}>Les dades recollides s'utilitzen exclusivament per respondre les teves consultes i organitzar les demos dels nostres productes. No les cedim a tercers ni les utilitzem per a finalitats de màrqueting sense el teu consentiment explícit.</p>

      <h2 style={{fontSize:"1.15rem",fontWeight:600,margin:"2rem 0 0.75rem",color:"var(--navy)"}}>4. Base jurídica</h2>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"1rem"}}>El tractament es basa en el teu consentiment explícit (art. 6.1.a RGPD) i en l'interès legítim de respondre les teves sol·licituds (art. 6.1.f RGPD).</p>

      <h2 style={{fontSize:"1.15rem",fontWeight:600,margin:"2rem 0 0.75rem",color:"var(--navy)"}}>5. Cookies</h2>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"0.5rem"}}>Aquest web utilitza només cookies tècniques necessàries per al seu funcionament:</p>
      <table style={{width:"100%",borderCollapse:"collapse",marginBottom:"1rem",fontSize:"0.875rem"}}>
        <thead>
          <tr style={{background:"var(--bg)"}}>
            <th style={{padding:"0.6rem 1rem",textAlign:"left",border:"1px solid var(--border)",color:"var(--navy)"}}>Cookie</th>
            <th style={{padding:"0.6rem 1rem",textAlign:"left",border:"1px solid var(--border)",color:"var(--navy)"}}>Finalitat</th>
            <th style={{padding:"0.6rem 1rem",textAlign:"left",border:"1px solid var(--border)",color:"var(--navy)"}}>Duracio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{padding:"0.6rem 1rem",border:"1px solid var(--border)",color:"var(--muted)"}}>aulaia-cookies</td>
            <td style={{padding:"0.6rem 1rem",border:"1px solid var(--border)",color:"var(--muted)"}}>Desa la teva preferència de cookies</td>
            <td style={{padding:"0.6rem 1rem",border:"1px solid var(--border)",color:"var(--muted)"}}>1 any</td>
          </tr>
        </tbody>
      </table>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"1rem"}}>No utilitzem cookies de seguiment, analítiques de tercers ni publicitat. Pots esborrar les cookies en qualsevol moment des de la configuració del teu navegador.</p>

      <h2 style={{fontSize:"1.15rem",fontWeight:600,margin:"2rem 0 0.75rem",color:"var(--navy)"}}>6. Drets de les persones interessades</h2>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"1rem"}}>Tens dret a accedir, rectificar, suprimir, oposar-te i limitar el tractament de les teves dades. Pots exercir aquests drets enviant un correu a <a href="mailto:hola@aulaia.cat" style={{color:"var(--blue)"}}>hola@aulaia.cat</a>. Si consideres que el tractament no és adequat, pots presentar una reclamació davant l'Autoritat Catalana de Protecció de Dades (APDCAT).</p>

      <h2 style={{fontSize:"1.15rem",fontWeight:600,margin:"2rem 0 0.75rem",color:"var(--navy)"}}>7. Conservació de les dades</h2>
      <p style={{color:"var(--muted)",lineHeight:1.8,marginBottom:"1rem"}}>Conservem les teves dades durant el temps necessari per atendre la teva consulta i, posteriorment, durant els terminis legals aplicables. Un cop transcorreguts, les dades s'eliminen de manera segura.</p>
    </div>
  );
}
