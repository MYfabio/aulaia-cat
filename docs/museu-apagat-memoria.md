# El Museu Apagat: por qué ocupa 1,6 GB y cómo bajarlo

Medido el 15/11/2026 (domingo, sin clase). Amplía el motivo 2 y **sustituye la
acción 4** de `docs/railway-consumo.md`.

**Aplicado el 15/11 a las 21:50, con permiso del propietario: la variable
`MALLOC_ARENA_MAX=2`** (apartado 9). Nada más: el código de `VIP` está intacto
y el tope de heap sigue pendiente.

## 1. Resumen

- Lo que no se devuelve **no es heap de V8, es memoria nativa**: de los
  1.405 MB del servidor, 1.250 MB están retenidos por el asignador de memoria
  de Linux (glibc) y V8 solo ocupa 50–70 MB.
- La causa es el motor de Prisma. Cada guardado le hace pasar el progreso
  entero (1 MB) varias veces, repartido entre sus hilos (el proceso tiene 37),
  y glibc da a cada hilo zonas propias de 64 MB («arenas») que luego no
  devuelve. Hoy hay 48.
- **Medida barata: la variable `MALLOC_ARENA_MAX=2`.** Probada dentro del
  contenedor con progresos reales: la memoria retenida baja un 63 %.
- **Un límite de memoria de 1 GB reiniciaría el servidor en plena clase**: con
  30 alumnos guardando a la vez el pico pasa de 1,2 GB.
- Con la variable sola espero que el web se quede en 0,8–1,0 GB (hoy 1,65 GB).
  Para llegar a 600 MB hace falta el cambio de código del apartado 6, que en
  el prototipo deja el servidor en 241 MB después de una clase.

## 2. Qué ocupa la memoria hoy (producción, solo lectura)

| Parte | MB |
|---|---|
| Servidor (`node --import tsx server/index.ts`) | 1.405 |
| — arenas de glibc (48; 18 llenas a 64 MB) | 1.250 |
| — heap principal de malloc | 57 |
| — heap de V8 | 50–70 |
| Caché de ficheros del contenedor | 206 |
| `npm run start` + `sh` | 17 |
| Proceso `esbuild` que mantiene `tsx` | 20 |
| Kernel | 13 |
| **Total del contenedor** (lo que marca Railway) | **1.657** |

Node 20.20.2, glibc 2.41, sin `NODE_OPTIONS` ni límite. Pico del servidor
desde el despliegue del 5/11: 1.663 MB.

**Cuánto pesa un progreso real** (135 alumnos): 1,0 MB de media, 1,49 MB el
percentil 90, 1,81 MB el mayor. Lleva 22 capturas de media (61 % del peso) y
el resto son sobre todo los trazos guardados en `estatApp` (38 %). Desde el
17/09 se ha guardado 177.781 veces: unas 1.300 por alumno, 1 MB cada vez.

## 3. Prueba con 30 alumnos

**En local** (Windows, Node 24, base de datos aparte, 30 alumnos simulados con
progresos de 0,6 a 1,7 MB). MB del proceso del servidor:

| Momento | Hoy, sin tope | Heap 256 MB | Heap 384 MB |
|---|---|---|---|
| Recién arrancado | 119 | 121 | 120 |
| Entran los 30 (pico) | 973 | 888 | 880 |
| 30 guardando a la vez, 10 rondas (pico) | 1.380 | 1.141 | 1.214 |
| El docente abre el grupo, 30 MB (pico) | 1.618 | 1.211 | 1.278 |
| Pico de toda la prueba | 1.674 | 1.271 | 1.295 |
| En reposo, tras el recolector | 941 | 867 | 791 |
| — de ahí, heap de V8 | 36 | 35 | 35 |
| Guardados / errores | 2.160 / 0 | 1.260 / 0 | 1.260 / 0 |

La prueba sin tope fue el doble de larga (20 rondas y una clase de 1.500
guardados). El heap de V8 vuelve siempre a 35 MB; los ~800 MB que quedan son
nativos. El tope de heap baja el pico unos 200 MB a igual carga, pero no la
memoria en reposo.

**Dentro del contenedor** (glibc real). Un proceso aparte, de solo lectura,
leyó con Prisma 30 progresos reales a la vez durante 15 rondas (488 MB):

| Configuración | Pico | Tras 30 s de reposo | Retenido por malloc |
|---|---|---|---|
| Como está ahora | 3.337 | 2.303 | 1.387 (46 arenas) |
| `MALLOC_ARENA_MAX=2` | 2.027 | 863 | 450 (2 arenas) |

**Corrección de PDF con heap de 384 MB** (IA simulada en local): un PDF como
el mayor real (50 páginas, 4,5 MB), uno de 100 páginas y 22 MB, y uno de 29 MB
mientras los 30 alumnos guardaban: los tres se corrigen sin errores.

## 4. Medida recomendada

| # | Qué | Valor | Riesgo |
|---|---|---|---|
| 1 | Variable de Railway en el servicio web | `MALLOC_ARENA_MAX=2` | Bajo. Algo más de espera entre hilos al pedir memoria; la CPU está casi a cero. Se deshace borrando la variable |
| 2 | Tope de heap **en la orden de arranque** (`package.json`, script `start`) | `node --max-old-space-size=384 --import tsx server/index.ts` | Si algo necesitara más de 384 MB de heap vivo, el servidor se reiniciaría (unos 15 s). No ha pasado en ninguna prueba |
| 3 | Límite de memoria del servicio | Ninguno, o 2 GB como fusible | Con 1 GB se reinicia en clase. Con 2 GB saltaría si 30 alumnos abren a la vez un PDF muy grande (con uno de 22 MB el pico fue de 3,1 GB; con el mayor real, 1,0 GB) |

- **El tope de heap no puede ir en `NODE_OPTIONS`**: la variable también se
  aplica al build, y `tsc --noEmit` falla por memoria con 256 y con 384 MB
  (pasa con 512). El siguiente `railway up` no desplegaría.
- La 1 es la que ahorra. La 2 solo recorta picos y va con el próximo
  despliegue. La 3 no ahorra nada.
- **Reinicio nocturno: no lo recomiendo.** Railway no lo trae para un servicio
  web y solo ahorraría de madrugada hasta la primera clase.
- Cambiar la variable redespliega el servicio: hacerlo de noche o en fin de
  semana. Para comprobarlo, mirar la memoria al día siguiente de una clase;
  debería quedarse por debajo de 1 GB.

Ahorro esperado con la 1: de unos 16 $ a unos 8–10 $ al mes.

## 5. El arranque

- `scripts/genera-audio.mjs`: **nada**. Hay 986 clips y 0 pendientes en el
  volumen, así que el proceso vive menos de un segundo en cada arranque.
- `tsx`: unos **30 MB** (20 MB del proceso `esbuild` y unos 10 MB dentro del
  servidor: 93 MB con `tsx` frente a 83 MB con JavaScript ya compilado).
- `npm run start`: 15 MB que se quedan todo el tiempo.
- El servidor recién arrancado ocupa unos 100–120 MB. El resto de los 600 MB
  son la caché de ficheros (~200 MB) y las primeras entradas de alumnos, que
  ya disparan la retención.

Compilar a JavaScript y arrancar sin `npm` ahorraría unos 45 MB (0,5 $ al
mes): no compensa por sí solo.

## 6. Cambio de fondo propuesto (sin implementar)

Recomiendo **enviar solo lo que cambia**, no «subir cada captura una vez»:
las capturas son el 61 % del peso, pero los trazos (38 %) se seguirían
reenviando, y separar las capturas obliga a una tabla nueva, a migrar 3.016
imágenes y a tocar unas diez pantallas que las leen.

| Paso | Qué cambia | Tamaño | Medido en el prototipo (heap 384) |
|---|---|---|---|
| A | Solo servidor: el guardado deja de devolver la fila entera, la lectura pasa el JSON sin reinterpretarlo y entran como mucho 4 guardados a la vez | Medio día, unas 40 líneas en `server/index.ts` | Pico 808 MB (antes 1.295); en reposo 452 MB (antes 791); guardar tarda 4–5 veces menos |
| B | El cliente envía solo la misión que ha cambiado (`PATCH /api/progres`) y Postgres la fusiona en el JSON guardado | Un día: 15 líneas de servidor, unas 50 en `src/lib/sessio.ts`, tests | 67 kB por guardado (antes 1.042 kB); en reposo **241 MB**; con los 30 guardando, 204 MB de pico |
| C | El panel del docente deja de recibir el progreso completo de todo el grupo (30 MB por grupo, 135 MB al abrir los cinco) | 1–2 días, toca las vistas del docente | Sin medir. Tras A y B es lo único que sigue dando picos (687 MB) |

Compatibilidad de A y B: la tabla `progress` no cambia y no hay migración. El
`PUT` con el progreso entero sigue funcionando para los navegadores con la
versión antigua en caché y para la primera subida. Comprobado en el prototipo
que el progreso guardado por misiones queda idéntico al del cliente.

## 7. Lo que no se ha comprobado

- `MALLOC_ARENA_MAX=2` está probado en el contenedor con lecturas, no con el
  servidor real guardando. El 0,8–1,0 GB es una estimación.
- Las pruebas de 30 alumnos y del tope de heap son en Windows con Node 24;
  producción es Linux con Node 20. Este PC no tiene WSL ni Docker.
- Una tercera prueba en el contenedor (umbrales de `mmap`) la bloqueó el
  sistema de permisos. No he hecho más.
- Las dos pruebas en el contenedor subieron su memoria unos minutos hacia las
  19:52 (pico registrado: 4.968 MB). Se verá en la gráfica de Railway. No
  quedó ningún proceso y la memoria volvió a 1.642 MB.

## 8. Otros hallazgos (no tocados)

- `express.json({ limit: '40mb' })` se aplica a todas las rutas y antes de
  comprobar la sesión: cualquiera puede hacer que el servidor lea cuerpos de
  40 MB. El progreso real no pasa de 1,8 MB.
- `GET /api/entregues/:id/pdf` carga el PDF entero de la clase para cada
  alumno. Con 30 alumnos a la vez y un PDF de 22 MB el pico fue de 3,1 GB.
- Prisma abre hasta 97 conexiones (dos por CPU visible) y Postgres admite 100.
  Convendría `connection_limit=10` en `DATABASE_URL`.
- El segundo Postgres del proyecto no se ha tocado.
- La CLI de Railway avisa de que `railway.json` está obsoleto y que los
  ficheros existentes funcionan «until 2026-12-01». En `VIP` ese fichero
  define el constructor, la orden de arranque y el healthcheck, y otras apps
  también lo usan. Sin comprobar qué pasa después de esa fecha.

## 9. Aplicado el 15/11/2026

- 21:49 (domingo, sin clase): `railway variable set MALLOC_ARENA_MAX=2` en el
  servicio `museu-apagat`, entorno de producción. El web no tiene repositorio
  conectado, así que Railway reconstruyó el mismo código subido el 5/11.
- Redespliegue en 2 minutos (21:49:54 → 21:51:52), `SUCCESS`; `/api/health`
  responde 200.
- Comprobado dentro del contenedor a las 21:52: el proceso del servidor lleva
  `MALLOC_ARENA_MAX=2` y tiene 1 arena secundaria (6 MB) en vez de 48. Servidor
  107 MB, contenedor 120 MB.
- **Falta ver la memoria después de una clase real** (lunes 16/11). Esperado:
  por debajo de 1 GB al día siguiente.
- Para deshacerlo, desde `VIP` y fuera de horario lectivo:
  `railway variable delete MALLOC_ARENA_MAX --service museu-apagat`
  (redespliega en unos 2 minutos).

Herramientas y resultados completos: carpeta de notas de la sesión,
`eines-memoria/`. Base local de pruebas: `museu_mem`.
