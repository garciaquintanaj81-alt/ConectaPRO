// =====================================================================
//  Mapa real (Leaflet + OpenStreetMap) y dirección a partir de coordenadas.
//  · Leaflet viene incluido en /public/vendor/leaflet (licencia BSD-2).
//  · Los mosaicos del mapa son de OpenStreetMap (© colaboradores de OSM).
//  · La dirección se obtiene con Nominatim (OpenStreetMap) solo cuando la
//    persona usa su ubicación o mueve el marcador.
// =====================================================================
import { useEffect, useRef, useState } from "react";
import { LuMapPinOff } from "react-icons/lu";
import { cx } from "./ui";

declare global { interface Window { L?: any } }

let loading: Promise<any> | null = null;
/** Carga Leaflet una sola vez (script + estilos) */
export function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  loading ??= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "vendor/leaflet/leaflet.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "vendor/leaflet/leaflet.js";
    s.onload = () => { window.L.Icon.Default.imagePath = "vendor/leaflet/images/"; resolve(window.L); };
    s.onerror = () => { loading = null; reject(new Error("No se pudo cargar el mapa")); };
    document.head.appendChild(s);
  });
  return loading;
}

export interface Punto { lat: number; lng: number }

/**
 * Mapa con un punto.
 * - approx: muestra un círculo de ~800 m en vez del punto exacto (privacidad).
 * - editable: la persona puede tocar el mapa o arrastrar el marcador para ajustar el punto.
 */
export function Mapa({ center, point, approx = false, editable = false, onPick, zoom, className, accuracy }: {
  center: Punto;
  point?: Punto | null;
  approx?: boolean;
  editable?: boolean;
  onPick?: (p: Punto) => void;
  zoom?: number;
  className?: string;
  accuracy?: number | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const [error, setError] = useState(false);

  // Crear el mapa
  useEffect(() => {
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !box.current || map.current) return;
      map.current = L.map(box.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false })
        .setView([center.lat, center.lng], zoom ?? (point ? 16 : 13));
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      if (editable) map.current.on("click", (e: any) => pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      draw();
      setTimeout(() => map.current?.invalidateSize(), 150);
    }).catch(() => alive && setError(true));
    return () => { alive = false; map.current?.remove(); map.current = null; };
  }, []);

  // Redibujar cuando cambian el punto o el centro
  function draw() {
    const L = window.L;
    if (!L || !map.current || !layer.current) return;
    layer.current.clearLayers();
    if (point && approx) {
      L.circle([point.lat, point.lng], { radius: 800, color: "#4b3cf3", weight: 2, fillOpacity: 0.12 }).addTo(layer.current);
      map.current.setView([point.lat, point.lng], zoom ?? 14);
    } else if (point) {
      if (accuracy && accuracy > 20) L.circle([point.lat, point.lng], { radius: accuracy, color: "#2463ff", weight: 1, fillOpacity: 0.08 }).addTo(layer.current);
      const m = L.marker([point.lat, point.lng], { draggable: editable, autoPan: true, title: "Lugar del servicio" }).addTo(layer.current);
      if (editable) m.on("dragend", () => { const ll = m.getLatLng(); pickRef.current?.({ lat: ll.lat, lng: ll.lng }); });
      map.current.setView([point.lat, point.lng], Math.max(map.current.getZoom(), zoom ?? 16));
    } else {
      map.current.setView([center.lat, center.lng], zoom ?? 13);
    }
  }
  useEffect(draw, [point?.lat, point?.lng, center.lat, center.lng, approx, accuracy]);

  if (error) return (
    <div className={cx("flex items-center justify-center gap-2 rounded-2xl bg-surface p-6 text-sm text-ink-soft ring-1 ring-line", className)}>
      <LuMapPinOff className="h-5 w-5" /> No se pudo cargar el mapa. Revisa tu conexión.
    </div>
  );
  return <div ref={box} className={cx("relative z-0 overflow-hidden rounded-2xl bg-[#eef0f4] ring-1 ring-line", className)} role="region" aria-label="Mapa" data-testid="mapa" />;
}

/** Enlace para abrir el punto en Google Maps (cómo llegar) */
export const comoLlegar = (p: Punto) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

export interface DireccionDetectada { direccion: string; barrio: string; ciudad: string; completa: string }

/** Dirección aproximada a partir de coordenadas (OpenStreetMap / Nominatim) */
export async function direccionDe(p: Punto): Promise<DireccionDetectada | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}&zoom=18&addressdetails=1&accept-language=es`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const j = await r.json();
    const a = j.address ?? {};
    const via = a.road ?? a.pedestrian ?? a.footway ?? a.residential ?? "";
    const direccion = [via, a.house_number ? "# " + a.house_number : ""].filter(Boolean).join(" ");
    const barrio = a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district ?? a.hamlet ?? "";
    const ciudad = a.city ?? a.town ?? a.village ?? a.municipality ?? "";
    const completa = [direccion, barrio && "barrio " + barrio].filter(Boolean).join(", ");
    return { direccion, barrio, ciudad, completa: completa || (j.display_name ?? "").split(",").slice(0, 2).join(",") };
  } catch { return null; }
}
