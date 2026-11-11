# Jab Store 2.0

Tienda online de JAB HIIT Boxing con cobro automático, inventario, clases online y panel de administración.

## Qué hace

- **Tienda:** catálogo con tallas, colores y stock real. Lo agotado no se puede comprar.
- **Envío separado del precio:** retiro gratis en Jab Centro o Jab Ceibos, envío en Guayaquil, resto de Ecuador, Estados Unidos, España y Alemania.
- **Pago con tarjeta (Payphone):** Visa, Mastercard, Diners y Discover. El pedido se confirma solo y el stock se descuenta al aprobarse el pago.
- **Pago por transferencia:** el cliente ve los datos bancarios y sube su comprobante. El gimnasio aprueba con un clic en `/admin` y el stock se descuenta.
- **Seguimiento del pedido:** cada cliente recibe un enlace con el estado (pagado, listo para retirar, enviado con guía, entregado).
- **Clases online:** cuentas de alumno y packs de 5 clases por $10, 15 por $13 y 20 por $15. Cada crédito desbloquea una clase para siempre. El video solo se entrega a quien la desbloqueó.
- **Entrenadores, historia del gimnasio y sedes** con mapa y botones para abrir la ruta en Waze o Google Maps.
- **Panel `/admin`:** pedidos, aprobación de transferencias, despacho, inventario por talla y créditos de alumnos.
- **Correos automáticos (opcional):** confirmación al cliente y aviso al gimnasio.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `content/tienda.js` | **Todo el contenido editable:** productos, precios, tarifas de envío, packs, clases y videos, entrenadores, historia, sedes, datos bancarios y WhatsApp |
| `public/img/` | Fotos de productos |
| `server.js` | Servidor: pagos, pedidos, inventario, cuentas y clases |
| `public/index.html` | La tienda |
| `public/admin.html` | Panel de administración |
| `render.yaml` | Configuración para Render (servidor + base de datos) |

## Subir a GitHub

Sube **todas** las carpetas y archivos (`content`, `public`, `src`, `server.js`, `package.json`, `render.yaml`, `README.md`, `.gitignore`).
En github.com, al subir, **arrastra las carpetas** (no uses "choose your files", que no sube carpetas).
No subas `node_modules` ni `data`.

## Publicar la versión de prueba (gratis)

1. Sube los archivos a GitHub (un repositorio nuevo, por ejemplo `jab-store-demo`).
2. En Render: **New + → Blueprint**, elige el repositorio y pulsa **Apply**.
3. Render te pedirá `ADMIN_PASSWORD`: escribe la clave que usarás en el panel.
4. En 3–5 minutos queda en `https://jab-store-demo.onrender.com` (o el nombre que asigne Render).
   - Tienda: la dirección principal.
   - Panel: la misma dirección + `/admin`.

Cómo se comporta la prueba:
- Arriba aparece la franja "Sitio de prueba": los pagos con tarjeta usan un simulador y no cobran nada.
- Plan gratuito: si nadie la visita en 15 minutos se "duerme" y la primera visita tarda cerca de un minuto.
- Sin base de datos: los pedidos y cuentas de prueba se borran al reiniciarse el servidor.

## Pasar a producción

1. En el servicio de Render: **Settings → Instance Type → Starter** (no se duerme).
2. **New + → Postgres** (plan Basic). Copia su "Internal Database URL" en la variable `DATABASE_URL` del servicio.
3. Agrega `PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`, `ADMIN_EMAIL` y, si usas dominio propio, `PUBLIC_URL`.
4. Al guardar las variables Render redespliega. La franja de prueba desaparece cuando Payphone está configurado.

Revisa los precios vigentes en render.com/pricing.

## Activar cobros reales con Payphone

1. El gimnasio crea su cuenta en **Payphone Business** (requiere RUC).
2. En **Payphone Developer** crea una aplicación tipo **WEB** con:
   - Dominio web: el de la tienda (por ejemplo `jab-store-demo.onrender.com` o tu dominio).
   - URL de respuesta: `https://TU-DOMINIO/pago/respuesta`.
3. Copia el **Token** y el **StoreID** en las variables `PAYPHONE_TOKEN` y `PAYPHONE_STORE_ID` de Render.
4. Si los precios incluyen IVA y quieres que Payphone lo desglose, agrega `IVA_PORCENTAJE` = `15`.

Mientras no haya token, el pago con tarjeta usa un **simulador** (no cobra nada) para poder probar todo el flujo.

## Correos automáticos (opcional)

Agrega en Render: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`.
Con Gmail: `smtp.gmail.com`, puerto `465`, y una "contraseña de aplicación".

## Cargar las clases online

En `content/tienda.js`, dentro de `CLASSES`, pon en `videoUrl` el enlace de inserción del video:

- YouTube (video **no listado**): `https://www.youtube.com/embed/ID_DEL_VIDEO`
- Vimeo: `https://player.vimeo.com/video/ID_DEL_VIDEO`
- Bunny Stream (más protegido): el enlace "Embed" de la biblioteca

La primera clase (`free: true`) es gratis como muestra.

## Antes de vender

- Reemplaza las tarifas de envío de ejemplo en `SHIPPING`.
- Completa `BANK` con los datos de transferencia.
- Completa las biografías "por confirmar" en `TRAINERS` (y fotos en `photo`).
- Revisa precios y carga el stock real en `/admin → Inventario`.
- Opcional: pon `lat` y `lng` exactos de cada sede en `LOCATIONS`.

## Probar en tu computadora

```
npm install
ADMIN_PASSWORD=prueba node server.js
```

Abre http://localhost:3000 y http://localhost:3000/admin
