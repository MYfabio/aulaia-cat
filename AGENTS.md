# Com treballar en aulaia.cat

## Arrencada local

```bash
npm install
npm run dev
```

L'aplicació estarà a `http://localhost:3000`. No necessita base de dades per al frontend.

Per a funcionalitat completa (formulari i panell), cal:
- `DATABASE_URL` amb connexió a PostgreSQL (crea la taula automàticament)
- `RESEND_API_KEY` per a enviament de correus
- `PANEL_PASSWORD` + `PANEL_SECRET` pel panell administratiu

## Estructura

```
app/                    # Rutes i components de Next.js
├── page.js            # Landing principal
├── alta/              # Formulari de sol·licitud
├── panel/             # Panell administratiu (protegit)
├── api/               # API del servidor
├── apps/[slug]/       # Detalls de cada app
└── blog/[slug]/       # Articles

lib/
├── db.js              # PostgreSQL: gestió de taula `solicituds`
├── correu.js          # Enviament amb Resend
├── panel-auth.js      # Autenticació del panell
└── railway.js         # Dades de Railway (panell)

data/
├── apps.json          # Catàleg d'aplicacions
└── accessos.json      # Control d'accessos

public/               # Assets estàtics
components/           # Components reutilitzables
```

## Convencions

- **Idioma**: Català en tot el codi (variables, comentaris, strings).
- **Nomenclatura**: camelCase en JS, kebab-case en fitxers (tret de components React).
- **Validació**: Al servidor, mai al client. Els formularis validen a `lib/correu.js`.
- **Seguretat**:
  - CORS limitat a dominis coneguts (veggies `apps.json`).
  - Password del panell amb comparació de temps constant.
  - CSP i X-Frame-Options al `next.config.js`.
  - PostgreSQL usa prepared statements (paràmetres de `pg`).
- **Dades**: La taula `solicituds` es crea automàticament. No mantenim migracions.
- **Correu**: `enviarCorreu()` va sempre per Resend amb templates tancades.

## Coses que NO fer mai

- No afegir lògica de validació al client sense al servidor.
- No canviar dominis ni secrets en codi: sempre per variables d'entorn.
- No deixar variables d'entorn per defecte en producció (ex: contraseya buida).
- No modificar directament la base de dades sense passar per les funcions de `db.js`.
- No enviar HTML en correus sense escapar valors.
- No eliminar camps de `solicituds` sense revisar històric: els pot tocar la taula algun script extern.

## Testeig

No hi ha suite de tests automatitzats. Comprova manualment:
- `npm run build` - compilació correcta.
- Landing: 12 apps en producció es llisten.
- `/alta` - formulari envia dades a BD.
- `/panel/altes` - sol·licituds es mostren i es poden validar (cal `PANEL_PASSWORD`).
- CORS: APIs d'altres dominis funcionen si venen de llista blanca.

## Desplegament

A Railway. El `proxy.js` fa de middleware. Variables crítiques:
- `DATABASE_URL` → postgres://...
- `RESEND_API_KEY` → clau API Resend
- `PANEL_PASSWORD` → contraseya del panell
- `PANEL_SECRET` → 32+ chars per a sessions

Els repositoris de les **altres apps** (radioescolar.cat, dictats.cat, etc.) apunten a aquest `/api/alta` per enviar sol·licituds.

## Monitorització

- Panell: `/panel` mostra estat de Railway, consum i certificats.
- Logs: Railway ofereix visibilitat de errors i rendiment.
- Errors: Si `RESEND_API_KEY` falta, els correus no es fan enviar (debug a logs).

## Preguntes sense resposta (demana al propietari)

1. Qui és responsable de revisar i validar les sol·licituds senyaladament?
2. Quina és la política de retenció de dades a `solicituds`?
3. Es pot borrar manualment la taula o falta backup?
4. Hi ha límit de sol·licituds pendents o s'ha de fer alerta si passen de N?
5. Els centres validats reben un email amb instruccions d'accés? De qui?
