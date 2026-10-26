// =====================================================================
//  Departamentos y municipios de Colombia (desde la base de datos)
//  <UbicacionSelect> muestra dos listas encadenadas: al elegir un
//  departamento solo aparecen sus municipios.
// =====================================================================
import { useEffect, useState } from "react";
import { LuMapPin, LuChevronDown, LuMap } from "react-icons/lu";
import { rpc } from "./api";
import { cx } from "./ui";

export interface Departamento { codigo: string; nombre: string }
export interface Municipio { codigo: string; nombre: string; lat: number; lng: number }

let depCache: Promise<Departamento[]> | null = null;
const munCache = new Map<string, Promise<Municipio[]>>();

export function getDepartamentos() {
  depCache ??= rpc<Departamento[]>("api_departamentos").catch((e) => { depCache = null; throw e; });
  return depCache;
}
export function getMunicipios(dep: string) {
  if (!dep) return Promise.resolve([] as Municipio[]);
  if (!munCache.has(dep)) munCache.set(dep, rpc<Municipio[]>("api_municipios", { p_departamento: dep }).catch((e) => { munCache.delete(dep); throw e; }));
  return munCache.get(dep)!;
}

export function useDepartamentos() {
  const [list, setList] = useState<Departamento[]>([]);
  useEffect(() => { getDepartamentos().then(setList).catch(() => setList([])); }, []);
  return list;
}

export function useMunicipios(dep?: string) {
  const [list, setList] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!dep) { setList([]); return; }
    setLoading(true);
    getMunicipios(dep).then((l) => alive && setList(l)).catch(() => alive && setList([])).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [dep]);
  return { list, loading };
}

export interface Ubicacion { departamento: string; municipio: string }

/**
 * Dos selectores encadenados. Al cambiar el departamento se limpia el
 * municipio y se cargan solo los municipios de ese departamento.
 */
export function UbicacionSelect({
  value, onChange, allowAll = false, variant = "field", errors, className, labels = true,
}: {
  value: Ubicacion;
  onChange: (v: Ubicacion, municipio?: Municipio) => void;
  allowAll?: boolean;
  variant?: "field" | "compact";
  errors?: { departamento?: string; municipio?: string };
  className?: string;
  labels?: boolean;
}) {
  const deps = useDepartamentos();
  const { list: muns, loading } = useMunicipios(value.departamento);

  const selCls = variant === "compact"
    ? "w-full appearance-none rounded-2xl bg-white py-3 pl-11 pr-10 text-[15px] font-medium outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50 disabled:opacity-60"
    : "w-full appearance-none bg-transparent text-sm outline-none disabled:opacity-60";

  const depSelect = (
    <select
      aria-label="Departamento"
      className={cx(selCls, !value.departamento && "text-ink-soft")}
      value={value.departamento}
      onChange={(e) => onChange({ departamento: e.target.value, municipio: "" })}
    >
      <option value="">{allowAll ? "Todos los departamentos" : "Selecciona el departamento"}</option>
      {deps.map((d) => <option key={d.codigo} value={d.codigo}>{d.nombre}</option>)}
    </select>
  );
  const munSelect = (
    <select
      aria-label="Municipio"
      className={cx(selCls, !value.municipio && "text-ink-soft")}
      value={value.municipio}
      disabled={!value.departamento || loading}
      onChange={(e) => onChange({ departamento: value.departamento, municipio: e.target.value }, muns.find((m) => m.codigo === e.target.value))}
    >
      <option value="">
        {!value.departamento ? "Primero elige el departamento" : loading ? "Cargando municipios…" : allowAll ? `Todos los municipios (${muns.length})` : `Selecciona el municipio (${muns.length})`}
      </option>
      {muns.map((m) => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
    </select>
  );

  if (variant === "compact") {
    return (
      <div className={cx("grid gap-3 sm:grid-cols-2", className)}>
        <label className="relative block">
          <LuMap className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
          {depSelect}
          <LuChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" />
        </label>
        <label className="relative block">
          <LuMapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
          {munSelect}
          <LuChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2" />
        </label>
      </div>
    );
  }

  const box = (icon: React.ReactNode, label: string, sel: React.ReactNode, err?: string) => (
    <div>
      <label className={cx("flex items-center gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand/50", err && "ring-2 ring-bad/50")}>
        {icon}
        <div className="min-w-0 flex-1">
          {labels && <div className="text-[13px] font-semibold text-ink">{label}</div>}
          {sel}
        </div>
        <LuChevronDown className="h-6 w-6 shrink-0" />
      </label>
      {err && <p className="mt-1 pl-4 text-xs font-medium text-bad">{err}</p>}
    </div>
  );
  return (
    <div className={cx("space-y-3", className)}>
      {box(<LuMap className="h-6 w-6 shrink-0 text-ink" />, "Departamento", depSelect, errors?.departamento)}
      {box(<LuMapPin className="h-6 w-6 shrink-0 text-ink" />, "Ciudad / municipio", munSelect, errors?.municipio)}
    </div>
  );
}

// =====================================================================
//  Ubicación actual del dispositivo (GPS / red), con permiso del usuario.
//  Es independiente del municipio administrativo: solo sirve para medir
//  distancias reales y precisar el punto del servicio.
// =====================================================================
export type GeoStatus = "inactivo" | "pidiendo" | "ok" | "denegado" | "no-disponible" | "error";
export interface GeoFix { lat: number; lng: number; accuracy: number; at: number }

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("inactivo");
  const [fix, setFix] = useState<GeoFix | null>(null);
  const request = () =>
    new Promise<GeoFix | null>((resolve) => {
      if (!("geolocation" in navigator) || !window.isSecureContext) { setStatus("no-disponible"); return resolve(null); }
      setStatus("pidiendo");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const f = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy), at: Date.now() };
          setFix(f); setStatus("ok"); resolve(f);
        },
        (err) => { setStatus(err.code === err.PERMISSION_DENIED ? "denegado" : "error"); resolve(null); },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    });
  const clear = () => { setFix(null); setStatus("inactivo"); };
  return { status, fix, request, clear };
}

export const GEO_MSG: Record<GeoStatus, string> = {
  inactivo: "",
  pidiendo: "Solicitando permiso de ubicación…",
  ok: "",
  denegado: "No diste permiso de ubicación. Puedes activarlo en la configuración del navegador; mientras tanto se usa el municipio que elegiste.",
  "no-disponible": "Este navegador no permite obtener la ubicación (requiere conexión segura https).",
  error: "No pudimos obtener tu ubicación. Revisa que el GPS esté encendido e inténtalo de nuevo.",
};
