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
import { Avatar, Badge, Button, Chip, Empty, Field, Modal, PageHeader, TestBadge, Toggle, clock, cx, inputCls, timeAgo, SERVICE_ICON } from "../ui";
import { LuFlaskConical, LuScale, LuImageOff } from "react-icons/lu";
import { CATEGORIES, PAYMENTS, PaymentMethod, SERVICES, ServiceId, serviceById } from "../data";
import { UbicacionSelect } from "../geo";
import { useBusy } from "../store";
import { rpc } from "../api";

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
            <Avatar name={c.peerName} photo={c.peerPhoto} size={54} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5 truncate font-bold">{c.peerName}{c.peerTest && <TestBadge />}</span><span className="shrink-0 text-xs text-ink-soft">{last ? clock(last.at) : ""}</span></div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-ink-soft">{last ? (last.image ? "📷 Foto" : last.text) : c.peerRole}</span>
                {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
              </div>
            </div>
          </Link>
        );
      })}
      {sorted.length === 0 && <p className="p-6 text-center text-ink-soft">Todavía no tienes conversaciones. Aparecerán aquí cuando escribas a un proveedor o cliente.</p>}
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
          {active ? <ChatPanel convId={active.id} /> : <div className="card h-96 animate-pulse" />}
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
  const { chats, sendMessage, markConversationRead, toast } = useStore();
  const c = chats.find((x) => x.id === convId)!;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const typing = false;
  const scroller = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const count = c.messages.length;

  useEffect(() => { if (c.unread) markConversationRead(c.id); }, [count]);
  useEffect(() => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [count, typing]);
  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true); setText("");
    try { await sendMessage(c.id, { text: t }); } catch { setText(t); } finally { setSending(false); }
  };
  const provider = c.peerRole !== "Cliente" ? { id: c.peerKey } : null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface lg:static lg:z-auto lg:card lg:h-[calc(100vh-150px)] lg:overflow-hidden">
      <header className="flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:border-b lg:border-line">
        <button onClick={() => goBack("/mensajes")} className="rounded-full p-1.5 hover:bg-surface lg:hidden" aria-label="Volver"><LuArrowLeft className="h-7 w-7" /></button>
        <Link to={provider ? "/proveedor/" + provider.id : "#"} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={c.peerName} photo={c.peerPhoto} size={52} />
          <div className="min-w-0"><div className="flex items-center gap-2 truncate text-lg font-extrabold">{c.peerName}{c.peerTest && <TestBadge />}</div><div className="text-sm text-ink-soft">{c.peerRole}</div></div>
        </Link>
        <button onClick={() => toast("Las llamadas por la app estarán disponibles próximamente")} className="rounded-full p-2.5 text-brand-blue hover:bg-brand-50" aria-label="Llamar"><LuPhone className="h-6 w-6 fill-brand-blue" /></button>
        <button onClick={() => toast("Las videollamadas estarán disponibles próximamente")} className="rounded-full p-2.5 text-brand hover:bg-brand-50" aria-label="Videollamada"><LuVideo className="h-7 w-7 fill-brand" /></button>
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
          <button type="button" onClick={() => toast("Las notas de voz estarán disponibles próximamente")} aria-label="Nota de voz" className="text-brand"><LuMic className="h-8 w-8" /></button>
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

  const switchMode = async () => {
    if (mode === "cliente" && !myProvider) return navigate("/mi-servicio");
    await setMode(mode === "cliente" ? "proveedor" : "cliente");
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
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {account.verified ? <Badge tone="ok" icon={LuBadgeCheck}>Rostro validado al registrarse</Badge> : <Badge tone="soft">Sin validación facial</Badge>}
            {account.test && <TestBadge />}
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
          <Button variant="dark" onClick={() => logout().then(() => navigate("/", true))}>Cerrar sesión</Button>
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
  const [f, setF] = useState({ name: account!.name, phone: account!.phone });
  const [ubic, setUbic] = useState({ departamento: account!.departamento ?? "", municipio: account!.municipio ?? "" });
  const [busy, wrap] = useBusy();
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ubic.municipio) return toast("Selecciona tu departamento y municipio");
    wrap(async () => {
      await updateAccount({ name: f.name, phone: f.phone.replace(/\D/g, ""), ...ubic } as any);
      toast("Datos guardados");
    });
  };
  return (
    <div className="space-y-4">
      <ProfilePhoto />
      <form className="card space-y-4 p-6" onSubmit={save}>
        <Field label="Nombre completo"><input name="nombre" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Documento (no editable)"><input className={cx(inputCls, "text-ink-soft")} value={account!.document} readOnly /></Field>
        <Field label="Correo electrónico (no editable)"><input className={cx(inputCls, "text-ink-soft")} value={account!.email} readOnly /></Field>
        <Field label="Celular"><input name="celular" inputMode="numeric" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <UbicacionSelect value={ubic} onChange={setUbic} />
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Guardando…" : "Guardar cambios"}</Button>
      </form>
    </div>
  );
}

/** Foto de perfil guardada en Supabase Storage: subir, cambiar, eliminar y elegir quién la ve */
function ProfilePhoto() {
  const { account, uploadPhoto, deletePhoto, setPhotoPrivacy, toast } = useStore();
  const [busy, wrap] = useBusy();
  const [confirm, setConfirm] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  if (!account) return null;
  const has = !!account.photo;
  const pick = (fl: File) => wrap(async () => {
    if (!/^image\//.test(fl.type)) { toast("Elige un archivo de imagen"); return; }
    if (fl.size > 15 * 1024 * 1024) { toast("La imagen es demasiado grande (máximo 15 MB antes de reducirla)"); return; }
    const blob = await toJpegBlob(fl, 512);
    await uploadPhoto(blob);
    toast(has ? "Foto actualizada" : "Foto guardada");
  });
  return (
    <div className="card p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Avatar name={account.name} photo={account.photo} size={96} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="font-bold">Foto de perfil</div>
          <p className="text-sm text-ink-soft">{has ? (account.photoStored ? "Guardada en el almacenamiento de ConectaPRO." : "Foto anterior. Súbela de nuevo para guardarla en el almacenamiento.") : "Aún no tienes foto. JPG, PNG o WEBP."}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button type="button" variant="soft" className="px-4 py-2.5 text-sm" disabled={busy} onClick={() => file.current?.click()}>{busy ? "Guardando…" : has ? "Cambiar foto" : "Subir foto"}</Button>
            {has && <Button type="button" variant="ghost" icon={LuImageOff} className="px-3 py-2.5 text-sm text-bad" disabled={busy} onClick={() => setConfirm(true)}>Eliminar</Button>}
          </div>
        </div>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden data-testid="foto-perfil" onChange={(e) => { const fl = e.target.files?.[0]; if (fl) pick(fl); e.target.value = ""; }} />
      </div>
      <label className="mt-5 block text-sm font-semibold">¿Quién puede ver tu foto?
        <select value={account.photoPrivacy ?? "todos"} disabled={busy} onChange={(e) => wrap(async () => { await setPhotoPrivacy(e.target.value as any); toast("Privacidad de la foto actualizada"); })}
          className="mt-1 w-full rounded-xl bg-surface px-4 py-3 font-normal outline-none ring-1 ring-line">
          <option value="todos">Todos los usuarios de ConectaPRO</option>
          <option value="contactos">Solo personas con las que tengo chat, postulación o acuerdo</option>
        </select>
      </label>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="¿Eliminar tu foto de perfil?">
        <p className="text-ink-soft">Se borrará del almacenamiento y dejará de mostrarse a los demás usuarios.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button variant="danger" disabled={busy} onClick={() => wrap(async () => { await deletePhoto(); setConfirm(false); toast("Foto eliminada"); })}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}

/** Reduce la imagen (lado mayor = max px) y la convierte a JPEG para subirla */
function toJpegBlob(file: File, max = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No pudimos leer la imagen")); };
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob((b) => (b ? resolve(b) : reject(new Error("No pudimos procesar la imagen"))), "image/jpeg", 0.85);
    };
    img.src = url;
  });
}

/** Convierte una imagen a JPEG reducido (para guardarla en la base de datos) */
export function toDataUrl(file: File, max = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas"); cv.width = img.width * k; cv.height = img.height * k;
        cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL("image/jpeg", 0.78));
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}

const PAY_ICON: Record<PaymentMethod, any> = { efectivo: LuBanknote, nequi: LuWallet, transferencia: LuArrowLeftRight, tarjeta: LuCreditCard };
function Payments() {
  const { payMethods, savePayment, defaultPayment, deletePayment, toast } = useStore();
  const [tipo, setTipo] = useState<PaymentMethod>("nequi");
  const [detalle, setDetalle] = useState("");
  const [busy, wrap] = useBusy();
  return (
    <div className="space-y-3">
      {payMethods.length === 0 && <p className="card p-5 text-center text-ink-soft">Aún no tienes métodos de pago guardados.</p>}
      {payMethods.map((m) => {
        const I = PAY_ICON[m.type];
        return (
          <div key={m.id} className="card flex items-center gap-4 p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand"><I className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1"><div className="font-bold">{PAYMENTS[m.type]}</div><div className="truncate text-sm text-ink-soft">{m.detail || "—"}</div></div>
            {m.default ? <Badge tone="ok">Predeterminado</Badge> : <button onClick={() => wrap(() => defaultPayment(m.id))} className="text-sm font-semibold text-brand">Usar</button>}
            <button onClick={() => wrap(async () => { await deletePayment(m.id); toast("Método eliminado"); })} aria-label="Eliminar" className="p-2 text-bad"><LuTrash2 className="h-5 w-5" /></button>
          </div>
        );
      })}
      <form className="card space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); wrap(async () => { await savePayment(tipo, detalle); setDetalle(""); toast("Método de pago guardado"); }); }}>
        <div className="font-bold">Agregar método de pago</div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as PaymentMethod)} className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line">
          {(Object.keys(PAYMENTS) as PaymentMethod[]).map((k) => <option key={k} value={k}>{PAYMENTS[k]}</option>)}
        </select>
        <input value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder={tipo === "tarjeta" ? "Ej. Visa terminada en 4821" : tipo === "efectivo" ? "Ej. Pago al terminar" : "Ej. Número terminado en 6543"} className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line" />
        <p className="text-xs text-ink-soft">Por seguridad no guardes números completos de tarjetas ni cuentas.</p>
        <Button type="submit" disabled={busy} className="w-full" icon={LuPlus}>Guardar método</Button>
      </form>
    </div>
  );
}

function Addresses() {
  const { addresses, saveAddress, deleteAddress, toast } = useStore();
  const empty = { id: undefined as string | undefined, name: "", address: "" };
  const [f, setF] = useState(empty);
  const [ubic, setUbic] = useState({ departamento: "", municipio: "" });
  const [busy, wrap] = useBusy();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.address.trim()) return toast("Escribe el nombre y la dirección");
    if (!ubic.municipio) return toast("Selecciona el departamento y el municipio");
    wrap(async () => {
      await saveAddress({ ...f, ...ubic });
      toast(f.id ? "Dirección actualizada" : "Dirección guardada");
      setF(empty); setUbic({ departamento: "", municipio: "" });
    });
  };
  return (
    <div className="space-y-3">
      {addresses.length === 0 && <p className="card p-5 text-center text-ink-soft">Aún no tienes direcciones guardadas.</p>}
      {addresses.map((x) => (
        <div key={x.id} className="card flex items-center gap-4 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand"><LuMapPin className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1"><div className="font-bold">{x.name}</div><div className="text-sm text-ink-soft">{x.address} · {x.label}</div></div>
          <button onClick={() => { setF({ id: x.id, name: x.name, address: x.address }); setUbic({ departamento: x.departamento, municipio: x.municipio }); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }} className="text-sm font-semibold text-brand">Editar</button>
          <button onClick={() => wrap(async () => { await deleteAddress(x.id); toast("Dirección eliminada"); })} aria-label="Eliminar" className="p-2 text-bad"><LuTrash2 className="h-5 w-5" /></button>
        </div>
      ))}
      <form className="card space-y-3 p-4" onSubmit={submit}>
        <div className="font-bold">{f.id ? "Editar dirección" : "Nueva dirección"}</div>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nombre (ej. Casa de mamá)" className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line" />
        <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Dirección (ej. Calle 10 #5-20, barrio Centro)" className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line" />
        <UbicacionSelect variant="compact" value={ubic} onChange={setUbic} />
        <div className="flex gap-2">
          {f.id && <Button type="button" variant="outline" className="flex-1" onClick={() => { setF(empty); setUbic({ departamento: "", municipio: "" }); }}>Cancelar</Button>}
          <Button type="submit" disabled={busy} className="flex-1">{f.id ? "Guardar cambios" : "Guardar dirección"}</Button>
        </div>
      </form>
    </div>
  );
}

function Security() {
  const { strikes, account, resetDemo, resetTests, deleteAccount, toast, terms } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [busy, wrap] = useBusy();
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-center gap-3"><LuTriangleAlert className={cx("h-7 w-7", strikes ? "text-bad" : "text-ok")} /><h2 className="text-xl font-extrabold">Regla de “Tres Strikes”</h2></div>
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((i) => <div key={i} className={cx("h-3 flex-1 rounded-full", i < strikes ? "bg-bad" : "bg-ok-50")} />)}
        </div>
        <p className="mt-2 font-bold">{strikes}/3 faltas graves</p>
        <p className="mt-2 text-sm text-ink-soft">Una falta grave es no realizar un trabajo acordado (proveedor) o cancelar un acuerdo confirmado (cliente). Al acumular tres, la cuenta queda suspendida para proteger la confianza de la comunidad.</p>
      </div>
      <div className="card space-y-3 p-6">
        <div className="flex items-center gap-3"><LuBadgeCheck className={cx("h-6 w-6", account?.verified ? "text-ok" : "text-ink-soft")} /><div><div className="font-bold">{account?.verified ? "Validación facial realizada" : "Sin validación facial"}</div><div className="text-sm text-ink-soft">{account?.verified ? "Se detectó un rostro frente a la cámara al registrarte" : "Esta cuenta no pasó por la validación facial"}</div></div></div>
        <Link to="/legal" className="flex items-center gap-3"><LuScale className="h-6 w-6 text-brand" /><div className="flex-1"><div className="font-bold">Términos, condiciones y aviso de privacidad</div><div className="text-sm text-ink-soft">{terms?.fecha ? `Aceptaste la versión ${terms.version} el ${new Date(terms.fecha).toLocaleDateString("es-CO")}` : `Versión vigente ${terms?.version ?? ""}`}</div></div><LuChevronRight className="h-5 w-5" /></Link>
        <div className="flex items-center gap-3"><LuShieldCheck className="h-6 w-6 text-brand" /><div><div className="font-bold">Habeas Data</div><div className="text-sm text-ink-soft">Tus datos se tratan conforme a la Ley 1581 de 2012</div></div></div>
        <Button variant="outline" className="w-full" onClick={() => toast("Escribe a soporte@conectapro.co para cambiar tu contraseña")}>Cambiar contraseña</Button>
      </div>
      {account?.test && (
        <div className="card p-6">
          <div className="flex items-center gap-2 font-bold"><LuFlaskConical className="h-5 w-5 text-[#b45309]" /> Cuenta de prueba</div>
          <p className="mt-1 text-sm text-ink-soft">Borra las solicitudes, postulaciones, acuerdos, chats y notificaciones de las 4 cuentas de prueba para repetir el escenario desde cero. Los usuarios reales no se ven afectados.</p>
          <Button variant="soft" icon={LuRefreshCw} disabled={busy} className="mt-4 w-full" onClick={() => wrap(async () => { await resetTests(); toast("Escenario de prueba reiniciado"); })}>Reiniciar escenario de prueba</Button>
        </div>
      )}
      {account?.demo && (
        <div className="card p-6">
          <div className="font-bold">Datos de ejemplo</div>
          <p className="mt-1 text-sm text-ink-soft">Esta es una cuenta de demostración. Puedes volver a dejar sus solicitudes, chats y notificaciones como al inicio. Los usuarios reales no se ven afectados.</p>
          <Button variant="soft" icon={LuRefreshCw} disabled={busy} className="mt-4 w-full" onClick={() => wrap(async () => { await resetDemo(); toast("Datos de ejemplo reiniciados"); })}>Reiniciar datos de ejemplo</Button>
        </div>
      )}
      <div className="card p-6">
        <div className="font-bold text-bad">Eliminar mi cuenta</div>
        <p className="mt-1 text-sm text-ink-soft">Se borrarán de la base de datos tu perfil, solicitudes, mensajes y demás información.</p>
        <Button variant="danger" icon={LuTrash2} className="mt-4 w-full" onClick={() => setConfirm(true)}>Eliminar mi cuenta</Button>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="¿Eliminar tu cuenta definitivamente?">
        <p className="text-ink-soft">Esta acción no se puede deshacer.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button variant="danger" disabled={busy} onClick={() => wrap(async () => { await deleteAccount(); navigate("/", true); })}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}

function Benefits() {
  const { points, redeem, toast } = useStore();
  const [allies, setAllies] = useState<{ id: number; brand: string; offer: string; cost: number; color: string }[]>([]);
  const [busy, wrap] = useBusy();
  useEffect(() => { rpc("api_aliados").then(setAllies).catch(() => setAllies([])); }, []);
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
      <h2 className="pt-2 text-xl font-extrabold">Beneficios con marcas aliadas (en gestión)</h2>
      {allies.map((a) => (
        <div key={a.id} className="card flex items-center gap-4 p-4">
          <span className={cx("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold", a.color)}>{a.brand[0]}</span>
          <div className="flex-1"><div className="font-bold">{a.brand}</div><div className="text-sm text-ink-soft">{a.offer}</div></div>
          <span className="flex shrink-0 flex-col items-end text-sm"><b className="inline-flex items-center gap-1"><LuTicket className="h-4 w-4" />{a.cost} pts</b><span className="text-xs text-ink-soft">Próximamente</span></span>
        </div>
      ))}
      <p className="text-center text-xs text-ink-soft">Convenios propuestos, aún no firmados: los canjes se habilitarán cuando existan acuerdos reales con las marcas. Tus puntos se conservan.</p>
    </div>
  );
}

function NotifPrefs() {
  const { prefs: p, setPrefs, toast } = useStore();
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
          <Toggle on={p[k]} onChange={(v) => setPrefs({ ...p, [k]: v }).then(() => toast("Preferencia guardada")).catch(() => null)} label={t} />
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
//  Match por trueque (ofertas guardadas en la base de datos)
// =====================================================================
interface BarterOffer { id: string; userId: string; name: string; photo?: string; offers: ServiceId; needs: ServiceId; note: string; city: string; perfect: boolean }

export function Barter() {
  const { openConversation, sendMessage, toast, myBarters, publishBarter, deleteBarter, account } = useStore();
  const [offer, setOffer] = useState<ServiceId>("computadores");
  const [need, setNeed] = useState<ServiceId>("paseo");
  const [ubic, setUbic] = useState({ departamento: account?.departamento ?? "", municipio: "" });
  const [list, setList] = useState<BarterOffer[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, wrap] = useBusy();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setList(null);
    rpc<BarterOffer[]>("api_trueque_buscar", { p_ofrece: offer, p_necesita: need, p_departamento: ubic.departamento || null })
      .then((r) => alive && setList(r)).catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [offer, need, ubic.departamento, reload]);

  const propose = (u: BarterOffer) => wrap(async () => {
    const id = await openConversation({ user: u.userId });
    await sendMessage(id, { text: `¡Hola ${u.name.split(" ")[0]}! Vi tu propuesta de trueque. Yo ofrezco ${serviceById(offer).name.toLowerCase()} y necesito ${serviceById(need).name.toLowerCase()}. ¿Hacemos el intercambio?` });
    toast("¡Propuesta de trueque enviada!");
    navigate("/chat/" + id);
  });

  const sel = "mt-1 w-full rounded-2xl bg-white px-4 py-3.5 font-normal outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50";
  const perfect = (list ?? []).filter((u) => u.perfect);
  const partial = (list ?? []).filter((u) => !u.perfect);
  const Card = ({ u }: { u: BarterOffer }) => {
    const O = SERVICE_ICON[u.offers], N = SERVICE_ICON[u.needs];
    return (
      <div className="card animate-fade-up p-5">
        <div className="flex items-center gap-3">
          <Avatar name={u.name} photo={u.photo} size={52} />
          <div className="min-w-0 flex-1"><div className="truncate font-extrabold">{u.name}</div><div className="truncate text-xs text-ink-soft">{u.city}</div></div>
          {u.perfect ? <Badge tone="ok" icon={LuCircleCheck}>Match perfecto</Badge> : <Badge tone="warn">Parcial</Badge>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-ok-50 p-3"><div className="text-xs font-bold text-ok">OFRECE</div><div className="mt-1 flex items-center gap-1.5 font-semibold">{O && <O className="h-4 w-4" />}{serviceById(u.offers).short}</div></div>
          <div className="rounded-2xl bg-brand-50 p-3"><div className="text-xs font-bold text-brand">NECESITA</div><div className="mt-1 flex items-center gap-1.5 font-semibold">{N && <N className="h-4 w-4" />}{serviceById(u.needs).short}</div></div>
        </div>
        <p className="mt-3 text-sm text-ink-soft">“{u.note}”</p>
        <Button variant={u.perfect ? "primary" : "soft"} disabled={busy} className="mt-4 w-full" icon={LuRepeat} onClick={() => propose(u)}>Proponer trueque</Button>
      </div>
    );
  };
  return (
    <AppShell>
      <PageHeader title="Match por trueque" back="/explorar" sub="Intercambia habilidades sin usar dinero" />
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Yo ofrezco
          <select value={offer} onChange={(e) => setOffer(e.target.value as ServiceId)} className={sel}>{CATEGORIES.map((c) => <optgroup key={c.id} label={c.name}>{SERVICES.filter((x) => x.category === c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>)}</select>
        </label>
        <label className="block text-sm font-semibold">Yo necesito
          <select value={need} onChange={(e) => setNeed(e.target.value as ServiceId)} className={sel}>{CATEGORIES.map((c) => <optgroup key={c.id} label={c.name}>{SERVICES.filter((x) => x.category === c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>)}</select>
        </label>
        <div className="sm:col-span-2"><UbicacionSelect variant="compact" allowAll value={ubic} onChange={(v) => setUbic({ departamento: v.departamento, municipio: "" })} className="[&>label:last-child]:hidden sm:!grid-cols-1" /></div>
      </div>

      <h2 className="mb-3 mt-6 text-xl font-extrabold">Personas compatibles</h2>
      {list === null ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="card h-56 animate-pulse" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {perfect.map((u) => <Card key={u.id} u={u} />)}
          {partial.map((u) => <Card key={u.id} u={u} />)}
        </div>
      )}
      {list?.length === 0 && <Empty icon={LuRepeat} title="Aún no hay coincidencias" text="Publica tu oferta abajo: cuando alguien compatible la vea podrá escribirte." />}

      <div className="card mt-8 p-5">
        <h2 className="text-lg font-extrabold">Publica tu oferta de trueque</h2>
        <p className="text-sm text-ink-soft">Se publicará: ofrezco <b>{serviceById(offer).name.toLowerCase()}</b> y necesito <b>{serviceById(need).name.toLowerCase()}</b>.</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={160} placeholder="Ej. Arreglo tu computador si paseas a mi perro dos veces" className="flex-1 rounded-2xl bg-surface px-4 py-3 outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50" />
          <Button disabled={busy} onClick={() => wrap(async () => { await publishBarter(offer, need, note); setNote(""); setReload((x) => x + 1); toast("Tu oferta de trueque quedó publicada"); })}>Publicar</Button>
        </div>
        {myBarters.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="text-sm font-bold text-ink-soft">Mis ofertas publicadas</div>
            {myBarters.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-sm">
                <LuRepeat className="h-5 w-5 shrink-0 text-ok" />
                <div className="min-w-0 flex-1"><b>{serviceById(b.offers).short}</b> ⇄ <b>{serviceById(b.needs).short}</b><div className="truncate text-ink-soft">{b.note}</div></div>
                <button onClick={() => wrap(async () => { await deleteBarter(b.id); toast("Oferta eliminada"); })} aria-label="Eliminar oferta" className="p-2 text-bad"><LuTrash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
