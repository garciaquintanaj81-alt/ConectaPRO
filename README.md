# ConectaPRO · Prototipo funcional

**Tu red de servicios, más cerca.** Plataforma web responsiva para la orquestación de servicios a demanda en entornos multisectoriales.

Proyecto de Ingeniería de Sistemas – Universidad de Santander (UDES), Cúcuta.
Autoras: Julieth A. García Quintana y Daniela S. Junco Salazar · Director: Miguel F. Robles Angarita.

🔗 **Ver el prototipo:** https://garciaquintanaj81-alt.github.io/ConectaPRO/

> Prototipo con **datos simulados**: todo lo que hagas se guarda en tu navegador. Para volver al estado inicial usa *Mi perfil → Seguridad y privacidad → Restablecer demo*.

## Cómo probarlo

1. Abre el enlace en el celular o en el computador (el diseño se adapta a ambos).
2. En **Iniciar sesión** usa una cuenta de demostración:
   - **Daniela** → rol *cliente*
   - **Carlos** → rol *proveedor*
3. O crea una cuenta nueva desde *Registrarme* (incluye validación facial simulada con la cámara).

### Recorrido sugerido (cliente)
Inicio → **Publicar** solicitud → animación del **algoritmo de emparejamiento** → **Proveedores compatibles** (ordenados por calificación) → **Ver perfil** → **Contratar** → **Acuerdo digital** → *Mis solicitudes* → **Calificar servicio**.

### Recorrido sugerido (proveedor)
Inicio con oportunidades cercanas → **Aceptar** o proponer precio → *Mis trabajos* → **Marcar como realizado** → calificar al cliente. En *Mi servicio* se parametriza el oferente (empresa, categorías, cobertura, horario, precios, galería).

## Funcionalidades incluidas

| Módulo | Qué hace en el prototipo |
|---|---|
| Registro y autenticación | Registro con validación de datos, reconocimiento facial simulado (usa la cámara si se permite) e inicio de sesión |
| Roles dinámicos | La misma persona cambia entre cliente y proveedor |
| Publicación de solicitudes | Descripción, categoría, ubicación (GPS o manual), método de pago y propuestas |
| **Algoritmo de emparejamiento** | Filtra por categoría, distancia (Haversine) dentro de la cobertura y horario laboral; ordena por reputación y cercanía (`src/matching.ts`) |
| Notificaciones | Alertas a proveedores compatibles, postulaciones, acuerdos y mensajes |
| Acuerdos digitales | Propuesta → Acuerdo → Confirmación, con contrato y código |
| Mensajería | Chat con envío de fotos y respuestas simuladas |
| Calificación mutua | Cliente califica al proveedor y viceversa |
| Flexibilidad y penalizaciones | Plazo adicional de 2 días con registro de impuntualidad |
| Regla de “Tres Strikes” | Faltas graves acumuladas y suspensión de la cuenta |
| Match por trueque | Intercambio de habilidades sin dinero |
| IA predictiva de rutinas | Detecta servicios repetidos (≥3 veces con frecuencia similar) y sugiere volver a contactar |
| Fidelización con aliados | Puntos, niveles y cupones de ejemplo |

## Tecnologías

React 19 · TypeScript · Tailwind CSS 4 · esbuild. Se publica como sitio estático en GitHub Pages (carpeta `/docs`).
En la fase de desarrollo final se integrarán Next.js, PostgreSQL y autenticación real, como se plantea en el proyecto.

## Ejecutar en tu computador (opcional)

```bash
npm install
npm run dev     # abre http://localhost:5173
npm run build   # genera la carpeta /docs que publica GitHub Pages
```

## Estructura

```
src/
  data.ts        Datos simulados (servicios, proveedores, clientes)
  matching.ts    Algoritmo de emparejamiento georreferenciado + IA predictiva
  store.tsx      Estado global (simula el backend, guarda en localStorage)
  Layout.tsx     Menú lateral (computador) y barra inferior (móvil)
  ui.tsx         Componentes visuales reutilizables
  screens/       Pantallas: Auth, Client, Provider, Common
public/img/      Imágenes tomadas de los mockups
docs/            Versión compilada (lo que se publica)
```
