# Alta de compte automàtica en validar

Quan es valida una sol·licitud a `/panel/altes`, l'app crea el compte del docent i li envia el correu «Ja tens compte» amb el primer enllaç. El docent rep un sol correu.

## Camí

1. **Panell** (`app/api/panel/altes/route.js`): en validar, si l'app és a `APPS_ALTA_COMPTE` (`lib/alta-compte.mjs`), envia una ordre signada a n8n (`lib/alta-compte-envio.js`).
2. **n8n**, flux «Alta de compte (panell → app)», camí `alta-compte`: comprova la signatura, mira l'adreça de l'app a la seva taula, torna a signar i reenvia.
3. **App**, `POST /api/alta-compte`: comprova la signatura i la data, crea (o reactiva) el docent i envia el correu `compte-llest` pel servei central. Si el docent ja era actiu, no toca ni envia res.
4. **Panell**: desa el resultat a la nota de la sol·licitud i l'ensenya. Si falla, la sol·licitud queda validada, surt el correu de validació de sempre i apareix el botó «Crear el compte a l'app» per tornar-ho a provar.

## Contracte

Ordre (JSON), amb la capçalera `X-Aulaia-Signature` (HMAC-SHA256 en hex del cos, secret `AULAIA_WEBHOOK_SECRET`):

```
{ "app": "ullada", "id_alta": "alta-47-1795500000000", "data": "2026-11-24T10:00:00.000Z",
  "centre": "Nom del centre", "idioma": "ca", "usuari": { "nom": "…", "email": "…" } }
```

n8n reenvia el mateix cos sense `app`. L'app rebutja les ordres amb més de 5 minuts.

Resposta de l'app: `{ "id_alta": "…", "resultat": "creat" | "reactivat" | "ja-existia", "correu": true | false }`.

- L'ordre **no porta rol**: el càrrec que algú escriu al formulari públic no decideix res. Cada app crea el compte amb el rol mínim de docent.
- Ni el panell ni n8n ni l'app registren correus o noms; la nota de la sol·licitud només diu què ha passat.
- El secret és el mateix per a totes les apps (com als avisos). Qui el tingués podria crear comptes de docent a qualsevol app connectada: cal tractar-lo com una clau mestra i rotar-lo si es filtra.

## Apps

| App | Estat |
|---|---|
| Ullada | Connectada (24/11/2026). |
| Enfonsar la Flota | Connectada (24/11/2026). |
| El Pla Lector, Kiosko, Poetes Vives, Aulaacull, Museu Apagat, La Claqueta, FP Segura | Pendents. Abans cal que un docent d'un altre centre hi pugui entrar (avui només hi entra el Google del centre de la instal·lació o una llista de correus a mà). |

## Afegir una app

1. A l'app: que un docent de fora pugui entrar (enllaç per correu, com Ullada) i la ruta `POST /api/alta-compte` amb aquest contracte. Variable `AULAIA_WEBHOOK_SECRET` al servei.
2. A n8n: afegir l'adreça de l'app a la taula del node «Comprova i firma».
3. Aquí: afegir l'app a `APPS_ALTA_COMPTE`. Proves: `node --test scripts/alta-compte/proves.mjs`.
4. Provar amb una signatura dolenta (401) i amb un docent que ja existeix (`ja-existia`) abans de cap alta real.
