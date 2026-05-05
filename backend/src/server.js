import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { Pool } from "pg";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const DATABASE_URL = process.env.DATABASE_URL;
const _frontendOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FRONTEND_ORIGINS = _frontendOrigins.length > 0 ? _frontendOrigins : ["http://localhost:5173"];
const HORAS_EXPIRACION_SESION = 24;
const APP_PUBLIC_NAME = process.env.APP_PUBLIC_NAME || "Sistema de Evaluación de Riesgos";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createMailTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function generateTemporaryPassword() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

async function sendAdminLockoutRecoveryEmail({ to, nombre, username, temporaryPassword }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = createMailTransport();
  const subject = `${APP_PUBLIC_NAME} — contraseña temporal`;
  const text = `Hola ${nombre},

Se han superado los intentos de inicio de sesión permitidos para la cuenta de administrador "${username}".

Su contraseña temporal es: ${temporaryPassword}

Al iniciar sesión deberá cambiar esta contraseña por una nueva.

Si no ha sido usted quien ha intentado acceder, contacte de inmediato con el responsable del sistema.`;

  const html = `<p>Hola <strong>${escapeHtml(nombre)}</strong>,</p>
<p>Se han superado los intentos de inicio de sesión permitidos para la cuenta de administrador <strong>${escapeHtml(username)}</strong>.</p>
<p>Su contraseña temporal es: <code style="font-size:1.1em">${escapeHtml(temporaryPassword)}</code></p>
<p>Al iniciar sesión deberá <strong>cambiar esta contraseña</strong> por una nueva.</p>
<p>Si no ha sido usted quien ha intentado acceder, contacte de inmediato con el responsable del sistema.</p>`;

  await transporter.sendMail({ from, to, subject, text, html });
}

async function sendManualUnlockTemporaryPasswordEmail({ to, nombre, username, temporaryPassword }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transporter = createMailTransport();
  const subject = `${APP_PUBLIC_NAME} — contraseña temporal`;
  const text = `Hola ${nombre},

Su cuenta "${username}" ha sido desbloqueada por un administrador.

Su contraseña temporal es: ${temporaryPassword}

Al iniciar sesión deberá cambiar esta contraseña por una nueva.`;

  const html = `<p>Hola <strong>${escapeHtml(nombre)}</strong>,</p>
<p>Su cuenta <strong>${escapeHtml(username)}</strong> ha sido desbloqueada por un administrador.</p>
<p>Su contraseña temporal es: <code style="font-size:1.1em">${escapeHtml(temporaryPassword)}</code></p>
<p>Al iniciar sesión deberá <strong>cambiar esta contraseña</strong> por una nueva.</p>`;

  await transporter.sendMail({ from, to, subject, text, html });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString: DATABASE_URL });

app.use(cors({ origin: FRONTEND_ORIGINS, credentials: true }));
app.use(express.json({ limit: "10mb" }));

const rolesValidos = new Set(["administrador", "administrativo", "tecnico"]);

function shapeUser(row) {
  return {
    id: row.id,
    username: row.nombre_usuario,
    nombre: row.nombre_completo,
    email: row.correo,
    role: row.rol,
    isBlocked: row.esta_bloqueado,
    failedAttempts: row.intentos_fallidos,
    mustChangePassword: row.requiere_cambio_contrasena,
    createdAt: row.creado_en,
    lastLogin: row.ultimo_acceso,
  };
}

function shapeWorkCenter(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion,
    ciudad: row.ciudad,
    responsable: row.responsable,
    telefono: row.telefono,
    email: row.correo,
    numeroEmpleados: row.numero_empleados,
    fechaCreacion: row.fecha_creacion,
    estructura: row.estructura ?? [],
    estructuraJerarquica: row.estructura_jerarquica ?? [],
    puestosTrabajo: row.puestos_trabajo ?? [],
  };
}

function shapeEvaluation(row) {
  return {
    id: row.id,
    workCenterId: row.centro_trabajo_id,
    workCenterName: row.nombre_centro_trabajo,
    fecha: row.fecha,
    evaluador: row.evaluador,
    cargo: row.cargo,
    riesgos: row.riesgos ?? [],
    riesgosEstructura: row.riesgos_estructura ?? [],
    riesgosPuestos: row.riesgos_puestos ?? [],
    observaciones: row.observaciones ?? "",
    estado: row.estado,
  };
}

function shapeJobCategory(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    actividades: row.actividades ?? [],
    riesgosGenericos: row.riesgos_genericos ?? [],
    episGenericos: row.epis_genericos ?? [],
    createdAt: row.creado_en,
  };
}

async function runMigrations() {
  await pool.query(`
    create table if not exists usuarios (
      id text primary key,
      nombre_usuario text not null unique,
      hash_contrasena text not null,
      nombre_completo text not null,
      correo text not null,
      rol text not null check (rol in ('administrador','administrativo','tecnico')),
      esta_bloqueado boolean not null default false,
      intentos_fallidos int not null default 0,
      requiere_cambio_contrasena boolean not null default false,
      creado_en text not null,
      ultimo_acceso text
    );
  `);
  await pool.query(`
    alter table usuarios
    add column if not exists requiere_cambio_contrasena boolean not null default false;
  `);

  await pool.query(`
    create table if not exists sesiones (
      token text primary key,
      usuario_id text not null references usuarios(id) on delete cascade,
      expira_en timestamptz not null
    );
  `);

  await pool.query(`
    create table if not exists centros_trabajo (
      id text primary key,
      nombre text not null,
      direccion text not null,
      ciudad text not null,
      responsable text not null,
      telefono text not null,
      correo text not null,
      numero_empleados int not null,
      fecha_creacion text not null,
      estructura jsonb not null default '[]'::jsonb,
      estructura_jerarquica jsonb not null default '[]'::jsonb,
      puestos_trabajo jsonb not null default '[]'::jsonb
    );
  `);

  await pool.query(`
    create table if not exists categorias_puestos (
      id text primary key,
      nombre text not null,
      descripcion text not null,
      actividades jsonb not null default '[]'::jsonb,
      riesgos_genericos jsonb not null default '[]'::jsonb,
      epis_genericos jsonb not null default '[]'::jsonb,
      creado_en text not null
    );
  `);

  await pool.query(`
    create table if not exists evaluaciones (
      id text primary key,
      centro_trabajo_id text not null references centros_trabajo(id) on delete cascade,
      nombre_centro_trabajo text not null,
      fecha text not null,
      evaluador text not null,
      cargo text not null,
      riesgos jsonb not null default '[]'::jsonb,
      riesgos_estructura jsonb not null default '[]'::jsonb,
      riesgos_puestos jsonb not null default '[]'::jsonb,
      observaciones text not null default '',
      estado text not null check (estado in ('pendiente','en_progreso','completada','revision'))
    );
  `);
}

async function ensureAdminUser() {
  const existing = await pool.query("select id from usuarios where nombre_usuario = 'admin' limit 1");
  if (existing.rowCount > 0) return;

  const passwordHash = await bcrypt.hash("admin123", 10);
  await pool.query(
    `insert into usuarios (
      id, nombre_usuario, hash_contrasena, nombre_completo, correo, rol, esta_bloqueado, intentos_fallidos, creado_en
    ) values ($1,$2,$3,$4,$5,$6,false,0,$7)`,
    [
      crypto.randomUUID(),
      "admin",
      passwordHash,
      "Administrador",
      "admin@empresa.com",
      "administrador",
      new Date().toISOString(),
    ],
  );
}

function createSessionToken() {
  return crypto.randomUUID() + crypto.randomUUID().replaceAll("-", "");
}

async function getSessionUser(req) {
  const token = req.headers["x-session-token"];
  if (!token || typeof token !== "string") return null;
  const result = await pool.query(
    `
      select u.* from sesiones s
      join usuarios u on u.id = s.usuario_id
      where s.token = $1 and s.expira_en > now()
      limit 1
    `,
    [token],
  );
  return result.rows[0] ?? null;
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(500).json({ status: "error", db: "down" });
  }
});

app.post("/autenticacion/iniciar-sesion", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
  }

  const result = await pool.query("select * from usuarios where nombre_usuario = $1 limit 1", [username]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ message: "Usuario no encontrado" });
  if (user.esta_bloqueado) return res.status(403).json({ message: "Usuario bloqueado" });

  const valid = await bcrypt.compare(password, user.hash_contrasena);
  if (!valid) {
    const attempts = user.intentos_fallidos + 1;
    const isBlocked = attempts >= 3;

    if (user.rol === "administrador" && isBlocked) {
      if (!smtpConfigured()) {
        await pool.query(
          "update usuarios set intentos_fallidos = $1, esta_bloqueado = true where id = $2",
          [attempts, user.id],
        );
        return res.status(503).json({
          code: "ADMIN_RECOVERY_SMTP_NOT_CONFIGURED",
          message:
            "El correo de recuperación no está configurado en el servidor. Contacte al administrador del sistema.",
        });
      }

      const temporaryPassword = generateTemporaryPassword();
      const tempHash = await bcrypt.hash(temporaryPassword, 10);
      const oldHash = user.hash_contrasena;
      const oldMustChange = Boolean(user.requiere_cambio_contrasena);

      await pool.query(
        `update usuarios set hash_contrasena = $1, intentos_fallidos = 0, esta_bloqueado = false, requiere_cambio_contrasena = true where id = $2`,
        [tempHash, user.id],
      );

      try {
        await sendAdminLockoutRecoveryEmail({
          to: user.correo,
          nombre: user.nombre_completo,
          username: user.nombre_usuario,
          temporaryPassword,
        });
      } catch (err) {
        console.error("Error enviando correo de recuperación:", err);
        await pool.query(
          `update usuarios set hash_contrasena = $1, intentos_fallidos = $2, esta_bloqueado = true, requiere_cambio_contrasena = $3 where id = $4`,
          [oldHash, attempts, oldMustChange, user.id],
        );
        return res.status(503).json({
          code: "ADMIN_RECOVERY_EMAIL_FAILED",
          message: "No se pudo enviar el correo de recuperación. Intente más tarde o contacte al soporte.",
        });
      }

      return res.status(401).json({
        code: "ADMIN_RECOVERY_EMAIL_SENT",
        message:
          "Se han superado los intentos permitidos. Se ha enviado una contraseña temporal a su correo. Deberá cambiarla al iniciar sesión.",
      });
    }

    await pool.query(
      "update usuarios set intentos_fallidos = $1, esta_bloqueado = $2 where id = $3",
      [attempts, isBlocked, user.id],
    );
    return res.status(401).json({
      message: isBlocked
        ? "Usuario bloqueado por múltiples intentos fallidos."
        : `Contraseña incorrecta. Intento ${attempts} de 3.`,
    });
  }

  const nowIso = new Date().toISOString();
  await pool.query(
    "update usuarios set intentos_fallidos = 0, esta_bloqueado = false, ultimo_acceso = $1 where id = $2",
    [nowIso, user.id],
  );

  const token = createSessionToken();
  await pool.query(
    "insert into sesiones (token, usuario_id, expira_en) values ($1,$2,now() + ($3 || ' hours')::interval)",
    [token, user.id, String(HORAS_EXPIRACION_SESION)],
  );

  const updated = await pool.query("select * from usuarios where id = $1", [user.id]);
  return res.json({ user: shapeUser(updated.rows[0]), sessionToken: token });
});

app.post("/autenticacion/cerrar-sesion", async (req, res) => {
  const token = req.headers["x-session-token"];
  if (token && typeof token === "string") {
    await pool.query("delete from sesiones where token = $1", [token]);
  }
  res.json({ ok: true });
});

app.get("/autenticacion/yo", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ message: "No autenticado" });
  res.json({ user: shapeUser(user) });
});

app.get("/usuarios", async (_req, res) => {
  const result = await pool.query("select * from usuarios order by creado_en asc");
  res.json(result.rows.map(shapeUser));
});

app.post("/usuarios", async (req, res) => {
  const { id, username, password, nombre, email, role, isBlocked = false, failedAttempts = 0, createdAt } = req.body ?? {};
  if (!username || !password || !nombre || !email || !rolesValidos.has(role)) {
    return res.status(400).json({ message: "Datos inválidos para crear usuario" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = id || crypto.randomUUID();
  const created = createdAt || new Date().toISOString();
  await pool.query(
    `insert into usuarios (id, nombre_usuario, hash_contrasena, nombre_completo, correo, rol, esta_bloqueado, intentos_fallidos, creado_en, ultimo_acceso)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [userId, username, passwordHash, nombre, email, role, isBlocked, failedAttempts, created, null],
  );
  const user = await pool.query("select * from usuarios where id = $1", [userId]);
  res.status(201).json(shapeUser(user.rows[0]));
});

app.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password, nombre, email, role, isBlocked, failedAttempts, createdAt, lastLogin } = req.body ?? {};
  if (!username || !nombre || !email || !rolesValidos.has(role)) {
    return res.status(400).json({ message: "Datos inválidos para actualizar usuario" });
  }
  const existing = await pool.query("select * from usuarios where id = $1", [id]);
  if (existing.rowCount === 0) return res.status(404).json({ message: "Usuario no encontrado" });
  const passwordHash = password ? await bcrypt.hash(password, 10) : existing.rows[0].hash_contrasena;
  await pool.query(
    `update usuarios
     set nombre_usuario = $1, hash_contrasena = $2, nombre_completo = $3, correo = $4, rol = $5, esta_bloqueado = $6, intentos_fallidos = $7, creado_en = $8, ultimo_acceso = $9
     where id = $10`,
    [
      username,
      passwordHash,
      nombre,
      email,
      role,
      Boolean(isBlocked),
      Number(failedAttempts || 0),
      createdAt || existing.rows[0].creado_en,
      lastLogin || existing.rows[0].ultimo_acceso,
      id,
    ],
  );
  const updated = await pool.query("select * from usuarios where id = $1", [id]);
  res.json(shapeUser(updated.rows[0]));
});

app.post("/usuarios/:id/cambiar-contrasena", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Contraseña inválida" });
  }
  const existing = await pool.query("select * from usuarios where id = $1", [id]);
  if (existing.rowCount === 0) return res.status(404).json({ message: "Usuario no encontrado" });
  const valid = await bcrypt.compare(currentPassword, existing.rows[0].hash_contrasena);
  if (!valid) {
    return res.status(401).json({ message: "La contraseña actual es incorrecta" });
  }
  const sameAsPrevious = await bcrypt.compare(newPassword, existing.rows[0].hash_contrasena);
  if (sameAsPrevious) {
    return res.status(400).json({ message: "La nueva contraseña no puede ser igual a la anterior" });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "update usuarios set hash_contrasena = $1, requiere_cambio_contrasena = false where id = $2",
    [passwordHash, id],
  );
  res.json({ ok: true });
});

app.post("/usuarios/:id/desbloquear", async (req, res) => {
  const { id } = req.params;
  const { temporaryPassword } = req.body ?? {};
  if (!temporaryPassword || typeof temporaryPassword !== "string" || temporaryPassword.length < 6) {
    return res.status(400).json({ message: "La contraseña temporal debe tener al menos 6 caracteres" });
  }

  const existing = await pool.query("select * from usuarios where id = $1", [id]);
  if (existing.rowCount === 0) return res.status(404).json({ message: "Usuario no encontrado" });
  const user = existing.rows[0];

  if (!smtpConfigured()) {
    return res.status(503).json({
      message:
        "El correo de recuperación no está configurado en el servidor. Contacte al administrador del sistema.",
    });
  }

  const previousHash = user.hash_contrasena;
  const previousMustChange = Boolean(user.requiere_cambio_contrasena);
  const previousBlocked = Boolean(user.esta_bloqueado);
  const previousAttempts = Number(user.intentos_fallidos || 0);
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  await pool.query(
    "update usuarios set esta_bloqueado = false, intentos_fallidos = 0, hash_contrasena = $1, requiere_cambio_contrasena = true where id = $2",
    [passwordHash, id],
  );
  try {
    await sendManualUnlockTemporaryPasswordEmail({
      to: user.correo,
      nombre: user.nombre_completo,
      username: user.nombre_usuario,
      temporaryPassword,
    });
  } catch (err) {
    console.error("Error enviando correo de desbloqueo manual:", err);
    await pool.query(
      "update usuarios set esta_bloqueado = $1, intentos_fallidos = $2, hash_contrasena = $3, requiere_cambio_contrasena = $4 where id = $5",
      [previousBlocked, previousAttempts, previousHash, previousMustChange, id],
    );
    return res.status(503).json({
      message: "No se pudo enviar la contraseña temporal por correo. Intente más tarde o contacte al soporte.",
    });
  }

  const updatedUser = await pool.query("select * from usuarios where id = $1", [id]);
  res.json({
    user: shapeUser(updatedUser.rows[0]),
    message: `Usuario desbloqueado. Se ha enviado la contraseña temporal a ${user.correo}.`,
  });
});

app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("delete from usuarios where id = $1", [id]);
  res.json({ ok: true });
});

app.get("/centros-trabajo", async (_req, res) => {
  const result = await pool.query("select * from centros_trabajo order by fecha_creacion asc");
  res.json(result.rows.map(shapeWorkCenter));
});

app.put("/centros-trabajo/:id", async (req, res) => {
  const { id } = req.params;
  const center = req.body ?? {};
  await pool.query(
    `insert into centros_trabajo (
      id, nombre, direccion, ciudad, responsable, telefono, correo, numero_empleados, fecha_creacion,
      estructura, estructura_jerarquica, puestos_trabajo
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb)
    on conflict (id) do update set
      nombre = excluded.nombre,
      direccion = excluded.direccion,
      ciudad = excluded.ciudad,
      responsable = excluded.responsable,
      telefono = excluded.telefono,
      correo = excluded.correo,
      numero_empleados = excluded.numero_empleados,
      fecha_creacion = excluded.fecha_creacion,
      estructura = excluded.estructura,
      estructura_jerarquica = excluded.estructura_jerarquica,
      puestos_trabajo = excluded.puestos_trabajo`,
    [
      id,
      center.nombre,
      center.direccion,
      center.ciudad,
      center.responsable,
      center.telefono,
      center.email,
      Number(center.numeroEmpleados || 0),
      center.fechaCreacion,
      JSON.stringify(center.estructura || []),
      JSON.stringify(center.estructuraJerarquica || []),
      JSON.stringify(center.puestosTrabajo || []),
    ],
  );
  const updated = await pool.query("select * from centros_trabajo where id = $1", [id]);
  res.json(shapeWorkCenter(updated.rows[0]));
});

app.delete("/centros-trabajo/:id", async (req, res) => {
  await pool.query("delete from centros_trabajo where id = $1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/evaluaciones", async (_req, res) => {
  const result = await pool.query("select * from evaluaciones order by fecha desc");
  res.json(result.rows.map(shapeEvaluation));
});

app.put("/evaluaciones/:id", async (req, res) => {
  const { id } = req.params;
  const evaluation = req.body ?? {};
  await pool.query(
    `insert into evaluaciones (
      id, centro_trabajo_id, nombre_centro_trabajo, fecha, evaluador, cargo, riesgos,
      riesgos_estructura, riesgos_puestos, observaciones, estado
    ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11)
    on conflict (id) do update set
      centro_trabajo_id = excluded.centro_trabajo_id,
      nombre_centro_trabajo = excluded.nombre_centro_trabajo,
      fecha = excluded.fecha,
      evaluador = excluded.evaluador,
      cargo = excluded.cargo,
      riesgos = excluded.riesgos,
      riesgos_estructura = excluded.riesgos_estructura,
      riesgos_puestos = excluded.riesgos_puestos,
      observaciones = excluded.observaciones,
      estado = excluded.estado`,
    [
      id,
      evaluation.workCenterId,
      evaluation.workCenterName,
      evaluation.fecha,
      evaluation.evaluador,
      evaluation.cargo,
      JSON.stringify(evaluation.riesgos || []),
      JSON.stringify(evaluation.riesgosEstructura || []),
      JSON.stringify(evaluation.riesgosPuestos || []),
      evaluation.observaciones || "",
      evaluation.estado,
    ],
  );
  const updated = await pool.query("select * from evaluaciones where id = $1", [id]);
  res.json(shapeEvaluation(updated.rows[0]));
});

app.delete("/evaluaciones/:id", async (req, res) => {
  await pool.query("delete from evaluaciones where id = $1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/categorias-puestos", async (_req, res) => {
  const result = await pool.query("select * from categorias_puestos order by creado_en asc");
  res.json(result.rows.map(shapeJobCategory));
});

app.put("/categorias-puestos/:id", async (req, res) => {
  const { id } = req.params;
  const category = req.body ?? {};
  await pool.query(
    `insert into categorias_puestos (
      id, nombre, descripcion, actividades, riesgos_genericos, epis_genericos, creado_en
    ) values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7)
    on conflict (id) do update set
      nombre = excluded.nombre,
      descripcion = excluded.descripcion,
      actividades = excluded.actividades,
      riesgos_genericos = excluded.riesgos_genericos,
      epis_genericos = excluded.epis_genericos,
      creado_en = excluded.creado_en`,
    [
      id,
      category.nombre,
      category.descripcion,
      JSON.stringify(category.actividades || []),
      JSON.stringify(category.riesgosGenericos || []),
      JSON.stringify(category.episGenericos || []),
      category.createdAt || new Date().toISOString(),
    ],
  );
  const updated = await pool.query("select * from categorias_puestos where id = $1", [id]);
  res.json(shapeJobCategory(updated.rows[0]));
});

app.delete("/categorias-puestos/:id", async (req, res) => {
  await pool.query("delete from categorias_puestos where id = $1", [req.params.id]);
  res.json({ ok: true });
});

app.get("/sistema/exportar", async (_req, res) => {
  const [users, workCenters, evaluations, jobCategories] = await Promise.all([
    pool.query("select * from usuarios order by creado_en asc"),
    pool.query("select * from centros_trabajo order by fecha_creacion asc"),
    pool.query("select * from evaluaciones order by fecha desc"),
    pool.query("select * from categorias_puestos order by creado_en asc"),
  ]);
  res.json({
    version: "2.0",
    exportDate: new Date().toISOString(),
    users: users.rows.map(shapeUser),
    workCenters: workCenters.rows.map(shapeWorkCenter),
    evaluations: evaluations.rows.map(shapeEvaluation),
    jobCategories: jobCategories.rows.map(shapeJobCategory),
  });
});

app.post("/sistema/importar", async (req, res) => {
  const { users = [], workCenters = [], evaluations = [], jobCategories = [] } = req.body ?? {};
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("delete from sesiones");
    await client.query("delete from evaluaciones");
    await client.query("delete from centros_trabajo");
    await client.query("delete from categorias_puestos");
    await client.query("delete from usuarios");

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password || "admin123", 10);
      await client.query(
        `insert into usuarios (id, nombre_usuario, hash_contrasena, nombre_completo, correo, rol, esta_bloqueado, intentos_fallidos, creado_en, ultimo_acceso)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          user.id || crypto.randomUUID(),
          user.username,
          passwordHash,
          user.nombre,
          user.email,
          rolesValidos.has(user.role) ? user.role : "tecnico",
          Boolean(user.isBlocked),
          Number(user.failedAttempts || 0),
          user.createdAt || new Date().toISOString(),
          user.lastLogin || null,
        ],
      );
    }

    for (const center of workCenters) {
      await client.query(
        `insert into centros_trabajo (
          id, nombre, direccion, ciudad, responsable, telefono, correo, numero_empleados, fecha_creacion,
          estructura, estructura_jerarquica, puestos_trabajo
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb)`,
        [
          center.id,
          center.nombre,
          center.direccion,
          center.ciudad,
          center.responsable,
          center.telefono,
          center.email,
          Number(center.numeroEmpleados || 0),
          center.fechaCreacion,
          JSON.stringify(center.estructura || []),
          JSON.stringify(center.estructuraJerarquica || []),
          JSON.stringify(center.puestosTrabajo || []),
        ],
      );
    }

    for (const category of jobCategories) {
      await client.query(
        `insert into categorias_puestos (id, nombre, descripcion, actividades, riesgos_genericos, epis_genericos, creado_en)
         values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7)`,
        [
          category.id,
          category.nombre,
          category.descripcion,
          JSON.stringify(category.actividades || []),
          JSON.stringify(category.riesgosGenericos || []),
          JSON.stringify(category.episGenericos || []),
          category.createdAt || new Date().toISOString(),
        ],
      );
    }

    for (const evaluation of evaluations) {
      await client.query(
        `insert into evaluaciones (
          id, centro_trabajo_id, nombre_centro_trabajo, fecha, evaluador, cargo, riesgos, riesgos_estructura, riesgos_puestos, observaciones, estado
        ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11)`,
        [
          evaluation.id,
          evaluation.workCenterId,
          evaluation.workCenterName,
          evaluation.fecha,
          evaluation.evaluador,
          evaluation.cargo,
          JSON.stringify(evaluation.riesgos || []),
          JSON.stringify(evaluation.riesgosEstructura || []),
          JSON.stringify(evaluation.riesgosPuestos || []),
          evaluation.observaciones || "",
          evaluation.estado || "pendiente",
        ],
      );
    }

    await ensureAdminUser();
    await client.query("commit");
    res.json({ ok: true });
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({ message: "No se pudo importar la información", error: String(error) });
  } finally {
    client.release();
  }
});

app.post("/sistema/reiniciar", async (_req, res) => {
  await pool.query("delete from sesiones");
  await pool.query("delete from evaluaciones");
  await pool.query("delete from centros_trabajo");
  await pool.query("delete from categorias_puestos");
  await pool.query("delete from usuarios");
  await ensureAdminUser();
  res.json({ ok: true });
});

async function start() {
  await runMigrations();
  await ensureAdminUser();
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
