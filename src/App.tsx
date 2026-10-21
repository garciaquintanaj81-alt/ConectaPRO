import { LuTriangleAlert, LuRefreshCw } from "react-icons/lu";
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
import { useEffect } from "react";

type Route = [string, (p: Record<string, string>) => JSX.Element];

export default function App() {
  const path = useRoute();
  const { db, mode, strikes, toastMsg, reset } = useStore();
  const logged = !!db.session;
  const isPublic = path === "/" || path === "/login" || path === "/registro";

  // Redirecciones de sesión
  useEffect(() => {
    if (!logged && !isPublic) navigate("/", true);
    if (logged && (path === "/" || path === "/login")) navigate("/inicio", true);
  }, [logged, path]);

  const routes: Route[] = [
    ["/", () => <Welcome />],
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
        <Empty icon={LuTriangleAlert} title="Cuenta suspendida" text="Acumulaste 3 faltas graves. Por la seguridad de la comunidad tu cuenta fue suspendida. (En esta demo puedes restablecer los datos.)"
          action={<Button icon={LuRefreshCw} onClick={() => { reset(); navigate("/", true); }}>Restablecer demo</Button>} />
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
      {toastMsg && (
        <div className="animate-toast fixed left-1/2 top-4 z-[60] w-[min(92vw,460px)] rounded-2xl bg-ink px-5 py-3.5 text-center text-[15px] font-semibold text-white shadow-2xl" role="status">
          {toastMsg}
        </div>
      )}
    </>
  );
}
