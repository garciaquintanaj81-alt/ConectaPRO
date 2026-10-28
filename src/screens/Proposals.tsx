// =====================================================================
//  Negociación en el chat: propuestas formales
//  · Contratación: el proveedor que se postuló envía servicio, precio final,
//    fecha, hora, lugar y condiciones. El cliente la acepta o la rechaza; solo al
//    aceptarla se crea el acuerdo.
//  · Modificación: con el acuerdo en curso, cualquiera de las dos partes propone
//    un cambio y la otra lo acepta o lo rechaza. Todo queda registrado.
// =====================================================================
import { useEffect, useState } from "react";
import { LuFilePen, LuCheck, LuX, LuCalendarDays, LuMapPin, LuCircleDollarSign, LuUndo2, LuPencilLine } from "react-icons/lu";
import { Proposal, Request, useBusy, useStore } from "../store";
import { navigate } from "../router";
import { Badge, Button, Modal, MoneyInput, TONE, agreementWhen, cx, localISO } from "../ui";
import { money } from "../data";

const STATUS: Record<Proposal["status"], { label: string; tone: "postulacion" | "completado" | "bad" | "soft" }> = {
  pendiente: { label: "Esperando respuesta", tone: "postulacion" },
  aceptada: { label: "Aceptada", tone: "completado" },
  rechazada: { label: "Rechazada", tone: "bad" },
  reemplazada: { label: "Reemplazada", tone: "soft" },
  retirada: { label: "Retirada", tone: "soft" },
};

/** Tarjeta de una propuesta dentro del chat */
export function ProposalCard({ p }: { p: Proposal }) {
  const { account, myRequests, respondProposal, withdrawProposal, toast } = useStore();
  const [busy, wrap] = useBusy();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const mine = account?.id === p.authorId;
  const soyCliente = myRequests.some((r) => r.id === p.requestId);
  const puedeResponder = p.status === "pendiente" && !mine && (p.kind === "modificacion" || soyCliente);
  const st = STATUS[p.status];
  return (
    <div className={cx("w-full max-w-md rounded-3xl bg-white p-4 shadow-sm ring-1", p.status === "pendiente" ? "ring-[#bbe5c8]" : "ring-line")} data-testid="propuesta">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand"><LuFilePen className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold">{p.kind === "contratacion" ? "Propuesta formal" : "Cambio al acuerdo"}</div>
          <div className="truncate text-xs text-ink-soft">{p.requestTitle}</div>
        </div>
        <Badge tone={st.tone} className="px-2 py-0.5 text-[11px]">{st.label}</Badge>
      </div>
      <p className="mt-3 text-[15px]">{p.service}</p>
      <dl className="mt-3 grid gap-1.5 text-sm">
        <div className="flex items-center gap-2"><LuCircleDollarSign className="h-4 w-4 text-brand" /><dt className="sr-only">Precio</dt><dd className="text-lg font-extrabold">{money(p.price)}</dd></div>
        <div className="flex items-center gap-2"><LuCalendarDays className="h-4 w-4 text-brand" /><dt className="sr-only">Fecha</dt><dd>{agreementWhen(p.date, p.time)}</dd></div>
        <div className="flex items-start gap-2"><LuMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><dt className="sr-only">Lugar</dt><dd>{p.address}</dd></div>
      </dl>
      {p.conditions && <p className="mt-2 rounded-xl bg-surface p-2.5 text-sm text-ink-soft"><b className="text-ink">Condiciones:</b> {p.conditions}</p>}
      {p.status === "rechazada" && p.reason && <p className="mt-2 text-sm text-bad">Motivo: {p.reason}</p>}

      {puedeResponder && !rejecting && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" icon={LuX} className="py-2.5 text-sm" disabled={busy} onClick={() => setRejecting(true)}>Rechazar</Button>
          <Button icon={LuCheck} className="py-2.5 text-sm" disabled={busy} onClick={() => wrap(async () => {
            const r = await respondProposal(p.id, true);
            toast(p.kind === "contratacion" ? `¡Contrataste el servicio! Acuerdo ${r.agreement?.code ?? ""}` : "Cambio aceptado. El acuerdo quedó actualizado.");
          })}>{p.kind === "contratacion" ? "Aceptar y contratar" : "Aceptar cambio"}</Button>
        </div>
      )}
      {puedeResponder && rejecting && (
        <div className="mt-3 space-y-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={160} placeholder="Motivo (opcional), ej. el precio es alto"
            className="w-full rounded-xl bg-surface px-3 py-2.5 text-sm outline-none ring-1 ring-line" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className="py-2 text-sm" onClick={() => setRejecting(false)}>Volver</Button>
            <Button variant="danger" className="py-2 text-sm" disabled={busy} onClick={() => wrap(async () => { await respondProposal(p.id, false, reason); toast("Propuesta rechazada"); setRejecting(false); })}>Rechazar</Button>
          </div>
        </div>
      )}
      {p.status === "pendiente" && mine && (
        <button className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-bad" disabled={busy}
          onClick={() => wrap(async () => { await withdrawProposal(p.id); toast("Propuesta retirada"); })}><LuUndo2 className="h-4 w-4" /> Retirar propuesta</button>
      )}
      {p.status === "aceptada" && (
        <button className="mt-3 text-sm font-semibold text-brand" onClick={() => navigate((soyCliente ? "/solicitud/" : "/trabajo/") + p.requestId)}>Ver acuerdo →</button>
      )}
    </div>
  );
}

/** Solicitudes sobre las que se puede enviar una propuesta en esta conversación */
export function useProposalTargets(peerUserId: string, peerProviderId: string | null) {
  const { myProvider, opportunities, myJobs, myRequests } = useStore();
  const out: { r: Request; kind: "contratacion" | "modificacion" }[] = [];
  if (myProvider) {
    // Como proveedor: solicitudes de este cliente a las que me postulé, o trabajos en curso con él
    opportunities.filter((o) => o.r.clientKey === peerUserId && o.r.status === "buscando" && o.r.applicants.some((a) => a.providerId === myProvider.id))
      .forEach((o) => out.push({ r: o.r, kind: "contratacion" }));
    myJobs.filter((j) => j.clientKey === peerUserId && j.status === "en_curso").forEach((j) => out.push({ r: j, kind: "modificacion" }));
  }
  if (peerProviderId) {
    // Como cliente: acuerdos en curso con este proveedor (puedo proponer cambios)
    myRequests.filter((r) => r.status === "en_curso" && r.providerId === peerProviderId).forEach((r) => out.push({ r, kind: "modificacion" }));
  }
  return out;
}

/** Formulario de propuesta formal o de cambio */
export function ProposalForm({ open, onClose, targets }: { open: boolean; onClose: () => void; targets: { r: Request; kind: "contratacion" | "modificacion" }[] }) {
  const { sendProposal, toast, myProvider } = useStore();
  const [busy, wrap] = useBusy();
  const [idx, setIdx] = useState(0);
  const t = targets[idx];
  const [f, setF] = useState({ service: "", price: null as number | null, date: "", time: "", address: "", conditions: "" });
  const [err, setErr] = useState("");
  // Valores iniciales: el acuerdo vigente (cambio) o lo que pidió el cliente (contratación)
  useEffect(() => {
    if (!open || !t) return;
    const r = t.r, ag = r.agreement;
    const app = myProvider ? r.applicants.find((a) => a.providerId === myProvider.id) : undefined;
    setF({
      service: ag?.service || r.desc,
      price: ag?.price ?? app?.price ?? null,
      date: ag?.date ?? r.date ?? localISO(Date.now() + 86400000),
      time: ag?.time ?? r.time ?? "08:00",
      address: ag?.address || r.direccion || "",
      conditions: ag?.conditions || "",
    });
    setErr("");
  }, [open, idx, t?.r.id]);
  if (!t) return null;
  const cls = "mt-1 w-full rounded-2xl bg-surface px-4 py-3 font-normal outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50";
  const submit = () => wrap(async () => {
    if (f.service.trim().length < 5) return setErr("Describe el servicio que se va a prestar");
    if (!f.price || f.price < 5000) return setErr("Escribe el precio final (mínimo $5.000)");
    if (!f.date || !f.time) return setErr("Indica la fecha y la hora");
    if (f.address.trim().length < 5) return setErr("Escribe el lugar donde se prestará el servicio");
    await sendProposal({ requestId: t.r.id, service: f.service.trim(), price: f.price, date: f.date, time: f.time, address: f.address.trim(), conditions: f.conditions.trim() });
    toast(t.kind === "contratacion" ? "Propuesta enviada. El cliente puede aceptarla o rechazarla." : "Cambio propuesto. La otra parte debe aceptarlo.");
    onClose();
  });
  return (
    <Modal open={open} onClose={onClose} title={t.kind === "contratacion" ? "Propuesta formal" : "Proponer un cambio al acuerdo"}>
      {targets.length > 1 && (
        <label className="mb-3 block text-sm font-semibold">Solicitud
          <select value={idx} onChange={(e) => setIdx(+e.target.value)} className={cls}>
            {targets.map((x, i) => <option key={x.r.id} value={i}>{x.r.title} · {x.kind === "contratacion" ? "contratación" : "cambio"}</option>)}
          </select>
        </label>
      )}
      {t.r.budget ? <p className={cx("mb-3 rounded-xl px-3 py-2 text-sm", TONE.insignia)}>Presupuesto del cliente: {t.r.budgetType === "maximo" ? "máximo " : ""}{money(t.r.budget)}</p> : null}
      <div className="space-y-3">
        <label className="block text-sm font-semibold">Servicio acordado
          <textarea value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })} maxLength={500} className={cx(cls, "h-24 resize-none")} />
        </label>
        <label className="block text-sm font-semibold">Precio final
          <MoneyInput className="mt-1" name="precio-final" value={f.price} onChange={(v) => setF({ ...f, price: v })} ariaLabel="Precio final" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Fecha<input type="date" name="fecha-propuesta" value={f.date} min={localISO()} onChange={(e) => setF({ ...f, date: e.target.value })} className={cls} /></label>
          <label className="block text-sm font-semibold">Hora<input type="time" name="hora-propuesta" value={f.time} step={900} onChange={(e) => setF({ ...f, time: e.target.value })} className={cls} /></label>
        </div>
        <label className="block text-sm font-semibold">Lugar
          <input name="lugar" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Dirección acordada con el cliente" className={cls} />
        </label>
        <label className="block text-sm font-semibold">Condiciones (opcional)
          <textarea value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} maxLength={1000} placeholder="Ej. Abono del 50 % al aceptar. Incluye tarjeta y entrega." className={cx(cls, "h-20 resize-none")} />
        </label>
      </div>
      {err && <p className="mt-3 rounded-xl bg-bad-50 px-3 py-2 text-sm font-medium text-bad">{err}</p>}
      <p className="mt-3 text-xs text-ink-soft">{t.kind === "contratacion" ? "Si el cliente la acepta, se crea el acuerdo con estas condiciones." : "El acuerdo solo cambia si la otra parte acepta. Quedará registrado en el historial."}</p>
      <Button className="mt-4 w-full" icon={LuPencilLine} disabled={busy} onClick={submit}>{busy ? "Enviando…" : t.kind === "contratacion" ? "Enviar propuesta" : "Proponer cambio"}</Button>
    </Modal>
  );
}
