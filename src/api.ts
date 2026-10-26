// =====================================================================
//  Cliente de la API de ConectaPRO (Supabase: Auth + PostgREST RPC).
//  Sin librerías externas: usa fetch.
//  La URL y la clave pública se leen de /config.js
// =====================================================================

interface Config { supabaseUrl: string; anonKey: string }
const cfg: Config = (window as any).CONECTAPRO_CONFIG ?? { supabaseUrl: "", anonKey: "" };
const BASE = (cfg.supabaseUrl || "").replace(/\/+$/, "");
export const isConfigured = !!BASE && !!cfg.anonKey;

/** En el simulador cada pantalla (?as=u1…) guarda su propia sesión */
export const FRAME_AS = new URLSearchParams(window.location.search).get("as");
const KEY = "conectapro-sesion" + (FRAME_AS ? "-" + FRAME_AS : "");

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // segundos
  user: { id: string; email: string };
}

let session: Session | null = (() => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
})();

function saveSession(s: Session | null) {
  session = s;
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* */ }
}
export const getSession = () => session;

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

// Mensajes de error en español
function traducir(msg: string): string {
  const m = msg || "";
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos";
  if (/already registered|already exists/i.test(m)) return "Ya existe una cuenta con ese correo";
  if (/Password should be at least/i.test(m)) return "La contraseña debe tener al menos 6 caracteres";
  if (/Email not confirmed/i.test(m)) return "Debes confirmar tu correo antes de ingresar";
  if (/Unable to validate email|invalid format/i.test(m)) return "Correo electrónico no válido";
  if (/rate limit|too many/i.test(m)) return "Demasiados intentos. Espera un momento e inténtalo de nuevo";
  if (/JWT expired|invalid JWT/i.test(m)) return "Tu sesión expiró. Inicia sesión de nuevo";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "No hay conexión con el servidor. Revisa tu internet";
  return m.replace(/^ERROR:\s*/, "");
}

// La clave pública va en "apikey". Solo se envía "Authorization" con el token del usuario
// (las claves nuevas sb_publishable_… no son JWT y no deben ir como Bearer).
const headers = (token?: string): Record<string, string> => {
  const h: Record<string, string> = { "Content-Type": "application/json", apikey: cfg.anonKey };
  const bearer = token ?? (cfg.anonKey.startsWith("eyJ") ? cfg.anonKey : undefined);
  if (bearer) h.Authorization = `Bearer ${bearer}`;
  return h;
};

async function authCall(path: string, body: unknown): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/auth/v1/${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  } catch (e: any) { throw new ApiError(traducir(e.message), 0); }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(traducir(j.msg || j.error_description || j.message || j.error || "Error de autenticación"), res.status);
  return j;
}

function toSession(j: any): Session {
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at ?? Math.floor(Date.now() / 1000) + (j.expires_in ?? 3600), user: { id: j.user?.id, email: j.user?.email } };
}

export async function signIn(email: string, password: string) {
  const j = await authCall("token?grant_type=password", { email: email.trim().toLowerCase(), password });
  saveSession(toSession(j));
  return session!;
}

export async function signUp(email: string, password: string, data: Record<string, unknown> = {}) {
  const j = await authCall("signup", { email: email.trim().toLowerCase(), password, data });
  if (!j.access_token) {
    throw new ApiError("Tu cuenta fue creada, pero el servidor exige confirmar el correo. (Administrador: desactiva \"Confirm email\" en Supabase)");
  }
  saveSession(toSession(j));
  return session!;
}

let refreshing: Promise<boolean> | null = null;
async function refresh(): Promise<boolean> {
  if (!session?.refresh_token) return false;
  refreshing ??= (async () => {
    try {
      const j = await authCall("token?grant_type=refresh_token", { refresh_token: session!.refresh_token });
      saveSession(toSession(j));
      return true;
    } catch { saveSession(null); return false; }
    finally { setTimeout(() => (refreshing = null), 0); }
  })();
  return refreshing;
}

export async function signOut() {
  const tok = session?.access_token;
  saveSession(null);
  if (tok) fetch(`${BASE}/auth/v1/logout`, { method: "POST", headers: headers(tok) }).catch(() => {});
}

/** Llama a una función api_* de la base de datos */
export async function rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!isConfigured) throw new ApiError("La plataforma no está conectada a la base de datos (falta config.js)");
  if (session && session.expires_at * 1000 - Date.now() < 60_000) await refresh();
  const call = () => fetch(`${BASE}/rest/v1/rpc/${fn}`, { method: "POST", headers: headers(session?.access_token), body: JSON.stringify(args) });
  let res: Response;
  try { res = await call(); } catch (e: any) { throw new ApiError(traducir(e.message), 0); }
  if (res.status === 401 && session && (await refresh())) res = await call();
  const text = await res.text();
  const j = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(traducir(j?.message || j?.msg || `Error ${res.status}`), res.status);
  return j as T;
}
