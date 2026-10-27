// =====================================================================
//  Zona de búsqueda: desde dónde se buscan proveedores y servicios.
//  · Ubicación actual del dispositivo (solo con permiso del usuario),
//    que se sigue en tiempo real mientras la app está abierta.
//  · Otra ciudad o municipio elegido manualmente.
//  · El municipio registrado en el perfil (por defecto).
//  La ubicación del dispositivo NO se guarda en la base de datos ni se
//  muestra a otros usuarios: solo se usa para calcular distancias.
// =====================================================================
import { useState } from "react";
import { LuMapPin, LuLocateFixed, LuChevronDown, LuShieldCheck, LuHouse, LuRadio } from "react-icons/lu";
import { useStore } from "./store";
import { Button, Modal, cx } from "./ui";
import { UbicacionSelect, useDepartamentos } from "./geo";
import { Mapa } from "./mapa";

export const GPS_MSG: Record<string, string> = {
  pidiendo: "Solicitando permiso de ubicación…",
  denegado: "No diste permiso de ubicación. Puedes activarlo en la configuración del navegador o elegir una ciudad manualmente.",
  "no-disponible": "Este navegador no permite obtener la ubicación (requiere conexión segura https).",
  error: "No pudimos obtener tu ubicación. Revisa que el GPS esté encendido o elige una ciudad manualmente.",
};

export function zonaFuenteLabel(f: "perfil" | "manual" | "gps") {
  return f === "gps" ? "Tu ubicación actual" : f === "manual" ? "Ciudad elegida" : "Tu municipio";
}

/** Botón que muestra la zona actual y abre el selector */
export function ZonaChip({ className, compact }: { className?: string; compact?: boolean }) {
  const { zona, gpsState } = useStore();
  const [open, setOpen] = useState(false);
  if (!zona) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} data-testid="zona-chip"
        className={cx("flex min-w-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line hover:ring-brand/40", className)}
        aria-label={`Ubicación de búsqueda: ${zona.label}. Cambiar`}>
        {zona.fuente === "gps" ? <LuLocateFixed className={cx("h-4 w-4 shrink-0 text-ok", gpsState === "activo" && "animate-pulse")} /> : <LuMapPin className="h-4 w-4 shrink-0 text-brand-blue" />}
        <span className="truncate">{compact ? zona.label.split(",")[0] : zona.label}</span>
        <LuChevronDown className="h-4 w-4 shrink-0 text-ink-soft" />
      </button>
      <ZonaModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ZonaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { zona, gpsState, usarUbicacionActual, elegirZona, zonaDelPerfil, account } = useStore();
  const deps = useDepartamentos();
  const [manual, setManual] = useState({ departamento: "", municipio: "" });
  const [manualLabel, setManualLabel] = useState("");
  const [busy, setBusy] = useState(false);
  if (!zona) return null;

  const gps = async () => {
    setBusy(true);
    const ok = await usarUbicacionActual();
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="¿Dónde buscas servicios?">
      <div className="rounded-2xl bg-surface p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{zonaFuenteLabel(zona.fuente)}</div>
        <div className="mt-0.5 flex items-center gap-2 text-lg font-extrabold">
          {zona.fuente === "gps" ? <LuLocateFixed className="h-5 w-5 text-ok" /> : <LuMapPin className="h-5 w-5 text-brand" />}{zona.label}
        </div>
        {zona.fuente === "gps" && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <LuRadio className="h-4 w-4 text-ok" /> {gpsState === "activo" ? "Actualizándose en tiempo real" : "Ubicación detectada"} · precisión ±{zona.accuracy} m
          </p>
        )}
      </div>

      {zona.fuente === "gps" && zona.lat != null && <Mapa className="mt-3 h-44" center={{ lat: zona.lat, lng: zona.lng! }} point={{ lat: zona.lat, lng: zona.lng! }} accuracy={zona.accuracy} zoom={15} />}
      <Button className="mt-4 w-full" icon={LuLocateFixed} disabled={busy || gpsState === "pidiendo"} onClick={gps}>
        {busy || gpsState === "pidiendo" ? "Ubicando…" : zona.fuente === "gps" ? "Actualizar mi ubicación" : "Usar mi ubicación actual"}
      </Button>
      {GPS_MSG[gpsState] && gpsState !== "pidiendo" && <p className="mt-2 text-sm text-bad">{GPS_MSG[gpsState]}</p>}

      <div className="mt-6 text-sm font-bold">O elige otra ciudad o municipio</div>
      <UbicacionSelect variant="compact" className="mt-2" value={manual} onChange={(v, m) => {
        setManual(v);
        const dep = deps.find((d) => d.codigo === v.departamento)?.nombre ?? "";
        setManualLabel(m ? (m.nombre === dep ? m.nombre : `${m.nombre}, ${dep}`) : "");
      }} />
      <Button variant="soft" className="mt-3 w-full" disabled={!manual.municipio} onClick={() => { elegirZona({ ...manual, label: manualLabel }); onClose(); }}>
        Buscar en {manualLabel ? manualLabel.split(",")[0] : "esta ciudad"}
      </Button>

      {zona.fuente !== "perfil" && account?.municipio && (
        <button className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-brand" onClick={() => { zonaDelPerfil(); onClose(); }}>
          <LuHouse className="h-4 w-4" /> Volver a mi municipio ({account.city.split(",")[0]})
        </button>
      )}
      <p className="mt-5 flex gap-2 text-xs text-ink-soft">
        <LuShieldCheck className="h-4 w-4 shrink-0 text-brand" />
        Tu ubicación solo se usa en este dispositivo para calcular qué proveedores están cerca. No se guarda ni se muestra a otros usuarios.
      </p>
    </Modal>
  );
}
