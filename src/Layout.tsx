// Estructura responsiva:
//  - Móvil / tablet: barra de navegación inferior con botón central "Publicar"
//  - Computador (lg+): menú lateral fijo + barra superior
import { ReactNode } from "react";
import {
  LuHouse, LuSearch, LuPlus, LuMessageCircleMore, LuUserRound, LuClipboardList, LuBell, LuMapPin,
  LuBriefcase, LuRepeat, LuArrowLeftRight, LuLifeBuoy, LuGift, LuChevronDown,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { useStore } from "./store";
import { Link, navigate, useRoute } from "./router";
import { Avatar, Logo, cx } from "./ui";

interface NavItem { to: string; label: string; icon: IconType; match?: string[] }

export function useNav() {
  const { mode } = useStore();
  const client: NavItem[] = [
    { to: "/inicio", label: "Inicio", icon: LuHouse },
    { to: "/explorar", label: "Explorar", icon: LuSearch, match: ["/explorar", "/proveedor/"] },
    { to: "/publicar", label: "Publicar", icon: LuPlus },
    { to: "/mensajes", label: "Mensajes", icon: LuMessageCircleMore, match: ["/mensajes", "/chat/"] },
    { to: "/perfil", label: "Mi perfil", icon: LuUserRound, match: ["/perfil"] },
  ];
  const provider: NavItem[] = [
    { to: "/inicio", label: "Inicio", icon: LuHouse },
    { to: "/oportunidades", label: "Oportunidades", icon: LuClipboardList, match: ["/oportunidad"] },
    { to: "/mi-servicio", label: "Publicar", icon: LuPlus },
    { to: "/mensajes", label: "Mensajes", icon: LuMessageCircleMore, match: ["/mensajes", "/chat/"] },
    { to: "/perfil", label: "Mi perfil", icon: LuUserRound, match: ["/perfil"] },
  ];
  return mode === "proveedor" ? provider : client;
}

const isActive = (path: string, item: NavItem) =>
  path === item.to || (item.match ?? []).some((m) => path.startsWith(m));

// ---------------------------------------------------------------------
function BottomNav() {
  const path = useRoute();
  const items = useNav();
  const { chats } = useStore();
  const unread = chats.reduce((s, c) => s + c.unread, 0);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="mx-auto max-w-2xl rounded-t-[28px] bg-white/95 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_-12px_rgba(30,40,120,.25)] backdrop-blur">
        <ul className="grid grid-cols-5 items-end">
          {items.map((it, i) => {
            const active = isActive(path, it);
            if (i === 2)
              return (
                <li key={it.to} className="flex flex-col items-center">
                  <Link to={it.to} className="-mt-9 mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient text-white shadow-brand ring-[6px] ring-surface transition active:scale-95">
                    <LuPlus className="h-8 w-8" strokeWidth={2.6} />
                  </Link>
                  <span className="text-xs font-medium text-ink-soft">{it.label}</span>
                </li>
              );
            return (
              <li key={it.to}>
                <Link to={it.to} className={cx("relative flex flex-col items-center gap-1 py-1 text-xs font-medium", active ? "text-brand" : "text-ink-soft")}>
                  <it.icon className={cx("h-7 w-7", active && "fill-brand/90 text-brand")} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="max-w-full truncate px-0.5 text-[11px] sm:text-xs">{it.label}</span>
                  {active && <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-brand" />}
                  {it.to === "/mensajes" && unread > 0 && (
                    <span className="absolute right-[22%] top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">{unread}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------
function Sidebar() {
  const path = useRoute();
  const items = useNav();
  const { mode, setMode, account, myProvider, chats, points, toast } = useStore();
  const unread = chats.reduce((s, c) => s + c.unread, 0);
  const extra: NavItem[] = mode === "cliente"
    ? [
        { to: "/solicitudes", label: "Mis solicitudes", icon: LuClipboardList, match: ["/solicitud", "/proveedores/", "/acuerdo/", "/calificar/", "/buscando/"] },
        { to: "/trueque", label: "Match por trueque", icon: LuRepeat },
      ]
    : [{ to: "/trabajos", label: "Mis trabajos", icon: LuBriefcase, match: ["/trabajo"] }];
  const all = [...items.slice(0, 2), ...extra, ...items.slice(2)];

  const switchMode = () => {
    if (mode === "cliente") {
      if (!myProvider) { navigate("/mi-servicio"); toast("Configura tu perfil de proveedor para empezar"); return; }
      setMode("proveedor");
    } else setMode("cliente");
    navigate("/inicio");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-white/80 px-5 py-6 backdrop-blur lg:flex">
      <Link to="/inicio"><Logo size="sm" /></Link>
      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
        {all.map((it) => {
          const active = isActive(path, it);
          const isPublish = it.icon === LuPlus;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cx(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition",
                isPublish ? "my-2 bg-brand-gradient text-white shadow-brand hover:brightness-110"
                  : active ? "bg-brand-50 text-brand" : "text-ink-soft hover:bg-surface hover:text-ink"
              )}
            >
              <it.icon className="h-5 w-5" />
              {isPublish ? (mode === "cliente" ? "Publicar solicitud" : "Mi servicio") : it.label}
              {it.to === "/mensajes" && unread > 0 && <span className="ml-auto rounded-full bg-bad px-2 text-xs font-bold text-white">{unread}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3">
        <Link to="/perfil/beneficios" className="flex items-center gap-3 rounded-2xl bg-[#fff6e5] px-4 py-3 text-sm font-semibold text-[#9a5b00]">
          <LuGift className="h-5 w-5" /> {points} puntos ConectaPRO
        </Link>
        <div className="rounded-3xl bg-surface p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Rol activo</div>
          <div className="mt-1 flex items-center gap-2 text-[15px] font-bold">
            {mode === "cliente" ? "Cliente" : "Proveedor"}
            <span className="h-2 w-2 rounded-full bg-ok" />
          </div>
          <button onClick={switchMode} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-brand ring-1 ring-line hover:ring-brand/40">
            <LuArrowLeftRight className="h-4 w-4" /> Cambiar a {mode === "cliente" ? "proveedor" : "cliente"}
          </button>
        </div>
        <Link to="/perfil/ayuda" className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink">
          <LuLifeBuoy className="h-5 w-5" /> Ayuda y soporte
        </Link>
        {account && <div className="px-4 text-[11px] text-ink-soft/80">Prototipo académico · UDES 2026</div>}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------
function TopBar() {
  const { account, mode, notifications, myProvider } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  if (!account) return null;
  return (
    <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-line bg-surface/85 px-8 py-3.5 backdrop-blur lg:flex">
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line">
        <LuMapPin className="h-4 w-4 text-brand-blue" />
        {mode === "proveedor" && myProvider ? `${myProvider.city} · cobertura ${myProvider.coverageKm} km` : account.city}
      </div>
      <div className="flex items-center gap-4">
        <Link to="/notificaciones" className="relative rounded-full bg-white p-2.5 ring-1 ring-line hover:ring-brand/40" aria-label="Notificaciones">
          <LuBell className="h-5 w-5" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">{unread}</span>}
        </Link>
        <Link to="/perfil" className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 hover:bg-white">
          <Avatar name={account.name} photo={account.photo} size={38} />
          <div className="leading-tight">
            <div className="text-sm font-bold">{account.name.split(" ").slice(0, 2).join(" ")}</div>
            <div className="text-xs text-ink-soft">{mode === "cliente" ? "Cliente" : "Proveedor"}</div>
          </div>
          <LuChevronDown className="h-4 w-4 text-ink-soft" />
        </Link>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------
//  Barra superior móvil (pantallas de inicio): logo + ubicación + campana
// ---------------------------------------------------------------------
export function MobileTopBar() {
  const { notifications } = useStore();
  const unread = notifications.some((n) => !n.read);
  return (
    <div className="mb-6 flex items-center justify-between lg:hidden">
      <Logo size="md" />
      <div className="flex items-center gap-2">
        <Link to="/perfil/direcciones" aria-label="Ubicación" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 ring-1 ring-line">
          <LuMapPin className="h-6 w-6" />
        </Link>
        <Link to="/notificaciones" aria-label="Notificaciones" className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/80 ring-1 ring-line">
          <LuBell className="h-6 w-6" />
          {unread && <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full bg-bad ring-2 ring-white" />}
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
export function AppShell({ children, hideNav, wide }: { children: ReactNode; hideNav?: boolean; wide?: boolean }) {
  return (
    <div className="relative min-h-screen">
      <div className="blobs" />
      <Sidebar />
      <div className="relative z-10 lg:pl-[264px]">
        <TopBar />
        <main className={cx("mx-auto w-full px-4 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8", wide ? "max-w-7xl" : "max-w-6xl", hideNav ? "pb-10" : "pb-32")}>
          {children}
        </main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
