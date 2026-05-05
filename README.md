# Evaluapp — Evaluación de riesgos laborales

## Estructura del proyecto

- `frontend/`: aplicación React + Vite.
- `backend/`: API Node.js/Express conectada a PostgreSQL.


## Requisitos

- Node.js 20 LTS o superior.
- PostgreSQL con una base de datos creada (vacía). La URL debe coincidir con `DATABASE_URL` en `backend/.env`.

## Instalación

Desde la raíz del repositorio:

```bash
npm --prefix frontend install
npm --prefix backend install
```

No hace falta `npm install` en la raíz salvo que quieras usar los scripts del `package.json` del workspace desde esa carpeta.

## Base de datos

Al arrancar el backend se ejecutan migraciones automáticas (creación de tablas si no existen). Solo necesitas crear la base en PostgreSQL y configurar `DATABASE_URL`.

Si no existe aún un usuario `admin`, se crea uno inicial: usuario `admin`, contraseña `admin123`, correo `admin@empresa.com`. **Cámbiala en cuanto el entorno deje de ser local o de prueba.**

## Variables de entorno backend

1. Copia `backend/.env.example` en `backend/.env`.
2. Ajusta al menos:
   - `DATABASE_URL`
   - `PORT` (por defecto en el ejemplo: `4000`)
   - `FRONTEND_ORIGIN` (debe coincidir con la URL del frontend; en local suele ser `http://localhost:5173`)
3. Para el envío de correos: sin SMTP configurado no funcionan la recuperación automática del administrador tras 3 intentos fallidos ni el envío de contraseñas temporales desde `Gestión`. Configura:
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
SMTP_PASS=abcdefghijklmnop
SMTP_FROM="Sistema de Evaluación <tu.correo@gmail.com>"
APP_PUBLIC_NAME=Sistema de Evaluación de Riesgos Laborales
```

> Para Gmail usa una contraseña de aplicación (App Password), no la contraseña de la cuenta. Pégala **sin espacios** (16 caracteres).

## Ejecución en local

Ejecuta **en dos terminales** desde la raíz del repositorio:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

El backend escucha en `http://localhost:<PORT>` (p. ej. 4000) y Vite en `http://localhost:5173`.

Otros scripts útiles en la raíz: `npm run dev` (solo frontend), `npm run preview:frontend` (previsualizar el build), `npm run check:backend` (comprobación sintáctica del servidor).

## Flujo de desbloqueo y contraseña temporal

- Si un **administrador** falla 3 veces el login, el sistema genera una contraseña temporal y la envía por correo (requiere SMTP).
- En `Gestión`, un administrador puede desbloquear un usuario bloqueado, editar la contraseña temporal sugerida y enviarla por email.
- La contraseña temporal exige cambio obligatorio al siguiente inicio de sesión.

## Build y ejecución tipo producción (referencia)

Frontend:

```bash
npm run build:frontend
```

Backend (tras configurar `NODE_ENV` y variables según tu despliegue):

```bash
npm --prefix backend run start
```

Sirve los estáticos del frontend con tu servidor web o plataforma habitual apuntando al directorio `frontend/dist`.