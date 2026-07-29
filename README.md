# Gestión de Invitados

App para que organizadores de eventos gestionen su lista de invitados y la confirmación
de asistencia (RSVP). La app **no diseña la invitación** — eso se hace por separado
(Canva, PDF, etc.) — pero genera, por cada invitado, un **link único** y su **código QR**
para integrarlo en esa invitación, además de poder compartirse directo por email o WhatsApp.

## Funcionalidades

- Cuentas de organizador (registro / login), múltiples eventos por organizador.
- Alta de invitados manual o por importación CSV, con mesa asignada.
- Link y QR de confirmación de asistencia únicos por invitado (RSVP).
- Control de acceso el día del evento: QR de check-in separado del de confirmación
  (escaneable con la cámara nativa del celular, sin librería de escaneo en la app).
- Envío por email (Resend) o WhatsApp (`wa.me`), usando una plantilla de mensaje
  personalizable por evento (con variables como `{nombre}`, `{mesa}`, `{link}`, etc.).
- Dashboard por pestañas: Invitados, Confirmaciones, Mesas, Accesos, Envíos, Configuración.
- Exportar / imprimir la lista de confirmaciones (PDF vía impresión del navegador).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth (Auth.js) v5](https://authjs.dev) con credentials provider
- [Resend](https://resend.com) para email
- `qrcode` para generación de códigos QR

## Desarrollo local

1. Copia `.env.example` a `.env` y completa las variables (necesitas un `DATABASE_URL`
   de Postgres; puedes usar uno local, [Neon](https://neon.tech) o la base de Render).
2. Instala dependencias y aplica las migraciones:

   ```bash
   npm install
   npx prisma migrate dev --name init
   ```

3. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000).

`RESEND_API_KEY` es opcional para desarrollo: sin ella, la app funciona igual pero el
botón de "enviar por email" fallará hasta que la configures.

## Despliegue en Render

Este repo incluye un `render.yaml` (Blueprint) que crea:

- Un **Web Service** (Node) que corre `npm run build` / `npm run start`, aplicando las
  migraciones de Prisma automáticamente en el build (`prisma migrate deploy`).
- Una base de datos **PostgreSQL** administrada, conectada automáticamente vía `DATABASE_URL`.

Pasos:

1. Sube este repo a GitHub (público o privado).
2. En [Render](https://dashboard.render.com), elige **New > Blueprint** y selecciona el repo.
3. Render detectará `render.yaml` y creará el Web Service + la base de datos.
4. Completa manualmente las variables marcadas como `sync: false`:
   - `NEXTAUTH_URL`: la URL pública que Render asigna a tu servicio (ej.
     `https://gestion-invitados.onrender.com`) — actualízala después del primer deploy.
   - `RESEND_API_KEY`: tu API key de Resend (opcional, solo si quieres enviar emails).
5. Vuelve a desplegar tras completar esas variables.

## Estructura del proyecto

```
prisma/schema.prisma          # modelo de datos (Organizer, Event, Guest)
src/app/(auth)/               # login / registro
src/app/dashboard/events/[eventId]/  # dashboard del evento, por pestañas (?tab=)
src/app/c/[token]/             # página pública de confirmación de asistencia (RSVP)
src/app/checkin/[checkinToken]/  # página pública de control de acceso (día del evento)
src/components/event-dashboard/  # paneles del dashboard (Invitados, Mesas, Accesos, ...)
src/lib/actions/               # server actions (eventos, invitados, RSVP, check-in)
src/lib/                        # auth, prisma client, email, whatsapp, plantillas, validaciones
```
