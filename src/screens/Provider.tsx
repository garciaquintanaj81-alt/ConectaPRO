import { useMemo, useRef, useState } from "react";
import {
  LuSlidersHorizontal, LuMapPin, LuClock, LuChevronRight, LuCheck, LuX, LuWrench, LuCircleCheck, LuBriefcase,
  LuMessageCircle, LuTriangleAlert, LuCalendarDays, LuCircleDollarSign, LuCreditCard, LuUserRound, LuImagePlus,
  LuTrash2, LuStore, LuRadar, LuTimer, LuFileText, LuClipboardList, LuSend, LuChevronDown, LuLocateFixed,
} from "react-icons/lu";
import { AppShell, MobileTopBar } from "../Layout";
import { Request, useStore } from "../store";
import { Link, navigate } from "../router";
import {
  Avatar, Badge, Button, Chip, Empty, MapMock, Modal, PageHeader, Rating, SectionTitle, Stars, TestBadge, Toggle,
  PAYMENT_COLOR, PAYMENT_ICON, SERVICE_ICON, CATEGORY_ICON, agreementWhen, cx, mainCategories, shortDate, timeAgo,
} from "../ui";
import { PAYMENTS, PaymentMethod, SERVICES, ServiceId, money, serviceById, CATEGORIES } from "../data";
import { UbicacionSelect, useGeolocation, GEO_MSG } from "../geo";
import { useBusy } from "../store";
import { distanceKm, scheduleLabel } from "../matching";
import { ContractModal, Info } from "./Client";
import { Mapa, comoLlegar } from "../mapa";

// =====================================================================
//  Inicio (proveedor): "Hola, Carlos — Aquí están tus oportunidades"
// =====================================================================
export function ProviderHome() {
  const { account, myProvider, opportunities, myJobs } = useStore();
  const [svc, setSvc] = useState<ServiceId | "todas">("todas");
  const [maxKm, setMaxKm] = useState(50);
  const [pay, setPay] = useState<PaymentMethod | "todos">("todos");
  const [ubic, setUbic] = useState({ departamento: "", municipio: "" });
  if (!myProvider) return <NeedsProfile />;

  const nuevas = opportunities.filter((o) => !o.r.applicants.some((a) => a.providerId === myProvider.id));
  const enCurso = myJobs.filter((j) => j.status === "en_curso").length;
  const completadas = myProvider.completed;
  const list = nuevas
    .filter((o) => !ubic.departamento || o.r.departamento === ubic.departamento)
    .filter((o) => !ubic.municipio || o.r.municipio === ubic.municipio)
    .filter((o) => svc === "todas" || o.r.service === svc)
    .filter((o) => o.distance <= maxKm)
    .filter((o) => pay === "todos" || o.r.payment === pay);

  return (
    <AppShell wide>
      <MobileTopBar />
      <h1 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">Hola, {account?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-ink-soft">Aquí están tus oportunidades</p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 lg:max-w-2xl">
        {[
          [nuevas.length, "Nuevas", "bg-brand", "/oportunidades"],
          [enCurso, "En curso", "bg-brand-blue", "/trabajos"],
          [completadas, "Completadas", "bg-ok", "/trabajos"],
        ].map(([n, l, c, to]: any) => (
          <Link key={l} to={to} className="card min-w-0 px-3 py-3 transition hover:ring-brand/40 sm:px-4 sm:py-3.5">
            <div className="text-2xl font-extrabold text-ink">{n}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft sm:text-[13px]"><span className={cx("h-2 w-2 shrink-0 rounded-full", c)} />{l}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_330px]">
        <div className="min-w-0">
          <SectionTitle action={
            <Link to="/oportunidades" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-line xl:hidden" aria-label="Filtros"><LuSlidersHorizontal className="h-5 w-5" /></Link>
          }><span className="text-lg sm:text-xl">Oportunidades cerca de ti</span></SectionTitle>
          <div className="space-y-3">
            {list.map((o) => <OpportunityCard key={o.r.id} r={o.r} distance={o.distance} />)}
            {list.length === 0 && <Empty icon={LuRadar} title="Sin oportunidades nuevas" text="Te notificaremos cuando un cliente compatible publique una solicitud en tu zona." />}
          </div>
        </div>

        <aside className="hidden space-y-5 xl:block">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 font-bold"><LuSlidersHorizontal className="h-5 w-5" /> Filtros</div>
              <button className="text-sm font-semibold text-brand" onClick={() => { setSvc("todas"); setMaxKm(50); setPay("todos"); setUbic({ departamento: "", municipio: "" }); }}>Limpiar</button></div>
            <div className="mb-4 text-sm font-semibold">Ubicación de la solicitud
              <UbicacionSelect variant="compact" allowAll value={ubic} onChange={setUbic} className="mt-1 !grid-cols-1" />
            </div>
            <label className="block text-sm font-semibold">Categoría
              <select value={svc} onChange={(e) => setSvc(e.target.value as any)} className="mt-1 w-full rounded-xl bg-surface px-3 py-2.5 font-normal outline-none ring-1 ring-line">
                <option value="todas">Todas mis categorías</option>
                {myProvider.services.map((s) => <option key={s} value={s}>{serviceById(s).name}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold">Distancia: hasta {maxKm} km
              <input type="range" min={1} max={50} value={maxKm} onChange={(e) => setMaxKm(+e.target.value)} className="mt-2 w-full accent-brand" />
            </label>
            <label className="mt-3 block text-sm font-semibold">Método de pago
              <select value={pay} onChange={(e) => setPay(e.target.value as any)} className="mt-1 w-full rounded-xl bg-surface px-3 py-2.5 font-normal outline-none ring-1 ring-line">
                <option value="todos">Todos</option>
                {(Object.keys(PAYMENTS) as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENTS[m]}</option>)}
              </select>
            </label>
          </div>
          <div className="card overflow-hidden">
            <MapMock className="h-48 rounded-none ring-0" pins={list.slice(0, 5).map((o, i) => ({ x: 50 + (o.r.location.lng - myProvider.lng) * 900, y: 50 - (o.r.location.lat - myProvider.lat) * 900 + i * 2 }))} />
            <div className="flex items-center gap-2 p-4 text-sm"><LuMapPin className="h-4 w-4 text-brand" /> Tu ubicación · <b>{myProvider.city}</b></div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function OpportunityCard({ r, distance }: { r: Request; distance: number }) {
  const { clientInfo, applyTo, decline, myProvider, toast } = useStore();
  const [busy, wrap] = useBusy();
  const c = clientInfo(r.clientKey);
  const isNew = Date.now() - r.createdAt < 15 * 60000;
  const PIcon = PAYMENT_ICON[r.payment];
  const applied = myProvider && r.applicants.some((a) => a.providerId === myProvider.id);
  const suggested = myProvider ? Math.round((myProvider.priceMin + myProvider.priceMax) / 2 / 5000) * 5000 : 0;
  return (
    <div className="card animate-fade-up p-4 sm:p-5">
      <Link to={"/oportunidad/" + r.id} className="flex gap-4">
        <Avatar name={c.name} photo={c.photo} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{serviceById(r.service).name}</span>{isNew && <Badge tone="ok">Nueva</Badge>}{c.test && <TestBadge />}
            <span className="ml-auto hidden text-sm text-ink-soft lg:inline">{c.name.split(" ")[0]} {c.name.split(" ")[1]?.[0]}. · <Rating value={c.rating} count={c.reviews} className="text-sm" /></span>
          </div>
          <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-ink-soft">{r.desc}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
            <span className="inline-flex items-center gap-1 font-semibold text-brand-blue"><LuMapPin className="h-4 w-4" />≈ {distance.toFixed(1)} km · {r.municipioNombre}</span>
            <span className="inline-flex items-center gap-1"><LuClock className="h-4 w-4" />{timeAgo(r.createdAt)}</span>
            <span className="inline-flex items-center gap-1"><PIcon className={cx("h-4 w-4", PAYMENT_COLOR[r.payment])} />{PAYMENTS[r.payment].split(" ")[0]}</span>
            <LuChevronRight className="ml-auto h-5 w-5 text-ink-soft lg:hidden" />
          </div>
        </div>
      </Link>
      <div className="mt-3 hidden items-center gap-2 border-t border-line pt-3 lg:flex">
        {applied ? <Badge tone="ok" icon={LuCircleCheck}>Postulado · esperando al cliente</Badge> : (
          <>
            <Button className="px-4 py-2 text-sm" icon={LuCheck} disabled={busy} onClick={() => wrap(async () => { await applyTo(r.id, suggested); toast(`Te postulaste con ${money(suggested)}`); })}>Aceptar</Button>
            <Button variant="outline" className="px-4 py-2 text-sm" icon={LuX} disabled={busy} onClick={() => wrap(async () => { await decline(r.id); toast("Oportunidad descartada"); })}>Descartar</Button>
            <Link to={"/oportunidad/" + r.id} className="ml-auto self-center text-sm font-semibold text-brand">Ver detalle y proponer precio →</Link>
          </>
        )}
      </div>
    </div>
  );
}

function NeedsProfile() {
  return (
    <AppShell>
      <Empty icon={LuStore} title="Configura tu perfil de proveedor" text="Registra tu empresa o marca personal, zona de cobertura, horario y categoría para empezar a recibir oportunidades."
        action={<Button onClick={() => navigate("/mi-servicio")}>Configurar ahora</Button>} />
    </AppShell>
  );
}

// =====================================================================
//  Oportunidades (lista completa + mis postulaciones)
// =====================================================================
export function Opportunities() {
  const { opportunities, myProvider } = useStore();
  const [tab, setTab] = useState<"nuevas" | "postuladas">("nuevas");
  const [ubic, setUbic] = useState({ departamento: "", municipio: "" });
  if (!myProvider) return <NeedsProfile />;
  const enUbic = opportunities.filter((o) => (!ubic.departamento || o.r.departamento === ubic.departamento) && (!ubic.municipio || o.r.municipio === ubic.municipio));
  const nuevas = enUbic.filter((o) => !o.r.applicants.some((a) => a.providerId === myProvider.id));
  const postuladas = enUbic.filter((o) => o.r.applicants.some((a) => a.providerId === myProvider.id));
  const list = tab === "nuevas" ? nuevas : postuladas;
  return (
    <AppShell>
      <PageHeader title="Oportunidades" back={false} sub={`Categorías: ${myProvider.services.map((s) => serviceById(s).short).join(", ")} · cobertura ${myProvider.coverageKm} km`} />
      <UbicacionSelect variant="compact" allowAll value={ubic} onChange={setUbic} className="mb-4" />
      <div className="mb-5 flex gap-2.5">
        <Chip active={tab === "nuevas"} onClick={() => setTab("nuevas")} className="px-6 py-2.5 text-base">Nuevas ({nuevas.length})</Chip>
        <Chip active={tab === "postuladas"} onClick={() => setTab("postuladas")} className="px-6 py-2.5 text-base">Mis postulaciones ({postuladas.length})</Chip>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">{list.map((o) => <OpportunityCard key={o.r.id} r={o.r} distance={o.distance} />)}</div>
      {list.length === 0 && <Empty icon={LuClipboardList} title={tab === "nuevas" ? "No hay oportunidades nuevas" : "Aún no te has postulado"} />}
    </AppShell>
  );
}

// =====================================================================
//  Detalle de oportunidad: aceptar postulación con precio
// =====================================================================
export function OpportunityDetail({ id }: { id: string }) {
  const { findRequest, clientInfo, myProvider, applyTo, decline, toast, openConversation } = useStore();
  const r = findRequest(id);
  const [busy, wrap] = useBusy();
  const suggested = myProvider ? Math.round((myProvider.priceMin + myProvider.priceMax) / 2 / 5000) * 5000 : 50000;
  const [price, setPrice] = useState(suggested);
  const [note, setNote] = useState("");
  if (!r || !myProvider) return <AppShell><Empty icon={LuClipboardList} title="Esta oportunidad ya no está disponible" text="Es posible que el cliente ya haya elegido a otro proveedor o la haya cancelado." action={<Button onClick={() => navigate("/oportunidades")}>Ver oportunidades</Button>} /></AppShell>;
  const c = clientInfo(r.clientKey);
  const d = distanceKm(myProvider, r.location);
  const mine = r.providerId === myProvider.id;
  const applied = r.applicants.find((a) => a.providerId === myProvider.id);
  const taken = r.status !== "buscando";
  const PIcon = PAYMENT_ICON[r.payment];

  return (
    <AppShell hideNav>
      <PageHeader title="Detalle de la oportunidad" back="/inicio" />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <Avatar name={c.name} photo={c.photo} size={72} />
            <div><div className="flex flex-wrap items-center gap-2 text-xl font-extrabold">{c.name}{c.test && <TestBadge />}</div><Rating value={c.rating} count={c.reviews} /> <span className="text-sm text-ink-soft">como cliente</span></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="brand" icon={SERVICE_ICON[r.service]}>{serviceById(r.service).name}</Badge>
            <Badge tone="soft" icon={LuMapPin}>{r.location.approximate ? "≈ " : "A "}{d.toFixed(1)} km</Badge>
            <Badge tone="soft" icon={LuClock}>{timeAgo(r.createdAt)}</Badge>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">{r.title}</h1>
          <p className="mt-2 text-lg text-ink-soft">{r.desc}</p>
          <Mapa className="mt-5 h-52" center={r.location} point={r.location} approx={!!r.location.approximate} />
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-surface p-4">
            <LuMapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div><div className="font-semibold">{r.location.label}</div>
              <div className="text-sm text-ink-soft">{r.location.approximate && !mine ? "Zona aproximada. La dirección exacta solo se comparte con el proveedor que el cliente contrate." : "Dirección del servicio"}</div></div>
          </div>
          <div className="mt-4 flex items-center gap-3 text-lg"><PIcon className={cx("h-6 w-6", PAYMENT_COLOR[r.payment])} /> Pago en <b>{PAYMENTS[r.payment]}</b></div>
        </div>
        <div className="card self-start p-6">
          {taken && r.providerId === myProvider.id ? (
            <>
              <Badge tone="ok" icon={LuCircleCheck} className="text-base">¡El cliente te eligió!</Badge>
              <p className="mt-3 text-ink-soft">Se generó el acuerdo digital{r.agreement ? ` para ${agreementWhen(r.agreement.date, r.agreement.time)} por ${money(r.agreement.price)}` : ""}.</p>
              <Button className="mt-5 w-full" icon={LuBriefcase} onClick={() => navigate("/trabajo/" + r.id)}>Ver trabajo</Button>
              <Button variant="soft" className="mt-3 w-full" icon={LuMessageCircle} onClick={async () => navigate("/chat/" + (await openConversation({ user: r.clientKey })))}>Escribir al cliente</Button>
            </>
          ) : taken ? (
            <p className="font-semibold text-ink-soft">Esta solicitud ya fue asignada a otro proveedor.</p>
          ) : applied ? (
            <>
              <Badge tone="ok" icon={LuCircleCheck} className="text-base">Te postulaste</Badge>
              <p className="mt-3 text-ink-soft">Propusiste <b className="text-ink">{money(applied.price)}</b>. El cliente comparará tu oferta con las demás y te avisaremos si te elige. Puedes cambiar tu precio enviando una nueva propuesta.</p>
              <Button variant="soft" className="mt-5 w-full" icon={LuMessageCircle} onClick={async () => navigate("/chat/" + (await openConversation({ user: r.clientKey })))}>Escribir al cliente</Button>
            </>
          ) : (
            <>
              <div className="text-lg font-extrabold">Envía tu propuesta</div>
              <p className="text-sm text-ink-soft">Tu rango: {money(myProvider.priceMin)} - {money(myProvider.priceMax)}</p>
              <label className="mt-4 block text-sm font-semibold">Precio propuesto
                <div className="mt-1 flex items-center rounded-2xl bg-surface px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand/50">
                  <span className="text-lg font-bold">$</span>
                  <input type="number" step={5000} min={5000} value={price} onChange={(e) => setPrice(+e.target.value)} className="w-full bg-transparent px-2 py-3 text-lg font-bold outline-none" />
                </div>
              </label>
              <label className="mt-4 block text-sm font-semibold">Mensaje para el cliente (opcional)
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={160} placeholder="Ej. Puedo llegar en 30 minutos con los materiales." className="mt-1 h-24 w-full resize-none rounded-2xl bg-surface p-3 font-normal outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50" />
              </label>
              <Button className="mt-5 w-full py-4" icon={LuCheck} disabled={price < 5000 || busy} onClick={() => wrap(async () => { await applyTo(r.id, price, note || undefined); toast("¡Postulación enviada! El cliente fue notificado."); })}>{busy ? "Enviando…" : "Aceptar y postularme"}</Button>
              <Button variant="outline" className="mt-3 w-full" icon={LuX} disabled={busy} onClick={() => wrap(async () => { await decline(r.id); toast("Oportunidad descartada"); navigate("/inicio"); })}>Descartar</Button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// =====================================================================
//  Mis trabajos (proveedor)
// =====================================================================
export function MyJobs() {
  const { myJobs, clientInfo, myProvider } = useStore();
  const [f, setF] = useState<"en_curso" | "completada" | "cancelada">("en_curso");
  if (!myProvider) return <NeedsProfile />;
  const list = myJobs.filter((j) => j.status === f).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <AppShell>
      <PageHeader title="Mis trabajos" back={false} />
      <div className="mb-5 flex gap-2.5 overflow-x-auto scrollbar-none">
        {([["en_curso", "En curso"], ["completada", "Completados"], ["cancelada", "Cancelados"]] as const).map(([k, l]) => <Chip key={k} active={f === k} onClick={() => setF(k)} className="px-6 py-2.5 text-base">{l}</Chip>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((j) => {
          const c = clientInfo(j.clientKey);
          return (
            <Link key={j.id} to={"/trabajo/" + j.id} className="card flex items-center gap-4 p-4 hover:-translate-y-0.5">
              <Avatar name={c.name} photo={c.photo} size={64} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-extrabold">{j.title}</div>
                <div className="text-ink-soft">{c.name}</div>
                {j.agreement && <div className="text-sm font-semibold text-brand">{j.status === "en_curso" ? agreementWhen(j.agreement.date, j.agreement.time) : shortDate(j.finishedAt ?? j.createdAt)} · {money(j.agreement.price)}</div>}
              </div>
              <LuChevronRight className="h-6 w-6 text-brand" />
            </Link>
          );
        })}
      </div>
      {list.length === 0 && <Empty icon={LuBriefcase} title="Nada por aquí" text="Cuando un cliente confirme un acuerdo contigo aparecerá en esta lista." />}
    </AppShell>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { findRequest, clientInfo, myProvider, providerNoShow, openConversation } = useStore();
  const r = findRequest(id);
  const [busy, wrap] = useBusy();
  const [noShow, setNoShow] = useState(false);
  const [contract, setContract] = useState(false);
  if (!r || !myProvider) return <AppShell><Empty icon={LuBriefcase} title="Trabajo no encontrado" /></AppShell>;
  const c = clientInfo(r.clientKey);
  return (
    <AppShell hideNav>
      <PageHeader title="Detalle del trabajo" back="/trabajos" />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <Avatar name={c.name} photo={c.photo} size={64} />
            <div><div className="text-xl font-extrabold">{c.name}</div><Rating value={c.rating} count={c.reviews} /></div>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold">{r.title}</h1>
          <p className="mt-2 text-ink-soft">{r.desc}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info icon={LuMapPin} k="Ubicación" v={r.location.label} />
            <Info icon={LuCreditCard} k="Pago" v={PAYMENTS[r.payment]} />
            {r.agreement && <Info icon={LuCalendarDays} k="Fecha pactada" v={agreementWhen(r.agreement.date, r.agreement.time) + (r.agreement.extendedDays ? ` (+${r.agreement.extendedDays} días)` : "")} />}
            {r.agreement && <Info icon={LuCircleDollarSign} k="Valor" v={money(r.agreement.price)} />}
          </dl>
          <Mapa className="mt-5 h-56" center={r.location} point={r.location} approx={!!r.location.approximate} />
          {!r.location.approximate && <a href={comoLlegar(r.location)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand"><LuMapPin className="h-4 w-4" />Cómo llegar (Google Maps)</a>}
          {r.punctualityPenalty && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#fff4dc] p-3 text-sm font-medium text-[#9a5b00]"><LuTriangleAlert className="h-5 w-5" /> El cliente reportó un retraso: tienes 2 días adicionales y se registró una valoración negativa de puntualidad.</div>}
          {r.rating && <div className="mt-5 rounded-2xl p-4 ring-1 ring-line"><div className="text-sm font-bold text-ink-soft">Calificación del cliente</div><Stars value={r.rating.stars} /><p className="mt-1 text-ink-soft">{r.rating.comment}</p></div>}
          {r.clientRating && <div className="mt-3 rounded-2xl p-4 ring-1 ring-line"><div className="text-sm font-bold text-ink-soft">Tu calificación al cliente</div><Stars value={r.clientRating.stars} /></div>}
        </div>
        <div className="card space-y-3 self-start p-5">
          <Button variant="soft" className="w-full" icon={LuMessageCircle} onClick={async () => navigate("/chat/" + (await openConversation({ user: r.clientKey })))}>Escribir al cliente</Button>
          {r.agreement && <Button variant="outline" className="w-full" icon={LuFileText} onClick={() => setContract(true)}>Ver contrato</Button>}
          {r.status === "en_curso" && (
            <>
              <Button className="w-full" icon={LuCircleCheck} onClick={() => navigate("/calificar-cliente/" + r.id)}>Marcar como realizado</Button>
              <Button variant="danger" className="w-full" onClick={() => setNoShow(true)}>No puedo asistir</Button>
            </>
          )}
        </div>
      </div>
      <Modal open={noShow} onClose={() => setNoShow(false)} title="¿No puedes realizar el trabajo?">
        <div className="flex gap-3 rounded-2xl bg-bad-50 p-4 text-sm text-bad"><LuTriangleAlert className="h-5 w-5 shrink-0" />No realizar un trabajo previamente acordado es una <b>falta grave</b>. Al acumular 3, tu cuenta será suspendida.</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setNoShow(false)}>Volver</Button>
          <Button variant="danger" disabled={busy} onClick={() => wrap(async () => { await providerNoShow(r.id); setNoShow(false); })}>Cancelar trabajo</Button>
        </div>
      </Modal>
      {r.agreement && <ContractModal open={contract} onClose={() => setContract(false)} r={r} p={myProvider} date={r.agreement.date} time={r.agreement.time} price={r.agreement.price} code={r.agreement.code} />}
    </AppShell>
  );
}

// =====================================================================
//  Calificación mutua: el proveedor califica al cliente
// =====================================================================
export function RateClient({ id }: { id: string }) {
  const { findRequest, clientInfo, rate, toast } = useStore();
  const r = findRequest(id);
  const [busy, wrap] = useBusy();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  if (!r) return <AppShell><Empty icon={LuBriefcase} title="Trabajo no encontrado" /></AppShell>;
  const c = clientInfo(r.clientKey);
  return (
    <AppShell hideNav>
      <PageHeader title="Calificar cliente" back={"/trabajo/" + r.id} />
      <div className="mx-auto max-w-xl text-center lg:card lg:p-10">
        <Avatar name={c.name} photo={c.photo} size={160} className="mx-auto" />
        <h1 className="mt-4 text-3xl font-extrabold">{c.name}</h1>
        <div className="text-lg text-ink-soft">{r.title}</div>
        <h2 className="mt-8 text-xl font-bold">¿Cómo fue tu experiencia con el cliente?</h2>
        <div className="mt-4 flex justify-center"><Stars value={stars} size={48} onChange={setStars} /></div>
        <textarea value={comment} maxLength={200} onChange={(e) => setComment(e.target.value)} placeholder="Pago puntual, muy amable." className="mt-6 h-28 w-full resize-none rounded-3xl bg-white p-5 outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50" />
        <Button className="mt-6 w-full py-4 text-lg" disabled={!stars || busy} onClick={() => wrap(async () => { await rate(r.id, stars, comment); toast("Trabajo completado. ¡Gracias por calificar! (+50 puntos)"); navigate("/trabajos"); })}>{busy ? "Guardando…" : "Enviar calificación"}</Button>
      </div>
    </AppShell>
  );
}

// =====================================================================
//  Parametrización del oferente (Mi servicio)
// =====================================================================
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

async function resizeImage(file: File, max = 480): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = img.width * k; c.height = img.height * k;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.75);
}

export function MyService() {
  const { account, myProvider, saveProviderProfile, toast } = useStore();
  const [busy, wrap] = useBusy();
  const p = myProvider;
  const [company, setCompany] = useState(p?.company ?? "");
  const [profession, setProfession] = useState(p?.profession ?? "");
  const [services, setServices] = useState<ServiceId[]>(p?.services ?? []);
  const [ubic, setUbic] = useState({ departamento: p?.departamento ?? account?.departamento ?? "", municipio: p?.municipio ?? account?.municipio ?? "" });
  const [openCat, setOpenCat] = useState<string>(p?.services[0] ? serviceById(p.services[0]).category : "");
  const geo = useGeolocation();
  const [coverage, setCoverage] = useState(p?.coverageKm ?? 10);
  const [days, setDays] = useState<number[]>(p?.schedule.days ?? [1, 2, 3, 4, 5, 6]);
  const [from, setFrom] = useState(p?.schedule.from ?? 8);
  const [to, setTo] = useState(p?.schedule.to ?? 18);
  const [priceMin, setPriceMin] = useState(p?.priceMin ?? 40000);
  const [priceMax, setPriceMax] = useState(p?.priceMax ?? 80000);
  const [about, setAbout] = useState(p?.about ?? "");
  const [offers, setOffers] = useState((p?.offers ?? []).join("\n"));
  const [gallery, setGallery] = useState<string[]>(p?.portfolio ?? []);
  const [publicLocation, setPublicLocation] = useState(p?.publicLocation ?? false);
  const [moreCats, setMoreCats] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !p;

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const save = () => {
    const e: string[] = [];
    if (!company.trim()) e.push("Escribe el nombre de tu empresa, emprendimiento o marca");
    if (!services.length) e.push("Selecciona al menos una categoría de servicio");
    if (!days.length) e.push("Selecciona los días de atención");
    if (to <= from) e.push("La hora de cierre debe ser posterior a la de apertura");
    if (about.trim().length < 15) e.push("Describe lo que haces (mínimo 15 caracteres)");
    if (!ubic.departamento || !ubic.municipio) e.push("Selecciona el departamento y el municipio donde atiendes");
    if (priceMax < priceMin) e.push("El precio máximo debe ser mayor o igual al mínimo");
    setErrors(e);
    if (e.length) return window.scrollTo({ top: 0, behavior: "smooth" });
    wrap(async () => {
      await saveProviderProfile({
        company: company.trim(), profession: profession.trim() || serviceById(services[0]).name,
        services, departamento: ubic.departamento, municipio: ubic.municipio, coverageKm: coverage,
        days: [...days].sort(), from, to, priceMin, priceMax, about: about.trim(),
        ...(geo.fix ? { lat: geo.fix.lat, lng: geo.fix.lng } : {}),
        offers: offers.split("\n").map((s) => s.trim()).filter(Boolean), portfolio: gallery, publicLocation,
      });
      toast(isNew ? "¡Perfil de proveedor creado! Ya puedes recibir oportunidades" : "Cambios guardados");
      navigate("/inicio");
    });
  };

  const sel = "mt-1 w-full rounded-2xl bg-white px-4 py-3.5 outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50";
  return (
    <AppShell hideNav>
      <PageHeader title={isNew ? "Configura tu servicio" : "Mi servicio"} back={isNew ? "/perfil" : "/inicio"} sub="Así te encontrarán los clientes compatibles" />
      <div className="mx-auto max-w-3xl space-y-6">
        {errors.length > 0 && <div className="rounded-2xl bg-bad-50 p-4 text-sm font-medium text-bad">{errors.map((e) => <div key={e}>• {e}</div>)}</div>}

        <section className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><LuStore className="h-5 w-5 text-brand" /> Tu negocio</h2>
          <label className="block text-sm font-semibold">Nombre de tu empresa, emprendimiento o marca personal
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ej. Ramírez Plomería" className={sel} />
          </label>
          <label className="block text-sm font-semibold">Profesión u oficio
            <input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ej. Técnico en plomería" className={sel} />
          </label>
        </section>

        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><LuWrench className="h-5 w-5 text-brand" /> Sectores y subcategorías</h2>
          <p className="text-sm text-ink-soft">El algoritmo solo te notificará necesidades de las subcategorías que marques.</p>
          {services.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {services.map((id) => <span key={id} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">{serviceById(id).name}</span>)}
            </div>
          )}
          <div className="mt-4 divide-y divide-line rounded-xl ring-1 ring-line">
            {(() => {
              const main = mainCategories();
              const rest = CATEGORIES.filter((c) => !main.includes(c));
              const showAll = moreCats || rest.some((c) => SERVICES.some((s) => s.category === c.id && services.includes(s.id)));
              return showAll ? [...main, ...rest] : main;
            })().map((c) => {
              const subs = SERVICES.filter((s) => s.category === c.id);
              const n = subs.filter((s) => services.includes(s.id)).length;
              const open = openCat === c.id;
              const I = CATEGORY_ICON[c.id];
              return (
                <div key={c.id}>
                  <button type="button" onClick={() => setOpenCat(open ? "" : c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", c.tint)}><I className="h-4 w-4" /></span>
                    <span className="flex-1 text-sm font-semibold">{c.name}</span>
                    {n > 0 && <span className="rounded-full bg-brand px-2 text-xs font-bold text-white">{n}</span>}
                    <LuChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
                  </button>
                  {open && (
                    <div className="flex flex-wrap gap-2 px-4 pb-4">
                      {subs.map((s) => <Chip key={s.id} active={services.includes(s.id)} onClick={() => setServices(toggle(services, s.id))}>{s.name}</Chip>)}
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => setMoreCats(!moreCats)} className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-brand">
              {moreCats ? "Ver menos sectores" : "Ver más sectores"}<LuChevronDown className={cx("h-4 w-4 transition", moreCats && "rotate-180")} />
            </button>
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><LuRadar className="h-5 w-5 text-brand" /> Ubicación y cobertura</h2>
          <div className="text-sm font-semibold">Departamento y municipio base</div>
          <UbicacionSelect variant="compact" value={ubic} onChange={setUbic} />
          <div className="flex flex-col gap-3 rounded-xl bg-surface p-3 text-sm sm:flex-row sm:items-center">
            <LuLocateFixed className="hidden h-5 w-5 shrink-0 text-brand sm:block" />
            <p className="min-w-0 flex-1 text-ink-soft">{geo.fix ? `Punto de atención tomado del GPS (±${geo.fix.accuracy} m). Solo se aplica si está dentro del municipio elegido.` : "Opcional: usa tu ubicación actual como punto de atención para calcular distancias reales."}</p>
            {!geo.fix && <Button type="button" variant="soft" className="rounded-xl px-4 py-2 text-sm" onClick={() => geo.request()}>{geo.status === "pidiendo" ? "Ubicando…" : "Usar mi ubicación"}</Button>}
            {GEO_MSG[geo.status] && <p className="w-full text-xs text-bad">{GEO_MSG[geo.status]}</p>}
          </div>
          <label className="block text-sm font-semibold">Zona de cobertura: <span className="text-brand">hasta {coverage} km</span>
            <input type="range" min={1} max={50} value={coverage} onChange={(e) => setCoverage(+e.target.value)} className="mt-3 w-full accent-brand" />
          </label>
          <div className="flex items-center gap-4 rounded-xl ring-1 ring-line p-4">
            <div className="flex-1">
              <div className="text-sm font-semibold">Mostrar mi ubicación exacta a los clientes</div>
              <p className="text-xs text-ink-soft">{publicLocation ? "Los clientes verán tu punto exacto de atención." : "Desactivado: los clientes solo ven tu municipio y una zona aproximada (~1 km). Las distancias se calculan igual."}</p>
            </div>
            <Toggle on={publicLocation} onChange={setPublicLocation} label="Mostrar ubicación exacta" />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><LuTimer className="h-5 w-5 text-brand" /> Horario de atención</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d, i) => (
              <button key={d} onClick={() => setDays(toggle(days, i))} className={cx("rounded-xl py-3 text-sm font-bold", days.includes(i) ? "bg-brand text-white" : "bg-surface text-ink-soft")}>{d}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {([["Desde", from, setFrom], ["Hasta", to, setTo]] as const).map(([l, v, set]) => (
              <label key={l} className="block text-sm font-semibold">{l}
                <select value={v} onChange={(e) => (set as any)(+e.target.value)} className={sel}>
                  {Array.from({ length: 25 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
                </select>
              </label>
            ))}
          </div>
          <p className="text-sm text-ink-soft">Vista previa: {scheduleLabel({ days: [...days].sort(), from, to })}</p>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><LuCircleDollarSign className="h-5 w-5 text-brand" /> Precios y descripción</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-semibold">Precio mínimo<input type="number" step={5000} value={priceMin} onChange={(e) => setPriceMin(+e.target.value)} className={sel} /></label>
            <label className="block text-sm font-semibold">Precio máximo<input type="number" step={5000} value={priceMax} onChange={(e) => setPriceMax(+e.target.value)} className={sel} /></label>
          </div>
          <label className="block text-sm font-semibold">Describe lo que haces
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} maxLength={400} placeholder="Ej. Más de 5 años de experiencia en plomería residencial y comercial." className={cx(sel, "h-28 resize-none")} />
          </label>
          <label className="block text-sm font-semibold">Servicios que ofreces (uno por línea)
            <textarea value={offers} onChange={(e) => setOffers(e.target.value)} placeholder={"Instalación de tuberías\nDestapado de cañerías"} className={cx(sel, "h-28 resize-none")} />
          </label>
        </section>

        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><LuImagePlus className="h-5 w-5 text-brand" /> Galería de trabajos</h2>
          <p className="text-sm text-ink-soft">Sube fotos de trabajos anteriores. Los clientes las verán en tu portafolio.</p>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {gallery.map((g, i) => (
              <div key={i} className="group relative">
                <img src={g} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                <button onClick={() => setGallery(gallery.filter((_, k) => k !== i))} className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1.5 text-bad shadow" aria-label="Eliminar foto"><LuTrash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {gallery.length < 8 && (
              <button onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-brand/40 text-sm font-semibold text-brand hover:bg-brand-50">
                <LuImagePlus className="h-7 w-7" /> Agregar
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 8 - gallery.length);
            const imgs = await Promise.all(files.map((f) => resizeImage(f)));
            setGallery([...gallery, ...imgs]);
            e.target.value = "";
          }} />
        </section>

        <Button className="w-full py-[18px] text-xl" icon={LuSend} disabled={busy} onClick={save}>{busy ? "Guardando…" : isNew ? "Publicar mi servicio" : "Guardar cambios"}</Button>
      </div>
    </AppShell>
  );
}
