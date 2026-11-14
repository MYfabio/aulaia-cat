# Consumo de Railway: dónde se va y cómo bajarlo

Medido el 14/11/2026 con la CLI de Railway (`railway usage`, `railway metrics`,
`railway api`) y el panel.

**Hecho el 14/11/2026, con permiso del propietario:** borrados los 19 proyectos
que sobraban (acciones 1, 2 y 3). Antes se comprobó en vivo, uno por uno, que
ninguno tenía dominio, base de datos ni volumen. Sus servicios ya están
parados; Railway elimina los proyectos del todo el 16/11/2026. Las apps buenas
respondían igual antes y después. Con esto se liberan unos 1,8 GB (unos 18 $
al mes). El resto de acciones sigue pendiente y no se ha tocado nada más.

## 1. Lo que se paga

El plan Pro son 20 $ al mes que **incluyen 20 $ de consumo**. Lo que pasa de
ahí se cobra al cerrar el ciclo (día 16).

| Cobro | Importe |
|---|---|
| 16/07/2026 | 5,00 $ |
| 16/08/2026 | 2,92 $ |
| 20/08/2026 | 12,92 $ |
| 16/09/2026 | 25,56 $ |
| 16/10/2026 | 85,70 $ |
| 16/11/2026 (previsto) | 107,54 $ |

Ciclo actual (16/10–16/11): memoria 93,21 $, volúmenes 4,16 $, tráfico de
salida 3,55 $, CPU 0,49 $, copias 0,05 $. **El 92 % es memoria.** Cada GB de
RAM ocupado todo el mes cuesta unos 10 $.

Ahora mismo hay **11,35 GB ocupados** entre 48 proyectos y 76 servicios. Si no
se toca nada, el ciclo siguiente saldrá por unos 120 $.

No hay ningún límite de gasto puesto (ni aviso ni corte), ningún servicio tiene
límite de memoria (todos pueden llegar a 24 GB) y ninguno duerme cuando no se
usa. Los recibos van a un correo de administración del centro.

## 2. Los cuatro motivos

1. **Una copia de La Cantina arrancada en modo desarrollo.** El proyecto
   `triumphant-wonder` tiene los servicios `@lacantina/web` y
   `@lacantina/landing` con `npm run dev`: 1,24 GB, sin dominio y sin base de
   datos. La buena es `la-cantina` (`lacantina.aulaia.cat`, 227 MB). Unos
   12 $ al mes.
2. **Museu Apagat ocupa 1,6 GB.** El servicio web (`node --import tsx
   server/index.ts`) sube a 1,3–1,9 GB después de cada despliegue y se queda
   ahí; ha llegado a 3,98 GB. Causa probable, sin confirmar: la corrección de
   escaneados carga los PDF enteros en memoria y, sin límite de memoria, Node
   no la devuelve. Su base de datos buena (`Postgres-HgNR`) ocupa 408 MB, y
   hay una segunda (`Postgres`, 36 MB) que parece sin uso.
3. **La base de datos de Chef Boss se disparó una semana.** Del 15 al 22 de
   octubre ocupó entre 3 y 6 GB (pico de 12,8 GB). Desde el 23 está en 0,2 GB.
   La causa no se ha identificado; con un límite de memoria no habría pasado
   de 1 GB. Por eso Chef Boss sale caro en los dos últimos ciclos y hoy ya no.
4. **Diecinueve proyectos que sobran.** Son copias de apps reales, creadas al
   ejecutar `railway up` o `railway init` desde una carpeta sin enlazar
   (probablemente desde sesiones de asistente). Siete siguen corriendo; las
   que salen de GitHub se vuelven a construir con cada `git push` de la app.

Además, cada app encendida con su Postgres cuesta 2–3 $ al mes aunque no entre
nadie: los 24 Postgres suman 2,2 GB (unos 22 $).

## 3. Proyectos que sobran

Ninguno tiene dominio propio ni base de datos. No se han mirado sus variables.

| Proyecto | Qué es | Estado | Memoria |
|---|---|---|---|
| `triumphant-wonder` | La Cantina (web, api, landing) en modo dev | Corriendo | 1 235 MB |
| `affectionate-mercy` | Copia de FPSegura | Corriendo | 134 MB |
| `victorious-abundance` | Copia de FPSegura | Corriendo | 89 MB |
| `empowering-hope` | Copia de FPSegura | Corriendo | 83 MB |
| `miraculous-analysis` | Copia de FPSegura | Corriendo | 81 MB |
| `adorable-joy` | Copia de Enfonsar la flota | Corriendo | 120 MB |
| `accurate-enthusiasm` | Copia de aulaia.cat | Corriendo | 73 MB |
| `reasonable-determination`, `dependable-vibrancy` | Copias de Memòria | Caídas | 0 |
| `fortunate-learning` | Copia de Pla Lector | Caída | 0 |
| `captivating-mindfulness`, `discerning-insight`, `laudable-presence`, `secure-wholeness` | Copias de inici-escola | Caídas | 0 |
| `cb-deploy` | Chef Boss, nunca desplegado | Vacío | 0 |
| `confident-dedication`, `steadfast-gentleness`, `accurate-success`, `insightful-enthusiasm` | Sin servicios | Vacíos | 0 |

**No sobra:** `exquisite-empathy` es **theoadvisor** (`www.theoadvisor.com`,
292 MB); solo le falta el nombre. `inici-escola` es real
(`apps.escolaindustrial.org`, `inici.aulaia.cat`).

## 4. Memoria por proyecto (ahora)

| Proyecto | $ del ciclo | Servicios (MB) |
|---|---|---|
| museu-apagat | 18,26 | web 1 643 · Postgres-HgNR 408 · Postgres 36 |
| chefboss | 16,66 | Postgres 201 · chef-boss 168 |
| dictats | 5,31 | ditat 360 · Postgres 138 |
| diedric3d | 4,56 | web 259 · api 203 · backup 165 · Postgres 53 |
| FP-segura | 4,23 | FPSegura 461 · Postgres 58 |
| triumphant-wonder | 4,06 | web 1 125 · landing 110 |
| eltaulell | 3,90 | eltaulell 326 · Postgres 58 |
| pantalles (Kiosko) | 3,46 | pantalles 326 · Postgres 116 |
| radioescolar | 3,22 | Postgres 185 · web 91 |
| laclaqueta | 3,12 | laclaqueta 213 · Postgres 84 |
| clubpoetesvives | 2,70 | web 201 · Postgres 69 |
| undirlaflota | 2,67 | web 312 · Postgres 43 |
| exquisite-empathy (theoadvisor) | 2,63 | web 177 · api 75 · Postgres 40 |
| matescac | 2,52 | web 159 · Postgres 69 |
| aulaia-cat | 2,42 | aulaia-cat 284 · Postgres 47 |
| aules-web | 2,26 | functions 142 · web 120 |
| biblioteca-pla-lector | 2,18 | web 193 · Postgres 80 |
| aulaacull | 2,18 | web 159 · Postgres 72 |
| inici-escola | 2,04 | web 287 · Postgres 63 |
| kipuk | 1,93 | kipuk 194 · Postgres 40 |
| typeedu | 1,70 | typeedu 129 · Postgres 56 |
| aules-sostenibles | 1,56 | 151 |
| ecoiso | 1,50 | api 75 · Postgres 47 · web 31 |
| la-cantina | 0,87 | web 227 · Postgres 66 (desde el 3/11) |
| ciutatviva | 0,64 | ciutatviva 144 · Postgres 56 (desde el 3/11) |
| memoria | 0,31 | web 156 · Postgres 73 (desde el 9/11) |
| troquel, plalector-landing, matricula-demo, bird | 0,57 · 0,57 · 0,36 · 0,05 | 50 · 64 · 64 · 38 |

## 5. Acciones, por orden

| # | Acción | Ahorro al mes | Riesgo | Quién |
|---|---|---|---|---|
| 1 | Borrar `triumphant-wonder` | ~12 $ | Ninguno conocido: sin dominio ni datos | **Hecho el 14/11/2026** |
| 2 | Borrar las 6 copias que corren | ~6 $ y deja de construir 6 veces de más | Ninguno conocido | **Hecho el 14/11/2026** |
| 3 | Borrar los 12 proyectos vacíos o caídos | 0 $; limpia y evita builds fallidos | Ninguno | **Hecho el 14/11/2026** |
| 4 | Límite de memoria de 1 GB al web de Museu Apagat | ~6 $ | Si corrige un PDF muy grande puede reiniciarse | Tú, en Settings → Deploy → Replica Limits |
| 5 | Límite de memoria de 1 GB a cada Postgres y a cada web | Evita picos como el de Chef Boss (~20 $ en octubre) | Demasiado bajo hace caer el servicio | Tú, servicio a servicio |
| 6 | Dormir prototipos y demos: `eltaulell`, `ecoiso`, `troquel`, `matricula-demo` | Hasta ~6 $ | La primera visita tarda y puede dar un 502 | Tú, en Settings → Deploy → Serverless (hay que redesplegar) |
| 7 | Aviso de gasto a 60 $ | 0 $; avisa por correo | Ninguno | **Hecho el 14/11/2026** (solo aviso, sin corte) |
| 8 | Renombrar `exquisite-empathy` a `theoadvisor` | 0 $ | Ninguno | Tú |
| 9 | Borrar el segundo Postgres de Museu Apagat | ~0,5 $ | Es una base de datos: comprobar antes que está vacía | Tú |

Con 1–6 la factura baja de unos 120 $ a unos 90 $.

**Para bajar de 60–70 $** con unas veinte apps siempre encendidas hace falta
algo más:

- **Dormir también las apps de aula fuera de horario.** Railway duerme un
  servicio a los 5–10 minutos sin tráfico de salida. Una conexión abierta con
  la base de datos cuenta como tráfico, así que cada app necesita cerrar su
  pool cuando no se usa; y la primera petición de la mañana puede dar un 502.
  Probarlo primero en dos o tres apps de poco uso.
- **Juntar los Postgres de prototipos en uno.** Ahorra memoria, pero se pierde
  el aislamiento y la copia de seguridad por app. No lo haría con apps que
  guardan alumnado.

**Límite de corte:** Railway permite un límite duro (mínimo 10 $) que **apaga
todos los servicios** al alcanzarlo. Sirve de seguro, pero si se pone, que sea
con margen (por ejemplo 150 $).

## 6. Lo que no se ha comprobado

- Por qué se disparó el Postgres de Chef Boss en octubre.
- La causa exacta de la memoria de Museu Apagat (haría falta un perfil de
  memoria en local).
- Las variables de las copias: si alguna copia de FPSegura apunta a la base de
  datos de producción, cada despliegue suyo lanza migraciones contra ella.
- Qué factura Railway exactamente por un servicio dormido: la documentación
  solo dice que «puede reducir» el coste.

## 7. Cómo repetir la medición

Desde el 14/11/2026 esto mismo sale en el panel, en **Infraestructura →
Cost per projecte** (`lib/cost-railway.mjs`, `lib/railway.js`): gasto del ciclo
y previsión por proyecto, memoria por servicio, y avisos de «más de 1 GB» y
«sin dominio». Con la CLI:

```bash
railway usage                       # factura del ciclo
railway usage projects --json       # coste por proyecto
railway usage limit status          # límites puestos
railway metrics --all -p <id> -e production --memory --since 7d   # memoria por servicio
```

Para no volver a crear copias: antes de `railway up` o `railway init`,
`railway status` tiene que decir el proyecto correcto.
