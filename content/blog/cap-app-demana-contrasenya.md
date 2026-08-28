---
titol: Per què cap de les nostres apps demana una contrasenya
resum: Un centre que estrena sis eines digitals acaba amb sis llistes d'usuaris i sis contrasenyes oblidades. Expliquem la decisió que ens vam prendre per evitar-ho, i què implica per a la coordinació.
data: 2026-08-27
autor: Fabio Martínez
etiquetes: [Coordinació digital, Privacitat, Google Workspace]
apps: [dictats, typeedu, radio-escolar]
imatge: /blog/cap-app-demana-contrasenya.png
imatgeAlt: Una llista de contrasenyes d'alumnat ratllada, al costat del compte del centre
---

Cada setembre passa el mateix a molts centres. S'estrena una eina nova, algú prepara un full de càlcul amb el nom i el correu de cent seixanta alumnes, es generen contrasenyes, s'imprimeixen en paperetes i es reparteixen per les aules. Al desembre, la meitat s'han perdut. Al març, ja ningú recorda qui té accés a què.

Aquest article explica per què vam decidir que **cap de les nostres eines gestionaria contrasenyes**, i què significa això per a qui coordina la digitalització d'un centre.

## El problema no és la contrasenya, és la llista

Una contrasenya oblidada es recupera. El problema de debò és la llista que hi ha al darrere.

Quan una aplicació guarda els seus propis usuaris, el centre passa a mantenir **una còpia més** de les dades del seu alumnat. Aquesta còpia s'ha d'actualitzar quan algú canvia de grup, s'ha d'esborrar quan algú marxa i s'ha de protegir mentre existeixi. Multipliqueu-ho per les eines que fa servir el centre i teniu una feina de manteniment que no fa ningú perquè no és de ningú.

I el dia que arriba una consulta sobre protecció de dades, la pregunta incòmoda no és si les contrasenyes eren prou llargues. És **quantes còpies hi ha del llistat d'alumnes i on són**.

## La decisió: el centre ja té la identitat

Gairebé tots els centres amb què treballem ja tenen comptes de Google per al seu alumnat i el seu professorat. Aquesta identitat existeix, està mantinguda per algú del centre, i es dóna d'alta i de baixa amb els processos que el centre ja té.

Construir una segona identitat al costat d'aquesta no aporta res. Només afegeix una llista que es desincronitza.

Per això les nostres eines **no tenen registre**. S'hi entra amb el compte del centre, i el domini del correu determina a quin centre pertany cadascú. Si algú entra amb un compte de `escolaexemple.cat` i aquest domini està donat d'alta, l'aplicació ja sap on posar-lo. No cal invitar ningú un per un ni repartir codis.

## Què guanya la coordinació

**Les baixes funcionen soles.** Quan el centre desactiva el compte de Google d'una persona, aquesta persona deixa d'entrar a totes les eines el mateix dia. No cal recordar-se de fer-ho en sis llocs.

**No hi ha contrasenyes a recuperar.** Ni les nostres ni les vostres. El suport que això genera al llarg d'un curs no és menyspreable.

**Els grups s'importen.** Si el professorat ja fa servir Google Classroom, els grups i les llistes es porten des d'allà. Demanar a un docent que torni a teclejar una llista que ja existeix és la manera més ràpida que deixi de fer servir una eina.

## Què no resol

Val la pena dir també el que no arregla, perquè ho preguntareu tard o d'hora.

**No tots els centres encaixen.** N'hi ha on l'alumnat fa servir un domini diferent del professorat, i n'hi ha on el professorat entra amb comptes personals. Per això, tot i que el domini assigna automàticament, els grups mantenen un codi d'invitació: és la via per a qui no encaixa a la regla.

**Les dades no desapareixen.** Que no guardem contrasenyes no vol dir que no guardem res. Quan una eina importa un grup, el nom i el correu d'aquell alumnat passen a estar també a la nostra base de dades, i això és responsabilitat nostra i vostra. El que sí que evitem és una segona contrasenya i un segon procés d'alta i baixa.

**No substitueix el vostre criteri.** Que una eina sigui fàcil de posar en marxa no vol dir que hàgiu de posar-la en marxa. La pregunta prèvia continua sent si resol un problema que teniu.

## Com comprovar-ho abans de decidir

Si esteu valorant qualsevol eina educativa, aquestes tres preguntes us estalviaran feina el curs vinent:

1. **Com s'hi entra?** Si la resposta inclou generar contrasenyes, ja sabeu qui les acabarà repartint.
2. **Què passa quan un alumne marxa del centre?** Si cal recordar-se d'esborrar-lo a mà en aquella eina, no passarà.
3. **D'on surten els grups?** Si s'han de teclejar, es teclejaran una vegada i mai més s'actualitzaran.

Són tres preguntes que es fan en cinc minuts i que diuen més sobre com serà el curs que qualsevol demostració.
