function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.replace(/\/+$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }
  return "";
}

const API_BASE_URL = resolveApiBaseUrl();
export const getApiBaseUrl = () => API_BASE_URL;

/** Códigos de error en POST /autenticacion/iniciar-sesion (recuperación admin). */
export const AuthLoginErrorCode = {
  AdminRecoveryEmailSent: "ADMIN_RECOVERY_EMAIL_SENT",
  AdminRecoverySmtpNotConfigured: "ADMIN_RECOVERY_SMTP_NOT_CONFIGURED",
  AdminRecoveryEmailFailed: "ADMIN_RECOVERY_EMAIL_FAILED",
} as const;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let sessionToken: string | null = null;

export const setSessionToken = (token: string | null) => {
  sessionToken = token;
};

export const getSessionToken = () => sessionToken;

export async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (sessionToken) {
    headers.set("x-session-token", sessionToken);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let code: string | undefined;
    try {
      const errorData = await response.json();
      message = errorData.message || message;
      if (typeof errorData.code === "string") code = errorData.code;
    } catch {
      // Ignore parse errors and keep fallback message.
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return response.json();
}
