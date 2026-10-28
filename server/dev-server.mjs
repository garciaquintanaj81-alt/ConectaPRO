// =====================================================================
//  Servidor de DESARROLLO local de ConectaPRO.
//  Emula los dos servicios de Supabase que usa la app, sobre un
//  PostgreSQL local, para poder probar todo sin internet:
//    · /auth/v1/*        registro, inicio de sesión y tokens (JWT)
//    · /rest/v1/rpc/:fn  llamadas a las funciones api_* de la base de datos
//  Además sirve la carpeta /docs (la app compilada).
//
//  Uso:  node server/dev-server.mjs   (requiere psql y la base "conectapro")
//  Variables: PGHOST, PGUSER, PGDATABASE, PORT
// =====================================================================
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const STATIC = path.join(ROOT, "docs");
const PORT = +(process.env.PORT || 8787);
const PG = ["-h", process.env.PGHOST || "/tmp", "-U", process.env.PGUSER || "postgres", "-d", process.env.PGDATABASE || "conectapro"];
const SECRET = process.env.JWT_SECRET || "conectapro-dev-secret";

// ---------------------------------------------------------------- psql
function psql(sql) {
  return new Promise((resolve, reject) => {
    const p = spawn("psql", [...PG, "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(err))));
    p.stdin.end(sql);
  });
}
const lit = (s) => { let t = "q" + crypto.randomBytes(4).toString("hex"); return `$${t}$${s}$${t}$`; };

// Firma de las funciones api_* (nombres y tipos de parámetros)
let SIGS = null;
async function signatures() {
  if (SIGS) return SIGS;
  const rows = await psql(`select p.proname || '|' || coalesce(array_to_string(p.proargnames, ','), '') || '|' ||
      coalesce((select string_agg(format_type(t, null), ',' order by o) from unnest(p.proargtypes) with ordinality u(t, o)), '')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'api\\_%'`);
  SIGS = {};
  for (const line of rows.trim().split("\n")) {
    const [name, names, types] = line.split("|");
    SIGS[name] = { names: names ? names.split(",") : [], types: types ? types.split(",") : [] };
  }
  return SIGS;
}

// ---------------------------------------------------------------- JWT
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function signJwt(payload) {
  const h = b64({ alg: "HS256", typ: "JWT" }), b = b64(payload);
  return `${h}.${b}.${crypto.createHmac("sha256", SECRET).update(`${h}.${b}`).digest("base64url")}`;
}
function verifyJwt(tok) {
  const [h, b, s] = (tok || "").split(".");
  if (!s) return null;
  if (crypto.createHmac("sha256", SECRET).update(`${h}.${b}`).digest("base64url") !== s) return null;
  const p = JSON.parse(Buffer.from(b, "base64url").toString());
  return p.exp * 1000 > Date.now() ? p : null;
}
const refreshTokens = new Map();
function session(user) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const refresh = crypto.randomBytes(24).toString("hex");
  refreshTokens.set(refresh, user);
  return {
    access_token: signJwt({ sub: user.id, email: user.email, role: "authenticated", exp }),
    token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: refresh,
    user: { id: user.id, email: user.email, role: "authenticated" },
  };
}
const hash = (pw, salt = crypto.randomBytes(12).toString("hex")) => salt + ":" + crypto.scryptSync(pw, salt, 32).toString("hex");
const checkHash = (pw, h) => { const [salt] = h.split(":"); return hash(pw, salt) === h; };

// ---------------------------------------------------------------- HTTP
const send = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
};
const readBody = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { r(d ? JSON.parse(d) : {}); } catch { r({}); } }); });

async function auth(req, res, url) {
  const body = await readBody(req);
  const ep = url.pathname.replace("/auth/v1/", "");
  if (ep === "signup") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return send(res, 400, { code: 400, error_code: "validation_failed", msg: "Unable to validate email address: invalid format" });
    if (String(body.password || "").length < 6) return send(res, 422, { code: 422, error_code: "weak_password", msg: "Password should be at least 6 characters." });
    const exists = (await psql(`select count(*) from auth.users where email = ${lit(email)}`)).trim();
    if (exists !== "0") return send(res, 422, { code: 422, error_code: "user_already_exists", msg: "User already registered" });
    const id = (await psql(`insert into auth.users (email, encrypted_password, raw_user_meta_data) values (${lit(email)}, ${lit(hash(body.password))}, ${lit(JSON.stringify(body.data || {}))}::jsonb) returning id`)).trim();
    return send(res, 200, session({ id, email }));
  }
  if (ep === "token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "password") {
      const email = String(body.email || "").trim().toLowerCase();
      const row = (await psql(`select id || '|' || encrypted_password from auth.users where email = ${lit(email)}`)).trim();
      const [id, h] = row.split("|");
      if (!id || !checkHash(String(body.password || ""), h)) return send(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
      return send(res, 200, session({ id, email }));
    }
    if (grant === "refresh_token") {
      const u = refreshTokens.get(body.refresh_token);
      if (!u) return send(res, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
      refreshTokens.delete(body.refresh_token);
      return send(res, 200, session(u));
    }
  }
  if (ep === "logout") return send(res, 204, "");
  if (ep === "user") {
    const p = verifyJwt((req.headers.authorization || "").replace(/^Bearer /, ""));
    return p ? send(res, 200, { id: p.sub, email: p.email }) : send(res, 401, { msg: "invalid JWT" });
  }
  send(res, 404, { msg: "not found" });
}

async function rpc(req, res, fn) {
  const sigs = await signatures();
  const sig = sigs[fn];
  if (!sig) return send(res, 404, { code: "PGRST202", message: `Could not find the function public.${fn}` });
  const body = req.method === "GET" ? Object.fromEntries(new URL(req.url, "http://x").searchParams) : await readBody(req);
  const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
  const claims = verifyJwt(tok);
  const role = claims ? "authenticated" : "anon";
  if (tok && !claims && tok.split(".").length === 3 && JSON.parse(Buffer.from(tok.split(".")[1], "base64url").toString()).role !== "anon")
    return send(res, 401, { code: "PGRST301", message: "JWT expired" });
  const args = Object.keys(body).filter((k) => sig.names.includes(k)).map((k) => {
    const t = sig.types[sig.names.indexOf(k)];
    return t === "jsonb" || t === "json" ? `${k} => (a.j->'${k}')` : `${k} => (a.j->>'${k}')::${t}`;
  });
  const sql = `begin;
set local role ${role};
select set_config('request.jwt.claims', ${lit(JSON.stringify(claims || { role: "anon" }))}, true);
with a as (select ${lit(JSON.stringify(body))}::jsonb as j) select coalesce(to_jsonb(public.${fn}(${args.join(", ")}))::text, 'null') from a;
commit;`;
  try {
    const out = (await psql(sql)).trim().split("\n").filter(Boolean).pop() ?? "null";
    send(res, 200, out);
  } catch (e) {
    const m = String(e.message).match(/ERROR:\s+(.*)/);
    const msg = m ? m[1].trim() : String(e.message);
    send(res, msg.includes("permission denied") ? 401 : 400, { code: "P0001", message: msg, details: null, hint: null });
  }
}

// ---------------------------------------------------------------- Storage
// Imita Supabase Storage para el bucket "fotos-perfil" (mismas reglas que supabase/storage.sql):
// cada usuario solo puede subir y borrar dentro de su carpeta <id de usuario>/
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(ROOT, ".storage-local");
const BUCKETS = { "fotos-perfil": { max: 2 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] } };
const readRaw = (req) => new Promise((r) => { const parts = []; req.on("data", (c) => parts.push(c)); req.on("end", () => r(Buffer.concat(parts))); });
const safeKey = (k) => /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_.-]+)+$/.test(k) && !k.includes("..");

async function storage(req, res, url) {
  const rest = decodeURIComponent(url.pathname.replace("/storage/v1/object/", ""));
  if (req.method === "GET" && rest.startsWith("public/")) {
    const key = rest.slice(7);
    const f = path.join(STORAGE_DIR, key);
    if (!safeKey(key) || !fs.existsSync(f)) return send(res, 404, { statusCode: "404", error: "not_found", message: "Object not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream", "Access-Control-Allow-Origin": "*" });
    return fs.createReadStream(f).pipe(res);
  }
  const claims = verifyJwt((req.headers.authorization || "").replace(/^Bearer /, ""));
  if (!claims) return send(res, 403, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" });
  const [bucket, ...parts] = rest.split("/");
  const cfg = BUCKETS[bucket];
  if (!cfg) return send(res, 404, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
  if (req.method === "POST" || req.method === "PUT") {
    const key = parts.join("/");
    if (!safeKey(bucket + "/" + key) || parts[0] !== claims.sub)
      return send(res, 403, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" });
    const type = String(req.headers["content-type"] || "").split(";")[0];
    if (!cfg.types.includes(type)) return send(res, 415, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${type} is not supported` });
    const body = await readRaw(req);
    if (body.length > cfg.max) return send(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
    const f = path.join(STORAGE_DIR, bucket, key);
    if (fs.existsSync(f)) return send(res, 409, { statusCode: "409", error: "Duplicate", message: "The resource already exists" });
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, body);
    return send(res, 200, { Key: `${bucket}/${key}` });
  }
  if (req.method === "DELETE") {
    const { prefixes = [] } = await readBody(req);
    const removed = [];
    for (const k of prefixes) {
      if (!safeKey(bucket + "/" + k) || k.split("/")[0] !== claims.sub) continue;   // la política solo permite borrar lo propio
      const f = path.join(STORAGE_DIR, bucket, k);
      if (fs.existsSync(f)) { fs.unlinkSync(f); removed.push({ name: k, bucket_id: bucket }); }
    }
    return send(res, 200, removed);
  }
  send(res, 405, { message: "Method not allowed" });
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json" };
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "OPTIONS") return send(res, 204, "");
    if (url.pathname.startsWith("/auth/v1/")) return await auth(req, res, url);
    if (url.pathname.startsWith("/rest/v1/rpc/")) return await rpc(req, res, url.pathname.split("/").pop());
    if (url.pathname.startsWith("/storage/v1/object/")) return await storage(req, res, url);
    let f = path.join(STATIC, decodeURIComponent(url.pathname));
    if (!f.startsWith(STATIC)) return send(res, 403, {});
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (url.pathname === "/config.js") {
      // En local la app usa este mismo servidor como "Supabase"
      res.writeHead(200, { "Content-Type": "text/javascript" });
      const vapid = (fs.readFileSync(path.join(ROOT, "public/config.js"), "utf8").match(/vapidPublicKey:\s*"([^"]+)"/) || [])[1] || "";
      return res.end(`window.CONECTAPRO_CONFIG = { supabaseUrl: location.origin, anonKey: "local-dev", vapidPublicKey: "${vapid}" };`);
    }
    if (!fs.existsSync(f)) f = path.join(STATIC, "index.html");
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  } catch (e) {
    send(res, 500, { message: String(e.message || e) });
  }
}).listen(PORT, () => console.log(`ConectaPRO (desarrollo) en http://localhost:${PORT}`));
