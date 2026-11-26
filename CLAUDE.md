# CLAUDE.md · aulaia.cat

Instruccions per a qui treballi en aquest repositori. Compleix-les abans de tocar res.

## Abans de començar

- Parteix sempre de l'últim `origin/main`. Un push des d'una base antiga ha tornat versions velles del panell.
- El que es publica a Railway surt de `main`. Un canvi a una altra branca no es veu a la web.
- No cometis fitxers que no siguin del teu canvi. Hi ha canvis locals d'altres tasques (panell, avisos, centraleta) que no s'han de barrejar.
- No posis claus, contrasenyes ni tokens al codi ni al README. Només variables d'entorn.

## Errors que ja han passat (comprova-ho de bell antuvi)

1. **Seguretat després de publicar.** Consultes amb paràmetres, claus només al servidor, rols comprovats al servidor, escapar HTML als correus.
2. **URL pública a Railway.** Redireccions i comprovacions d'origen amb la URL pública de variable d'entorn, mai la interna.
3. **Desplegaments que cauen.** Versions fixades (`package-lock`), fitxers amb finals de línia LF i comprovar després de cada desplegament que la web respon amb la versió nova.
4. **IA externa.** Reintents limitats, distingir «espera» de «torna demà», guardar el motiu de l'error i deixar sempre una via manual.
5. **Rols i login.** Provar cada rol (alumne, docent, admin) i noms amb accents abans de donar-ho per bo.
6. **Tot ha de poder desfer-se.** Qualsevol cosa que es crea s'ha de poder esborrar o retirar, amb confirmació.
7. **Base de dades.** Crear l'esquema una sola vegada i en ordre.
8. **Navegadors i pantalles.** Provar fora de Chrome d'escriptori, en mòbil i en mode fosc.
9. **Importacions.** Previsualitzar abans d'importar i provar amb un fitxer real.
10. **Proves amb data fixa.** Les dates han de ser relatives a avui.

## Dades d'alumnat

- Mai no s'envien dades d'alumnes a serveis externs ni a la IA sense anonimitzar-les.
- Els correus i els missatges no porten noms d'alumnes.
- El centre no es nomena en material públic sobre resultats sense el vistiplau de direcció.

## Publicar i comunicar

- No es publica res en xarxes ni es respon en nom de ningú sense un «publica'l» explícit.
- Els correus es redacten; l'envia qui els signa.
- No s'afirma que una eina «detecta IA». No s'afirma que una app estigui validada ni desplegada si no ho està.

## Vigilància

- Les apps tenen un flux de vigilància a n8n que avisa per correu si una app cau o si la seva IA falla de manera repetida.
- Hi ha un resum setmanal per correu els dilluns a les 8:00.
