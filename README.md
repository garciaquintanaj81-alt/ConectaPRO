# ConectaPRO · Plataforma web

**Tu red de servicios, más cerca.** Plataforma web responsiva para la orquestación de servicios a demanda en entornos multisectoriales.

Proyecto de Ingeniería de Sistemas – Universidad de Santander (UDES), Cúcuta.
Autoras: Julieth A. García Quintana y Daniela S. Junco Salazar · Director: Miguel F. Robles Angarita.

🔗 **Plataforma:** https://garciaquintanaj81-alt.github.io/ConectaPRO/
🎬 **Simulación en vivo (2 clientes + 2 proveedores):** https://garciaquintanaj81-alt.github.io/ConectaPRO/#/simulador

## Arquitectura

```
Navegador (React + TypeScript + Tailwind)  ──HTTPS──▶  Supabase
  publicado en GitHub Pages (/docs)                   ├─ Auth: registro e inicio de sesión (contraseñas cifradas, JWT)
                                                      ├─ API REST (PostgREST): funciones api_* 
                                                      └─ PostgreSQL: tablas, reglas de negocio y algoritmo
```

- **Base de datos real (PostgreSQL)**: usuarios, proveedores, solicitudes, postulaciones, acuerdos, calificaciones, mensajes, notificaciones, faltas, direcciones, métodos de pago, trueques y beneficios.
- **Toda la lógica de negocio está en la base de datos** (`supabase/schema.sql`): el algoritmo de emparejamiento georreferenciado (`cp_match`), la regla de tres strikes, los acuerdos digitales, la calificación mutua, etc.
- **Seguridad**: las tablas no se pueden leer ni modificar directamente desde internet (RLS activado sin políticas). Todo pasa por funciones `api_*` que validan quién es el usuario (`auth.uid()`) y qué puede hacer.
- **Departamentos y municipios de Colombia**: 33 entidades (32 departamentos + Bogotá D.C.) y 1.105 municipios con coordenadas (fuente DIVIPOLA, con correcciones), guardados en las tablas `departamentos` y `municipios`.
- **Tiempo real**: la app consulta el estado cada pocos segundos, así que notificaciones, postulaciones y mensajes llegan sin recargar.

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| Registro e inicio de sesión | Cuenta con correo y contraseña, documento, celular, **departamento y municipio** (listas encadenadas) y **detección facial real** con la cámara (ver abajo) |
| Roles dinámicos | La misma persona puede ser cliente y proveedor |
| Explorar | Filtro por **departamento → municipio**, **sector → subcategoría**, texto (nombre, profesión, servicios y palabras clave), disponibilidad y "Cerca de mí" (GPS). Muestra los proveedores del municipio y los de municipios vecinos cuya cobertura lo incluye |
| Publicar necesidad | 1) sector y subcategoría, 2) descripción, 3) departamento, municipio y **dirección obligatoria**, GPS opcional, 4) método de pago |
| Catálogo | 13 sectores y 68 subcategorías: hogar, construcción, tecnología, belleza, transporte, salud, mascotas, educación, comercio, agricultura, servicios profesionales, eventos y otros |
| Algoritmo de emparejamiento | Categoría + distancia (Haversine) dentro de la cobertura + horario; ordena por reputación y cercanía |
| Postulaciones y acuerdos | El proveedor propone precio; el cliente elige y se genera el contrato digital con código |
| Mensajería | Chat entre cliente y proveedor con fotos |
| Calificación mutua | Actualiza la reputación de ambos |
| Flexibilidad y tres strikes | Plazo adicional con penalización de puntualidad; suspensión al acumular 3 faltas graves |
| Trueque, IA predictiva y beneficios | Ofertas de trueque, sugerencia de servicios recurrentes y canje de puntos |
| CRUD completo | Crear, consultar, editar y eliminar: perfil, servicio del proveedor y portafolio, solicitudes, direcciones, métodos de pago, ofertas de trueque y la cuenta |

**Datos de ejemplo:** se cargan 68 proveedores de todos los sectores en 13 municipios (Rionegro, Medellín, Cúcuta, Villa del Rosario, Los Patios, Pamplona, Ocaña, Bucaramanga, Floridablanca, Bogotá, Cali, Barranquilla, Cartagena) y solicitudes abiertas. Los proveedores de ejemplo que no tienen cuenta de acceso responden automáticamente a las solicitudes para que la plataforma se pueda probar; los usuarios reales responden desde su propia cuenta. Se desactiva con `update config set valor = 'false' where clave = 'auto_respuesta_demo';`.

**Cuentas de demostración** (contraseña `Conecta2026*`): daniela@conectapro.co y juan@conectapro.co (clientes), carlos@conectapro.co y andres@conectapro.co (proveedores). También aparecen como botones en *Iniciar sesión*.

### Ubicación: municipio administrativo vs. GPS

El **municipio** que elige el usuario es siempre el dato administrativo (obligatorio, junto con la dirección). La ubicación GPS se pide **solo con autorización** del navegador y se usa únicamente como punto exacto para calcular distancias, y solo si está a menos de 25 km del municipio elegido. Si el GPS indica otro municipio, se avisa y no se usa a menos que el usuario cambie el municipio. Se guarda aparte (`ubicacion_gps`, `precision_m`).

### Detección facial: qué hace y sus limitaciones

Usa [pico.js](https://github.com/nenadmarkus/picojs) (licencia MIT) **en el navegador**: la imagen nunca se envía ni se guarda; al servidor solo llega el resultado (rostro detectado, cuadros válidos, movimiento, brillo y nitidez). Verifica que haya **un solo rostro**, con luz y nitidez suficientes, centrado, a buena distancia y con **movimiento natural de la cabeza**. Si no hay cámara, se puede validar con una selfie.

Limitaciones: **no reconoce la identidad** de la persona ni la compara con su documento, y una foto o video puesto frente a la cámara podría pasar la prueba. Una verificación de identidad real requiere un servicio biométrico especializado (fase futura).

## Instalación de la base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **Authentication → Sign In / Providers → Email**, desactiva **Confirm email**.
3. En **SQL Editor → New query**, pega todo el contenido de [`supabase/instalar.sql`](supabase/instalar.sql) y presiona **Run**. Se puede volver a ejecutar sin perder los datos de usuarios reales.
4. Copia la **Project URL** y la **publishable key** (Project Settings → API Keys) en [`public/config.js`](public/config.js) y vuelve a compilar (`npm run build`).

## Desarrollo local

Requiere Node.js y PostgreSQL.

```bash
npm install
createdb conectapro
psql -d conectapro -f server/local-auth-shim.sql   # solo local: imita el esquema auth de Supabase
psql -d conectapro -f supabase/instalar.sql
npm run build
node server/dev-server.mjs                         # http://localhost:8787 (emula Supabase sobre el PostgreSQL local)
```

## Estructura

```
supabase/
  schema.sql          Tablas, seguridad y API (funciones api_*)
  demo.sql            Datos de ejemplo de solicitudes, chats y notificaciones (reiniciables)
  seed.sql            Departamentos, municipios, catálogo y proveedores (generado por generar_seed.py)
  instalar.sql        schema + seed en un solo archivo para Supabase
server/
  dev-server.mjs      Servidor local que imita Supabase (Auth + RPC) para pruebas
src/
  api.ts              Cliente de la API (Auth + RPC) sin librerías externas
  store.tsx           Estado de la app conectado a la base de datos
  geo.tsx             Selectores encadenados de departamento y municipio
  screens/            Pantallas: Auth, Client, Provider, Common, Simulator
public/config.js      URL y clave pública de Supabase
docs/                 Versión compilada que publica GitHub Pages
```

> Nota: la validación facial usa la cámara del dispositivo, pero el reconocimiento biométrico real requiere un servicio especializado de terceros (fase futura del proyecto).
