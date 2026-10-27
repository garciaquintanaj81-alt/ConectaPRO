// =====================================================================
//  Simulador en vivo: escenario "desayuno sorpresa" con 1 cliente y
//  3 proveedores (las 4 cuentas de prueba) al mismo tiempo.
//  Cada "celular" es la app real abierta con ?as=<cuenta>; todos comparten
//  los mismos datos, así que las notificaciones llegan en tiempo real.
// =====================================================================
import { useEffect, useRef, useState } from "react";
import { LuRefreshCw, LuExternalLink, LuArrowLeft, LuPlay, LuMonitorSmartphone } from "react-icons/lu";
import { Avatar, Button, Logo, TestBadge, cx } from "../ui";
import { Link } from "../router";
import { rpc } from "../api";

// Etiquetas de las 4 cuentas de prueba (los datos reales vienen de la base de datos)
const DEMO_ACCOUNTS = [
  { id: "c1", name: "Cliente Prueba", photo: undefined as string | undefined, start: "/inicio" },
  { id: "p1", name: "Dulce Despertar", photo: "img/pruebas/logo1.svg", start: "/inicio" },
  { id: "p2", name: "Globos & Café", photo: "img/pruebas/logo2.svg", start: "/inicio" },
  { id: "p3", name: "Detalles Express", photo: "img/pruebas/logo3.svg", start: "/inicio" },
];

const PHONES = [
  { id: "c1", role: "Cliente · necesita un desayuno sorpresa", color: "from-[#2463ff] to-[#4b3cf3]" },
  { id: "p1", role: "Proveedor · desayunos clásicos", color: "from-[#16a34a] to-[#65a30d]" },
  { id: "p2", role: "Proveedor · desayunos premium", color: "from-[#7c3aed] to-[#c026d3]" },
  { id: "p3", role: "Proveedor · desayunos económicos", color: "from-[#0ea5e9] to-[#2463ff]" },
];

const STEPS = [
  ["El cliente publica", "En el celular del cliente toca + : Desayunos y detalles sorpresa ya viene elegido. Escribe qué necesita y publica."],
  ["Alerta a proveedores", "Dulce Despertar, Globos & Café y Detalles Express reciben la notificación al instante."],
  ["Se postulan", "Cada proveedor abre la oportunidad, escribe su precio y se postula."],
  ["El cliente compara", "Ve las 3 ofertas con precio, distancia y fotos de los trabajos de cada uno."],
  ["Acuerdo digital", "Elige una, confirma fecha y hora, y el proveedor elegido recibe el acuerdo."],
  ["Chatean y califican", "Pueden escribirse en tiempo real y al final se califican."],
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
  const src = `${window.location.pathname}?as=${id}#${acc.start}`;
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={acc.name} photo={acc.photo} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 truncate font-extrabold">{acc.name}<TestBadge /></div>
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
            allow="geolocation"
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
  const [one, setOne] = useState("c1");
  // Borra el escenario de prueba (solicitudes, ofertas, chats…) y recarga los 4 celulares
  const restart = async () => {
    setResetting(true);
    try { await rpc("api_reiniciar_pruebas"); } catch { /* */ }
    setResetting(false);
    setReloadKey((k) => k + 1);
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
            <Link to="/pruebas" className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-line hover:ring-brand/40">Cuentas de prueba</Link>
            <Button variant="outline" icon={LuRefreshCw} className="px-4 py-2.5 text-sm" disabled={resetting} onClick={restart}>{resetting ? "Limpiando…" : "Empezar de cero"}</Button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Simulación en vivo: <span className="text-brand-gradient">desayuno sorpresa</span></h1>
            <p className="mt-2 max-w-3xl text-lg text-ink-soft">Un cliente y tres proveedores de desayunos sorpresa usan ConectaPRO al mismo tiempo. Lo que hace uno le llega a los otros como notificación en tiempo real. La primera vez, cada celular pide aceptar los términos.</p>
            <p className="mt-2 max-w-3xl text-sm text-ink-soft">Son las 4 cuentas de prueba: viven aparte y <b>nunca se muestran a los usuarios reales</b>. Cada vez que el cliente publica, la prueba anterior se borra sola.</p>
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
      <div className="text-left"><div className="font-bold">Ver simulación en vivo</div><div className="text-xs opacity-90">1 cliente y 3 proveedores de desayunos sorpresa</div></div>
    </Link>
  );
}
