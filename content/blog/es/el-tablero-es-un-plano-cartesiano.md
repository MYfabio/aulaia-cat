---
titol: El tablero de ajedrez es un plano cartesiano, y el alumnado lo puede ver
resum: El ajedrez en la escuela se defiende siempre por el «pensamiento lógico», que es verdad y no sirve para evaluar nada. Queríamos algo más concreto: que la relación con el currículo de matemáticas fuera visible en el tablero y medible al final. Explicamos cómo lo hemos hecho y dónde están los límites.
data: 2026-09-15
autor: Fabio Martínez
etiquetes: [Matemáticas, Ajedrez, Pensamiento computacional, ESO]
apps: [matescac, enfonsar-la-flota, diedric3d]
imatge: /blog/el-tauler-es-un-pla-cartesia.jpg
imatgeAlt: Un aula de instituto con el alumnado jugando partidas de ajedrez por parejas; sobre el tablero del primer plano se proyectan ejes de coordenadas y figuras geométricas
imatgeCredit: Imagen generada con inteligencia artificial
original: el-tauler-es-un-pla-cartesia
---

En Cataluña hace más de diez años que hay ajedrez en la escuela, y el argumento es siempre el mismo: desarrolla el razonamiento, la concentración, el pensamiento lógico. Es verdad. También es el tipo de afirmación que no se puede llevar a una sesión de evaluación, porque no dice qué ha aprendido nadie ni cómo se comprueba.

Cuando empezamos [MatEscac](/es/apps/matescac) queríamos algo más pequeño y más concreto. No que el ajedrez «desarrolle» nada, sino que la conexión entre el juego y las matemáticas de la ESO fuera **visible en el tablero mientras se juega** y **medible cuando se acaba**. Este artículo explica las tres ideas que lo sostienen, y después lo que no resuelve.

## e4 es el punto (4, 3)

El tablero tiene sesenta y cuatro casillas en ocho columnas y ocho filas. Si la columna «a» es la 0 y la fila 1 es la 0, cada casilla es un par de coordenadas, y la notación algebraica que el alumnado aprende para anotar partidas es, sin decirlo, un sistema de coordenadas. Un movimiento es un vector: el caballo que va de g1 a f3 se ha desplazado menos una columna y dos filas, y todos los saltos de caballo son el mismo vector girado o reflejado.

En el tablero en tres dimensiones de MatEscac esto se ve. Se selecciona una pieza y aparecen las jugadas legales y el vector de cada una. Se pide el valor de una casilla y sale su centralidad, calculada con una fórmula que el alumnado puede leer y comprobar a mano. La geometría no se explica al lado del juego: es el juego.

Pasa lo mismo en [Enfonsar la flota](/es/apps/enfonsar-la-flota), donde cada disparo es un punto del espacio con tres coordenadas. Son dos juegos que enseñan a decir dónde está una cosa.

## Programar un bot que juegue mal

La segunda idea es de pensamiento computacional, y es la que más sorprende al profesorado.

En lugar de explicar qué es un algoritmo, se pide al alumnado que construya uno con bloques y lo vea jugar. Las reglas son simples: si puedes capturar, captura la pieza más valiosa; si no, desarrolla un caballo o un alfil; si no, avanza un peón. Se ordenan los bloques, se pulsa ejecutar, y el bot juega una partida siguiendo exactamente esas instrucciones, con una traza que dice en cada jugada qué regla ha decidido.

Y el bot juega mal, que es lo que interesa. Captura un peón y pierde la dama, porque la regla decía «captura» y no decía «mira qué pasa después». En ese momento el alumno ha entendido qué es una secuencia, qué es una condición y por qué el orden importa, y lo ha entendido porque su programa ha hecho algo estúpido delante de él. Reordenar los bloques para arreglarlo es depurar.

Los retos de MatEscac se agrupan en cuatro tipos: programar bots con bloques, reconocer patrones, depurar partidas donde hay una jugada errónea escondida, y calcular vectores e invariantes. Cada reto apunta a una de las tres competencias.

## Tres competencias y un mapa de errores

La tercera idea es la que hace que todo esto se pueda evaluar.

Cada alumno tiene un índice de cero a cien en tres competencias: pensamiento computacional, geometría y vectores, álgebra e invariantes. El índice es la media de la mejor puntuación que ha sacado en cada reto de la competencia, y los retos que no ha intentado cuentan cero. Esto es una decisión: un cien exige haberlo cubierto todo, y un alumno que ha hecho un solo reto muy bien no tiene un cien. El docente ve los tres índices de cada alumno y del grupo, y un radar que los dibuja.

Las partidas también dejan datos. Sin ningún motor de ajedrez detrás, MatEscac marca como imprecisa una jugada después de la cual, en la respuesta inmediata del rival, el jugador ha perdido dos o más puntos de material. Es una heurística sencilla y se explica en una frase. Con todas las jugadas imprecisas del grupo se dibuja un mapa del tablero con las casillas donde la clase se equivoca más, que es algo que ningún docente de ajedrez ha tenido nunca sobre la mesa.

Los índices llevan una correspondencia indicativa con las competencias específicas de matemáticas del Decret 175/2022. Indicativa quiere decir eso: es una propuesta de lectura, no una equivalencia oficial.

## Las ligas

Los grupos pueden jugar ligas de todos contra todos. La aplicación hace los emparejamientos y lleva la clasificación, y el docente del grupo puede entrar en cualquier partida como espectador. Las medallas que hay son de participación y de cobertura: primera partida, primera victoria, cinco retos distintos, un cien en un reto, cuarenta o más en las tres competencias a la vez, quince intentos. Ninguna medalla premia ganar mucho.

## Qué no resuelve

Como siempre, lo que no hace.

**La precisión no es la de un motor.** Una jugada que pierde material en la respuesta inmediata puede ser un sacrificio correcto que gana tres jugadas después. La heurística lo marcará como imprecisión igualmente. Sirve para ver tendencias de un grupo, no para juzgar una partida concreta. Quien quiera análisis de verdad tiene motores de sobra.

**Los ceros pesan.** Que los retos no intentados cuenten cero hace que el índice de un alumno que acaba de empezar sea bajo, y que suba a medida que cubre retos. Es por diseño, pero hay que explicarlo a la clase el primer día; si no, se lee como una mala nota.

**No enseña a jugar.** Hay un centro de aprendizaje con el movimiento de cada pieza en tres dimensiones y los conceptos tácticos básicos, pero no es un curso de ajedrez. Si el grupo no ha jugado nunca, el programa Escacs a l'escola y sus formaciones hacen ese trabajo mucho mejor.

**Hace falta la cuenta del centro.** Se entra con Google Workspace; un docente nuevo queda pendiente hasta que alguien lo valida, y es un prototipo de la Escola Industrial: está pensado para centros que ya hacen ajedrez y quieren vincularlo a matemáticas, no para quien quiere empezar de cero.

## Para empezar

El [centro de aprendizaje](https://matescac.aulaia.cat/ca/learn) se abre sin cuenta y muestra el tablero en tres dimensiones con los vectores de cada pieza. Es la manera más rápida de ver si la idea encaja con lo que hacéis. Si queréis probarlo con un grupo, [pedid el alta](/alta?app=matescac).

Y si lo que os interesa es la visión espacial más que el cálculo, [Diedric3D](/es/apps/diedric3d) hace el camino desde las piezas construidas con bloques hacia las vistas del dibujo técnico. Los tres juegos comparten algo: no explican la geometría, la hacen necesaria.
