// =====================================================================
//  Estado global de ConectaPRO conectado a la base de datos.
//  - Al iniciar: carga el catálogo y, si hay sesión, el estado del usuario
//    (api_estado). Se actualiza cada pocos segundos para recibir
//    notificaciones, postulaciones y mensajes en tiempo real.
//  - Cada acción llama a una función api_* y luego refresca el estado.
// =====================================================================
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as api from "./api";
import {
  Account, Address, ClientInfo, DEMO_PASSWORD, PaymentMethod, PayMethod, Provider, ServiceId, setCatalog,
} from "./data";

export type Mode = "cliente" | "proveedor";
export type Status = "buscando" | "en_curso" | "completada" | "cancelada";

export interface Applicant { providerId: string; price: number; at: number; note?: string }
export interface Agreement { date: string; time: string; price: number; code: string; signedAt: number; extendedDays?: number }
export interface Rating { stars: number; comment: string; at: number }
export interface Trace { total: number; byCategory: number; byCoverage: number; bySchedule: number }

export interface Request {
  id: string;
  ownerAccountId?: string;
  clientKey: string;
  title: string;
  desc: string;
  service: ServiceId;
  location: { lat: number; lng: number; label: string };
  departamento: string;
  municipio: string;
  municipioNombre: string;
  departamentoNombre: string;
  direccion: string;
  payment: PaymentMethod;
  wantsProposals: boolean;
  createdAt: number;
  status: Status;
  matched: string[];
  applicants: Applicant[];
  declinedBy: string[];
  providerId?: string;
  agreement?: Agreement;
  rating?: Rating;
  clientRating?: Rating;
  finishedAt?: number;
  photo?: string;
  punctualityPenalty?: boolean;
  trace?: Trace;
  gps?: boolean;
  gpsPrecision?: number | null;
}

export interface Message { id: string; from: "me" | "peer" | "system"; text?: string; image?: string; at: number }
export interface Conversation { id: string; peerKey: string; peerUserId: string; peerName: string; peerPhoto?: string; peerRole: string; messages: Message[]; unread: number }
export interface Notification { id: string; text: string; at: number; read: boolean; link?: string; kind: "match" | "agreement" | "rating" | "ia" | "info" | "strike" | "message" }
export interface Barter { id: string; offers: ServiceId; needs: ServiceId; note: string }

interface ServerState {
  cuenta: Account;
  modo: Mode;
  puntos: number;
  faltas: number;
  prefs: { push: boolean; email: boolean; ia: boolean };
  proveedor: Provider | null;
  solicitudes: Request[];
  oportunidades: { r: Request; distance: number }[];
  trabajos: Request[];
  proveedores: Record<string, Provider>;
  clientes: Record<string, ClientInfo>;
  conversaciones: Conversation[];
  notificaciones: Notification[];
  direcciones: Address[];
  metodosPago: PayMethod[];
  misTrueques: Barter[];
  serverTime: number;
}

export type Phase = "cargando" | "sin-config" | "error" | "listo";
export const LIVE = !!api.FRAME_AS;
const DEMO_EMAILS: Record<string, string> = { u1: "daniela@conectapro.co", u2: "carlos@conectapro.co", u3: "juan@conectapro.co", u4: "andres@conectapro.co" };

type Ctx = ReturnType<typeof useStoreValue>;
const StoreCtx = createContext<Ctx | null>(null);

function useStoreValue() {
  const [phase, setPhase] = useState<Phase>(api.isConfigured ? "cargando" : "sin-config");
  const [bootError, setBootError] = useState("");
  const [st, setSt] = useState<ServerState | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, Provider>>({});
  const [, setTick] = useState(0);
  const clockSkew = useRef(0);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((m) => (m === msg ? null : m)), 3200);
  }, []);

  const refresh = useCallback(async () => {
    if (!api.getSession()) { setSt(null); return null; }
    try {
      const s = await api.rpc<ServerState>("api_estado");
      clockSkew.current = s.serverTime - Date.now();
      setSt(s);
      return s;
    } catch (e: any) {
      if (/iniciar sesión|sesión expiró/i.test(e.message)) { await api.signOut(); setSt(null); }
      throw e;
    }
  }, []);

  // ---------- Arranque ----------
  useEffect(() => {
    if (!api.isConfigured) return;
    (async () => {
      try {
        setCatalog(await api.rpc("api_catalogo"));
        if (LIVE && !api.getSession()) await loginDemoInternal(DEMO_EMAILS[api.FRAME_AS!] ?? DEMO_EMAILS.u1);
        if (api.getSession()) await refresh().catch(() => null);
        setPhase("listo");
      } catch (e: any) {
        setBootError(e.message);
        setPhase("error");
      }
    })();
  }, []);

  // ---------- Actualización periódica (tiempo real) ----------
  useEffect(() => {
    if (phase !== "listo" || !st) return;
    const every = LIVE ? 2500 : 5000;
    const t = setInterval(() => { if (!document.hidden) refresh().catch(() => null); }, every);
    const onFocus = () => refresh().catch(() => null);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [phase, !!st]);

  // Reloj de 1 s (postulaciones que van apareciendo)
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  /** Ejecuta una acción del servidor, refresca el estado y muestra errores */
  async function run<T>(fn: () => Promise<T>, opts: { silent?: boolean; refresh?: boolean } = {}): Promise<T> {
    try {
      const r = await fn();
      if (opts.refresh !== false) await refresh().catch(() => null);
      return r;
    } catch (e: any) {
      if (!opts.silent) toast(e.message || "Ocurrió un error");
      throw e;
    }
  }

  async function loginDemoInternal(email: string) {
    try { await api.signIn(email, DEMO_PASSWORD); }
    catch (e: any) {
      if (!/incorrectos/.test(e.message)) throw e;
      await api.signUp(email, DEMO_PASSWORD, { demo: true });     // primera vez: crea el acceso de la cuenta de ejemplo
    }
    await api.rpc("api_completar_registro");
  }

  const account = st?.cuenta ?? null;
  const mode: Mode = st?.modo ?? "cliente";
  const myProvider = st?.proveedor ?? undefined;
  const now = () => Date.now() + clockSkew.current;

  const getProvider = (id?: string | null): Provider | undefined => {
    if (!id) return undefined;
    if (myProvider?.id === id) return myProvider;
    return st?.proveedores[id] ?? cache[id];
  };
  const loadProvider = async (id: string) => {
    const p = await api.rpc<Provider>("api_proveedor", { p_id: id });
    if (p) setCache((c) => ({ ...c, [id]: p }));
    return p;
  };
  const clientInfo = (key: string): ClientInfo => st?.clientes[key] ?? (account && key === account.id ? { name: account.name, photo: account.photo, rating: 5, reviews: 0 } : { name: "Cliente", rating: 5, reviews: 0 });
  const findRequest = (id: string): Request | undefined =>
    st?.solicitudes.find((r) => r.id === id) ?? st?.trabajos.find((r) => r.id === id) ?? st?.oportunidades.find((o) => o.r.id === id)?.r;
  /** Postulaciones visibles (las respuestas automáticas de ejemplo llegan con unos segundos de diferencia) */
  const visibleApplicants = (r: Request) => r.applicants.filter((a) => a.at <= now());

  const actions = {
    refresh,
    // ---------- Sesión ----------
    async login(email: string, password: string) {
      await api.signIn(email, password);
      try { await api.rpc("api_completar_registro"); } catch (e) { await api.signOut(); throw e; }
      await refresh();
    },
    async loginDemo(email: string) {
      await loginDemoInternal(email);
      await refresh();
    },
    async register(d: { email: string; password: string; name: string; document: string; phone: string; departamento: string; municipio: string; verification: unknown }) {
      try { await api.signUp(d.email, d.password, { nombre: d.name }); }
      catch (e: any) {
        // Si el acceso ya existía (p. ej. un intento anterior incompleto), se intenta ingresar con esa contraseña
        if (!/Ya existe/.test(e.message)) throw e;
        await api.signIn(d.email, d.password).catch(() => { throw e; });
      }
      try {
        await api.rpc("api_completar_registro", { p_nombre: d.name, p_documento: d.document, p_celular: d.phone, p_departamento: d.departamento, p_municipio: d.municipio, p_verificacion: d.verification });
      } catch (e) {
        await api.signOut();
        throw e;
      }
      await refresh();
    },
    async logout() { await api.signOut(); setSt(null); },
    setMode: (m: Mode) => run(() => api.rpc("api_set_modo", { p_modo: m })),
    updateAccount: (p: Partial<Account>) => run(() => api.rpc("api_actualizar_perfil", { p_datos: p })),
    async deleteAccount() { await run(() => api.rpc("api_eliminar_cuenta"), { refresh: false }); await api.signOut(); setSt(null); },
    resetDemo: () => run(() => api.rpc("api_reiniciar_demo")),

    // ---------- Proveedor ----------
    saveProviderProfile: (p: Record<string, unknown>) => run(() => api.rpc("api_guardar_proveedor", { p_datos: p })),
    applyTo: (requestId: string, price: number, note?: string) => run(() => api.rpc("api_postular", { p_solicitud: requestId, p_precio: price, p_nota: note ?? null })),
    decline: (requestId: string) => run(() => api.rpc("api_descartar", { p_solicitud: requestId })),
    providerNoShow: (requestId: string) => run(() => api.rpc("api_no_asistir", { p_solicitud: requestId })),

    // ---------- Cliente ----------
    publishRequest: (i: { desc: string; service: ServiceId; departamento: string; municipio: string; lat?: number | null; lng?: number | null; precision?: number | null; direccion: string; payment: PaymentMethod; wantsProposals: boolean }) =>
      run(() => api.rpc<{ id: string; notificados: number; trace: Trace; gps: boolean }>("api_publicar", {
        p_descripcion: i.desc, p_servicio: i.service, p_departamento: i.departamento, p_municipio: i.municipio,
        p_lat: i.lat ?? null, p_lng: i.lng ?? null, p_direccion: i.direccion, p_pago: i.payment, p_propuestas: i.wantsProposals,
        p_precision: i.precision ?? null,
      })),
    editRequest: (id: string, desc: string, payment: PaymentMethod, direccion?: string) => run(() => api.rpc("api_editar_solicitud", { p_id: id, p_descripcion: desc, p_pago: payment, p_direccion: direccion ?? null })),
    deleteRequest: (id: string) => run(() => api.rpc("api_eliminar_solicitud", { p_id: id })),
    confirmAgreement: (requestId: string, providerId: string, date: string, time: string, price: number) =>
      run(() => api.rpc<Request & { conversationId: string }>("api_confirmar_acuerdo", { p_solicitud: requestId, p_proveedor: providerId, p_fecha: date, p_hora: time, p_precio: price })),
    rate: (requestId: string, stars: number, comment: string) => run(() => api.rpc("api_calificar", { p_solicitud: requestId, p_estrellas: stars, p_comentario: comment })),
    extendDeadline: (requestId: string) => run(() => api.rpc("api_extender_plazo", { p_solicitud: requestId })),
    cancelRequest: (requestId: string, withStrike: boolean) => run(() => api.rpc("api_cancelar", { p_solicitud: requestId, p_con_falta: withStrike })),

    // ---------- Mensajería ----------
    sendMessage: (convId: string, msg: { text?: string; image?: string }) => run(() => api.rpc("api_enviar_mensaje", { p_conversacion: convId, p_texto: msg.text ?? null, p_imagen: msg.image ?? null })),
    /** Abre (o crea) una conversación con un proveedor o un usuario */
    openConversation: (target: { provider?: string; user?: string }) =>
      run(() => api.rpc<string>("api_abrir_conversacion", { p_perfil: target.user ?? null, p_proveedor: target.provider ?? null })),
    markConversationRead: (convId: string) => run(() => api.rpc("api_leer_conversacion", { p_conversacion: convId }), { silent: true }),
    markNotificationsRead: () => run(() => api.rpc("api_leer_notificaciones"), { silent: true }),
    setPrefs: (p: { push: boolean; email: boolean; ia: boolean }) => run(() => api.rpc("api_preferencias", { p_push: p.push, p_email: p.email, p_ia: p.ia })),

    // ---------- Direcciones y pagos ----------
    saveAddress: (a: { id?: string; name: string; address: string; departamento: string; municipio: string }) =>
      run(() => api.rpc("api_direccion_guardar", { p_id: a.id ?? null, p_nombre: a.name, p_direccion: a.address, p_departamento: a.departamento, p_municipio: a.municipio })),
    deleteAddress: (id: string) => run(() => api.rpc("api_direccion_eliminar", { p_id: id })),
    savePayment: (type: PaymentMethod, detail: string) => run(() => api.rpc("api_pago_guardar", { p_tipo: type, p_detalle: detail })),
    defaultPayment: (id: string) => run(() => api.rpc("api_pago_predeterminado", { p_id: id })),
    deletePayment: (id: string) => run(() => api.rpc("api_pago_eliminar", { p_id: id })),

    // ---------- Trueque y beneficios ----------
    publishBarter: (offers: ServiceId, needs: ServiceId, note: string) => run(() => api.rpc("api_trueque_publicar", { p_ofrece: offers, p_necesita: needs, p_nota: note })),
    deleteBarter: (id: string) => run(() => api.rpc("api_trueque_eliminar", { p_id: id })),
    redeem: (allyId: number) => run(() => api.rpc<{ code: string; brand: string }>("api_canjear", { p_aliado: allyId })),
  };

  return {
    phase, bootError, session: st ? { accountId: st.cuenta.id, mode } : null,
    account, mode, myProvider, getProvider, loadProvider, clientInfo, findRequest, visibleApplicants, now,
    myRequests: st?.solicitudes ?? [],
    opportunities: st?.oportunidades ?? [],
    myJobs: st?.trabajos ?? [],
    chats: st?.conversaciones ?? [],
    notifications: st?.notificaciones ?? [],
    strikes: st?.faltas ?? 0,
    points: st?.puntos ?? 0,
    prefs: st?.prefs ?? { push: true, email: true, ia: true },
    addresses: st?.direcciones ?? [],
    payMethods: st?.metodosPago ?? [],
    myBarters: st?.misTrueques ?? [],
    toast, toastMsg, run, ...actions,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fuera de StoreProvider");
  return c;
}

/** Ayuda para botones: ejecuta una acción asíncrona y marca "ocupado" mientras tanto */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const wrap = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (busy) return;
    setBusy(true);
    try { return await fn(); } catch { return undefined; } finally { setBusy(false); }
  };
  return [busy, wrap] as const;
}
