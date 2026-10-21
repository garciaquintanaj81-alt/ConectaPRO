// =====================================================================
//  Estado global de la app (simula el backend).
//  Todo se guarda en localStorage para que el prototipo "recuerde"
//  lo que se hace. "Restablecer demo" vuelve al estado inicial.
// =====================================================================
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Account, BASE, CLIENTS, DEMO_ACCOUNTS, PaymentMethod, PROVIDERS, Provider, ServiceId,
  at, daysAgo, minutesAgo, serviceById,
} from "./data";
import { distanceKm, matchProviders } from "./matching";

export type Mode = "cliente" | "proveedor";
export type Status = "buscando" | "en_curso" | "completada" | "cancelada";

export interface Applicant { providerId: string; price: number; at: number; note?: string }
export interface Agreement { date: string; time: string; price: number; code: string; signedAt: number; extendedDays?: number }
export interface Rating { stars: number; comment: string; at: number }

export interface Request {
  id: string;
  ownerAccountId?: string;
  clientKey: string;
  title: string;
  desc: string;
  service: ServiceId;
  location: { lat: number; lng: number; label: string };
  payment: PaymentMethod;
  wantsProposals: boolean;
  createdAt: number;
  status: Status;
  matched: string[];
  applicants: Applicant[];
  declinedBy: string[];
  providerId?: string;
  agreement?: Agreement;
  rating?: Rating;          // calificación del cliente al proveedor
  clientRating?: Rating;    // calificación del proveedor al cliente
  finishedAt?: number;
  photo?: string;
  punctualityPenalty?: boolean;
}

export interface Message { id: string; from: "me" | "peer" | "system"; text?: string; image?: string; at: number }
export interface Conversation { id: string; peerKey: string; peerName: string; peerPhoto?: string; peerRole: string; messages: Message[]; unread: number }
export interface Notification { id: string; text: string; at: number; read: boolean; link?: string; kind: "match" | "agreement" | "rating" | "ia" | "info" | "strike" | "message" }

export interface DB {
  version: number;
  session: { accountId: string; mode: Mode } | null;
  accounts: Account[];
  customProviders: Provider[];
  requests: Request[];
  chats: Record<string, Conversation[]>;
  notifications: Record<string, Notification[]>;
  strikes: Record<string, number>;
  points: Record<string, number>;
  prefs: Record<string, { push: boolean; email: boolean; ia: boolean }>;
}

const KEY = "conectapro-demo-v1";
const VERSION = 1;
export const uid = (p = "id") => p + Math.random().toString(36).slice(2, 9);
const todayAt = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); };
export const mergeProviders = (custom: Provider[]) => [...PROVIDERS.filter((p) => !custom.some((c) => c.id === p.id)), ...custom];
const isoDay = (offsetDays = 0) => { const d = new Date(Date.now() + offsetDays * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// ---------------------------------------------------------------------
//  Estado inicial (semilla de datos)
// ---------------------------------------------------------------------
function seed(): DB {
  const loc = (e: number, n: number, label = BASE.label) => ({ ...at(e, n), label });
  const done = (stars: number, comment: string, when: number): Rating => ({ stars, comment, at: when });

  const requests: Request[] = [
    // ---- Historial de Daniela (cliente) ----
    {
      id: "r1", ownerAccountId: "u1", clientKey: "c6", title: "Reparación de fuga de agua",
      desc: "Necesito reparar una tubería rota, se presenta una fuga de agua en la cocina.",
      service: "plomeria", location: loc(0, 0), payment: "efectivo", wantsProposals: true,
      createdAt: todayAt(8, 15), status: "en_curso", matched: ["p1", "p2", "p3"],
      applicants: [{ providerId: "p1", price: 60000, at: todayAt(8, 17) }, { providerId: "p2", price: 55000, at: todayAt(8, 19) }],
      declinedBy: [], providerId: "p1", photo: "img/sol1.jpg",
      agreement: { date: isoDay(0), time: "15:00", price: 60000, code: "CP-2026-0481", signedAt: todayAt(11, 40) },
    },
    {
      id: "r2", ownerAccountId: "u1", clientKey: "c6", title: "Instalación de lámparas", desc: "Instalar 3 lámparas de techo en la sala.",
      service: "electricidad", location: loc(0, 0), payment: "transferencia", wantsProposals: true,
      createdAt: new Date(2026, 9, 11, 9).getTime(), status: "completada", matched: ["p2", "p8"],
      applicants: [{ providerId: "p2", price: 70000, at: new Date(2026, 9, 11, 9, 5).getTime() }], declinedBy: [],
      providerId: "p2", photo: "img/sol2.jpg", finishedAt: new Date(2026, 9, 12, 16).getTime(),
      agreement: { date: "2026-10-12", time: "14:00", price: 70000, code: "CP-2026-0412", signedAt: new Date(2026, 9, 11, 10).getTime() },
      rating: done(5, "Instaló las lámparas en menos de una hora. Muy amable.", new Date(2026, 9, 12, 17).getTime()),
    },
    {
      id: "r3", ownerAccountId: "u1", clientKey: "c6", title: "Pintura de habitación", desc: "Pintar habitación principal de 12 m².",
      service: "pintura", location: loc(0, 0), payment: "nequi", wantsProposals: true,
      createdAt: new Date(2026, 9, 3, 9).getTime(), status: "cancelada", matched: ["p3", "p13"],
      applicants: [{ providerId: "p3", price: 180000, at: new Date(2026, 9, 3, 10).getTime() }], declinedBy: [],
      providerId: "p3", photo: "img/sol3.jpg", finishedAt: new Date(2026, 9, 5, 9).getTime(),
    },
    {
      id: "r4", ownerAccountId: "u1", clientKey: "c6", title: "Mantenimiento aire acond.", desc: "Mantenimiento preventivo de aire acondicionado de 12.000 BTU.",
      service: "aire", location: loc(0, 0), payment: "tarjeta", wantsProposals: true,
      createdAt: new Date(2026, 8, 27, 9).getTime(), status: "completada", matched: ["p4"],
      applicants: [{ providerId: "p4", price: 90000, at: new Date(2026, 8, 27, 10).getTime() }], declinedBy: [],
      providerId: "p4", photo: "img/sol4.jpg", finishedAt: new Date(2026, 8, 28, 12).getTime(),
      agreement: { date: "2026-09-28", time: "10:00", price: 90000, code: "CP-2026-0377", signedAt: new Date(2026, 8, 27, 11).getTime() },
      rating: done(5, "Muy ordenado y explicó todo.", new Date(2026, 8, 28, 13).getTime()),
    },
    // Rutina: corte de cabello aprox. cada mes (alimenta la IA predictiva)
    ...[92, 61, 31].map((d, i): Request => ({
      id: "rh" + i, ownerAccountId: "u1", clientKey: "c6", title: "Corte de cabello", desc: "Corte y cepillado a domicilio.",
      service: "peluqueria", location: loc(0, 0), payment: "nequi", wantsProposals: false, createdAt: daysAgo(d + 1),
      status: "completada", matched: ["p5"], applicants: [{ providerId: "p5", price: 35000, at: daysAgo(d + 1) }], declinedBy: [],
      providerId: "p5", finishedAt: daysAgo(d, 11),
      agreement: { date: isoDay(-d), time: "11:00", price: 35000, code: "CP-2026-02" + (10 + i), signedAt: daysAgo(d + 1) },
      rating: done(5, "Siempre excelente.", daysAgo(d, 12)),
    })),

    // ---- Solicitudes abiertas de otros clientes (oportunidades para proveedores) ----
    { id: "o1", clientKey: "c1", title: "Fuga de agua en la cocina", desc: "Necesito reparar una fuga de agua en la cocina.", service: "plomeria",
      location: loc(1.6, 1.8), payment: "efectivo", wantsProposals: true, createdAt: minutesAgo(5), status: "buscando",
      matched: [], applicants: [], declinedBy: [] },
    { id: "o2", clientKey: "c2", title: "Instalación de lámparas", desc: "Instalación de lámparas en apartamento.", service: "electricidad",
      location: loc(-0.5, 3.0), payment: "transferencia", wantsProposals: true, createdAt: minutesAgo(18), status: "buscando",
      matched: [], applicants: [], declinedBy: [] },
    { id: "o3", clientKey: "c3", title: "Pintar habitación", desc: "Pintar habitación de 12 m².", service: "pintura",
      location: loc(2.2, -0.4), payment: "nequi", wantsProposals: true, createdAt: minutesAgo(25), status: "buscando",
      matched: [], applicants: [], declinedBy: [] },
    { id: "o4", clientKey: "c4", title: "Cambio de grifería", desc: "Cambio de grifería del lavamanos y revisión del sanitario que gotea.", service: "plomeria",
      location: loc(-1.1, 0.2), payment: "tarjeta", wantsProposals: true, createdAt: minutesAgo(48), status: "buscando",
      matched: [], applicants: [], declinedBy: [] },
    { id: "o5", clientKey: "c5", title: "Destapar cañería", desc: "Destapar cañería del baño principal, es urgente.", service: "plomeria",
      location: loc(3.1, 2.4), payment: "efectivo", wantsProposals: true, createdAt: minutesAgo(95), status: "buscando",
      matched: [], applicants: [], declinedBy: [] },
    { id: "o6", clientKey: "c4", title: "Mantenimiento de aires", desc: "Mantenimiento de 2 aires acondicionados en local comercial.", service: "aire",
      location: loc(0.4, 1.2), payment: "transferencia", wantsProposals: true, createdAt: minutesAgo(70), status: "buscando",
      matched: [], applicants: [], declinedBy: [] },
    // Trabajo en curso de Carlos con María (vista proveedor)
    { id: "o7", clientKey: "c1", title: "Revisión de tubería del patio", desc: "Hay humedad en la pared del patio, posible tubería rota.", service: "plomeria",
      location: loc(1.6, 1.8), payment: "efectivo", wantsProposals: true, createdAt: daysAgo(1), status: "en_curso",
      matched: ["p1"], applicants: [{ providerId: "p1", price: 75000, at: daysAgo(1) }], declinedBy: [], providerId: "p1",
      agreement: { date: isoDay(1), time: "09:00", price: 75000, code: "CP-2026-0479", signedAt: daysAgo(1) } },
  ];

  // Proveedores notificados por el algoritmo para las oportunidades abiertas
  for (const r of requests) if (r.status === "buscando") r.matched = matchProviders(r.service, r.location, { includeLater: true }).matches.map((m) => m.provider.id);

  const t = (h: number, m: number) => todayAt(h, m);
  const chats: Record<string, Conversation[]> = {
    u1: [
      { id: "ch-p1", peerKey: "p1", peerName: "Carlos Ramírez", peerPhoto: "img/carlos.jpg", peerRole: "Plomería", unread: 1, messages: [
        { id: "m1", from: "me", text: "Hola, buenas tardes, necesito que me repares una tubería en la cocina, ¿cuándo tienes disponibilidad?", at: t(11, 32) },
        { id: "m2", from: "peer", text: "Sí, claro. ¿Me puedes enviar una foto de la fuga?", at: t(11, 33) },
        { id: "m3", from: "me", image: "img/fuga.jpg", at: t(11, 34) },
        { id: "m4", from: "peer", text: "Perfecto, puede ser que sea una unión. Te confirmo que puedo ir mañana en la mañana.", at: t(11, 37) },
        { id: "m5", from: "me", text: "Listo, perfecto. ¿A qué hora podrías?", at: t(11, 38) },
      ] },
      { id: "ch-p2", peerKey: "p2", peerName: "Andrés Torres", peerPhoto: "img/andres.jpg", peerRole: "Electricidad", unread: 0, messages: [
        { id: "m1", from: "peer", text: "¡Gracias por la calificación, Daniela! Quedo atento para lo que necesites.", at: new Date(2026, 9, 12, 18).getTime() },
      ] },
      { id: "ch-p5", peerKey: "p5", peerName: "Sofía Herrera", peerPhoto: undefined, peerRole: "Peluquería", unread: 0, messages: [
        { id: "m1", from: "peer", text: "Hola Dani, cuando quieras agendamos tu próximo corte 💇‍♀️", at: daysAgo(30, 15) },
      ] },
    ],
    u2: [
      { id: "ch-c6", peerKey: "c6", peerName: "Daniela Jaramillo", peerPhoto: "img/daniela.jpg", peerRole: "Cliente", unread: 1, messages: [
        { id: "m1", from: "peer", text: "Hola, buenas tardes, necesito que me repares una tubería en la cocina, ¿cuándo tienes disponibilidad?", at: t(11, 32) },
        { id: "m2", from: "me", text: "Sí, claro. ¿Me puedes enviar una foto de la fuga?", at: t(11, 33) },
        { id: "m3", from: "peer", image: "img/fuga.jpg", at: t(11, 34) },
        { id: "m4", from: "me", text: "Perfecto, puede ser que sea una unión. Te confirmo que puedo ir mañana en la mañana.", at: t(11, 37) },
        { id: "m5", from: "peer", text: "Listo, perfecto. ¿A qué hora podrías?", at: t(11, 38) },
      ] },
      { id: "ch-c1", peerKey: "c1", peerName: "María López", peerPhoto: "img/cliente1.jpg", peerRole: "Cliente", unread: 0, messages: [
        { id: "m1", from: "peer", text: "Carlos, ¿mañana a las 9:00 a.m. sigue en pie?", at: t(8, 2) },
        { id: "m2", from: "me", text: "Sí señora, allá estaré puntual.", at: t(8, 10) },
      ] },
    ],
  };

  const notifications: Record<string, Notification[]> = {
    u1: [
      { id: "n1", kind: "agreement", text: "Carlos Ramírez confirmó el acuerdo: Reparación de fuga de agua, hoy 3:00 p.m.", at: t(11, 40), read: false, link: "/solicitud/r1" },
      { id: "n2", kind: "message", text: "Nuevo mensaje de Carlos Ramírez", at: t(11, 37), read: false, link: "/chat/ch-p1" },
      { id: "n3", kind: "rating", text: "¡Ganaste 50 puntos ConectaPRO por calificar tu servicio de electricidad!", at: new Date(2026, 9, 12, 17).getTime(), read: true, link: "/perfil/beneficios" },
    ],
    u2: [
      { id: "n1", kind: "match", text: "Nueva oportunidad de plomería a 1.2 km: \"Fuga de agua en la cocina\"", at: minutesAgo(5), read: false, link: "/oportunidad/o1" },
      { id: "n2", kind: "agreement", text: "Daniela Jaramillo confirmó el acuerdo digital CP-2026-0481", at: t(11, 40), read: false, link: "/trabajo/r1" },
    ],
  };

  return {
    version: VERSION,
    session: null,
    accounts: DEMO_ACCOUNTS,
    customProviders: [],
    requests,
    chats,
    notifications,
    strikes: { u1: 0, u2: 0 },
    points: { u1: 320, u2: 540 },
    prefs: {},
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.version === VERSION) return db;
    }
  } catch { /* almacenamiento no disponible */ }
  return seed();
}

// ---------------------------------------------------------------------
//  Contexto
// ---------------------------------------------------------------------
type Ctx = ReturnType<typeof useStoreValue>;
const StoreCtx = createContext<Ctx | null>(null);

function useStoreValue() {
  const [db, setDb] = useState<DB>(load);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignorar */ }
  }, [db]);

  // Reloj: refresca la UI cada 1 s (postulaciones simuladas que van llegando)
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((m) => (m === msg ? null : m)), 2600);
  }, []);

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const account = db.session ? db.accounts.find((a) => a.id === db.session!.accountId) ?? null : null;
  const mode: Mode = db.session?.mode ?? "cliente";
  const allProviders = useMemo(() => mergeProviders(db.customProviders), [db.customProviders]);
  const getProvider = (id?: string) => (id ? allProviders.find((p) => p.id === id) : undefined);
  const myProvider = account?.providerId ? getProvider(account.providerId) : undefined;

  const clientInfo = (key: string) => {
    const acc = db.accounts.find((a) => a.clientId === key);
    if (acc) return { name: acc.name, photo: acc.photo, rating: CLIENTS[key]?.rating ?? 5, reviews: CLIENTS[key]?.reviews ?? 0 };
    return CLIENTS[key] ?? { name: "Cliente", rating: 5, reviews: 0 };
  };

  /** Postulaciones visibles (las simuladas llegan con un pequeño retraso) */
  const visibleApplicants = (r: Request) => r.applicants.filter((a) => a.at <= Date.now());

  const notify = (d: DB, accountId: string | undefined, n: Omit<Notification, "id" | "at" | "read">) => {
    if (!accountId) return;
    (d.notifications[accountId] ??= []).unshift({ ...n, id: uid("n"), at: Date.now(), read: false });
  };
  const accountOfProvider = (d: DB, providerId: string) => d.accounts.find((a) => a.providerId === providerId)?.id;

  const actions = {
    // ---------- Sesión ----------
    login(accountId: string, mode?: Mode) {
      update((d) => {
        const acc = d.accounts.find((a) => a.id === accountId)!;
        d.session = { accountId, mode: mode ?? (acc.providerId ? "proveedor" : "cliente") };
      });
    },
    logout() { update((d) => { d.session = null; }); },
    register(data: { name: string; document: string; phone: string; email: string; city: string }) {
      const id = uid("u");
      update((d) => {
        d.accounts.push({ id, ...data, clientId: "c-" + id });
        d.session = { accountId: id, mode: "cliente" };
        d.strikes[id] = 0;
        d.points[id] = 100;
        d.notifications[id] = [{ id: uid("n"), kind: "info", text: "¡Bienvenido a ConectaPRO! Tu identidad fue verificada. Ganaste 100 puntos de bienvenida.", at: Date.now(), read: false, link: "/perfil/beneficios" }];
        d.chats[id] = [];
      });
      return id;
    },
    setMode(mode: Mode) { update((d) => { if (d.session) d.session.mode = mode; }); },
    updateAccount(patch: Partial<Account>) {
      update((d) => { const a = d.accounts.find((x) => x.id === d.session?.accountId); if (a) Object.assign(a, patch); });
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch { /* */ }
      setDb(seed());
    },

    // ---------- Proveedor: parametrización del oferente ----------
    saveProviderProfile(p: Omit<Provider, "id" | "rating" | "reviews" | "verified" | "completed">) {
      update((d) => {
        const acc = d.accounts.find((a) => a.id === d.session?.accountId)!;
        if (acc.providerId) {
          const base = PROVIDERS.find((x) => x.id === acc.providerId);
          if (base) {
            // Proveedor semilla: se guarda una copia editada
            const edited = { ...base, ...p };
            d.customProviders = d.customProviders.filter((x) => x.id !== base.id);
            d.customProviders.push(edited);
            return;
          }
          const ex = d.customProviders.find((x) => x.id === acc.providerId);
          if (ex) Object.assign(ex, p);
        } else {
          const id = uid("p");
          d.customProviders.push({ ...p, id, rating: 5, reviews: 0, verified: true, completed: 0 });
          acc.providerId = id;
        }
        if (d.session) d.session.mode = "proveedor";
      });
    },

    // ---------- Cliente: publicar solicitud + orquestación ----------
    publishRequest(input: { desc: string; service: ServiceId; location: { lat: number; lng: number; label: string }; payment: PaymentMethod; wantsProposals: boolean }) {
      const id = uid("r");
      update((d) => {
        const acc = d.accounts.find((a) => a.id === d.session?.accountId)!;
        const pool = mergeProviders(d.customProviders);
        const { matches } = matchProviders(input.service, input.location, { pool, includeLater: true });
        const now = Date.now();
        // Simulación: los proveedores notificados responden en unos segundos
        const applicants: Applicant[] = matches
          .filter((m) => m.provider.id !== acc.providerId)
          .slice(0, 4)
          .map((m, i) => ({
            providerId: m.provider.id,
            price: Math.round((m.provider.priceMin + m.provider.priceMax) / 2 / 5000) * 5000,
            at: now + 2500 + i * 1600 + Math.round(Math.random() * 600),
          }));
        const title = input.desc.split(/[.,\n]/)[0].slice(0, 48) || serviceById(input.service).name;
        d.requests.unshift({
          id, ownerAccountId: acc.id, clientKey: acc.clientId, title, ...input,
          createdAt: now, status: "buscando", matched: matches.map((m) => m.provider.id), applicants, declinedBy: [],
          photo: serviceById(input.service).photo,
        });
        for (const m of matches) {
          const pa = accountOfProvider(d, m.provider.id);
          if (pa && pa !== acc.id) notify(d, pa, { kind: "match", text: `Nueva oportunidad de ${serviceById(input.service).name.toLowerCase()}: "${title}"`, link: "/oportunidad/" + id });
        }
        notify(d, acc.id, { kind: "match", text: `Notificamos a ${matches.length} proveedores compatibles para "${title}"`, link: "/proveedores/" + id });
      });
      return id;
    },

    confirmAgreement(requestId: string, providerId: string, date: string, time: string, price: number) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        r.status = "en_curso";
        r.providerId = providerId;
        r.agreement = { date, time, price, code: "CP-2026-0" + Math.floor(500 + Math.random() * 400), signedAt: Date.now() };
        const prov = mergeProviders(d.customProviders).find((p) => p.id === providerId)!;
        const accId = d.session!.accountId;
        notify(d, accId, { kind: "agreement", text: `Acuerdo digital ${r.agreement.code} confirmado con ${prov.name}`, link: "/solicitud/" + r.id });
        notify(d, accountOfProvider(d, providerId), { kind: "agreement", text: `Nuevo acuerdo confirmado: "${r.title}"`, link: "/trabajo/" + r.id });
        // Abre conversación con el proveedor
        const list = (d.chats[accId] ??= []);
        let conv = list.find((c) => c.peerKey === providerId);
        if (!conv) {
          conv = { id: "ch-" + providerId, peerKey: providerId, peerName: prov.name, peerPhoto: prov.photo, peerRole: serviceById(r.service).short, unread: 0, messages: [] };
          list.unshift(conv);
        }
        conv.messages.push({ id: uid("m"), from: "system", text: `Acuerdo ${r.agreement.code} confirmado · ${r.title}`, at: Date.now() });
        conv.messages.push({ id: uid("m"), from: "peer", text: "¡Hola! Ya recibí el acuerdo. Allá estaré a la hora pactada 👍", at: Date.now() + 1500 });
        conv.unread += 1;
      });
    },

    rateService(requestId: string, stars: number, comment: string) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        r.status = "completada";
        r.finishedAt = r.finishedAt ?? Date.now();
        r.rating = { stars, comment, at: Date.now() };
        const accId = d.session!.accountId;
        d.points[accId] = (d.points[accId] ?? 0) + 50;
        notify(d, accId, { kind: "rating", text: "¡Ganaste 50 puntos ConectaPRO por calificar tu servicio!", link: "/perfil/beneficios" });
        if (r.providerId) notify(d, accountOfProvider(d, r.providerId), { kind: "rating", text: `Recibiste una calificación de ${stars} estrellas`, link: "/trabajo/" + r.id });
      });
    },

    rateClient(requestId: string, stars: number, comment: string) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        r.status = "completada";
        r.finishedAt = r.finishedAt ?? Date.now();
        r.clientRating = { stars, comment, at: Date.now() };
        const accId = d.session!.accountId;
        d.points[accId] = (d.points[accId] ?? 0) + 50;
        notify(d, r.ownerAccountId, { kind: "rating", text: "El proveedor marcó tu servicio como realizado. ¡Califícalo!", link: "/calificar/" + r.id });
      });
    },

    /** Regla de flexibilidad: plazo adicional de 2 días con valoración negativa de puntualidad */
    extendDeadline(requestId: string) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        if (r.agreement) r.agreement.extendedDays = 2;
        r.punctualityPenalty = true;
        notify(d, accountOfProvider(d, r.providerId!), { kind: "strike", text: `Se registró un incumplimiento de puntualidad en "${r.title}". Tienes 2 días adicionales.`, link: "/trabajo/" + r.id });
      });
    },

    /** Cancelación con falta grave (regla de los tres strikes) */
    cancelRequest(requestId: string, withStrike: boolean) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        r.status = "cancelada";
        r.finishedAt = Date.now();
        const accId = d.session!.accountId;
        if (withStrike) {
          d.strikes[accId] = (d.strikes[accId] ?? 0) + 1;
          notify(d, accId, { kind: "strike", text: `Se registró una falta grave (${d.strikes[accId]}/3). Al llegar a 3 tu cuenta será suspendida.`, link: "/perfil/seguridad" });
        }
      });
    },

    // ---------- Proveedor: postularse / rechazar / no asistir ----------
    applyTo(requestId: string, price: number, note?: string) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        const acc = d.accounts.find((a) => a.id === d.session?.accountId)!;
        if (!acc.providerId || r.applicants.some((a) => a.providerId === acc.providerId)) return;
        r.applicants.push({ providerId: acc.providerId, price, at: Date.now(), note });
        notify(d, r.ownerAccountId, { kind: "match", text: `${acc.name} aceptó tu solicitud "${r.title}"`, link: "/proveedores/" + r.id });
      });
    },
    decline(requestId: string) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        const acc = d.accounts.find((a) => a.id === d.session?.accountId)!;
        if (acc.providerId) r.declinedBy.push(acc.providerId);
      });
    },
    providerNoShow(requestId: string) {
      update((d) => {
        const r = d.requests.find((x) => x.id === requestId)!;
        r.status = "cancelada";
        r.finishedAt = Date.now();
        const accId = d.session!.accountId;
        d.strikes[accId] = (d.strikes[accId] ?? 0) + 1;
        notify(d, accId, { kind: "strike", text: `Se registró una falta grave por no realizar un trabajo acordado (${d.strikes[accId]}/3).`, link: "/perfil/seguridad" });
        notify(d, r.ownerAccountId, { kind: "info", text: `El proveedor canceló "${r.title}". Puedes volver a publicar tu solicitud.`, link: "/solicitud/" + r.id });
      });
    },

    // ---------- Mensajería ----------
    sendMessage(convId: string, msg: { text?: string; image?: string }) {
      const accId = db.session!.accountId;
      update((d) => {
        const c = d.chats[accId]?.find((x) => x.id === convId);
        if (c) c.messages.push({ id: uid("m"), from: "me", ...msg, at: Date.now() });
      });
      // Respuesta automática simulada
      const replies = [
        "¡Perfecto! Quedo atento.",
        "Listo, podría llegar a las 9:00 a.m. ¿Te queda bien?",
        "Gracias por escribir, ya te confirmo.",
        "De acuerdo, nos vemos entonces 👍",
      ];
      setTimeout(() => {
        update((d) => {
          const c = d.chats[accId]?.find((x) => x.id === convId);
          if (!c) return;
          const n = c.messages.filter((m) => m.from === "peer").length;
          c.messages.push({ id: uid("m"), from: "peer", text: replies[n % replies.length], at: Date.now() });
        });
      }, 1800);
    },
    openConversation(peerKey: string, peerName: string, peerRole: string, peerPhoto?: string) {
      const accId = db.session!.accountId;
      const id = "ch-" + peerKey;
      update((d) => {
        const list = (d.chats[accId] ??= []);
        if (!list.some((c) => c.peerKey === peerKey)) list.unshift({ id, peerKey, peerName, peerPhoto, peerRole, unread: 0, messages: [] });
      });
      return id;
    },
    markConversationRead(convId: string) {
      update((d) => { const c = d.chats[d.session!.accountId]?.find((x) => x.id === convId); if (c && c.unread) c.unread = 0; });
    },
    markNotificationsRead() {
      update((d) => { for (const n of d.notifications[d.session!.accountId] ?? []) n.read = true; });
    },
    setPrefs(p: { push: boolean; email: boolean; ia: boolean }) {
      update((d) => { d.prefs[d.session!.accountId] = p; });
    },
    redeem(cost: number) {
      update((d) => { const id = d.session!.accountId; d.points[id] = Math.max(0, (d.points[id] ?? 0) - cost); });
    },
  };

  // ---------- Consultas derivadas ----------
  const myRequests = account ? db.requests.filter((r) => r.ownerAccountId === account.id) : [];
  const chats = account ? db.chats[account.id] ?? [] : [];
  const notifications = account ? db.notifications[account.id] ?? [] : [];
  const strikes = account ? db.strikes[account.id] ?? 0 : 0;
  const points = account ? db.points[account.id] ?? 0 : 0;

  /** Oportunidades para el proveedor actual: misma categoría + dentro de cobertura */
  const opportunities = myProvider
    ? db.requests
        .filter((r) => r.status === "buscando" && r.ownerAccountId !== account?.id && myProvider.services.some((s) => s === r.service))
        .map((r) => ({ r, distance: distanceKm(myProvider, r.location) }))
        .filter((x) => x.distance <= myProvider.coverageKm && !x.r.declinedBy.includes(myProvider.id))
        .sort((a, b) => b.r.createdAt - a.r.createdAt)
    : [];
  const myJobs = myProvider ? db.requests.filter((r) => r.providerId === myProvider.id) : [];

  return {
    db, account, mode, allProviders, getProvider, myProvider, clientInfo, visibleApplicants,
    myRequests, chats, notifications, strikes, points, opportunities, myJobs,
    toast, toastMsg, ...actions,
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
