---
titol: Enfonsar la flota en 3D: quan la tercera coordenada té conseqüències
resum: Vam agafar el joc de tota la vida i hi vam afegir profunditat. Expliquem què canvia a l'aula quan un submarí pot amagar-se sota un vaixell, i com ho fem servir a 3r i 4t d'ESO per treballar coordenades a l'espai i sistema dièdric.
data: 2026-09-14
autor: Fabio Martínez
etiquetes: [Matemàtiques, Dibuix tècnic, Geometria a l'espai, ESO]
apps: [enfonsar-la-flota, diedric3d, matescac]
imatge: /blog/enfonsar-la-flota-en-3d.jpg
imatgeAlt: Una flota en combat sota un cel de tempesta: destructors, un portaavions i un submarí que emergeix en primer pla
---

Enfonsar la flota és probablement el primer exercici de coordenades que fa tothom, molt abans que ningú li digui que allò són coordenades. Dius «B-7», l'altre mira la quadrícula, i la lletra i el número han fet la feina d'un parell d'eixos sense que calgui explicar res.

A 3r d'ESO el problema és un altre. La quadrícula ja se sap. El que costa és el salt a l'espai: imaginar que un punt té tres coordenades, que una vista d'un objecte en perd una, i que amb dues vistes es pot reconstruir el que no es veu. Aquest article explica per què vam decidir afegir profunditat al joc de tota la vida i què passa a l'aula quan ho fem.

## El que canvia quan hi ha profunditat

A [Enfonsar la flota](/apps/enfonsar-la-flota) el tauler ja no és una quadrícula: és un bloc de 10 per 10 per 5. La tercera coordenada és l'altura respecte de la superfície del mar, i va de menys dos a més dos.

Aquesta coordenada no és decorativa, té regles. Els avions volen als dos nivells de sobre. Els vaixells naveguen a la superfície, al nivell zero. Els submarins s'amaguen als dos nivells de sota. I les armes no arriben a tot arreu: un torpede toca la superfície i el que hi ha a sota, un atac aeri toca la superfície i el que hi ha a sobre.

La conseqüència és que pensar en dues dimensions deixa de servir. Un alumne que dispara a la columna tres i la fila set encara no ha dit res: ha de decidir a quin nivell, i per fer-ho ha de decidir quina arma, i per decidir l'arma ha de tenir una hipòtesi sobre què hi ha allà sota. El tret és un punt de l'espai, amb les tres coordenades, i l'ordre importa: (3, 7, -2) no és el mateix que (7, 3, -2).

## Les tres vistes del dibuix tècnic, sense fitxa

Aquí és on el joc toca l'altra assignatura. Mentre l'alumne mou el cursor pel bloc, al costat hi apareixen la planta, l'alçat i el perfil de la cel·la que està apuntant, i dels impactes que ja ha fet. Són les tres projeccions del sistema dièdric, les mateixes que surten als plànols, però aplicades a una cosa que li interessa trobar.

No cal explicar què és una projecció ortogonal. Es veu que la planta perd l'altura i que l'alçat perd la profunditat, i es veu que amb les dues juntes ja saps on és el submarí. El professorat de dibuix tècnic sap com costa que això s'entengui sobre paper. Aquí s'entén perquè fa falta per guanyar.

A [Diedric3D](/apps/diedric3d) fem el mateix camí en l'altre sentit: es construeix una peça amb blocs i les vistes es dibuixen soles. Les dues eines es complementen bé en una mateixa unitat.

## Trenta trets per a cinc-centes cel·les

El joc clàssic no té límit de munició. Aquest sí: vint torpedes i deu atacs aeris per a un bloc de cinc-centes cel·les on hi ha deu unitats amagades. Amb això, disparar a l'atzar és perdre.

I aquí entra la part de matemàtiques que més ens agrada, perquè apareix sola. Un portaavions ocupa cinc cel·les en línia. Si dispares una de cada cinc columnes, el trobes segur. Les fragates, els submarins i el bombarder n'ocupen tres, i demanen un patró més dens. Els caces, dues. La pregunta «quants trets calen per cobrir un pla?» és una pregunta de recompte, i la pregunta «quina probabilitat té el primer tret d'encertar?» és una pregunta de probabilitat. Cap de les dues surt d'un enunciat: surten de voler guanyar.

Quan la partida s'acaba, la pantalla de resultats diu quina precisió has tingut, quantes columnes has explorat, quins nivells has fet servir i si el teu patró d'atac ha estat sistemàtic, exploratori o una barreja. És material per a una reflexió de tres línies que val més que moltes fitxes.

## Com ho portem a l'aula

La seqüència que fem servir són tres sessions de classe.

1. **Tutorial i primera partida contra l'ordinador.** La consigna és anotar cada tret a la llibreta com a punt, i marcar-lo en una planta i un alçat dibuixats a mà. La posada en comú acaba sempre amb la mateixa pregunta: quin nivell heu explorat menys, i per què.
2. **Partida a dos al mateix dispositiu.** Abans de cada tret, el jugador ha de dir en veu alta la cel·la i en quina vista l'ha deduïda. Després, una fitxa a la inversa: donada la planta i l'alçat d'una flota, escriure les coordenades de tots els vaixells.
3. **Anàlisi i estratègia.** Amb la pantalla de resultats, cada alumne escriu què canviaria. I el repte: dissenyar el patró de cerca mínim que garanteixi trobar un portaavions a la superfície, i comprovar-lo jugant.

El joc guarda per codi de classe la precisió, els trets, les unitats enfonsades, els nivells usats i el tipus de patró. Això són evidències, però no són la nota: la nota surt de la llibreta amb les vistes, de la fitxa de coordenades i de la reflexió escrita.

## Què no resol

Val la pena dir-ho, com sempre.

**No ensenya el sistema dièdric tot sol.** Fa que les vistes tinguin sentit, que és una altra cosa. La definició, els noms i la convenció dels plànols els ha de posar el professorat, i la llibreta hi és per això.

**No cal cap compte, però sí un codi.** L'alumnat entra amb un codi de classe i un nom, sense contrasenya. Per jugar en línia amb el grup i que els resultats es guardin, el centre necessita un codi propi, i avui el creem nosaltres. Qui vulgui provar-lo abans, té el mode tutorial, que no guarda res.

**No és per a tots els cursos.** Està pensat per a 3r i 4t d'ESO. A 2n serveix com a primera aproximació a les coordenades a l'espai, i a 1r de batxillerat tecnològic com a repàs del dièdric. Més avall, la tercera coordenada és més un obstacle que una ajuda.

## Per començar

El [tutorial interactiu](https://enfonsarlaflota.aulaia.cat/tutorial) s'obre sense compte i és la manera més ràpida de veure si encaixa amb el que esteu fent. Si voleu jugar-hi amb un grup i guardar els resultats, [demaneu l'alta](/alta?app=enfonsar-la-flota) i us preparem el codi de classe.

I si el que us interessa és la geometria a l'espai com a fil de tota una unitat, [MatEscac](/apps/matescac) treballa les mateixes coordenades sobre un tauler d'escacs en tres dimensions. Són tres jocs diferents que fan la mateixa pregunta: on és, exactament, aquesta cosa que no veig.
