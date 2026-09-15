---
titol: El tauler d'escacs és un pla cartesià, i l'alumnat ho pot veure
resum: Els escacs a l'escola es defensen sempre pel «pensament lògic», que és veritat i no serveix per avaluar res. Volíem una cosa més concreta: que la relació amb el currículum de matemàtiques fos visible al tauler i mesurable al final. Expliquem com ho hem fet i on són els límits.
data: 2026-09-15
autor: Fabio Martínez
etiquetes: [Matemàtiques, Escacs, Pensament computacional, ESO]
apps: [matescac, enfonsar-la-flota, diedric3d]
imatge: /blog/el-tauler-es-un-pla-cartesia.jpg
imatgeAlt: Una aula d'institut amb l'alumnat jugant partides d'escacs per parelles; sobre el tauler del primer pla s'hi projecten eixos de coordenades i figures geomètriques
---

A Catalunya fa més de deu anys que hi ha escacs a l'escola, i l'argument és sempre el mateix: desenvolupa el raonament, la concentració, el pensament lògic. És veritat. També és el tipus d'afirmació que no es pot portar a una sessió d'avaluació, perquè no diu què ha après ningú ni com es comprova.

Quan vam començar [MatEscac](/apps/matescac) volíem una cosa més petita i més concreta. No que els escacs «desenvolupin» res, sinó que la connexió entre el joc i les matemàtiques de l'ESO fos **visible al tauler mentre es juga** i **mesurable quan s'acaba**. Aquest article explica les tres idees que ho aguanten, i després el que no resol.

## e4 és el punt (4, 3)

El tauler té seixanta-quatre caselles en vuit columnes i vuit files. Si la columna «a» és la 0 i la fila 1 és la 0, cada casella és un parell de coordenades, i la notació algebraica que l'alumnat aprèn per anotar partides és, sense dir-ho, un sistema de coordenades. Un moviment és un vector: el cavall que va de g1 a f3 s'ha desplaçat menys una columna i dues files, i tots els salts de cavall són el mateix vector girat o reflectit.

Al tauler en tres dimensions de MatEscac això es veu. Es selecciona una peça i apareixen les jugades legals i el vector de cada una. Es demana el valor d'una casella i surt la seva centralitat, calculada amb una fórmula que l'alumnat pot llegir i comprovar a mà. La geometria no s'explica al costat del joc: és el joc.

Passa el mateix a [Enfonsar la flota](/apps/enfonsar-la-flota), on cada tret és un punt de l'espai amb tres coordenades. Són dos jocs que ensenyen a dir on és una cosa.

## Programar un bot que jugui malament

La segona idea és de pensament computacional, i és la que més sorprèn el professorat.

En lloc d'explicar què és un algorisme, es demana a l'alumnat que en construeixi un amb blocs i el vegi jugar. Les regles són simples: si pots capturar, captura la peça més valuosa; si no, desenvolupa un cavall o un alfil; si no, avança un peó. S'ordenen els blocs, es prem executa, i el bot juga una partida seguint exactament aquestes instruccions, amb una traça que diu a cada jugada quina regla ha decidit.

I el bot juga malament, que és el que interessa. Captura un peó i perd la dama, perquè la regla deia «captura» i no deia «mira què passa després». En aquest moment l'alumne ha entès què és una seqüència, què és una condició i per què l'ordre importa, i ho ha entès perquè el seu programa ha fet una cosa estúpida davant seu. Reordenar els blocs per arreglar-ho és depurar.

Els reptes de MatEscac s'agrupen en quatre menes: programar bots amb blocs, reconèixer patrons, depurar partides on hi ha una jugada errònia amagada, i calcular vectors i invariants. Cada repte apunta a una de les tres competències.

## Tres competències i un mapa d'errors

La tercera idea és la que fa que tot això es pugui avaluar.

Cada alumne té un índex de zero a cent en tres competències: pensament computacional, geometria i vectors, àlgebra i invariants. L'índex és la mitjana de la millor puntuació que ha tret a cada repte de la competència, i els reptes que no ha intentat compten zero. Això és una decisió: un cent exigeix haver-ho cobert tot, i un alumne que ha fet un sol repte molt bé no té un cent. El docent veu els tres índexs de cada alumne i del grup, i un radar que els dibuixa.

Les partides també deixen dades. Sense cap motor d'escacs al darrere, MatEscac marca com a imprecisa una jugada després de la qual, a la resposta immediata del rival, el jugador ha perdut dos o més punts de material. És una heurística senzilla i s'explica en una frase. Amb totes les jugades imprecises del grup es dibuixa un mapa del tauler amb les caselles on la classe s'equivoca més, que és una cosa que cap docent d'escacs ha tingut mai sobre la taula.

Els índexs porten una correspondència indicativa amb les competències específiques de matemàtiques del Decret 175/2022. Indicativa vol dir això: és una proposta de lectura, no una equivalència oficial.

## Les lligues

Els grups poden jugar lligues de tots contra tots. L'aplicació fa els aparellaments i porta la classificació, i el docent del grup pot entrar a qualsevol partida com a espectador. Les medalles que hi ha són de participació i de cobertura: primera partida, primera victòria, cinc reptes diferents, un cent en un repte, quaranta o més a les tres competències alhora, quinze intents. Cap medalla premia guanyar molt.

## Què no resol

Com sempre, el que no fa.

**La precisió no és la d'un motor.** Una jugada que perd material a la resposta immediata pot ser un sacrifici correcte que guanya tres jugades després. L'heurística el marcarà com a imprecisió igualment. Serveix per veure tendències d'un grup, no per jutjar una partida concreta. Qui vulgui anàlisi de debò té motors de sobres.

**Els zeros pesen.** Que els reptes no intentats comptin zero fa que l'índex d'un alumne que acaba de començar sigui baix, i que pugi a mesura que cobreix reptes. És per disseny, però cal explicar-ho a la classe el primer dia, si no es llegeix com una mala nota.

**No ensenya a jugar.** Hi ha un centre d'aprenentatge amb el moviment de cada peça en tres dimensions i els conceptes tàctics bàsics, però no és un curs d'escacs. Si el grup no ha jugat mai, el programa Escacs a l'escola i les seves formacions fan aquesta feina molt millor.

**Cal el compte del centre.** S'hi entra amb Google Workspace; un docent nou queda pendent fins que algú el valida, i és un prototip de l'Escola Industrial: està pensat per a centres que ja fan escacs i volen lligar-los a matemàtiques, no per a qui vol començar de zero.

## Per començar

El [centre d'aprenentatge](https://matescac.aulaia.cat/ca/learn) s'obre sense compte i mostra el tauler en tres dimensions amb els vectors de cada peça. És la manera més ràpida de veure si la idea encaixa amb el que feu. Si voleu provar-ho amb un grup, [demaneu l'alta](/alta?app=matescac).

I si el que us interessa és la visió espacial més que el càlcul, [Diedric3D](/apps/diedric3d) fa el camí des de les peces construïdes amb blocs cap a les vistes del dibuix tècnic. Els tres jocs comparteixen una cosa: no expliquen la geometria, la fan necessària.
