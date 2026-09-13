# Plataforma JSP — Frontend

Contexto de proyecto para Claude Code. Este repo es **solo el frontend**: una SPA en React que consume el backend (`jsp-backend`, repo separado) únicamente vía HTTP documentado (Swagger/OpenAPI) — nunca acceso directo a la base de datos ni código compartido con el backend.

Planeación completa en el Project de claude.ai "Plataforma JSP": `claude/arquitectura-y-stack.md`, `claude/esquema-base-datos.md`, `claude/esquema-tecnico-detallado.md`, `claude/propuesta-comercial.md`. Este archivo es un resumen operativo para desarrollo, no reemplaza esos documentos.

## Qué es esto

Frontend del CRM interno de JSP Abogados, firma especializada en procesos judiciales de tránsito (accidentes). Contrato ya aceptado, primer pago recibido. Uso exclusivo dentro de la oficina, ~5 usuarios internos (roles `admin`/`abogado` — el rol `cliente` nunca inicia sesión, no usa este frontend).

**Fuera de alcance de este repo:** cualquier automatización de IA (transcripción de documentos) y el Portal de Consulta Ciudadana (se maneja como esfuerzo aparte, posiblemente otro proyecto/dominio). No las anticipes en el código todavía.

## Estándares de código (léelo antes de escribir cualquier componente nuevo)

El desarrollador que mantiene este proyecto no es un experto en frontend/backend. La prioridad es que pueda abrir un solo archivo y entender exactamente qué hace esa vista, sin tener que rastrear una abstracción compartida en otro lado. Esto tiene prioridad sobre eliminar duplicación o "ahorrar" líneas de código — mismo estándar que ya rige en `jsp-backend`.

Reglas concretas, no negociables sin discutirlo primero:

- **Un archivo de componente por cada vista/pantalla real** (`LoginPage.tsx`, `ProcesosListPage.tsx`, etc.), nombrado igual que la vista. No dividir una vista simple en múltiples sub-componentes "por prolijidad" si no aporta claridad real.
- **Cada vista hace sus propias llamadas `fetch` a la ruta que necesita, directamente en el componente** (o en un archivo de servicio simple específico de esa vista, ej. `procesos.api.ts` si el componente ya queda muy largo) — **nunca** un cliente API genérico compartido ni un cliente generado automáticamente desde el esquema OpenAPI del backend. Repetir un `fetch` parecido en dos vistas está bien.
- **Nada de helpers/hooks/factories genéricos** que generen lógica de fetch, formularios o rutas de forma dinámica/parametrizada para evitar escribir código repetido entre vistas.
- **Nombres de archivo/función/variable siempre en términos del negocio real** (`ProcesosListPage`, `login`), nunca términos genéricos de la abstracción.
- Repetir estructura similar entre vistas parecidas es preferible a una abstracción compartida — la duplicación aquí es legible, la abstracción prematura no lo es para este equipo (de una sola persona, sin experiencia previa).
- Estilos: **Tailwind CSS**, utilidades directo en el JSX. Sin archivos `.css` por componente (salvo el mínimo global que requiere Tailwind). No se usa ninguna librería de componentes prearmados (shadcn, Mantine, etc.) — se prefirió mantener control total y explícito sobre el markup.

## Stack de este repo

- React + Vite + TypeScript
- Tailwind CSS
- Sin librería de manejo de formularios ni de estado global por ahora — estado de React (`useState`) alcanza para el alcance actual; si más adelante se vuelve insuficiente, se discute antes de agregar una dependencia nueva.
- Sin cliente API generado — fetch nativo del navegador, llamadas explícitas por vista (ver "Estándares de código" arriba).
- Autenticación: JWT devuelto por `POST /api/v1/auth/login`, guardado en `localStorage`, enviado como `Authorization: Bearer <token>` en cada request autenticado.

## Reglas de arquitectura (no reabrir sin razón)

- **SPA pura, sin acceso a base de datos.** Todo dato viene de la API del backend documentada en Swagger/OpenAPI.
- **El backend ya aplica el RBAC real** (rol + `abogado_asignado_id`) — el frontend no reimplementa esa lógica de permisos, pero sí debe reflejarla visualmente: por ejemplo, no mostrar controles de edición de `procesos` a un usuario con rol `abogado`, porque el backend los rechazaría con 403/404 de todas formas. La fuente de verdad de qué puede hacer cada rol es siempre el backend; la UI solo evita ofrecer acciones que el backend no permitiría.
- **Rutas protegidas:** cualquier ruta que no sea `/login` requiere un JWT válido en `localStorage`; si no hay token (o el backend responde 401), redirige a `/login`.
- **Variable de entorno `VITE_API_URL`** apunta a la URL base de la API (hoy, en desarrollo local, algo como `http://localhost:3000/api/v1` — confirmar el puerto real del backend). Nunca hardcodear la URL del backend en el código.
- **CORS:** el backend solo acepta requests desde el origen configurado en su propio `.env` (`CORS_ORIGIN`, hoy `http://localhost:5173`, el default de Vite). Si el frontend corre en otro puerto/host, hay que actualizar esa variable en el backend — no es algo que se configure desde este repo.
- **Sin registro público de usuarios** — el admin crea las cuentas manualmente (fuera del frontend, vía API o directo en base de datos); no hay pantalla de "crear cuenta" en este CRM.

## Entorno de ejecución actual

**Todo corre en local por ahora (2026-09-12)** — backend y frontend ambos en `localhost` durante esta fase de desarrollo. El despliegue a VPS (Easypanel para el backend, VPS propio o hosting estático para este frontend) se hace más adelante; no bloquea el desarrollo actual.

## Alcance actual (primera tanda, 2026-09-12)

Se está construyendo **solo**:

1. `LoginPage.tsx` — formulario contra `POST /api/v1/auth/login`, guarda el JWT y redirige al listado de procesos.
2. Ruta protegida + layout base — nombre/rol del usuario (vía `GET /api/v1/auth/me`) y botón de logout.
3. `ProcesosListPage.tsx` — tabla simple contra `GET /api/v1/procesos` (columnas: placa, tipo de caso, estado, abogado asignado, fecha del accidente). El backend ya filtra por rol.

**No construir todavía:** detalle de proceso, formularios de creación/edición, gestión de usuarios, dashboard, reportes, landing page, ni el Portal de Consulta Ciudadana. Se agregan en tandas siguientes, una a la vez.

## Referencia rápida de rutas del backend (Fase 2 ya cerrada, ver `arquitectura-y-stack.md` para el detalle completo)

- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET/POST /api/v1/procesos`, `GET/PATCH /api/v1/procesos/:id`, `GET /api/v1/procesos/:id/historial`
- `GET /api/v1/tipos-casos`, `/api/v1/aseguradoras`, `/api/v1/estados-procesos`, `/api/v1/tipos-archivos` (catálogos, solo lectura)
- `GET/POST /api/v1/vehiculos`, `PATCH /api/v1/vehiculos/:id`
- `GET/POST/PATCH /api/v1/usuarios` (solo admin)
- `GET/POST /api/v1/procesos/:id/terceros`, `PATCH/DELETE /api/v1/terceros/:id`
- `GET/POST /api/v1/procesos/:id/lesionados`, `PATCH/DELETE /api/v1/lesionados/:id`
- `GET /api/v1/notificaciones`, `PATCH /api/v1/notificaciones/:id`
- `GET /api/v1/dashboard/metricas`
- `GET /api/v1/reportes/excel?aseguradora_id=...`

Todas documentadas en Swagger del backend — revisar ahí el shape exacto de request/response antes de construir cada vista.

## Pendiente de definir

- Puerto/URL real del backend en desarrollo local (confirmar antes de fijar `VITE_API_URL`).
- Orden exacto de las tandas siguientes después de login + listado de procesos.
- Hosting concreto del build de producción (Easypanel en VPS propio vs. hosting estático tipo Cloudflare Pages/Netlify).
- Si más adelante se necesita manejo de estado global o de formularios más complejo, discutirlo antes de agregar una librería nueva — no asumir que hace falta desde ya.
