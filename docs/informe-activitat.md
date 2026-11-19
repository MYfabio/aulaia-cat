# Informe de actividad: cómo envía una app sus cifras a aulaia.cat

14/11/2026. Guía para añadir el envío a una app. Lo que recibe y pinta
aulaia.cat ya está hecho (`/api/activitat`, `/panel/activitat`); falta el
emisor en cada app.

**Qué resuelve.** Railway sabe lo que cuesta cada servidor, pero no cuánta
gente entra ni cuántos tokens de IA gasta: eso solo lo sabe cada app. Con este
informe el panel enseña, por app y por dominio de centro, los activos de la
última hora, los de hoy, la tendencia de 30 días y los tokens del mes con su
coste estimado.

**Las tres reglas que no se tocan:**

1. **Habla la app, no el panel.** aulaia.cat no consulta nunca a ninguna app.
   Si aulaia.cat está caído, la app sigue igual y solo se pierde un informe.
2. **Solo cifras agregadas.** Ni nombres, ni correos, ni identificadores de
   persona, ni textos. Hay alumnado menor de edad.
3. **Una clave distinta por app**, solo en variables de entorno.

---

## 1. El contrato (versión 1)

```
POST https://www.aulaia.cat/api/activitat
Authorization: Bearer <clave de la app>
Content-Type: application/json
```

Con `www`: `https://aulaia.cat` redirige y en la redirección el POST se pierde.
Solo de servidor a servidor: no hay CORS, desde un navegador no funciona.

```json
{
  "versio": 1,
  "app": "dictats",
  "hora": "2026-11-16T09:00:00Z",
  "dominis": [
    {
      "domini": "escolaindustrial.org",
      "actiusHora": 42,
      "actiusDia": 180,
      "ia": [
        { "model": "gemini-3.6-flash", "entrada": 120000, "sortida": 8000 },
        { "model": "claude-opus-5", "entrada": 30000, "sortida": 2500, "cauLectura": 9000 }
      ]
    },
    { "domini": "altres", "actiusHora": 4, "actiusDia": 7 }
  ]
}
```

| Campo | Qué es |
|---|---|
| `versio` | Siempre `1`. |
| `app` | El slug de la app. Tiene que ser el de la clave; si no coincide, se rechaza (así se descubre una app desplegada con la clave de otra). |
| `hora` | Inicio de la hora que se informa, en UTC y en punto (`…T09:00:00Z` es de 9:00 a 10:00 UTC). No puede ser futura ni tener más de 7 días. |
| `dominis` | Una entrada por dominio de centro, de 1 a 300. **Foto completa del día:** van todos los dominios con alguien activo hoy, aunque en esta hora no haya entrado nadie de ese dominio (`actiusHora: 0`). |
| `domini` | El dominio de Google del centre (`escolaindustrial.org`), en minúsculas, o `altres`. |
| `actiusHora` | Personas distintas activas dentro de esa hora. |
| `actiusDia` | Personas distintas activas desde las 0:00 **de Cataluña** (Europe/Madrid) de ese día hasta el final de esa hora. Nunca menor que `actiusHora`. |
| `ia` | Opcional. Tokens gastados **en esa hora** por la gente de ese dominio, uno por modelo (máximo 12). |
| `model` | El identificador tal como lo usa la API (`claude-haiku-5-5`, `gemini-3.6-flash`). Solo `a-z 0-9 . _ : / -`. |
| `entrada`, `sortida` | Tokens de entrada (sin contar los de caché) y de salida. En Gemini, los de «pensar» van en salida. |
| `cauLectura`, `cauEscriptura` | Opcionales: tokens leídos de caché y escritos en caché, que tienen otro precio. |

**Cualquier campo que no esté en esta tabla hace que se rechace el informe
entero.** Es a propósito: si alguien añade por error un correo o un nombre,
tiene que notarse en el primer envío.

### Respuestas

| Código | `motiu` | Qué ha pasado |
|---|---|---|
| 200 | — | Guardado. Devuelve `{ ok, app, hora, dominis, agrupats }`. |
| 400 | `json`, `format`, `versio`, `hora`, `hora-futura`, `hora-antiga`, `dominis`, `domini`, `domini-repetit`, `actius`, `ia`, `model`, `model-repetit`, `tokens`, `camp-desconegut` | El cuerpo no cumple el contrato. `on` dice dónde (`dominis[2].ia[0]`), nunca el valor. |
| 401 | `no-autoritzat` | Falta la clave o no es de ninguna app. |
| 403 | `app-no-coincideix` | La clave es de otra app. |
| 413 | `massa-gran` | Más de 64 KB. |
| 429 | `massa-peticions` | Más de 60 envíos de esa app en 10 minutos. |
| 500 | `no-desat` | Fallo de aulaia.cat. |

**Reenviar la misma hora sustituye lo que había, no suma.** Se puede repetir
un envío sin miedo.

`GET` a la misma dirección, sin clave, devuelve la versión del contrato: sirve
para comprobar que la dirección es la buena.

---

## 2. Qué cuenta

- **Activo:** una persona con sesión iniciada (alumnado o docentes) de la que
  ha llegado al servidor al menos una acción suya en esa hora: abrir una
  página con sesión, guardar, responder. No cuentan las visitas sin sesión,
  los robots, las comprobaciones de salud ni una pestaña olvidada en segundo
  plano.
- **Dominio:** el dominio de Google Workspace del centro al que pertenece la
  persona, el que la app ya guarda para su organización. Quien no pertenece a
  ningún centro (cuentas personales) cuenta en `altres`.
- **Menos de 3:** un dominio con menos de 3 personas activas **en todo el
  día** no se envía con su nombre: se suma a `altres`, para que la cifra no
  señale a nadie. aulaia.cat lo vuelve a aplicar al recibir (`agrupats` dice
  cuántos ha juntado), pero la app debe hacerlo antes de enviar.
- **Tokens:** los que devuelve el proveedor en cada respuesta
  (`usage.input_tokens` / `output_tokens` en Anthropic, `usageMetadata` en
  Gemini), sumados por hora, dominio y modelo. Lo que no se mide en tokens
  (voz de OpenAI por carácter, OCR por imagen) no entra en este informe.

---

## 3. Cuándo enviar

- **Una vez por hora, al cerrarse la hora** (a las 10:01 se envía la de 9 a 10).
- **Solo si en esa hora ha habido actividad** (alguien activo o tokens
  gastados). Sin actividad no se envía nada.
- **Tiempo máximo de 5 segundos y sin reintentos en bucle.** Si falla, se
  apunta una línea en el registro (solo el código de estado, nunca el cuerpo)
  y se sigue. Como mucho, el siguiente tic vuelve a intentar esa hora una vez.
- **Horas atrasadas:** si el servidor estaba dormido o reiniciándose cuando
  tocaba, al despertar puede enviar las horas pendientes de los últimos 7
  días. Para eso la app tiene que poder calcular una hora pasada (apartado 5).
- **Sin clave, el emisor no hace nada.** En local y en las pruebas no se envía.

El panel marca una app cuando lleva más de 26 horas **lectivas** sin enviar
nada (no cuentan fines de semana, julio, agosto ni Navidad; Semana Santa y
festivos locales se apuntan en `DIES_NO_LECTIUS`, en `lib/activitat.mjs`).
Como solo se envía cuando hay actividad, esa marca significa «no ha entrado
nadie o el envío se ha roto».

---

## 4. Conectar una app, paso a paso

1. **Generar la clave** (en la carpeta de aulaia-cat):

   ```bash
   node scripts/activitat/nova-clau.mjs dictats
   ```

   Escribe la clave y su huella SHA-256. No se guarda en ningún sitio.
2. **Railway, servicio de la app:** variable `AULAIA_ACTIVITAT_CLAU` con la
   clave. Opcional: `AULAIA_ACTIVITAT_URL`, si algún día cambia la dirección.
3. **Railway, servicio de aulaia.cat:** añadir `"dictats":"<huella>"` al JSON
   de la variable `ACTIVITAT_CLAUS`:

   ```
   ACTIVITAT_CLAUS={"memoria":"81ab…","dictats":"a76f…"}
   ```

   aulaia.cat solo guarda huellas: con esta variable nadie puede enviar nada.
   Ojo: cambiar una variable redespliega; en aulaia.cat hay que comprobar que
   lo que queda servido es el código bueno.
4. **Añadir el emisor a la app** (apartado 5) y desplegarla.
5. **Comprobar:** tras la primera hora con uso, la app aparece en
   `/panel/activitat` con «Informa».

Para cambiar una clave (rotación o sospecha de filtración): generar otra y
sustituir las dos variables. La anterior deja de valer al instante.

---

## 5. El emisor en la app

Dos piezas: **de dónde salen las cifras** y **el envío**.

### De dónde salen las cifras

Hace falta poder contestar, para una hora ya cerrada: quién estuvo activo en
esa hora, quién ha estado activo en lo que va de día y cuántos tokens se
gastaron. Un único sello de «última actividad» por usuario no basta: cuando
la persona vuelve a entrar, el sello se mueve y la hora anterior ya no se
puede reconstruir.

- **Si la app ya guarda acciones con usuario y fecha** (intentos, entregas,
  sesiones de trabajo), los activos se derivan de ahí.
- **Si no, una tabla mínima de presencia:** `(usuari_id, hora)` con clave
  única, que se rellena con `ON CONFLICT DO NOTHING` la primera vez que la
  persona hace algo en cada hora (con una memoria en el proceso para no
  escribir en cada petición) y se purga a los 8 días. Es de la app y no sale
  de ella: a aulaia.cat solo viajan los recuentos.
- **Tokens:** una tabla `(hora, organitzacio, model)` con dos contadores que
  se incrementan en el mismo sitio donde hoy se lee el `usage` de cada
  respuesta. Sin texto de los prompts ni usuario.

### El envío

Receta en JavaScript; cada app la adapta a su lenguaje y a sus consultas.

```js
const URL_INFORME = process.env.AULAIA_ACTIVITAT_URL || "https://www.aulaia.cat/api/activitat";
const MINIM = 3;

/** `inici`: Date con el inicio de una hora ya cerrada. No lanza nunca. */
export async function enviarInformeActivitat(inici) {
  const clau = process.env.AULAIA_ACTIVITAT_CLAU;
  if (!clau) return "sense-clau";
  try {
    // [{ domini, actiusHora, actiusDia, ia: [{ model, entrada, sortida }] }]
    const files = await xifresDeLHora(inici);
    if (!files.some(f => f.actiusHora > 0 || f.ia?.length)) return "sense-activitat";

    const r = await fetch(URL_INFORME, {
      method: "POST",
      headers: { Authorization: `Bearer ${clau}`, "Content-Type": "application/json" },
      body: JSON.stringify({ versio: 1, app: "dictats", hora: inici.toISOString(), dominis: agruparPetits(files, MINIM) }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.warn("Informe d'activitat rebutjat:", r.status);
    return r.ok ? "enviat" : "rebutjat";
  } catch (e) {
    console.warn("Informe d'activitat no enviat:", e.name);
    return "error";
  }
}
```

`xifresDeLHora` son dos consultas agrupadas por dominio: personas distintas
con presencia en `[inici, inici + 1 h)` y personas distintas con presencia
desde las 0:00 de Europe/Madrid del día de `inici` hasta `inici + 1 h`.
`agruparPetits` suma en `altres` los dominios con `actiusDia < 3` y los
usuarios sin centro.

**El reloj.** Un temporizador cada 10 minutos dentro del proceso del servidor
(`setInterval(...).unref()`), que mira si hay una hora cerrada sin enviar y,
si la hay, la envía. Que guarde en la base de la app cuál fue la última hora
enviada, para no repetir tras un reinicio y para recuperar las que quedaron
pendientes. Con varias réplicas no pasa nada: todas enviarían la misma foto y
se sustituye. En apps sin proceso propio (funciones de Firebase, workers) el
mismo código va en la tarea programada de la plataforma.

### Lo que el emisor no debe hacer

- Enviar desde el navegador o poner la clave en código de cliente.
- Escribir en el registro el cuerpo del informe, la clave o la respuesta.
- Reintentar en bucle o bloquear una petición de un usuario esperando el envío.
- Añadir campos «por si acaso».

---

## 6. Probar en local

Con aulaia-cat levantado en local y una clave de prueba en su
`ACTIVITAT_CLAUS`:

```bash
curl -s -X POST http://localhost:3230/api/activitat -H "Authorization: Bearer $CLAU" -H "Content-Type: application/json" -d '{"versio":1,"app":"dictats","hora":"2026-11-16T09:00:00Z","dominis":[{"domini":"centre-de-prova.cat","actiusHora":4,"actiusDia":9}]}'
```

Las funciones puras (validación, días lectivos, precios) tienen pruebas:

```bash
node --test scripts/activitat/proves.mjs
```

---

## 7. Lo que hace aulaia.cat con el informe

- **Guarda** una fila por app, hora y dominio en la tabla `activitat_hores`
  (`lib/db.js`): app, hora, día, dominio, dos recuentos y los tokens por
  modelo. Nada más.
- **Borra solo** lo que tiene más de 13 meses.
- **Calcula el coste** con la tabla de `lib/preus-ia.mjs` (precios públicos de
  Anthropic y de Google comprobados el 14/11/2026, con las subidas ya
  anunciadas para el 1/12/2026 y el 1/1/2027). Es una estimación: no recoge
  los tramos de prompts muy largos, la entrada de audio, los descuentos ni los
  recargos, y cuenta Claude por Bedrock como si fuera la API directa. La cifra
  oficial es la de la consola de cada proveedor. Un modelo que no esté en la
  tabla sale en el panel como «sin precio» y no suma.
- **Lo enseña en euros**, al cambio de referencia del BCE del día
  (`lib/canvi.mjs`, igual que Infraestructura), con el total en dólares
  debajo, que es como cobran los proveedores. Si el BCE no responde, todo
  sale en dólares.
- **Los totales del panel suman apps:** quien entra en dos apps cuenta dos
  veces. Dentro de una app, cada persona cuenta una.
