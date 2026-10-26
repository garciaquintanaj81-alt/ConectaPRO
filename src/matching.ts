// =====================================================================
//  Algoritmo de emparejamiento georreferenciado de ConectaPRO
//
//  1. Mapa GPS ............ ubicación de la solicitud (lat/lng)
//  2. Filtros de solicitud  categoría del servicio + ubicación + horario
//  3. Algoritmo ........... cruza categoría, distancia (Haversine) y
//                           zona de cobertura del proveedor
//  4. Proveedor compatible  lista ordenada por calificación y cercanía
// =====================================================================

import { ServiceId, Schedule } from "./data";

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

// El emparejamiento real se ejecuta en la base de datos (función cp_match en
// supabase/schema.sql). Aquí quedan las utilidades que usa la interfaz.

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
