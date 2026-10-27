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
  Account, Address, ClientInfo, DEMO_PASSWORD, PaymentMethod, PayMethod, Provider, ServiceId, TEST_PASSWORD, setCatalog,
} from "./data";
import { TERMS_VERSION } from "./legal";

export type Mode = "cliente" | "proveedor";
export type Status = "buscando" | "en_curso" | "completada" | "cancelada";

export interface Applicant { providerId: string; price: number; at: number; note?: string; distanceKm?: number }
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
  /** approximate = punto redondeado (~1 km) y sin dirección: lo ven los proveedores no contratados */
  location: { lat: number; lng: number; label: string; approximate?: boolean };
  departamento: string;
  municipio: string;
  municipioNombre: string;
  departamentoNombre: string;
  direccion: string | null;
  payment: PaymentMethod;
  wantsProposals: boolean;
  createdAt: number;
  status: Status;
  matched: string[];
  matchedCount: number;
  applicantsCount: number;
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
export interface Conversation { id: string; peerKey: string; peerUserId: string; peerName: string; peerPhoto?: string; peerTest?: boolean; peerRole: string; messages: Message[]; unread: number }
export interface Notification { id: string; text: string; at: number; read: boolean; link?: string; kind: "match" | "agreement" | "rating" | "ia" | "info" | "strike" | "message" }
export interface Barter { id: string; offers: ServiceId; needs: ServiceId; note: string }

export interface TermsState { version: string; aceptada: boolean; fecha?: number | null }

/** Zona desde la que se buscan servicios: municipio del perfil, uno elegido a mano o la ubicación actual (GPS) */
export interface Zona {
  departamento: string;
  municipio: string;
  label: string;
  fuente: "perfil" | "manual" | "gps";
  lat?: number;
  lng?: number;
  accuracy?: number;
  at?: number;
}

interface ServerState {
  cuenta: Account;
  terminos: TermsState;
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

  // El catálogo trae conteos de proveedores según la cuenta (real, prueba o simulación):
  // se vuelve a cargar al iniciar o cerrar sesión
  const cuentaId = st?.cuenta.id ?? null;
  useEffect(() => {
    if (phase !== "listo") return;
    api.rpc("api_catalogo").then((c) => { setCatalog(c); setTick((x) => x + 1); }).catch(() => null);
  }, [cuentaId, phase]);

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

  async function loginDemoInternal(email: string, password = DEMO_PASSWORD) {
    try { await api.signIn(email, password); }
    catch (e: any) {
      if (!/incorrectos/.test(e.message)) throw e;
      await api.signUp(email, password, { cuenta_prevista: true });   // primera vez: crea el acceso de la cuenta ya preparada
    }
    try { await api.rpc("api_completar_registro"); }
    catch (e) { await api.signOut(); throw e; }
  }

  const account = st?.cuenta ?? null;

  // ---------- Zona de búsqueda (ubicación) ----------
  const zonaKey = account ? "conectapro-zona-" + account.id : "";
  const perfilZona = (): Zona | null => account?.municipio
    ? { departamento: account.departamento ?? "", municipio: account.municipio, label: account.city, fuente: "perfil" }
    : null;
  const [zonaSel, setZonaSel] = useState<Zona | null>(null);
  const [gpsState, setGpsState] = useState<"inactivo" | "pidiendo" | "activo" | "denegado" | "no-disponible" | "error">("inactivo");
  const watchId = useRef<number | null>(null);
  const lastMuniCheck = useRef<{ lat: number; lng: number } | null>(null);
  // Al cambiar de cuenta se recupera la zona elegida a mano (solo municipio; nunca coordenadas GPS)
  useEffect(() => {
    stopWatch();
    if (!zonaKey) { setZonaSel(null); return; }
    try { const z = JSON.parse(localStorage.getItem(zonaKey) || "null"); setZonaSel(z && z.fuente === "manual" ? z : null); }
    catch { setZonaSel(null); }
  }, [zonaKey]);
  const zona: Zona | null = zonaSel ?? perfilZona();

  function stopWatch() {
    if (watchId.current != null) { try { navigator.geolocation.clearWatch(watchId.current); } catch { /* */ } }
    watchId.current = null;
  }
  useEffect(() => () => stopWatch(), []);

  /** Pide permiso de ubicación y sigue la posición mientras la app está abierta */
  async function usarUbicacionActual(): Promise<boolean> {
    if (!("geolocation" in navigator) || !window.isSecureContext) { setGpsState("no-disponible"); return false; }
    setGpsState("pidiendo");
    const pos = await new Promise<GeolocationPosition | null>((res) =>
      navigator.geolocation.getCurrentPosition(res, (err) => { setGpsState(err.code === err.PERMISSION_DENIED ? "denegado" : "error"); res(null); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }));
    if (!pos) return false;
    const ok = await aplicarPosicion(pos, true);
    if (!ok) return false;
    setGpsState("activo");
    stopWatch();
    watchId.current = navigator.geolocation.watchPosition((p) => { aplicarPosicion(p, false); }, () => null,
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 30000 });
    return true;
  }
  async function aplicarPosicion(p: GeolocationPosition, forzar: boolean): Promise<boolean> {
    const lat = p.coords.latitude, lng = p.coords.longitude, accuracy = Math.round(p.coords.accuracy);
    const prev = lastMuniCheck.current;
    // Solo se vuelve a consultar el municipio si la persona se movió más de 2 km
    if (forzar || !prev || distKm(prev, { lat, lng }) > 2) {
      try {
        const m = await api.rpc<{ codigo: string; nombre: string; departamento: string; departamentoNombre: string }>("api_municipio_cercano", { p_lat: lat, p_lng: lng });
        lastMuniCheck.current = { lat, lng };
        setZonaSel({ departamento: m.departamento, municipio: m.codigo, label: m.nombre === m.departamentoNombre ? m.nombre : `${m.nombre}, ${m.departamentoNombre}`, fuente: "gps", lat, lng, accuracy, at: Date.now() });
      } catch { if (forzar) { setGpsState("error"); return false; } }
    } else {
      setZonaSel((z) => (z && z.fuente === "gps" ? { ...z, lat, lng, accuracy, at: Date.now() } : z));
    }
    return true;
  }
  const zonaActions = {
    usarUbicacionActual,
    /** Elegir manualmente otra ciudad o municipio */
    elegirZona(z: { departamento: string; municipio: string; label: string }) {
      stopWatch(); setGpsState("inactivo");
      const v: Zona = { ...z, fuente: "manual" };
      setZonaSel(v);
      try { localStorage.setItem(zonaKey, JSON.stringify(v)); } catch { /* */ }
    },
    /** Volver al municipio registrado en el perfil */
    zonaDelPerfil() {
      stopWatch(); setGpsState("inactivo"); setZonaSel(null);
      try { localStorage.removeItem(zonaKey); } catch { /* */ }
    },
  };
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
  /** Postulaciones de la solicitud (todas son reales: las envía cada proveedor desde su cuenta) */
  const visibleApplicants = (r: Request) => r.applicants;

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
    /** Ingreso a una de las 4 cuentas de prueba (QA) */
    async loginTest(email: string) {
      await loginDemoInternal(email, TEST_PASSWORD);
      await refresh();
    },
    async register(d: { email: string; password: string; name: string; document: string; phone: string; departamento: string; municipio: string; verification: unknown; terms: string }) {
      try { await api.signUp(d.email, d.password, { nombre: d.name }); }
      catch (e: any) {
        // Si el acceso ya existía (p. ej. un intento anterior incompleto), se intenta ingresar con esa contraseña
        if (!/Ya existe/.test(e.message)) throw e;
        await api.signIn(d.email, d.password).catch(() => { throw e; });
      }
      try {
        await api.rpc("api_completar_registro", { p_nombre: d.name, p_documento: d.document, p_celular: d.phone, p_departamento: d.departamento, p_municipio: d.municipio,
          p_verificacion: d.verification, p_terminos: d.terms, p_agente: navigator.userAgent });
      } catch (e) {
        await api.signOut();
        throw e;
      }
      await refresh();
    },
    async logout() { stopWatch(); setGpsState("inactivo"); await api.signOut(); setSt(null); },
    /** Registra la aceptación de la versión vigente de los términos */
    acceptTerms: () => run(() => api.rpc("api_aceptar_terminos", { p_version: TERMS_VERSION, p_agente: navigator.userAgent })),
    /** Sube la foto a Supabase Storage, la asocia a la cuenta y borra la anterior */
    async uploadPhoto(blob: Blob) {
      const ruta = await run(() => api.uploadPhoto(blob), { refresh: false });
      try {
        const r = await run(() => api.rpc<{ anterior: string | null }>("api_foto_perfil", { p_ruta: ruta }));
        if (r.anterior && r.anterior !== ruta) api.deletePhotos([r.anterior]).catch(() => null);
      } catch (e) { api.deletePhotos([ruta]).catch(() => null); throw e; }
    },
    async deletePhoto() {
      const r = await run(() => api.rpc<{ anterior: string | null }>("api_foto_perfil", { p_ruta: null }));
      if (r.anterior) await api.deletePhotos([r.anterior]).catch(() => null);
    },
    setPhotoPrivacy: (v: "todos" | "contactos") => run(() => api.rpc("api_foto_privacidad", { p_valor: v })),
    resetTests: () => run(() => api.rpc("api_reiniciar_pruebas")),
    setMode: (m: Mode) => run(() => api.rpc("api_set_modo", { p_modo: m })),
    updateAccount: (p: Partial<Account>) => run(() => api.rpc("api_actualizar_perfil", { p_datos: p })),
    async deleteAccount() {
      // Primero se borra la foto del almacenamiento (los demás datos los borra la base de datos)
      if (st?.cuenta.photoPath) await api.deletePhotos([st.cuenta.photoPath]).catch(() => null);
      await run(() => api.rpc("api_eliminar_cuenta"), { refresh: false });
      await api.signOut(); setSt(null);
    },
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
    terms: st?.terminos ?? null,
    zona, gpsState, ...zonaActions,
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

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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
