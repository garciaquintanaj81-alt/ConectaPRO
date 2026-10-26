import { LuTriangleAlert, LuRefreshCw, LuLogOut, LuDatabase } from "react-icons/lu";
import { useStore } from "./store";
import { match, navigate, useRoute } from "./router";
import { Button, Empty } from "./ui";
import { Login, Register, RoleSelect, Welcome } from "./screens/Auth";
import {
  AgreementFlow, ClientHome, CompatibleProviders, Explore, MyRequests, ProviderProfile, Publish, RateService,
  RequestDetail, Searching,
} from "./screens/Client";
import { JobDetail, MyJobs, MyService, Opportunities, OpportunityDetail, ProviderHome, RateClient } from "./screens/Provider";
import { Barter, Messages, Notifications, Profile, ProfileSection } from "./screens/Common";
import { AppShell } from "./Layout";
import { useEffect, useRef, useState } from "react";
import { Simulator } from "./screens/Simulator";
import type { Notification } from "./store";
import { LuBell } from "react-icons/lu";

type Route = [string, (p: Record<string, string>) => JSX.Element];

export default function App() {
  const path = useRoute();
  const { session, mode, strikes, toastMsg, resetDemo, logout, phase, bootError, account } = useStore();
  const logged = !!session;
  const isPublic = path === "/" || path === "/login" || path === "/registro" || path === "/simulador";

  // El simulador le pide a esta pantalla reiniciar los datos de ejemplo
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.data === "cp-reset-demo") resetDemo().catch(() => null).finally(() => window.parent?.postMessage("cp-reset-done", "*"));
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);

  // Redirecciones de sesión
  useEffect(() => {
    if (phase !== "listo") return;
    if (!logged && !isPublic) navigate("/", true);
    if (logged && (path === "/" || path === "/login")) navigate("/inicio", true);
  }, [logged, path, phase]);

  if (phase === "cargando") return <Splash />;
  if (phase === "sin-config") return <SetupNeeded />;
  if (phase === "error") return <Splash error={bootError} />;

  const routes: Route[] = [
    ["/", () => <Welcome />],
    ["/simulador", () => <Simulator />],
    ["/login", () => <Login />],
    ["/registro", () => <Register />],
    ["/rol", () => <RoleSelect />],
    ["/inicio", () => (mode === "proveedor" ? <ProviderHome /> : <ClientHome />)],
    // Cliente
    ["/explorar", () => <Explore />],
    ["/publicar", () => <Publish />],
    ["/buscando/:id", (p) => <Searching id={p.id} />],
    ["/proveedores/:id", (p) => <CompatibleProviders id={p.id} />],
    ["/proveedor/:id", (p) => <ProviderProfile id={p.id} />],
    ["/acuerdo/:rid/:pid", (p) => <AgreementFlow rid={p.rid} pid={p.pid} />],
    ["/calificar/:id", (p) => <RateService id={p.id} />],
    ["/solicitudes", () => <MyRequests />],
    ["/solicitud/:id", (p) => <RequestDetail id={p.id} />],
    ["/trueque", () => <Barter />],
    // Proveedor
    ["/oportunidades", () => <Opportunities />],
    ["/oportunidad/:id", (p) => <OpportunityDetail id={p.id} />],
    ["/trabajos", () => <MyJobs />],
    ["/trabajo/:id", (p) => <JobDetail id={p.id} />],
    ["/calificar-cliente/:id", (p) => <RateClient id={p.id} />],
    ["/mi-servicio", () => <MyService />],
    // Comunes
    ["/mensajes", () => <Messages />],
    ["/chat/:id", (p) => <Messages activeId={p.id} />],
    ["/perfil", () => <Profile />],
    ["/perfil/:section", (p) => <ProfileSection section={p.section} />],
    ["/notificaciones", () => <Notifications />],
  ];

  let page: JSX.Element | null = null;
  if (!logged && !isPublic) page = null;
  else if (logged && strikes >= 3 && !path.startsWith("/perfil")) {
    page = (
      <AppShell hideNav>
        <Empty icon={LuTriangleAlert} title="Cuenta suspendida" text="Acumulaste 3 faltas graves. Por la seguridad de la comunidad tu cuenta fue suspendida."
          action={account?.demo
            ? <Button icon={LuRefreshCw} onClick={() => resetDemo().then(() => navigate("/inicio", true))}>Reiniciar datos de ejemplo</Button>
            : <Button variant="dark" icon={LuLogOut} onClick={() => logout().then(() => navigate("/", true))}>Cerrar sesión</Button>} />
      </AppShell>
    );
  } else {
    for (const [pattern, render] of routes) {
      const params = match(pattern, path);
      if (params) { page = render(params); break; }
    }
    if (!page) page = (
      <AppShell><Empty icon={LuTriangleAlert} title="Página no encontrada" action={<Button onClick={() => navigate("/inicio")}>Ir al inicio</Button>} /></AppShell>
    );
  }

  return (
    <>
      <div key={path} className="animate-page">{page}</div>
      <PushBanner path={path} />
      {toastMsg && (
        <div className="animate-toast fixed left-1/2 top-4 z-[60] w-[min(92vw,460px)] rounded-2xl bg-ink px-5 py-3.5 text-center text-[15px] font-semibold text-white shadow-2xl" role="status">
          {toastMsg}
        </div>
      )}
    </>
  );
}

/** Notificación emergente (estilo celular) cuando llega algo nuevo en tiempo real */
function PushBanner({ path }: { path: string }) {
  const { notifications, account } = useStore();
  const seen = useRef<Set<string> | null>(null);
  const [show, setShow] = useState<Notification | null>(null);
  useEffect(() => { seen.current = null; }, [account?.id]);
  useEffect(() => {
    if (!account) return;
    if (!seen.current) { seen.current = new Set(notifications.map((n) => n.id)); return; }
    const fresh = notifications.filter((n) => !seen.current!.has(n.id));
    fresh.forEach((n) => seen.current!.add(n.id));
    const n = fresh.find((x) => !x.read && !(x.link && x.link === path));
    if (!n) return;
    setShow(n);
    try { navigator.vibrate?.(80); } catch { /* */ }
    const t = setTimeout(() => setShow((c) => (c?.id === n.id ? null : c)), 5000);
    return () => clearTimeout(t);
  }, [notifications]);
  if (!show) return null;
  return (
    <button
      onClick={() => { setShow(null); if (show.link) navigate(show.link); }}
      className="animate-toast fixed left-1/2 top-3 z-[70] flex w-[min(94vw,420px)] items-start gap-3 rounded-3xl bg-white/95 p-3.5 text-left shadow-[0_18px_50px_-12px_rgba(20,30,90,.45)] ring-1 ring-line backdrop-blur"
    >
      <img src="img/logo.png" alt="" className="h-10 w-10 shrink-0 rounded-xl bg-brand-50 p-1" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-soft"><span className="flex items-center gap-1"><LuBell className="h-3.5 w-3.5" /> ConectaPRO</span><span>ahora</span></div>
        <div className="mt-0.5 text-[14px] font-semibold leading-snug text-ink">{show.text}</div>
      </div>
    </button>
  );
}

function Splash({ error }: { error?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
      <img src="img/logo.png" alt="" className={error ? "h-20 w-20" : "h-20 w-20 animate-pulse"} />
      <div className="text-2xl font-extrabold">Conecta<span className="text-brand-blue">+</span><span className="text-brand-gradient">PRO</span></div>
      {error ? (
        <>
          <p className="max-w-sm text-ink-soft">No pudimos conectar con el servidor: <b className="text-ink">{error}</b></p>
          <Button icon={LuRefreshCw} onClick={() => location.reload()}>Reintentar</Button>
        </>
      ) : <p className="text-ink-soft">Conectando con la base de datos…</p>}
    </div>
  );
}

function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="card max-w-lg p-8 text-center">
        <LuDatabase className="mx-auto h-12 w-12 text-brand" />
        <h1 className="mt-4 text-2xl font-extrabold">Falta conectar la base de datos</h1>
        <p className="mt-2 text-ink-soft">Edita el archivo <code className="rounded bg-surface px-1.5">config.js</code> con la URL y la clave pública (anon) de tu proyecto de Supabase. Los pasos están en el README del repositorio.</p>
      </div>
    </div>
  );
}
