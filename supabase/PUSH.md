# Notificaciones push (al celular) · Configuración en Supabase

Las notificaciones **dentro de la app** (la campana) funcionan siempre. Para que además lleguen **al celular aunque la página esté cerrada** hay que hacer estos pasos **una sola vez** en Supabase.

## Cómo funciona

1. La persona toca **Activar notificaciones** (Mi perfil → Notificaciones). El navegador pide permiso y el dispositivo queda guardado en la tabla `push_suscripciones`.
2. Cada vez que ConectaPRO crea una notificación (nueva oportunidad, mensaje, propuesta, aceptación o cambio en una contratación), un **Database Webhook** llama a la función `enviar-push`.
3. La función envía el aviso a todos los dispositivos de esa persona, firmado con las **claves VAPID**.

## Pasos

### 1. Crear la función
1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nombre: `enviar-push`.
3. Borra el código de ejemplo y pega todo el archivo [`functions/enviar-push/index.ts`](functions/enviar-push/index.ts). Presiona **Deploy function**.
4. En los ajustes de la función, **desactiva "Verify JWT"** (la función se protege con el secreto del webhook).

### 2. Guardar los secretos
Edge Functions → **Secrets** → agrega:

| Nombre | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | la clave pública (está en `public/config.js`, campo `vapidPublicKey`) |
| `VAPID_PRIVATE_KEY` | la clave privada que se entregó aparte (**no la subas a GitHub**) |
| `VAPID_SUBJECT` | `mailto:soporte@conectapro.co` |
| `WEBHOOK_SECRET` | el texto secreto que se entregó aparte |

### 3. Crear el webhook
1. Supabase → **Database** → **Webhooks** → **Create a new hook** (si lo pide, actívalos primero).
2. Nombre: `notificaciones-push` · Tabla: `notificaciones` · Evento: **Insert**.
3. Tipo: **Supabase Edge Functions** → función `enviar-push` · Método `POST`.
4. En **HTTP Headers** agrega `x-webhook-secret` con el mismo valor de `WEBHOOK_SECRET`.
5. Guarda.

### 4. Probar
1. Abre ConectaPRO en el celular → Mi perfil → Notificaciones → **Activar notificaciones** → Permitir.
2. Desde otra cuenta envíale un mensaje: debe llegar el aviso aunque cierres la página.
3. Si no llega: Edge Functions → `enviar-push` → **Logs**.

## Compatibilidad y limitaciones

| Dispositivo | ¿Funciona? | Qué hay que hacer |
|---|---|---|
| Android (Chrome, Edge, Firefox, Samsung Internet) | Sí, aunque la página esté cerrada | Aceptar el permiso. Si el ahorro de batería es agresivo los avisos pueden demorarse: permite al navegador trabajar en segundo plano |
| iPhone / iPad | Solo iOS 16.4 o superior | Safari → Compartir → **Agregar a pantalla de inicio**, abrir ConectaPRO desde ese ícono y activar ahí las notificaciones |
| Computador (Chrome, Edge, Firefox) | Sí, mientras el navegador esté abierto | Aceptar el permiso |
| Navegadores dentro de otras apps (Facebook, Instagram) | No | Abrir la página en Chrome o Safari |

- El permiso es **por dispositivo y navegador**: hay que activarlo en cada uno.
- Si la persona bloquea el permiso, debe habilitarlo desde la configuración del sitio en el navegador (candado junto a la dirección).
- Solo funciona en páginas **https** (GitHub Pages ya lo es).
- Si se cambian las claves VAPID, todas las personas deben volver a activar las notificaciones.
