export const metadata = {
  title: "Entrar al panell",
  robots: { index: false, follow: false },
};

export default async function EntrarPage({ searchParams }) {
  const sp = await searchParams;
  const error = sp?.error === "1";
  const seguent = typeof sp?.seguent === "string" && sp.seguent.startsWith("/") ? sp.seguent : "/panel";

  return (
    <div className="panel-entrar">
      <h1>Panell de control</h1>
      <p className="panel-entrar-sub">Zona privada d aulaia.cat</p>

      <form method="POST" action="/api/panel/entrar" className="panel-entrar-form">
        <input type="hidden" name="seguent" value={seguent} />
        <div className="form-group">
          <label htmlFor="password">Contrasenya</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        </div>
        {error && <p className="panel-error">Contrasenya incorrecta. Torna-ho a provar.</p>}
        <button type="submit" className="btn-submit">Entrar</button>
      </form>
    </div>
  );
}
