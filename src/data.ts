// =====================================================================
//  Tipos de datos de ConectaPRO.
//  El catálogo (categorías y servicios) se carga desde la base de datos
//  al iniciar la app (ver store.tsx → api_catalogo). Aquí solo quedan los
//  tipos y algunos textos de interfaz.
// =====================================================================

export type PaymentMethod = "efectivo" | "nequi" | "transferencia" | "tarjeta";

export const PAYMENTS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi / Daviplata",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export type CategoryId = string;
export type ServiceId = string;

export interface Category { id: CategoryId; name: string; short: string; description?: string; providers?: number; main?: boolean; tint: string }
export interface Service { id: ServiceId; name: string; short: string; category: CategoryId; photo?: string; providers?: number }

// Colores de cada categoría (solo presentación)
const TINTS: Record<string, string> = {
  hogar: "bg-[#eef0ff] text-brand",
  tecnologia: "bg-[#e8f0ff] text-brand-blue",
  construccion: "bg-[#f1ecff] text-brand-violet",
  belleza: "bg-[#f4eeff] text-[#8b2cf0]",
  transporte: "bg-[#e7f3ff] text-brand-blue",
  salud: "bg-[#fdeef3] text-[#e7336b]",
  mascotas: "bg-[#e6f3ff] text-brand-blue",
  educacion: "bg-[#fff4e5] text-[#c2410c]",
  comercio: "bg-[#e9f8f0] text-[#15803d]",
  agricultura: "bg-[#eef8e6] text-[#4d7c0f]",
  profesionales: "bg-[#eef2f7] text-[#334155]",
  eventos: "bg-[#fdeef8] text-[#be185d]",
  mas: "bg-[#eef0ff] text-brand",
};

/** Catálogo cargado desde la base de datos (los arreglos se llenan en setCatalog) */
export const CATEGORIES: Category[] = [];
export const SERVICES: Service[] = [];

export function setCatalog(c: { categorias: Omit<Category, "tint">[]; servicios: Service[] }) {
  CATEGORIES.splice(0, CATEGORIES.length, ...c.categorias.map((x) => ({ ...x, short: x.short ?? x.name, tint: TINTS[x.id] ?? TINTS.mas })));
  SERVICES.splice(0, SERVICES.length, ...c.servicios.map((s) => ({ ...s, photo: s.photo ?? undefined })));
}

export const servicesOf = (cat: CategoryId) => SERVICES.filter((s) => s.category === cat);
export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id);

export const serviceById = (id: ServiceId): Service =>
  SERVICES.find((s) => s.id === id) ?? { id, name: id, short: id, category: "mas" };

// ---------------------------------------------------------------------
//  Entidades (mismo formato que devuelve la API)
// ---------------------------------------------------------------------
export interface Schedule { days: number[]; from: number; to: number } // días 0=Dom..6=Sáb, horas 24h

export interface Provider {
  id: string;
  userId?: string;
  name: string;
  photo?: string;
  company: string;
  profession: string;
  services: ServiceId[];
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  departamento?: string;
  municipio?: string;
  city: string;
  coverageKm: number;
  schedule: Schedule;
  priceMin: number;
  priceMax: number;
  verified: boolean;
  about: string;
  offers: string[];
  portfolio: string[];
  phone: string;
  completed: number;
  availability?: "ahora" | "hoy" | "otro";
  distanceKm?: number;
  ubicacion?: "local" | "cobertura";
  /** true = lat/lng son el punto exacto (propio o autorizado); false = aproximado (~1 km) */
  exactLocation?: boolean;
  publicLocation?: boolean;
  /** Cuenta de prueba (QA) */
  test?: boolean;
  resenas?: { name: string; stars: number; text: string; date: string }[];
}

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city: string;
  departamento?: string;
  municipio?: string;
  photo?: string;
  clientId: string;
  providerId?: string;
  verified?: boolean;
  demo?: boolean;
  /** Cuenta de prueba (QA) */
  test?: boolean;
  /** La foto está guardada en Supabase Storage (ruta dentro del bucket) */
  photoStored?: boolean;
  photoPath?: string | null;
  photoPrivacy?: "todos" | "contactos";
}

export interface ClientInfo { id?: string; name: string; photo?: string; rating: number; reviews: number; test?: boolean }

export interface Address { id: string; name: string; address: string; departamento: string; municipio: string; label: string }
export interface PayMethod { id: string; type: PaymentMethod; detail: string; default: boolean }

// ---------------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------------
export const money = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

/** Contraseña de las cuentas de demostración (solo para el simulador externo) */
export const DEMO_PASSWORD = "Conecta2026*";
/** Contraseña de las cuentas de prueba (QA) */
export const TEST_PASSWORD = "Prueba2026*";
