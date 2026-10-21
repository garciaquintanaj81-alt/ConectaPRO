import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowLeft, LuPhone, LuVideo, LuCirclePlus, LuImage, LuMic, LuCheckCheck, LuSend, LuSettings, LuUserRound,
  LuCreditCard, LuMapPin, LuShieldCheck, LuBell, LuLifeBuoy, LuLogOut, LuChevronRight, LuGift, LuArrowLeftRight,
  LuRefreshCw, LuMessageCircleMore, LuSearch, LuBrain, LuBadgeCheck, LuTriangleAlert, LuStar, LuRepeat, LuHandshake,
  LuTicket, LuAward, LuCircleCheck, LuBriefcase, LuStore, LuInfo, LuTrash2, LuPlus, LuWallet, LuBanknote,
} from "react-icons/lu";
import { AppShell } from "../Layout";
import { useStore } from "../store";
import { Link, goBack, navigate } from "../router";
import { Avatar, Badge, Button, Chip, Empty, Field, Modal, PageHeader, Toggle, clock, cx, inputCls, timeAgo, SERVICE_ICON } from "../ui";
import { CITIES, SERVICES, ServiceId, serviceById } from "../data";

// =====================================================================
//  Mensajes: lista (móvil) / dos paneles (computador)
// =====================================================================
export function Messages({ activeId }: { activeId?: string }) {
  const { chats } = useStore();
  const [q, setQ] = useState("");
  const sorted = [...chats]
    .filter((c) => c.peerName.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));
  const active = chats.find((c) => c.id === activeId);

  const list = (
    <div className="space-y-2">
      <label className="mb-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
        <LuSearch className="h-5 w-5 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversación" className={inputCls} />
      </label>
      {sorted.map((c) => {
        const last = c.messages.at(-1);
        return (
          <Link key={c.id} to={"/chat/" + c.id} className={cx("flex items-center gap-3 rounded-2xl p-3 transition", c.id === activeId ? "bg-brand-50" : "hover:bg-white")}>
            <Avatar name={c.peerName} photo={c.peerPhoto} size={54} dot="on" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="truncate font-bold">{c.peerName}</span><span className="shrink-0 text-xs text-ink-soft">{last ? clock(last.at) : ""}</span></div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-ink-soft">{last ? (last.image ? "📷 Foto" : last.text) : c.peerRole}</span>
                {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
              </div>
            </div>
          </Link>
        );
      })}
      {sorted.length === 0 && <p className="p-6 text-center text-ink-soft">No hay conversaciones.</p>}
    </div>
  );

  if (activeId) {
    return (
      <AppShell hideNav wide>
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="hidden lg:block">
            <h1 className="mb-4 text-2xl font-extrabold">Mensajes</h1>
            {list}
          </div>
          {active ? <ChatPanel convId={active.id} /> : <Empty icon={LuMessageCircleMore} title="Conversación no encontrada" />}
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell wide>
      <PageHeader title="Mensajes" back={false} />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {list}
        <div className="hidden lg:block"><Empty icon={LuMessageCircleMore} title="Selecciona una conversación" text="Aquí verás tus chats con clientes y proveedores." /></div>
      </div>
    </AppShell>
  );
}

function ChatPanel({ convId }: { convId: string }) {
  const { chats, sendMessage, markConversationRead, toast, getProvider } = useStore();
  const c = chats.find((x) => x.id === convId)!;
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const count = c.messages.length;

  useEffect(() => { if (c.unread) markConversationRead(c.id); }, [count]);
  useEffect(() => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [count, typing]);
  useEffect(() => {
    const last = c.messages.at(-1);
    if (last?.from === "me" && Date.now() - last.at < 3000) { setTyping(true); const t = setTimeout(() => setTyping(false), 1700); return () => clearTimeout(t); }
    setTyping(false);
  }, [count]);

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    sendMessage(c.id, { text: text.trim() });
    setText("");
  };
  const provider = getProvider(c.peerKey);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface lg:static lg:z-auto lg:card lg:h-[calc(100vh-150px)] lg:overflow-hidden">
      <header className="flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:border-b lg:border-line">
        <button onClick={() => goBack("/mensajes")} className="rounded-full p-1.5 hover:bg-surface lg:hidden" aria-label="Volver"><LuArrowLeft className="h-7 w-7" /></button>
        <Link to={provider ? "/proveedor/" + provider.id : "#"} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={c.peerName} photo={c.peerPhoto} size={52} dot="on" />
          <div className="min-w-0"><div className="truncate text-lg font-extrabold">{c.peerName}</div><div className="text-sm text-ink-soft">{typing ? "Escribiendo…" : "En línea"}</div></div>
        </Link>
        <button onClick={() => toast("Llamada de voz (simulada)")} className="rounded-full p-2.5 text-brand-blue hover:bg-brand-50" aria-label="Llamar"><LuPhone className="h-6 w-6 fill-brand-blue" /></button>
        <button onClick={() => toast("Videollamada (simulada)")} className="rounded-full p-2.5 text-brand hover:bg-brand-50" aria-label="Videollamada"><LuVideo className="h-7 w-7 fill-brand" /></button>
      </header>

      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {c.messages.length === 0 && <p className="py-10 text-center text-ink-soft">Inicia la conversación con {c.peerName.split(" ")[0]} 👋</p>}
        {c.messages.map((m) => m.from === "system" ? (
          <div key={m.id} className="flex justify-center"><span className="rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand">{m.text}</span></div>
        ) : m.from === "me" ? (
          <div key={m.id} className="flex flex-col items-end">
            {m.image ? <img src={m.image} alt="Foto enviada" className="max-w-[78%] rounded-3xl sm:max-w-sm" /> : (
              <div className="max-w-[78%] rounded-3xl rounded-br-lg bg-[#1f7cf2] px-5 py-3.5 text-[17px] leading-snug text-white sm:max-w-md">{m.text}</div>
            )}
            <div className="mt-1 flex items-center gap-1 text-sm text-ink-soft">{clock(m.at)} <LuCheckCheck className="h-4 w-4 text-brand" /></div>
          </div>
        ) : (
          <div key={m.id} className="flex items-start gap-3">
            <Avatar name={c.peerName} photo={c.peerPhoto} size={44} className="hidden sm:block" />
            <div className="max-w-[78%] sm:max-w-md">
              {m.image ? <img src={m.image} alt="" className="rounded-3xl" /> : <div className="rounded-3xl rounded-tl-lg bg-[#e9ecf8] px-5 py-3.5 text-[17px] leading-snug">{m.text}</div>}
              <div className="mt-1 text-sm text-ink-soft">{clock(m.at)}</div>
            </div>
          </div>
        ))}
        {typing && <div className="flex items-center gap-1 pl-14"><span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft/60" /><span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft/60 [animation-delay:.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-ink-soft/60 [animation-delay:.3s]" /></div>}
      </div>

      <form onSubmit={send} className="flex items-center gap-3 bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6 lg:border-t lg:border-line">
        <button type="button" onClick={() => file.current?.click()} aria-label="Adjuntar" className="text-ink"><LuCirclePlus className="h-8 w-8" strokeWidth={1.5} /></button>
        <div className="flex flex-1 items-center rounded-full bg-[#eef0f8] px-5">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje..." className="w-full bg-transparent py-3.5 text-[17px] outline-none placeholder:text-ink-soft" />
          <button type="button" onClick={() => file.current?.click()} aria-label="Enviar imagen"><LuImage className="h-6 w-6" /></button>
        </div>
        {text.trim() ? (
          <button type="submit" aria-label="Enviar" className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-brand"><LuSend className="h-5 w-5" /></button>
        ) : (
          <button type="button" onClick={() => toast("Nota de voz (simulada)")} aria-label="Nota de voz" className="text-brand"><LuMic className="h-8 w-8" /></button>
        )}
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            const img = new Image();
            img.onload = () => {
              const k = Math.min(1, 600 / Math.max(img.width, img.height));
              const cv = document.createElement("canvas"); cv.width = img.width * k; cv.height = img.height * k;
              cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
              sendMessage(c.id, { image: cv.toDataURL("image/jpeg", 0.75) });
            };
            img.src = r.result as string;
          };
          r.readAsDataURL(f); e.target.value = "";
        }} />
      </form>
    </div>
  );
}

// =====================================================================
//  Mi perfil
// =====================================================================
export function Profile() {
  const { account, mode, setMode, myProvider, logout, strikes, points, toast } = useStore();
  const [confirmOut, setConfirmOut] = useState(false);
  if (!account) return null;
  const items = [
    [LuUserRound, "Información personal", "/perfil/info"],
    ...(mode === "cliente" ? [[LuBriefcase, "Mis solicitudes", "/solicitudes"]] : [[LuStore, "Mi servicio", "/mi-servicio"], [LuBriefcase, "Mis trabajos", "/trabajos"]]),
    [LuCreditCard, "Métodos de pago", "/perfil/pagos"],
    [LuMapPin, "Direcciones guardadas", "/perfil/direcciones"],
    [LuShieldCheck, "Seguridad y privacidad", "/perfil/seguridad"],
    [LuGift, "Beneficios y aliados", "/perfil/beneficios"],
    [LuBell, "Notificaciones", "/perfil/notificaciones"],
    [LuLifeBuoy, "Ayuda y soporte", "/perfil/ayuda"],
  ] as [any, string, string][];

  const switchMode = () => {
    if (mode === "cliente" && !myProvider) return navigate("/mi-servicio");
    setMode(mode === "cliente" ? "proveedor" : "cliente");
    toast(`Ahora estás en modo ${mode === "cliente" ? "proveedor" : "cliente"}`);
    navigate("/inicio");
  };

  return (
    <AppShell>
      <PageHeader title="Mi perfil" back={false} right={<Link to="/perfil/notificaciones" className="block rounded-full p-2 hover:bg-white" aria-label="Configuración"><LuSettings className="h-8 w-8" /></Link>} />
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="text-center lg:card lg:self-start lg:p-8">
          <Avatar name={account.name} photo={account.photo} size={180} className="mx-auto" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{account.name}</h1>
          <div className="text-xl text-ink-soft">{mode === "cliente" ? "Cliente" : "Proveedor"}</div>
          <div className="mt-4 flex justify-center gap-2">
            <Badge tone="ok" icon={LuBadgeCheck}>Identidad verificada</Badge>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/perfil/beneficios" className="rounded-2xl bg-[#fff6e5] p-3"><div className="text-2xl font-extrabold text-[#9a5b00]">{points}</div><div className="text-xs font-semibold text-[#9a5b00]">Puntos</div></Link>
            <Link to="/perfil/seguridad" className={cx("rounded-2xl p-3", strikes ? "bg-bad-50" : "bg-ok-50")}><div className={cx("text-2xl font-extrabold", strikes ? "text-bad" : "text-ok")}>{strikes}/3</div><div className={cx("text-xs font-semibold", strikes ? "text-bad" : "text-ok")}>Faltas graves</div></Link>
          </div>
          <button onClick={switchMode} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 py-3.5 font-bold text-white shadow-brand">
            <LuArrowLeftRight className="h-5 w-5" /> {mode === "cliente" ? (myProvider ? "Cambiar a modo proveedor" : "Quiero ofrecer un servicio") : "Cambiar a modo cliente"}
          </button>
        </div>
        <div className="space-y-3">
          {items.map(([I, label, to]) => (
            <Link key={label} to={to} className="flex items-center gap-5 rounded-3xl bg-white/90 p-3 pr-5 shadow-[0_4px_18px_-12px_rgba(30,40,120,.2)] ring-1 ring-line/60 transition hover:ring-brand/30">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef0fb]"><I className="h-8 w-8" strokeWidth={1.6} /></span>
              <span className="flex-1 text-lg font-medium">{label}</span>
              <LuChevronRight className="h-6 w-6" />
            </Link>
          ))}
          <button onClick={() => setConfirmOut(true)} className="flex w-full items-center gap-5 rounded-3xl bg-white/90 p-3 pr-5 text-left shadow-[0_4px_18px_-12px_rgba(30,40,120,.2)] ring-1 ring-line/60 hover:ring-bad/30">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef0fb]"><LuLogOut className="h-8 w-8" strokeWidth={1.6} /></span>
            <span className="flex-1 text-lg font-medium">Cerrar sesión</span>
            <LuChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
      <Modal open={confirmOut} onClose={() => setConfirmOut(false)} title="¿Cerrar sesión?">
        <p className="text-ink-soft">Podrás volver a ingresar cuando quieras.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirmOut(false)}>Cancelar</Button>
          <Button variant="dark" onClick={() => { logout(); navigate("/", true); }}>Cerrar sesión</Button>
        </div>
      </Modal>
    </AppShell>
  );
}

// =====================================================================
//  Secciones del perfil
// =====================================================================
export function ProfileSection({ section }: { section: string }) {
  const content: Record<string, [string, () => JSX.Element]> = {
    info: ["Información personal", PersonalInfo],
    pagos: ["Métodos de pago", Payments],
    direcciones: ["Direcciones guardadas", Addresses],
    seguridad: ["Seguridad y privacidad", Security],
    beneficios: ["Beneficios y aliados", Benefits],
    notificaciones: ["Notificaciones", NotifPrefs],
    ayuda: ["Ayuda y soporte", Help],
  };
  const [title, Comp] = content[section] ?? ["Perfil", () => <Empty icon={LuInfo} title="Sección no encontrada" />];
  return (
    <AppShell>
      <PageHeader title={title} back="/perfil" />
      <div className="mx-auto max-w-2xl"><Comp /></div>
    </AppShell>
  );
}

function PersonalInfo() {
  const { account, updateAccount, toast } = useStore();
  const [f, setF] = useState({ name: account!.name, email: account!.email, phone: account!.phone, city: account!.city });
  return (
    <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); updateAccount(f); toast("Datos actualizados"); }}>
      <Field label="Nombre completo"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Documento (no editable)"><input className={cx(inputCls, "text-ink-soft")} value={account!.document} readOnly /></Field>
      <Field label="Correo electrónico"><input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Celular"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <Field label="Ciudad"><select className={inputCls} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Button type="submit" className="w-full">Guardar cambios</Button>
    </form>
  );
}

function Payments() {
  const { toast } = useStore();
  const [list, setList] = useState([
    { icon: LuBanknote, name: "Efectivo", sub: "Pago al finalizar el servicio", def: true },
    { icon: LuWallet, name: "Nequi", sub: "•••• 6543" },
    { icon: LuCreditCard, name: "Tarjeta débito", sub: "Visa •••• 4821" },
  ]);
  return (
    <div className="space-y-3">
      {list.map((m, i) => (
        <div key={m.name} className="card flex items-center gap-4 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand"><m.icon className="h-6 w-6" /></span>
          <div className="flex-1"><div className="font-bold">{m.name}</div><div className="text-sm text-ink-soft">{m.sub}</div></div>
          {m.def ? <Badge tone="ok">Predeterminado</Badge> : <button onClick={() => setList(list.map((x, k) => ({ ...x, def: k === i })))} className="text-sm font-semibold text-brand">Usar</button>}
        </div>
      ))}
      <Button variant="soft" icon={LuPlus} className="w-full" onClick={() => toast("Pasarela de pagos disponible en la versión final")}>Agregar método de pago</Button>
    </div>
  );
}

function Addresses() {
  const [list, setList] = useState([{ n: "Casa", a: "Cra. 50 #45-20, Rionegro" }, { n: "Oficina", a: "Calle 49 #50-12, Rionegro" }]);
  const [n, setN] = useState(""); const [a, setA] = useState("");
  return (
    <div className="space-y-3">
      {list.map((x, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand"><LuMapPin className="h-6 w-6" /></span>
          <div className="flex-1"><div className="font-bold">{x.n}</div><div className="text-sm text-ink-soft">{x.a}</div></div>
          <button onClick={() => setList(list.filter((_, k) => k !== i))} aria-label="Eliminar" className="p-2 text-bad"><LuTrash2 className="h-5 w-5" /></button>
        </div>
      ))}
      <form className="card space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); if (n && a) { setList([...list, { n, a }]); setN(""); setA(""); } }}>
        <div className="font-bold">Nueva dirección</div>
        <input value={n} onChange={(e) => setN(e.target.value)} placeholder="Nombre (ej. Casa de mamá)" className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line" />
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Dirección" className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line" />
        <Button type="submit" className="w-full">Guardar dirección</Button>
      </form>
    </div>
  );
}

function Security() {
  const { strikes, reset, toast } = useStore();
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-3"><LuTriangleAlert className={cx("h-7 w-7", strikes ? "text-bad" : "text-ok")} /><h2 className="text-xl font-extrabold">Regla de “Tres Strikes”</h2></div>
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((i) => <div key={i} className={cx("h-3 flex-1 rounded-full", i < strikes ? "bg-bad" : "bg-ok-50")} />)}
        </div>
        <p className="mt-2 font-bold">{strikes}/3 faltas graves</p>
        <p className="mt-2 text-sm text-ink-soft">Una falta grave es no realizar un trabajo acordado (proveedor) o no pagar un servicio recibido (cliente). Al acumular tres, la cuenta podrá ser suspendida definitivamente para proteger la confianza de la comunidad.</p>
      </div>
      <div className="card space-y-3 p-6">
        <div className="flex items-center gap-3"><LuBadgeCheck className="h-6 w-6 text-ok" /><div><div className="font-bold">Identidad verificada</div><div className="text-sm text-ink-soft">Reconocimiento facial completado</div></div></div>
        <div className="flex items-center gap-3"><LuShieldCheck className="h-6 w-6 text-brand" /><div><div className="font-bold">Habeas Data</div><div className="text-sm text-ink-soft">Tus datos se tratan conforme a la Ley 1581 de 2012</div></div></div>
        <Button variant="outline" className="w-full" onClick={() => toast("Te enviamos un correo para cambiar tu contraseña (simulado)")}>Cambiar contraseña</Button>
      </div>
      <div className="card p-6">
        <div className="font-bold">Datos de la demostración</div>
        <p className="mt-1 text-sm text-ink-soft">Restablece el prototipo a su estado inicial (borra solicitudes, mensajes y cuentas creadas).</p>
        <Button variant="danger" icon={LuRefreshCw} className="mt-4 w-full" onClick={() => { reset(); navigate("/", true); }}>Restablecer demo</Button>
      </div>
    </div>
  );
}

const ALLIES = [
  { brand: "Homecenter", offer: "10% en herramientas y materiales", cost: 300, color: "bg-[#fff1e0] text-[#c2410c]" },
  { brand: "Juan Valdez", offer: "Café gratis por tu buena reputación", cost: 150, color: "bg-[#f3eadf] text-[#7c4a1e]" },
  { brand: "Rappi", offer: "Envío gratis en tu próximo pedido", cost: 200, color: "bg-[#ffe7e3] text-[#e11d48]" },
  { brand: "Cine Colombia", offer: "2x1 en boletas de lunes a jueves", cost: 400, color: "bg-[#e8ecff] text-brand" },
];

function Benefits() {
  const { points, redeem, toast } = useStore();
  const level = points >= 500 ? "Oro" : points >= 250 ? "Plata" : "Bronce";
  const next = points >= 500 ? null : points >= 250 ? 500 : 250;
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#2463ff] via-[#4b3cf3] to-[#8a2cf0] p-6 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><LuAward className="h-5 w-5" /> Nivel {level}</div>
        <div className="mt-1 text-5xl font-extrabold">{points}<span className="text-xl font-semibold"> puntos</span></div>
        {next && <><div className="mt-4 h-2 rounded-full bg-white/30"><div className="h-2 rounded-full bg-white" style={{ width: `${(points / next) * 100}%` }} /></div><div className="mt-1 text-sm opacity-90">Te faltan {next - points} puntos para el siguiente nivel</div></>}
        <p className="mt-4 text-sm opacity-90">Ganas puntos al calificar, cumplir tus acuerdos y mantener buena reputación.</p>
      </div>
      <h2 className="pt-2 text-xl font-extrabold">Beneficios con marcas aliadas</h2>
      {ALLIES.map((a) => (
        <div key={a.brand} className="card flex items-center gap-4 p-4">
          <span className={cx("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold", a.color)}>{a.brand[0]}</span>
          <div className="flex-1"><div className="font-bold">{a.brand}</div><div className="text-sm text-ink-soft">{a.offer}</div></div>
          <Button variant={points >= a.cost ? "primary" : "soft"} disabled={points < a.cost} className="px-4 py-2.5 text-sm" icon={LuTicket}
            onClick={() => { redeem(a.cost); toast(`¡Cupón de ${a.brand} redimido! Código: CP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`); }}>{a.cost}</Button>
        </div>
      ))}
      <p className="text-center text-xs text-ink-soft">Marcas mostradas solo como ejemplo de posibles convenios.</p>
    </div>
  );
}

function NotifPrefs() {
  const { account, db, setPrefs, toast } = useStore();
  const p = db.prefs[account!.id] ?? { push: true, email: true, ia: true };
  const rows: [keyof typeof p, string, string][] = [
    ["push", "Notificaciones en tiempo real", "Alertas de nuevas oportunidades, postulaciones y mensajes"],
    ["email", "Correo electrónico", "Resumen de acuerdos y contratos digitales"],
    ["ia", "Recomendaciones inteligentes", "Sugerencias basadas en tus servicios recurrentes"],
  ];
  return (
    <div className="card divide-y divide-line">
      {rows.map(([k, t, d]) => (
        <div key={k} className="flex items-center gap-4 p-5">
          <div className="flex-1"><div className="font-bold">{t}</div><div className="text-sm text-ink-soft">{d}</div></div>
          <Toggle on={p[k]} onChange={(v) => { setPrefs({ ...p, [k]: v }); toast("Preferencia guardada"); }} label={t} />
        </div>
      ))}
    </div>
  );
}

function Help() {
  const faqs = [
    ["¿Cómo funciona el emparejamiento?", "Cuando publicas una solicitud, el algoritmo cruza la categoría del servicio, tu ubicación GPS y la zona de cobertura y horario de cada proveedor. Solo los compatibles reciben la alerta; luego ves sus postulaciones ordenadas por calificación."],
    ["¿Qué es un acuerdo digital?", "Es un contrato automático que registra el servicio, la fecha, el costo y el método de pago acordados, para dar seguridad a ambas partes."],
    ["¿Qué pasa si el proveedor llega tarde?", "Si no es urgente puedes darle hasta 2 días más; el retraso queda registrado en su reputación. Si es urgente puedes cancelar sin penalidad."],
    ["¿Qué es el match por trueque?", "Una opción para intercambiar habilidades sin dinero, por ejemplo arreglar un computador a cambio de pasear un perro."],
    ["¿Puedo ser cliente y proveedor?", "Sí. ConectaPRO usa roles dinámicos: cambias de modo desde tu perfil o el menú lateral."],
  ];
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {faqs.map(([q, a], i) => (
        <button key={q} onClick={() => setOpen(open === i ? -1 : i)} className="card block w-full p-5 text-left">
          <div className="flex items-center justify-between gap-4 font-bold">{q}<LuChevronRight className={cx("h-5 w-5 shrink-0 transition", open === i && "rotate-90")} /></div>
          {open === i && <p className="animate-fade-up mt-2 text-ink-soft">{a}</p>}
        </button>
      ))}
      <a href="mailto:soporte@conectapro.co"><Button variant="soft" className="mt-2 w-full">Escribir a soporte</Button></a>
    </div>
  );
}

// =====================================================================
//  Notificaciones
// =====================================================================
const N_ICON = { match: LuSearch, agreement: LuHandshake, rating: LuStar, ia: LuBrain, info: LuInfo, strike: LuTriangleAlert, message: LuMessageCircleMore };
export function Notifications() {
  const { notifications, markNotificationsRead } = useStore();
  useEffect(() => { const t = setTimeout(markNotificationsRead, 1500); return () => clearTimeout(t); }, []);
  return (
    <AppShell>
      <PageHeader title="Notificaciones" back="/inicio" />
      <div className="mx-auto max-w-2xl space-y-3">
        {notifications.map((n) => {
          const I = N_ICON[n.kind];
          return (
            <Link key={n.id} to={n.link ?? "/inicio"} className={cx("card flex items-start gap-4 p-4", !n.read && "ring-2 ring-brand/30")}>
              <span className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", n.kind === "strike" ? "bg-bad-50 text-bad" : "bg-brand-50 text-brand")}><I className="h-6 w-6" /></span>
              <div className="flex-1"><p className="font-medium">{n.text}</p><div className="mt-1 text-sm text-ink-soft">{timeAgo(n.at)}</div></div>
              {!n.read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
        {notifications.length === 0 && <Empty icon={LuBell} title="Sin notificaciones" />}
      </div>
    </AppShell>
  );
}

// =====================================================================
//  Match por trueque
// =====================================================================
const BARTER_USERS = [
  { name: "Camilo Rojas", photo: undefined, offers: "computadores" as ServiceId, needs: "paseo" as ServiceId, note: "Arreglo tu computador si paseas a mi perro Toby 2 veces." },
  { name: "Valentina Díaz", photo: undefined, offers: "paseo" as ServiceId, needs: "computadores" as ServiceId, note: "Paseo a tu perro a cambio de formatear mi portátil." },
  { name: "Sofía Herrera", photo: undefined, offers: "peluqueria" as ServiceId, needs: "pintura" as ServiceId, note: "Corte de cabello a cambio de pintar mi local." },
  { name: "Luis Gómez", photo: "img/luis.jpg", offers: "pintura" as ServiceId, needs: "peluqueria" as ServiceId, note: "Pinto una habitación a cambio de cortes para mi familia." },
  { name: "Andrés Torres", photo: "img/andres.jpg", offers: "electricidad" as ServiceId, needs: "limpieza" as ServiceId, note: "Instalo lámparas a cambio de una limpieza profunda." },
  { name: "Marta Ruiz", photo: undefined, offers: "limpieza" as ServiceId, needs: "electricidad" as ServiceId, note: "Limpio tu casa a cambio de revisar mi instalación eléctrica." },
];

export function Barter() {
  const { openConversation, toast } = useStore();
  const [offer, setOffer] = useState<ServiceId>("computadores");
  const [need, setNeed] = useState<ServiceId>("paseo");
  const matches = useMemo(() => {
    const perfect = BARTER_USERS.filter((u) => u.offers === need && u.needs === offer);
    const partial = BARTER_USERS.filter((u) => !perfect.includes(u) && (u.offers === need || u.needs === offer));
    return { perfect, partial };
  }, [offer, need]);
  const sel = "mt-1 w-full rounded-2xl bg-white px-4 py-3.5 font-normal outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50";
  const Card = ({ u, perfect }: { u: typeof BARTER_USERS[number]; perfect?: boolean }) => {
    const O = SERVICE_ICON[u.offers], N = SERVICE_ICON[u.needs];
    return (
      <div className="card animate-fade-up p-5">
        <div className="flex items-center gap-3">
          <Avatar name={u.name} photo={u.photo} size={52} />
          <div className="flex-1"><div className="font-extrabold">{u.name}</div>{perfect ? <Badge tone="ok" icon={LuCircleCheck}>Match perfecto</Badge> : <Badge tone="warn">Match parcial</Badge>}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-ok-50 p-3"><div className="text-xs font-bold text-ok">OFRECE</div><div className="mt-1 flex items-center gap-1.5 font-semibold"><O className="h-4 w-4" />{serviceById(u.offers).short}</div></div>
          <div className="rounded-2xl bg-brand-50 p-3"><div className="text-xs font-bold text-brand">NECESITA</div><div className="mt-1 flex items-center gap-1.5 font-semibold"><N className="h-4 w-4" />{serviceById(u.needs).short}</div></div>
        </div>
        <p className="mt-3 text-sm text-ink-soft">“{u.note}”</p>
        <Button variant={perfect ? "primary" : "soft"} className="mt-4 w-full" icon={LuRepeat} onClick={() => { const id = openConversation("trueque-" + u.name, u.name, "Trueque", u.photo); toast("¡Propuesta de trueque enviada!"); navigate("/chat/" + id); }}>Proponer trueque</Button>
      </div>
    );
  };
  return (
    <AppShell>
      <PageHeader title="Match por trueque" back="/explorar" sub="Intercambia habilidades sin usar dinero" />
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Yo ofrezco
          <select value={offer} onChange={(e) => setOffer(e.target.value as ServiceId)} className={sel}>{SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </label>
        <label className="block text-sm font-semibold">Yo necesito
          <select value={need} onChange={(e) => setNeed(e.target.value as ServiceId)} className={sel}>{SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </label>
      </div>
      <h2 className="mb-3 mt-6 text-xl font-extrabold">Personas compatibles</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {matches.perfect.map((u) => <Card key={u.name} u={u} perfect />)}
        {matches.partial.map((u) => <Card key={u.name} u={u} />)}
      </div>
      {matches.perfect.length + matches.partial.length === 0 && <Empty icon={LuRepeat} title="Aún no hay coincidencias" text="Prueba con otras habilidades. Te avisaremos cuando aparezca alguien compatible." />}
    </AppShell>
  );
}
