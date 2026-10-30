---
titol: Hundir la flota en 3D: cuando la tercera coordenada tiene consecuencias
resum: Cogimos el juego de toda la vida y le añadimos profundidad. Explicamos qué cambia en el aula cuando un submarino puede esconderse bajo un barco, y cómo lo usamos en 3.º y 4.º de ESO para trabajar coordenadas en el espacio y sistema diédrico.
data: 2026-09-14
autor: Fabio Martínez
etiquetes: [Matemáticas, Dibujo técnico, Geometría en el espacio, ESO]
apps: [enfonsar-la-flota, diedric3d, matescac]
imatge: /blog/enfonsar-la-flota-en-3d.jpg
imatgeAlt: Una flota en combate bajo un cielo de tormenta: destructores, un portaaviones y un submarino que emerge en primer plano
imatgeCredit: Imagen generada con inteligencia artificial
original: enfonsar-la-flota-en-3d
---

Hundir la flota es probablemente el primer ejercicio de coordenadas que hace todo el mundo, mucho antes de que nadie le diga que aquello son coordenadas. Dices «B-7», el otro mira la cuadrícula, y la letra y el número han hecho el trabajo de un par de ejes sin que haga falta explicar nada.

En 3.º de ESO el problema es otro. La cuadrícula ya se sabe. Lo que cuesta es el salto al espacio: imaginar que un punto tiene tres coordenadas, que una vista de un objeto pierde una, y que con dos vistas se puede reconstruir lo que no se ve. Este artículo explica por qué decidimos añadir profundidad al juego de toda la vida y qué pasa en el aula cuando lo hacemos.

## Lo que cambia cuando hay profundidad

En [Enfonsar la flota](/es/apps/enfonsar-la-flota) el tablero ya no es una cuadrícula: es un bloque de 10 por 10 por 5. La tercera coordenada es la altura respecto a la superficie del mar, y va de menos dos a más dos.

Esta coordenada no es decorativa, tiene reglas. Los aviones vuelan en los dos niveles de arriba. Los barcos navegan en la superficie, en el nivel cero. Los submarinos se esconden en los dos niveles de abajo. Y las armas no llegan a todas partes: un torpedo alcanza la superficie y lo que hay debajo, un ataque aéreo alcanza la superficie y lo que hay encima.

La consecuencia es que pensar en dos dimensiones deja de servir. Un alumno que dispara a la columna tres y la fila siete todavía no ha dicho nada: tiene que decidir a qué nivel, y para hacerlo tiene que decidir qué arma, y para decidir el arma tiene que tener una hipótesis sobre qué hay allí abajo. El disparo es un punto del espacio, con las tres coordenadas, y el orden importa: (3, 7, -2) no es lo mismo que (7, 3, -2).

## Las tres vistas del dibujo técnico, sin ficha

Aquí es donde el juego toca la otra asignatura. Mientras el alumno mueve el cursor por el bloque, al lado aparecen la planta, el alzado y el perfil de la celda que está apuntando, y de los impactos que ya ha hecho. Son las tres proyecciones del sistema diédrico, las mismas que salen en los planos, pero aplicadas a algo que le interesa encontrar.

No hace falta explicar qué es una proyección ortogonal. Se ve que la planta pierde la altura y que el alzado pierde la profundidad, y se ve que con las dos juntas ya sabes dónde está el submarino. El profesorado de dibujo técnico sabe lo que cuesta que esto se entienda sobre papel. Aquí se entiende porque hace falta para ganar.

En [Diedric3D](/es/apps/diedric3d) hacemos el mismo camino en el otro sentido: se construye una pieza con bloques y las vistas se dibujan solas. Las dos herramientas se complementan bien en una misma unidad.

## Treinta disparos para quinientas celdas

El juego clásico no tiene límite de munición. Este sí: veinte torpedos y diez ataques aéreos para un bloque de quinientas celdas donde hay diez unidades escondidas. Con esto, disparar al azar es perder.

Y aquí entra la parte de matemáticas que más nos gusta, porque aparece sola. Un portaaviones ocupa cinco celdas en línea. Si disparas a una de cada cinco columnas, lo encuentras seguro. Las fragatas, los submarinos y el bombardero ocupan tres, y piden un patrón más denso. Los cazas, dos. La pregunta «¿cuántos disparos hacen falta para cubrir un plano?» es una pregunta de recuento, y la pregunta «¿qué probabilidad tiene el primer disparo de acertar?» es una pregunta de probabilidad. Ninguna de las dos sale de un enunciado: salen de querer ganar.

Cuando la partida se acaba, la pantalla de resultados dice qué precisión has tenido, cuántas columnas has explorado, qué niveles has usado y si tu patrón de ataque ha sido sistemático, exploratorio o una mezcla. Es material para una reflexión de tres líneas que vale más que muchas fichas.

## Cómo lo llevamos al aula

La secuencia que usamos son tres sesiones de clase.

1. **Tutorial y primera partida contra el ordenador.** La consigna es anotar cada disparo en la libreta como punto, y marcarlo en una planta y un alzado dibujados a mano. La puesta en común acaba siempre con la misma pregunta: qué nivel habéis explorado menos, y por qué.
2. **Partida a dos en el mismo dispositivo.** Antes de cada disparo, el jugador tiene que decir en voz alta la celda y en qué vista la ha deducido. Después, una ficha a la inversa: dada la planta y el alzado de una flota, escribir las coordenadas de todos los barcos.
3. **Análisis y estrategia.** Con la pantalla de resultados, cada alumno escribe qué cambiaría. Y el reto: diseñar el patrón de búsqueda mínimo que garantice encontrar un portaaviones en la superficie, y comprobarlo jugando.

El juego guarda por código de clase la precisión, los disparos, las unidades hundidas, los niveles usados y el tipo de patrón. Eso son evidencias, pero no son la nota: la nota sale de la libreta con las vistas, de la ficha de coordenadas y de la reflexión escrita.

## Qué no resuelve

Vale la pena decirlo, como siempre.

**No enseña el sistema diédrico por sí solo.** Hace que las vistas tengan sentido, que es otra cosa. La definición, los nombres y la convención de los planos los tiene que poner el profesorado, y la libreta está para eso.

**No hace falta ninguna cuenta, pero sí un código.** El alumnado entra con un código de clase y un nombre, sin contraseña. Para jugar en línea con el grupo y que los resultados se guarden, el centro necesita un código propio, y hoy lo creamos nosotros. Quien quiera probarlo antes tiene el modo tutorial, que no guarda nada.

**No es para todos los cursos.** Está pensado para 3.º y 4.º de ESO. En 2.º sirve como primera aproximación a las coordenadas en el espacio, y en 1.º de bachillerato tecnológico como repaso del diédrico. Más abajo, la tercera coordenada es más un obstáculo que una ayuda.

## Para empezar

El [tutorial interactivo](https://enfonsarlaflota.aulaia.cat/tutorial) se abre sin cuenta y es la manera más rápida de ver si encaja con lo que estáis haciendo. Si queréis jugar con un grupo y guardar los resultados, [pedid el alta](/alta?app=enfonsar-la-flota) y os preparamos el código de clase.

Y si lo que os interesa es la geometría en el espacio como hilo de toda una unidad, [MatEscac](/es/apps/matescac) trabaja las mismas coordenadas sobre un tablero de ajedrez en tres dimensiones. Son tres juegos distintos que hacen la misma pregunta: dónde está, exactamente, esa cosa que no veo.
