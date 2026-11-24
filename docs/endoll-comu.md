# Endoll comú de les apps d'aulaia.cat

24/11/2026. Per dins cada app és diferent (Postgres, Prisma, Firestore, apps sense comptes). Per fora, totes parlen igual amb el panell i amb n8n. Aquest document diu què ha de tenir cada app. La comprovació automàtica és `node scripts/endoll/revisa.mjs` (apartat 5).

Tres peces, de més bàsica a més completa:

| Peça | Què fa | Qui l'ha de tenir | Detall |
|---|---|---|---|
| 1. Avisos | L'app avisa n8n quan dona d'alta algú, el treu, li canvia el rol o falla. Surt a `/panel/avisos`. | Totes | Aquí, apartat 1 |
| 2. Alta de compte | En validar una sol·licitud al panell, l'app crea el compte del docent. | Les que tenen comptes de docent | `docs/alta-compte-automatica.md` |
| 3. Informe d'activitat | L'app envia cada hora quanta gent hi entra i quants tokens d'IA gasta. Surt a `/panel/activitat`. | Totes les que tenen sessió | `docs/informe-activitat.md` |

Les tres regles que no es toquen:

1. **Parla l'app.** El panell no pregunta mai res a cap app. Si n8n o aulaia.cat cauen, l'app segueix igual.
2. **Mai noms ni correus.** Com a molt, el domini del correu (el que va darrere de la @). Hi ha alumnat menor d'edat.
3. **Els secrets, només en variables d'entorn.**

---

## 1. Avisos

### El fitxer

Un sol fitxer, igual a totes les apps: `lib/avisos.ts` (o `src/lib/avisos.ts`). Només canvia la constant de l'app. La còpia de referència és la de FP Segura (`src/lib/avisos.ts`).

Ha d'exportar:

- `enviarAvis({ tipus, centre, datos })`: signa i envia. Mai llança errors; si no hi ha variables o n8n no respon en 3 segons, torna `false` i l'app segueix.
- `dominiDe(correu)`: el domini en minúscules, o `null`.
- `rolComu(rolDeLApp)`: tradueix el rol propi de l'app a un dels quatre rols comuns.

### El contracte

```
POST $N8N_WEBHOOK_URL
X-Aulaia-Signature: <HMAC-SHA256 en hex del cos, amb AULAIA_WEBHOOK_SECRET>
{ "app": "fpsegura", "tipus": "alta.validada", "centre": "escolaindustrial.org",
  "datos": { "rol": "docent" }, "data": "2026-11-24T10:00:00.000Z" }
```

| Camp | Valors |
|---|---|
| `app` | L'slug del catàleg (`data/apps.json`). |
| `tipus` | `alta.solicitud` (invitació o alta pendent), `alta.validada` (compte creat), `baixa`, `rol.canvi`, `error`. |
| `centre` | El domini del correu de la persona (`dominiDe`), o el domini Google del centre si l'app el té. `null` només per als errors. |
| `datos` | Només comptadors i rols. `rol` sempre amb `rolComu`. Per a `rol.canvi`, `{ "abans": "...", "ara": "..." }`. Per a `error`, `{ "on": "importacio" }`, mai el missatge sencer. |

### Els quatre rols comuns

| Rol comú | Exemples de rols propis |
|---|---|
| `alumne` | STUDENT, ALUMNE, alumne |
| `docent` | TEACHER, DOCENT, docent, docent_aula, bibliotecari |
| `coordinacio` | COORD, SCHOOL_COORD, coordinador |
| `admin` | SUPERADMIN, admin, administrador |

Un rol que no és a la llista es queda com `altre`. El panell ho ensenya igual.

### On es crida

- **Alta:** just després de crear la persona a la base de dades, mai abans.
- **Baixa:** just després d'esborrar-la o desactivar-la.
- **Canvi de rol:** després de desar el rol nou, només si ha canviat.
- **Error:** als errors que una persona no pot arreglar sola (una importació que peta, un servei extern que no respon).
- Les importacions en lot envien **un sol avís** amb el recompte (`{ "invitacions": 12 }`), no un per persona.

### Variables (servei de l'app a Railway)

- `N8N_WEBHOOK_URL` = `https://n8n-production-9ae35f7d.up.railway.app/webhook/aulaia-esdeveniment`
- `AULAIA_WEBHOOK_SECRET` = la mateixa clau que té el servei `n8n`.

Sense variables l'app funciona igual; simplement no avisa.

---

## 2 i 3. Alta de compte i informe d'activitat

Cadascun té el seu document, enllaçat a la taula de dalt. Fan servir el mateix secret de n8n (alta de compte) o una clau pròpia per app (informe d'activitat).

---

## 4. Les variacions que s'accepten

- **App sense comptes d'usuari** (per exemple, Chef Boss, que no en té d'alumnat): només envia `error`. Les peces 2 i 3 no li toquen.
- **App sense servidor propi** (Firestore, funcions): el mateix contracte, des de la funció de servidor. Mai des del navegador.
- **App d'un sol centre**: igual; el domini serà sempre el mateix.

---

## 5. La comprovació automàtica

```
node scripts/endoll/revisa.mjs D:/APPS/fpsegura D:/APPS/claqueta ...
```

Per a cada carpeta, sense tocar res, diu:

- si té el fitxer d'avisos amb les tres funcions i l'slug d'una app del catàleg;
- si cada crida a `enviarAvis` fa servir un tipus permès, porta centre (excepte els errors) i passa el rol per `rolComu`;
- si té la ruta d'alta de compte i l'emissor de l'informe d'activitat (informatiu: no a totes les apps els toca).

Acaba amb `0` si totes compleixen la peça 1 i amb `1` si alguna no.

## 6. App nova

La recepta d'app nova (habilitat `nova-app-aulaia`) inclou aquest endoll des del primer dia: copiar el fitxer d'avisos, posar l'slug, cridar-lo a l'alta i passar la comprovació abans d'obrir-la a centres.
