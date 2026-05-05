# Aplicación de evaluación de riesgos

## Estructura del proyecto

- `frontend/`: aplicación React + Vite.
- `backend/`: API Node.js/Express conectada a PostgreSQL.

## Manual de usuario

Fuentes Markdown y generador del documento Word en [`docs/manual/README.md`](docs/manual/README.md). El archivo generado es `docs/manual/Evaluapp-Manual-de-Usuario.docx`.

## Requisitos

- Node.js LTS.
- Una base de datos PostgreSQL disponible.

## Instalación

```bash
npm --prefix frontend install
npm --prefix backend install
```

## Variables de entorno backend

1. Copia `backend/.env.example` en `backend/.env`.
2. Ajusta al menos:
   - `DATABASE_URL`
   - `PORT`
   - `FRONTEND_ORIGIN`
3. Para envío de correos (recomendado en todos los entornos no-demo), configura también:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `APP_PUBLIC_NAME`

### Ejemplo SMTP con Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu.correo@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="Sistema de Evaluación <tu.correo@gmail.com>"
APP_PUBLIC_NAME=Sistema de Evaluación de Riesgos Laborales
```

> Para Gmail usa una contraseña de aplicación (App Password), no la contraseña normal de la cuenta.

## Ejecución en local

```bash
npm run dev:backend
npm run dev:frontend
```

## Flujo de desbloqueo y contraseña temporal

- Si un **administrador** falla 3 veces el login, el sistema genera una contraseña temporal y la envía por correo.
- En `Gestión`, un administrador puede desbloquear un usuario bloqueado, editar la contraseña temporal sugerida y enviarla por email.
- La contraseña temporal exige cambio obligatorio al siguiente inicio de sesión.

## Build frontend

```bash
npm run build:frontend
```
