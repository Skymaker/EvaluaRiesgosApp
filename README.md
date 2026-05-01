# Aplicación de evaluación de riesgos

## Estructura del proyecto

- `frontend/`: aplicación React + Vite.
- `backend/`: API Node.js/Express conectada a PostgreSQL.

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

## Ejecución en local

```bash
npm run dev:backend
npm run dev:frontend
```

## Build frontend

```bash
npm run build:frontend
```