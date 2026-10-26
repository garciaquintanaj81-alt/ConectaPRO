// =====================================================================
//  Simulador en vivo: 2 clientes + 2 proveedores al mismo tiempo.
//  Cada "celular" es la app real abierta con ?as=<cuenta>; todos comparten
//  los mismos datos, así que las notificaciones llegan en tiempo real.
// =====================================================================
import { useEffect, useRef, useState } from "react";
import { LuRefreshCw, LuExternalLink, LuArrowLeft, LuPlay, LuMonitorSmartphone } from "react-icons/lu";
// Etiquetas de las 4 cuentas de demostración (los datos reales vienen de la base de datos)
const DEMO_ACCOUNTS = [
  { id: "u1", name: "Daniela Jaramillo", photo: "img/daniela.jpg" },
  { id: "u2", name: "Carlos Ramírez", photo: "img/carlos.jpg" },
  { id: "u3", name: "Juan Pérez", photo: "img/cliente2.jpg" },
  { id: "u4", name: "Andrés Torres", photo: "img/andres.jpg" },
];
import { Avatar, Button, Logo, cx } from "../ui";
import { Link } from "../router";

const PHONES = [
  { id: "u1", role: "Cliente", color: "from-[#2463ff] to-[#4b3cf3]" },
  { id: "u2", role: "Proveedor · Plomería", color: "from-[#6a2cf0] to-[#8a2cf0]" },
  { id: "u3", role: "Cliente", color: "from-[#0ea5e9] to-[#2463ff]" },
  { id: "u4", role: "Proveedor · Plomería y electricidad", color: "from-[#7c3aed] to-[#c026d3]" },
];

const STEPS = [
  ["Daniela publica", "En el celular de Daniela toca + y publica una solicitud de Plomería."],
  ["Alerta a proveedores", "Carlos y Andrés (ambos de plomería y en la zona) reciben la notificación al instante."],
  ["Se postulan", "Cada proveedor abre la oportunidad y la acepta con su precio."],
  ["Daniela elige", "Ve las postulaciones ordenadas por calificación, abre un perfil y toca Contratar."],
  ["Acuerdo digital", "El proveedor elegido recibe el acuerdo y pueden chatear en tiempo real."],
  ["Califican", "El proveedor marca el trabajo como realizado y ambos se califican."],
];

function Phone({ id, role, color, reloadKey }: { id: string; role: string; color: string; reloadKey: number }) {
  const acc = DEMO_ACCOUNTS.find((a) => a.id === id)!;
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 390)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const src = `${window.location.pathname}?as=${id}#/inicio`;
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={acc.name} photo={acc.photo} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold">{acc.name}</div>
          <div className={cx("inline-block rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-bold text-white", color)}>{role}</div>
        </div>
        <a href={src} target="_blank" rel="noreferrer" title="Abrir en otra pestaña" className="rounded-full p-2 text-ink-soft hover:bg-white hover:text-brand"><LuExternalLink className="h-5 w-5" /></a>
      </div>
      <div ref={box} className="w-full">
        <div className="mx-auto overflow-hidden rounded-[44px] border-[10px] border-[#11142b] bg-[#11142b] shadow-2xl" style={{ width: 390 * scale + 20, height: 800 * scale + 20 }}>
          <iframe
            key={reloadKey}
            title={acc.name}
            data-as={id}
            src={src}
            className="origin-top-left rounded-[34px] bg-surface"
            style={{ width: 390, height: 800, transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}

export function Simulator() {
  const [reloadKey, setReloadKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [one, setOne] = useState("u1");
  // Pide a la pantalla de Daniela (cuenta demo) que reinicie los datos de ejemplo en la base de datos
  const restart = () => {
    const frame = document.querySelector<HTMLIFrameElement>("iframe[data-as]");
    if (!frame?.contentWindow) return;
    setResetting(true);
    const done = (e: MessageEvent) => {
      if (e.data !== "cp-reset-done") return;
      window.removeEventListener("message", done);
      setResetting(false);
      setReloadKey((k) => k + 1);
    };
    window.addEventListener("message", done);
    frame.contentWindow.postMessage("cp-reset-demo", "*");
    setTimeout(() => { window.removeEventListener("message", done); setResetting(false); }, 15000);
  };
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="blobs" />
      <div className="relative z-10 mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-10">
        <header className="flex flex-wrap items-center gap-4">
          <Link to="/" className="rounded-full p-2 hover:bg-white" ><LuArrowLeft className="h-6 w-6" /></Link>
          <Logo size="sm" />
          <div className="ml-auto flex gap-2">
            <Button variant="outline" icon={LuRefreshCw} className="px-4 py-2.5 text-sm" disabled={resetting} onClick={restart}>{resetting ? "Reiniciando…" : "Reiniciar simulación"}</Button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Simulación en vivo <span className="text-brand-gradient">cliente ⇄ proveedor</span></h1>
            <p className="mt-2 max-w-3xl text-lg text-ink-soft">Cuatro usuarios usan ConectaPRO al mismo tiempo. Lo que hace uno le llega a los otros como notificación en tiempo real, igual que en la plataforma final.</p>
          </div>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="card flex gap-3 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">{i + 1}</span>
              <div><div className="font-bold">{t}</div><div className="text-sm text-ink-soft">{d}</div></div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-soft">Extra: Juan puede publicar una solicitud de <b>Electricidad</b>; solo Andrés la recibe porque Carlos no tiene esa categoría.</p>

        {/* Computador: los 4 celulares a la vez */}
        {wide && (
          <div className="mt-8 grid grid-cols-2 gap-8 2xl:grid-cols-4">
            {PHONES.map((p) => <Phone key={p.id} {...p} reloadKey={reloadKey} />)}
          </div>
        )}

        {/* Celular / tablet: uno a la vez */}
        {!wide && <div className="mt-8">
          <div className="mb-3 flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-sm text-brand"><LuMonitorSmartphone className="h-5 w-5 shrink-0" /> Para ver los 4 usuarios al mismo tiempo, abre esta página en un computador. Aquí puedes cambiar de usuario:</div>
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
            {PHONES.map((p) => {
              const a = DEMO_ACCOUNTS.find((x) => x.id === p.id)!;
              return (
                <button key={p.id} onClick={() => setOne(p.id)} className={cx("flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold", one === p.id ? "bg-brand text-white" : "bg-white ring-1 ring-line")}>
                  <Avatar name={a.name} photo={a.photo} size={28} /> {a.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
          {PHONES.filter((p) => p.id === one).map((p) => <Phone key={p.id} {...p} reloadKey={reloadKey} />)}
        </div>}
      </div>
    </div>
  );
}

export function SimulatorLink({ className }: { className?: string }) {
  return (
    <Link to="/simulador" className={cx("flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#2463ff] via-[#4b3cf3] to-[#8a2cf0] p-4 text-white shadow-brand transition hover:brightness-110", className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20"><LuPlay className="h-5 w-5 fill-white" /></span>
      <div className="text-left"><div className="font-bold">Ver simulación en vivo</div><div className="text-xs opacity-90">2 clientes y 2 proveedores interactuando</div></div>
    </Link>
  );
}
