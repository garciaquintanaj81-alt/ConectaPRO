// =====================================================================
//  Algoritmo de emparejamiento georreferenciado de ConectaPRO
//
//  1. Mapa GPS ............ ubicación de la solicitud (lat/lng)
//  2. Filtros de solicitud  categoría del servicio + ubicación + horario
//  3. Algoritmo ........... cruza categoría, distancia (Haversine) y
//                           zona de cobertura del proveedor
//  4. Proveedor compatible  lista ordenada por calificación y cercanía
// =====================================================================

import { PROVIDERS, Provider, ServiceId, Schedule } from "./data";

export interface GeoPoint { lat: number; lng: number }

/** Distancia en km entre dos puntos (fórmula de Haversine) */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type Availability = "ahora" | "hoy" | "otro";

/** ¿El proveedor está dentro de su horario laboral en este momento? */
export function availability(s: Schedule, now = new Date()): Availability {
  const h = now.getHours() + now.getMinutes() / 60;
  if (s.days.includes(now.getDay())) {
    if (h >= s.from && h < s.to) return "ahora";
    if (h < s.from) return "hoy";
  }
  return "otro";
}

export const availabilityLabel: Record<Availability, string> = {
  ahora: "Disponible ahora",
  hoy: "Disponible hoy",
  otro: "Disponible próximamente",
};

export function scheduleLabel(s: Schedule) {
  const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const fmt = (h: number) => {
    if (h === 0 || h === 24) return "12:00 a.m.";
    const ap = h < 12 ? "a.m." : "p.m.";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:00 ${ap}`;
  };
  const days = s.days.length === 7 ? "Todos los días"
    : s.days.length === 6 && !s.days.includes(0) ? "Lun - Sáb"
    : s.days.length === 5 && !s.days.includes(0) && !s.days.includes(6) ? "Lun - Vie"
    : s.days.map((d) => names[d]).join(", ");
  if (s.from === 0 && s.to === 24) return `${days}: 24 horas`;
  return `${days}: ${fmt(s.from)} - ${fmt(s.to)}`;
}

export interface Match {
  provider: Provider;
  distance: number;
  availability: Availability;
  score: number;
}

export interface MatchTrace {
  total: number;
  byCategory: number;
  byCoverage: number;
  bySchedule: number;
}

/**
 * Filtra exclusivamente los proveedores compatibles con la solicitud:
 *  - tienen registrada la categoría de servicio solicitada
 *  - la solicitud está dentro de su zona de cobertura
 *  - están activos (en horario laboral) ahora o más tarde hoy
 * y los ordena por reputación (calificación) y cercanía.
 */
export function matchProviders(
  service: ServiceId,
  location: GeoPoint,
  opts: { includeLater?: boolean; now?: Date; pool?: Provider[] } = {}
) {
  const now = opts.now ?? new Date();
  const pool = opts.pool ?? PROVIDERS;
  const trace: MatchTrace = { total: pool.length, byCategory: 0, byCoverage: 0, bySchedule: 0 };

  const byCategory = pool.filter((p) => p.services.includes(service));
  trace.byCategory = byCategory.length;

  const withDistance = byCategory
    .map((p) => ({ provider: p, distance: distanceKm(location, p) }))
    .filter((m) => m.distance <= m.provider.coverageKm);
  trace.byCoverage = withDistance.length;

  const matches: Match[] = withDistance
    .map((m) => ({ ...m, availability: availability(m.provider.schedule, now) }))
    .filter((m) => opts.includeLater || m.availability !== "otro")
    .map((m) => ({
      ...m,
      // Puntaje: reputación (peso alto) + cercanía + disponibilidad inmediata
      score: m.provider.rating * 20 - m.distance * 1.5 + (m.availability === "ahora" ? 6 : 0) + (m.provider.verified ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  trace.bySchedule = matches.length;

  return { matches, trace };
}

// =====================================================================
//  IA predictiva de rutinas
//  Si una persona ha pedido el mismo servicio al menos 3 veces con una
//  frecuencia parecida, se estima la próxima fecha y se sugiere volver
//  a contactar al proveedor cuando se acerca esa fecha.
// =====================================================================

export interface RoutineSuggestion {
  service: ServiceId;
  providerId?: string;
  intervalDays: number;
  nextDate: number;
  times: number;
}

export function predictRoutines(history: { service: ServiceId; date: number; providerId?: string }[], now = Date.now()): RoutineSuggestion[] {
  const DAY = 86400000;
  const groups = new Map<ServiceId, { date: number; providerId?: string }[]>();
  for (const h of history) {
    if (!groups.has(h.service)) groups.set(h.service, []);
    groups.get(h.service)!.push(h);
  }
  const out: RoutineSuggestion[] = [];
  for (const [service, list] of groups) {
    if (list.length < 3) continue;
    list.sort((a, b) => a.date - b.date);
    const gaps = list.slice(1).map((x, i) => (x.date - list[i].date) / DAY);
    const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    // Frecuencia "aproximada": ninguna diferencia se aleja más del 35 % del promedio
    const regular = gaps.every((g) => Math.abs(g - avg) <= avg * 0.35);
    if (!regular) continue;
    const last = list[list.length - 1];
    const nextDate = last.date + avg * DAY;
    const daysToNext = (nextDate - now) / DAY;
    if (daysToNext <= 5 && daysToNext >= -10) {
      out.push({ service, providerId: last.providerId, intervalDays: Math.round(avg), nextDate, times: list.length });
    }
  }
  return out;
}
