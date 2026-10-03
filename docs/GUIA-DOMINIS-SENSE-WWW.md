# Guía: que los dominios funcionen sin «www» y limpiar Railway

3/10/2026. Preparada solo leyendo (DNS públicos de cdmon, Cloudflare y Railway). Los cambios los hace Fabio.

## Por qué falla

cdmon no tiene registros ALIAS y su «redirección web» solo funciona por `http://`. Los navegadores prueban primero `https://`, así que `https://dominio.cat` falla en los 9 dominios. La solución es la misma para todos: que el DNS lo lleve **Cloudflare (gratis)**, que responde con certificado propio y redirige a `https://www.…`. El dominio sigue registrado y pagado en cdmon; solo cambian los nameservers.

## A. aulaia.cat (ya está en Cloudflare, 2 minutos)

1. Cloudflare → aulaia.cat → **DNS → Registros** → fila `CNAME aulaia.cat` → **Editar** → activar **Proxy** (nube naranja) → Guardar.
2. **Reglas → Reglas de redireccionamiento → Crear regla**:
   - Si *Nombre de host* es igual a `aulaia.cat`
   - URL **dinámica**: `concat("https://www.aulaia.cat", http.request.uri.path)` · código **301** · **Conservar cadena de consulta**.
3. Avisar a Claude para comprobarlo.

## B. Los 8 dominios de cdmon

Orden propuesto, de menos a más delicado (los que tienen correo, al final):
**typeedu.com → aulessostenibles.cat → chefboss.es → kipuk.cat → elplalector.cat → dictats.cat → diedric3d.com → radioescolar.cat**

Para cada uno:

1. **Cloudflare → Añadir un dominio** → escribir el dominio → plan **Free**. Cloudflare escanea los registros que encuentra.
2. **Comparar** lo que ha importado con la tabla de abajo. Añadir lo que falte. Todo en **Solo DNS** (nube gris) **excepto** el registro del dominio sin www.
3. **Dominio sin www:** borrar los registros A de `@` que apunten a `46.225.47.134` (la redirección de cdmon) y crear uno: `A @ 192.0.2.1` **con proxy (nube naranja)**. Es una dirección «de relleno»: Cloudflare contesta antes de llegar ahí.
4. **Regla de redirección** igual que en aulaia.cat: si el host es `dominio` → `concat("https://www.dominio", http.request.uri.path)`, 301, conservar la consulta.
5. **SSL/TLS → Información general → modo «Completo (estricto)»**.
6. **cdmon → el dominio → Nameservers / DNS → servidores personalizados** → poner los **dos que indique Cloudflare** (del tipo `xxx.ns.cloudflare.com`). Quitar los de cdmon.
7. Esperar a que Cloudflare diga «Activo» (de minutos a unas horas). `www` sigue funcionando durante el cambio porque el registro es el mismo.
8. Avisar a Claude para comprobar web, certificado y, si tiene, correo.

### Registros que hay que conservar en cada dominio

En todos: **`www` CNAME** a Railway y **`_railway-verify.www` TXT**. El valor completo lo copia el escáner de Cloudflare; si no, está en el panel de cdmon.

| Dominio | `www` CNAME | Otros registros a conservar |
| --- | --- | --- |
| typeedu.com | kofwq3i3.up.railway.app | TXT `@` google-site-verification · TXT `_dmarc` «v=DMARC1; p=none;» |
| aulessostenibles.cat | yh6csz8j.up.railway.app | TXT `@` google-site-verification |
| chefboss.es | 9rncs2v4.up.railway.app | TXT `@` google-site-verification |
| kipuk.cat | 4un5z722.up.railway.app | (nada más) |
| elplalector.cat | 0yovnpaw.up.railway.app | TXT `@` google-site-verification · **ojo**: subdominios de la app `industrial.elplalector.cat` y `escolaindustrial.elplalector.cat` (mirar en cdmon sus CNAME y TXT y copiarlos) |
| dictats.cat | v2fvsemn.up.railway.app | TXT `@` google-site-verification · TXT `_dmarc` · **correo Resend**: TXT `resend._domainkey` (clave larga) y CNAME `send` → `send.forge.rmta.net` (y si en cdmon hay MX o TXT en `send`, copiarlos) |
| diedric3d.com | n4cvkayc.up.railway.app | **correo cdmon**: MX `@` → `mail.cdmon.net` · TXT `@` «v=spf1 include:_spf.srv.cat ~all» · TXT `_dmarc` «v=DMARC1; p=quarantine; aspf=s; adkim=r» |
| radioescolar.cat | xorpvzme.up.railway.app | **correo cdmon**: MX `@` → `mail.cdmon.net` · TXT `@` SPF igual que diedric3d · TXT `_dmarc` igual · TXT `@` google-site-verification |

Si en el panel de cdmon aparece algún registro más que no esté aquí (DKIM de correo, otro subdominio), **copiarlo también**. La consulta pública no puede listar todos los nombres.

## C. Direcciones `…up.railway.app`

En Railway → servicio → **Settings → Networking** → borrar el dominio `…up.railway.app`.

**Se pueden quitar ya** (tienen dominio propio y ninguna variable usa la de Railway):
La Claqueta (`laclaqueta-production`), Museu Apagat (`museu-apagat-production`), Poetes Vives (`web-production-531662`), Enfonsar la flota (`web-production-c5be8`), MatEscac (`web-production-c419d`), AulaAcull (`web-production-4b66b`), Kiosko (`pantalles-production`), El Taulell (`eltaulell-production`), aulaia.cat (`aulaia-cat-production-978b`), Ràdio (`radio-industrial-jove-production`), TypeEdu (`typeedu-production`), Aules Sostenibles (`aules-sostenibles-production`), Chef Boss (`chef-boss-production`), landing Pla Lector (`web-production-d7121`), Pla Lector (`biblioteca-pla-lector-production`).
Antes de borrar cada una, mirar en Google Cloud que el login de Google de esa app no tenga como «URI de redireccionamiento» la dirección de Railway.

**Todavía no:**
- **dictats.cat**: `AUTH_URL` usa la dirección de Railway → primero cambiarla a `https://www.dictats.cat` y añadir esa URI en Google Cloud y en Entra ID.
- **Kipuk**: `GOOGLE_OAUTH_REDIRECT_URI` usa la de Railway → cambiarla a `https://www.kipuk.cat/api/google-classroom/callback`.
- **Diedric3D**: la web llama a la API por su dirección de Railway (`API_PROXY_TARGET`, `WEB_ORIGINS`). La de la **API** no se puede quitar; la de la web sí.
- **ecoiso** y **TheoAdvisor**: no son del catálogo; no tocar.

**Proyectos duplicados o vacíos en Railway** (gastan recursos o confunden; decidir si se borran):
`gentle-unity` (copia antigua de Pauta con `fpsegura-production`), `resplendent-recreation`, `reliable-dedication` y `compassionate-forgiveness` (tres copias de AulaAcull), `clever-nature` (copia de TypeEdu), `spirited-flow` (copia de Pla Lector), `aules-web` (posible duplicado de Aules Sostenibles), `powerful-vision` y `welcoming-happiness` (claqueta, vacíos), `worthy-courage` y `confident-dedication` (vacíos o sin dominio).
Antes de borrar uno: comprobar que no tiene base de datos con datos propios.
