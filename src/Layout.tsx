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
import { Avatar, Logo, TestBadge, cx } from "./ui";
import { ZonaChip } from "./zona";

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
  const { mode, setMode, myProvider, chats, toast } = useStore();
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

  const publish = all.find((it) => it.icon === LuPlus)!;
  const links = all.filter((it) => it.icon !== LuPlus);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-white px-4 py-6 lg:flex">
      <Link to="/inicio" className="px-2"><Logo size="sm" /></Link>
      <Link to={publish.to} className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-[15px] font-bold text-white shadow-brand hover:brightness-110">
        <LuPlus className="h-5 w-5" /> {mode === "cliente" ? "Publicar necesidad" : "Mi servicio"}
      </Link>
      <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto">
        {links.map((it) => {
          const active = isActive(path, it);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition",
                active ? "bg-brand-50 text-brand" : "text-ink-soft hover:bg-surface hover:text-ink"
              )}
            >
              <it.icon className="h-[18px] w-[18px]" />
              {it.label}
              {it.to === "/mensajes" && unread > 0 && <span className="ml-auto rounded-full bg-bad px-2 text-xs font-bold text-white">{unread}</span>}
            </Link>
          );
        })}
      </nav>

      <button onClick={switchMode} className="mt-4 flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left hover:border-brand/40">
        <LuArrowLeftRight className="h-[18px] w-[18px] text-brand" />
        <div className="leading-tight">
          <div className="text-[13px] font-bold">Modo {mode === "cliente" ? "cliente" : "proveedor"}</div>
          <div className="text-xs text-ink-soft">Cambiar a {mode === "cliente" ? "proveedor" : "cliente"}</div>
        </div>
      </button>
    </aside>
  );
}

// ---------------------------------------------------------------------
function TopBar() {
  const { account, mode, notifications, myProvider } = useStore();
  const unread = notifications.filter((n) => !n.read).length;
  if (!account) return null;
  return (
    <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-line bg-white/90 px-8 py-3 backdrop-blur lg:flex">
      {mode === "proveedor" && myProvider ? (
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line">
          <LuMapPin className="h-4 w-4 text-brand-blue" />{`${myProvider.city} · cobertura ${myProvider.coverageKm} km`}
        </div>
      ) : <ZonaChip className="max-w-md" />}
      <div className="flex items-center gap-4">
        {account.test && <TestBadge />}
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
  const { notifications, mode, account } = useStore();
  const unread = notifications.some((n) => !n.read);
  return (
    <div className="mb-6 lg:hidden">
    <div className="flex items-center justify-between">
      <Logo size="md" />
      <div className="flex items-center gap-2">
        <Link to="/notificaciones" aria-label="Notificaciones" className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/80 ring-1 ring-line">
          <LuBell className="h-6 w-6" />
          {unread && <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full bg-bad ring-2 ring-white" />}
        </Link>
      </div>
    </div>
    {(mode === "cliente" || account?.test) && (
      <div className="mt-3 flex items-center gap-2">
        {mode === "cliente" && <ZonaChip compact className="max-w-[70%]" />}
        {account?.test && <TestBadge />}
      </div>
    )}
    </div>
  );
}

// ---------------------------------------------------------------------
export function AppShell({ children, hideNav, wide }: { children: ReactNode; hideNav?: boolean; wide?: boolean }) {
  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <div className="relative z-10 lg:pl-[248px]">
        <TopBar />
        <main className={cx("mx-auto w-full px-4 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8", wide ? "max-w-7xl" : "max-w-6xl", hideNav ? "pb-10" : "pb-32")}>
          {children}
        </main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
