import { useEffect, useMemo, useState } from "react";
import {
  LuSearch, LuSlidersHorizontal, LuChevronRight, LuMapPin, LuClock, LuCircleCheck, LuCrosshair, LuCircleDot,
  LuWallet, LuUsers, LuShieldCheck, LuMessageCircle, LuPhone, LuEllipsisVertical, LuWrench, LuBriefcase,
  LuTimer, LuCheck, LuCalendarDays, LuUserRound, LuCircleDollarSign, LuCreditCard, LuFileText, LuSparkles,
  LuFilter, LuBrain, LuCircleX, LuTriangleAlert, LuRepeat, LuArrowRight, LuClipboardList, LuRadar, LuStar,
  LuChevronDown, LuZap, LuBadgeCheck, LuX, LuLocateFixed, LuNavigation, LuArrowLeft,
} from "react-icons/lu";
import { AppShell, MobileTopBar } from "../Layout";
import { useStore, Request } from "../store";
import { Link, navigate } from "../router";
import {
  Avatar, Badge, Button, CategoryPicker, Chip, Empty, Modal, PageHeader, Rating, SectionTitle, Stars, Stepper, TestBadge, Toggle,
  CATEGORY_ICON, localISO, PAYMENT_COLOR, PAYMENT_ICON, SERVICE_ICON, agreementWhen, clock, cx, shortDate, timeAgo,
} from "../ui";
import { GPS_MSG, ZonaChip } from "../zona";
import { CATEGORIES, CategoryId, PAYMENTS, PaymentMethod, Provider, SERVICES, ServiceId, money, serviceById, servicesOf, categoryById } from "../data";
import { availability, availabilityLabel, distanceKm, predictRoutines, scheduleLabel } from "../matching";
import { rpc } from "../api";
import { UbicacionSelect, getMunicipios, useGeolocation, GEO_MSG } from "../geo";
import { useBusy } from "../store";

const query = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "");

// =====================================================================
//  Inicio (cliente)
// =====================================================================
export function ClientHome() {
  const { account, myRequests, getProvider, prefs, zona } = useStore();
  const [q, setQ] = useState("");

  const suggestions = useMemo(() => {
    if (prefs && !prefs.ia) return [];
    return predictRoutines(myRequests.filter((r) => r.status === "completada").map((r) => ({ service: r.service, date: r.finishedAt ?? r.createdAt, providerId: r.providerId })));
  }, [myRequests, prefs]);

  const active = myRequests.filter((r) => r.status === "en_curso" || r.status === "buscando");
  // Proveedores reales de la zona elegida (municipio del perfil, otra ciudad o la ubicación actual)
  const gps = zona?.fuente === "gps";
  const [featured, setFeatured] = useState<Provider[] | null>(null);
  useEffect(() => {
    if (!zona?.municipio) return;
    let alive = true;
    rpc<{ resultados: Provider[] }>("api_buscar_proveedores", {
      p_departamento: zona.departamento, p_municipio: zona.municipio, p_orden: gps ? "distance" : "rating",
      p_lat: gps ? zona.lat : null, p_lng: gps ? zona.lng : null,
    }).then((r) => alive && setFeatured(r.resultados.slice(0, 4))).catch(() => alive && setFeatured([]));
    return () => { alive = false; };
  }, [zona?.municipio, gps ? Math.round((zona?.lat ?? 0) * 200) + ":" + Math.round((zona?.lng ?? 0) * 200) : ""]);

  return (
    <AppShell>
      <MobileTopBar />
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">Hola, {account?.name.split(" ")[0]}</h1>
          <p className="mt-1 text-ink-soft">¿Qué servicio necesitas hoy?</p>

          <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); navigate("/explorar?q=" + encodeURIComponent(q)); }}>
            <label className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand/40">
              <LuSearch className="h-5 w-5 text-ink-soft" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej. plomero, clases de inglés, torta…" className="w-full bg-transparent outline-none placeholder:text-ink-soft/80" aria-label="Buscar servicios" />
            </label>
            <Button type="submit" className="rounded-xl px-5">Buscar</Button>
          </form>

          {suggestions.map((s) => {
            const p = getProvider(s.providerId);
            return (
              <div key={s.service} className="animate-fade-up mt-6 flex items-start gap-3 rounded-2xl bg-brand-50 p-4 sm:items-center">
                <LuBrain className="mt-0.5 h-5 w-5 shrink-0 text-brand-violet sm:mt-0" />
                <p className="flex-1 text-sm"><b>Recordatorio:</b> sueles pedir {serviceById(s.service).name.toLowerCase()} cada {s.intervalDays} días. ¿Contactar de nuevo a {p ? p.name.split(" ")[0] : "tu proveedor"}?</p>
                <Button className="shrink-0 px-4 py-2 text-sm" onClick={() => navigate(p ? "/proveedor/" + p.id : "/publicar?servicio=" + s.service)}>Contactar</Button>
              </div>
            );
          })}

          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Sectores</h2>
            <Link to="/explorar" className="text-sm font-semibold text-brand">Explorar todo</Link>
          </div>
          <div className="mt-3"><CategoryPicker variant="tiles" hrefFor={(id) => "/explorar?cat=" + id} /></div>
        </div>

        <aside className="space-y-8">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">Mis servicios activos</h2>
              <Link to="/solicitudes" className="text-sm font-semibold text-brand">Ver todos</Link>
            </div>
            {active.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-ink-soft">
                No tienes servicios activos.
                <Link to="/publicar" className="mt-1 block font-semibold text-brand">Publicar una necesidad</Link>
              </div>
            ) : (
              <div className="space-y-2.5">{active.slice(0, 3).map((r) => <ActiveCard key={r.id} r={r} />)}</div>
            )}
          </section>
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">{gps ? "Cerca de ti" : "Proveedores en " + (zona?.label.split(",")[0] ?? "tu zona")}</h2>
              <Link to={zona ? `/explorar?dep=${zona.departamento}&mun=${zona.municipio}` : "/explorar"} className="shrink-0 text-sm font-semibold text-brand">Ver todos</Link>
            </div>
            <div className="card divide-y divide-line">
              {featured === null && <div className="h-24 animate-pulse" />}
              {featured?.length === 0 && <p className="p-5 text-center text-sm text-ink-soft">Todavía no hay proveedores registrados en {zona?.label.split(",")[0] ?? "tu zona"}. Puedes publicar tu necesidad y te avisaremos cuando alguien compatible la vea.</p>}
              {featured?.map((p) => (
                <Link key={p.id} to={"/proveedor/" + p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/60">
                  <Avatar name={p.name} photo={p.photo} size={40} dot={(p.availability ?? availability(p.schedule)) === "ahora" ? "on" : "away"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[15px] font-semibold"><span className="min-w-0 truncate">{p.name}</span>{p.test && <TestBadge />}</div>
                    <div className="truncate text-xs text-ink-soft">{p.profession}{p.distanceKm != null && ` · ${gps ? "≈ " : ""}${p.distanceKm} km`}</div>
                  </div>
                  <Rating value={p.rating} count={p.reviews} className="text-sm" />
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function ActiveCard({ r }: { r: Request }) {
  const { getProvider, visibleApplicants } = useStore();
  const p = getProvider(r.providerId);
  const Icon = SERVICE_ICON[r.service];
  const apps = visibleApplicants(r).length;
  return (
    <Link to={r.status === "buscando" ? "/proveedores/" + r.id : "/solicitud/" + r.id} className="card flex items-center gap-3 p-3.5 transition hover:ring-brand/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{r.title}</div>
        {r.status === "en_curso" && r.agreement ? (
          <div className="text-sm text-ink-soft">{p?.name} · {agreementWhen(r.agreement.date, r.agreement.time)}</div>
        ) : (
          <div className="text-sm font-semibold text-brand">{apps > 0 ? `${apps} oferta${apps > 1 ? "s" : ""} recibida${apps > 1 ? "s" : ""}` : "Esperando postulaciones"}</div>
        )}
      </div>
      <LuChevronRight className="h-5 w-5 text-brand" />
    </Link>
  );
}

// =====================================================================
//  Explorar proveedores — filtros por departamento y municipio
//  (cada cambio consulta la base de datos: api_buscar_proveedores)
// =====================================================================
export function Explore() {
  const { zona, usarUbicacionActual, gpsState } = useStore();
  const qp = query();
  const [q, setQ] = useState(qp.get("q") ?? "");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const initialSub = qp.get("sub") ?? "";
  const [cat, setCat] = useState<string>(qp.get("cat") ?? (initialSub ? serviceById(initialSub).category : ""));
  const [sub, setSub] = useState<string>(initialSub);
  const [sort, setSort] = useState<"rating" | "distance">("rating");
  const [onlyNow, setOnlyNow] = useState(false);
  const [nearMe, setNearMe] = useState(zona?.fuente === "gps" && !qp.get("mun"));
  const [ubic, setUbic] = useState({ departamento: qp.get("dep") ?? zona?.departamento ?? "", municipio: qp.get("mun") ?? zona?.municipio ?? "" });
  const gpsFix = nearMe && zona?.fuente === "gps" ? zona : null;
  // Con "Cerca de mí" activo, el municipio sigue a la ubicación actual (se actualiza en tiempo real)
  useEffect(() => { if (gpsFix) setUbic({ departamento: gpsFix.departamento, municipio: gpsFix.municipio }); }, [gpsFix?.municipio]);
  const [data, setData] = useState<{ total: number; referencia: string | null; distanciaDesde: string; resultados: Provider[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q), 300); return () => clearTimeout(t); }, [q]);

  // Consulta a la base de datos cada vez que cambia un filtro
  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    rpc<NonNullable<typeof data>>("api_buscar_proveedores", {
      p_departamento: ubic.departamento || null, p_municipio: ubic.municipio || null,
      p_categoria: cat || null, p_servicio: sub || null, p_texto: debouncedQ.trim() || null, p_solo_ahora: onlyNow, p_orden: sort,
      p_lat: gpsFix ? gpsFix.lat : null, p_lng: gpsFix ? gpsFix.lng : null,
    })
      .then((r) => alive && setData(r))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [ubic.departamento, ubic.municipio, cat, sub, debouncedQ, onlyNow, sort, nearMe, gpsFix ? Math.round(gpsFix.lat! * 500) + ":" + Math.round(gpsFix.lng! * 500) : ""]);

  const toggleNear = async () => {
    if (nearMe) { setNearMe(false); setSort("rating"); return; }
    const ok = zona?.fuente === "gps" || (await usarUbicacionActual());
    if (ok) { setNearMe(true); setSort("distance"); }
  };
  const clearAll = () => { setQ(""); setCat(""); setSub(""); setOnlyNow(false); setNearMe(false); setSort("rating"); };

  const list = data?.resultados ?? [];
  const locales = list.filter((p) => p.ubicacion !== "cobertura");
  const cercanos = list.filter((p) => p.ubicacion === "cobertura");
  const fromGps = data?.distanciaDesde === "gps";
  const subs = cat ? servicesOf(cat) : [];
  const sel = "w-full appearance-none rounded-xl bg-white py-3 pl-4 pr-10 text-[15px] outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/40 disabled:opacity-60";
  const card = (p: Provider) => (
    <Link key={p.id} to={"/proveedor/" + p.id} className="card flex gap-3.5 p-4 transition hover:ring-brand/40">
      <Avatar name={p.name} photo={p.photo} size={56} dot={p.availability === "ahora" ? "on" : "away"} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 font-bold">{p.name}{p.verified && <LuBadgeCheck className="h-4 w-4 shrink-0 text-brand" />}{p.test && <TestBadge />}</div>
        <div className="truncate text-sm text-ink-soft">{p.services.map((x) => serviceById(x).short).join(" · ")}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Rating value={p.rating} count={p.reviews} />
          <span className="inline-flex items-center gap-1 text-ink-soft"><LuMapPin className="h-3.5 w-3.5" />{p.city.split(",")[0]}{p.distanceKm != null && ` · ${p.distanceKm} km${fromGps ? " de ti" : ""}`}</span>
        </div>
        <div className="mt-1 text-sm font-semibold">{money(p.priceMin)} – {money(p.priceMax)}</div>
      </div>
    </Link>
  );

  return (
    <AppShell>
      <PageHeader title="Explorar servicios" back="/inicio" className="lg:justify-start [&>div]:lg:px-0 [&>div]:lg:text-left [&>button]:lg:hidden" />
      <div className="card space-y-3 p-4">
        <label className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand/40">
          <LuSearch className="h-5 w-5 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué necesitas? Ej. lavadora, torta, inglés…" className="w-full bg-transparent outline-none" aria-label="Buscar" />
          {q && <button onClick={() => setQ("")} aria-label="Limpiar"><LuX className="h-5 w-5 text-ink-soft" /></button>}
        </label>
        <UbicacionSelect variant="compact" allowAll value={ubic} onChange={(v) => { setUbic(v); setNearMe(false); if (sort === "distance") setSort("rating"); }} />
        <div>
          <div className="mb-2 text-sm font-semibold">Sector</div>
          <CategoryPicker variant="chips" value={cat} showCount onChange={(id) => { setCat(id); setSub(""); }} />
        </div>
        {cat && (
          <label className="relative block">
            <select aria-label="Subcategoría" className={sel} value={sub} onChange={(e) => setSub(e.target.value)}>
              <option value="">{`Todas las subcategorías de ${categoryById(cat)?.short ?? "este sector"} (${subs.length})`}</option>
              {subs.map((x) => <option key={x.id} value={x.id}>{x.name}{x.providers ? ` (${x.providers})` : ""}</option>)}
            </select>
            <LuChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2" />
          </label>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={onlyNow} onClick={() => setOnlyNow(!onlyNow)}>Disponible ahora</Chip>
          <Chip active={nearMe} onClick={toggleNear}><LuLocateFixed className="mr-1 inline h-4 w-4" />{gpsState === "pidiendo" ? "Ubicando…" : "Cerca de mí"}</Chip>
          <label className="relative ml-auto">
            <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value as any)} className="appearance-none rounded-full bg-white py-2 pl-4 pr-9 text-sm font-semibold ring-1 ring-line">
              <option value="rating">Mejor calificados</option>
              <option value="distance">Más cercanos</option>
            </select>
            <LuChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </label>
        </div>
        {GPS_MSG[gpsState] && gpsState !== "pidiendo" && <p className="text-xs text-bad">{GPS_MSG[gpsState]}</p>}
        {gpsFix && <p className="text-xs text-ink-soft">Distancias medidas desde tu ubicación actual en tiempo real (±{gpsFix.accuracy} m). Tu ubicación no se guarda ni se muestra a nadie. Puedes elegir otra ciudad arriba.</p>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft" aria-live="polite">
        <span data-testid="explorar-total">
          {loading ? "Buscando en la base de datos…" : error ? "" : `${data?.total ?? 0} proveedor${data?.total === 1 ? "" : "es"} ${data?.referencia ? "en " + data.referencia : "en toda Colombia"}${sub ? " · " + serviceById(sub).name : cat ? " · " + (categoryById(cat)?.short ?? "") : ""}`}
        </span>
        {(q || cat || onlyNow || nearMe) && <button className="shrink-0 font-semibold text-brand" onClick={clearAll}>Limpiar filtros</button>}
      </div>

      {error ? (
        <div className="mt-6"><Empty icon={LuTriangleAlert} title="No se pudo consultar" text={error} /></div>
      ) : loading && !data ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse" />)}</div>
      ) : list.length === 0 ? (
        <div className="mt-6"><Empty icon={LuSearch} title="Todavía no hay resultados" text="Aún no hay proveedores registrados que coincidan con estos filtros. Prueba con otro municipio, sector o subcategoría, o publica tu necesidad: avisaremos a los proveedores compatibles cuando se registren." action={<Button onClick={() => navigate(sub ? "/publicar?servicio=" + sub : "/publicar")}>Publicar necesidad</Button>} /></div>
      ) : (
        <div className={cx("transition-opacity", loading && "opacity-60")}>
          {locales.length > 0 && (
            <>
              {ubic.municipio && <h2 className="mb-3 mt-5 font-bold">En {data?.referencia?.split(",")[0]} ({locales.length})</h2>}
              <div className={cx("grid gap-3 md:grid-cols-2 xl:grid-cols-3", !ubic.municipio && "mt-4")} data-testid="explorar-resultados">{locales.map(card)}</div>
            </>
          )}
          {cercanos.length > 0 && (
            <>
              <h2 className="mt-8 font-bold">También atienden en {data?.referencia?.split(",")[0]} ({cercanos.length})</h2>
              <p className="mb-3 text-sm text-ink-soft">Proveedores de municipios vecinos cuya zona de cobertura incluye esta ubicación.</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{cercanos.map(card)}</div>
            </>
          )}
        </div>
      )}

      <Link to="/trueque" className="mt-8 flex items-center gap-3 rounded-xl p-3 text-sm ring-1 ring-line hover:ring-brand/40">
        <LuRepeat className="h-5 w-5 text-ok" />
        <span className="flex-1"><b>Match por trueque:</b> intercambia habilidades sin usar dinero</span>
        <LuChevronRight className="h-5 w-5 text-brand" />
      </Link>
    </AppShell>
  );
}

// =====================================================================
//  Publicar necesidad: 1) sector y subcategoría  2) descripción
//  3) ubicación (municipio + dirección obligatorios, GPS opcional)  4) pago
// =====================================================================
type Cercano = { codigo: string; nombre: string; departamento: string; departamentoNombre: string; distanciaKm: number };

export function Publish() {
  const { publishRequest, toast, strikes, zona, addresses } = useStore();
  const pre = query().get("servicio") as ServiceId | null;
  const [cat, setCat] = useState<string>(pre ? serviceById(pre).category : "");
  const [service, setService] = useState<ServiceId>(pre ?? "");
  const [desc, setDesc] = useState(query().get("desc") ?? "");
  const [ubic, setUbic] = useState({ departamento: zona?.departamento ?? "", municipio: zona?.municipio ?? "" });
  const [direccion, setDireccion] = useState("");
  const geo = useGeolocation();
  const [cercano, setCercano] = useState<Cercano | null>(null);
  const [usarGps, setUsarGps] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [proposals, setProposals] = useState(true);
  const [placeModal, setPlaceModal] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<number | null>(null);
  const [busy, wrap] = useBusy();

  // Vista previa del algoritmo (consulta la base de datos)
  useEffect(() => {
    if (!ubic.municipio || !service) { setPreview(null); return; }
    rpc<number>("api_vista_previa", { p_servicio: service, p_municipio: ubic.municipio }).then(setPreview).catch(() => setPreview(null));
  }, [service, ubic.municipio]);

  // El GPS solo se usa si corresponde al municipio elegido
  const gpsCoincide = !!cercano && cercano.codigo === ubic.municipio;
  useEffect(() => { if (!gpsCoincide) setUsarGps(false); }, [gpsCoincide]);

  const pedirGps = async () => {
    const f = await geo.request();
    if (!f) return;
    try {
      const m = await rpc<Cercano>("api_municipio_cercano", { p_lat: f.lat, p_lng: f.lng });
      setCercano(m);
      if (m.codigo === ubic.municipio) setUsarGps(true);
    } catch { toast("No pudimos identificar el municipio de tu ubicación"); }
  };
  const usarMunicipioGps = async () => {
    if (!cercano) return;
    await getMunicipios(cercano.departamento);
    setUbic({ departamento: cercano.departamento, municipio: cercano.codigo });
    setUsarGps(true);
    setErr({ ...err, departamento: "", municipio: "" });
  };

  const submit = () => wrap(async () => {
    if (strikes >= 3) { toast("Tu cuenta está suspendida por acumular 3 faltas graves"); return; }
    const e: Record<string, string> = {};
    if (!service) e.service = "Elige el sector y la subcategoría de lo que necesitas";
    if (desc.trim().length < 10) e.desc = "Describe tu necesidad (mínimo 10 caracteres)";
    if (!ubic.departamento) e.departamento = "Selecciona el departamento";
    if (!ubic.municipio) e.municipio = "Selecciona la ciudad o municipio";
    if (direccion.trim().length < 5) e.direccion = "Escribe la dirección donde se prestará el servicio";
    setErr(e);
    if (Object.keys(e).length) { document.querySelector("[data-err]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const gps = usarGps && gpsCoincide && geo.fix ? geo.fix : null;
    const r = await publishRequest({ desc: desc.trim(), service, ...ubic, lat: gps?.lat, lng: gps?.lng, precision: gps?.accuracy, direccion: direccion.trim(), payment, wantsProposals: proposals });
    navigate("/buscando/" + r.id);
  });

  const step = (n: number, title: string, done: boolean) => (
    <h2 className="mb-3 flex items-center gap-2.5 font-bold">
      <span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs", done ? "bg-ok text-white" : "bg-brand-50 text-brand")}>{done ? <LuCheck className="h-3.5 w-3.5" strokeWidth={3} /> : n}</span>
      {title}
    </h2>
  );
  const errText = (k: string) => err[k] ? <p data-err className="mt-1.5 text-sm font-medium text-bad">{err[k]}</p> : null;
  const inputCls2 = "w-full rounded-xl bg-white px-4 py-3 outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/40";
  const c = categoryById(cat);
  const CatIcon = cat ? CATEGORY_ICON[cat] : LuSearch;

  return (
    <AppShell hideNav>
      <PageHeader title="Publicar necesidad" back="/inicio" />
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* 1. Sector y subcategoría */}
          <section className="card p-5">
            {step(1, "¿Qué necesitas?", !!service)}
            {!cat ? (
              <>
                <p className="mb-3 text-sm text-ink-soft">Primero elige el sector; luego la subcategoría exacta de lo que necesitas.</p>
                <CategoryPicker variant="list" onChange={(id) => { setCat(id); setService(""); }} />
              </>
            ) : (
              <div>
                <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
                  <span className={cx("flex h-9 w-9 items-center justify-center rounded-lg", c?.tint)}><CatIcon className="h-[18px] w-[18px]" /></span>
                  <div className="min-w-0 flex-1"><div className="text-xs text-ink-soft">Sector</div><div className="font-semibold">{c?.name}</div></div>
                  <button onClick={() => { setCat(""); setService(""); }} className="text-sm font-semibold text-brand">Cambiar</button>
                </div>
                <div className="mt-4 text-sm font-semibold">Subcategoría</div>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Subcategoría">
                  {servicesOf(cat).map((x) => {
                    const I = SERVICE_ICON[x.id];
                    return (
                      <button key={x.id} role="radio" aria-checked={service === x.id} onClick={() => { setService(x.id); setErr({ ...err, service: "" }); }}
                        className={cx("inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition", service === x.id ? "bg-brand text-white" : "bg-white ring-1 ring-line hover:ring-brand/40")}>
                        <I className="h-4 w-4" />{x.name}{x.providers ? <span className={cx("text-xs", service === x.id ? "text-white/80" : "text-ink-soft")}>({x.providers})</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {errText("service")}
          </section>

          {/* 2. Descripción */}
          <section className="card p-5">
            {step(2, "Describe lo que necesitas", desc.trim().length >= 10)}
            <textarea
              name="descripcion"
              value={desc}
              maxLength={500}
              onChange={(e) => { setDesc(e.target.value); setErr({ ...err, desc: "" }); }}
              placeholder="Ej. Necesito reparar una tubería rota, hay una fuga de agua en la cocina."
              className={cx(inputCls2, "h-28 resize-none", err.desc && "ring-2 ring-bad/50")}
            />
            <div className="flex justify-between text-xs text-ink-soft"><span />{desc.length}/500</div>
            {errText("desc")}
          </section>

          {/* 3. Ubicación */}
          <section className="card p-5">
            {step(3, "¿Dónde se prestará el servicio?", !!ubic.municipio && direccion.trim().length >= 5)}
            <UbicacionSelect variant="compact" value={ubic} onChange={(v) => { setUbic(v); setErr({ ...err, departamento: "", municipio: "" }); }} />
            {errText("departamento") || errText("municipio")}
            <div className="mt-3 flex gap-2">
              <input name="direccion" value={direccion} onChange={(e) => { setDireccion(e.target.value); setErr({ ...err, direccion: "" }); }}
                placeholder="Dirección y barrio *" className={cx(inputCls2, err.direccion && "ring-2 ring-bad/50")} />
              {addresses.length > 0 && <Button variant="outline" className="shrink-0 rounded-xl px-4 text-sm" onClick={() => setPlaceModal(true)}>Guardadas</Button>}
            </div>
            {errText("direccion")}

            <div className="mt-4 rounded-xl bg-surface p-3.5 text-sm">
              {!geo.fix ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="flex min-w-0 flex-1 items-start gap-2.5 text-ink-soft"><LuLocateFixed className="mt-0.5 h-5 w-5 shrink-0 text-brand" />Opcional: comparte tu ubicación actual para que te contacten primero los proveedores más cercanos.</p>
                  <Button variant="soft" className="shrink-0 rounded-xl px-4 py-2 text-sm" disabled={geo.status === "pidiendo"} onClick={pedirGps}>{geo.status === "pidiendo" ? "Ubicando…" : "Usar mi ubicación"}</Button>
                  {GEO_MSG[geo.status] && <p className="w-full text-xs text-bad">{GEO_MSG[geo.status]}</p>}
                </div>
              ) : cercano && gpsCoincide ? (
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={usarGps} onChange={(e) => setUsarGps(e.target.checked)} className="mt-0.5 h-5 w-5 accent-brand" />
                  <span><b>Usar mi ubicación GPS como punto exacto</b> (±{geo.fix.accuracy} m, dentro de {cercano.nombre}). El municipio sigue siendo {cercano.nombre}; el GPS solo mejora el cálculo de cercanía.</span>
                </label>
              ) : cercano ? (
                <div className="space-y-2">
                  <p>Tu ubicación actual parece estar en <b>{cercano.nombre}, {cercano.departamentoNombre}</b>, que no coincide con el municipio elegido. No la usaremos a menos que cambies el municipio.</p>
                  <div className="flex gap-2">
                    <Button variant="soft" className="rounded-xl px-4 py-2 text-sm" onClick={usarMunicipioGps}>Usar {cercano.nombre}</Button>
                    <Button variant="ghost" className="rounded-xl px-3 py-2 text-sm" onClick={() => { geo.clear(); setCercano(null); }}>Descartar GPS</Button>
                  </div>
                </div>
              ) : <p className="text-ink-soft">Ubicando municipio…</p>}
            </div>
          </section>

          {/* 4. Pago */}
          <section className="card p-5">
            {step(4, "Método de pago preferido", true)}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(PAYMENTS) as PaymentMethod[]).map((m) => {
                const Icon = PAYMENT_ICON[m];
                return (
                  <button key={m} onClick={() => setPayment(m)} className={cx("flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium transition", payment === m ? "bg-brand-50 ring-2 ring-brand" : "bg-white ring-1 ring-line hover:ring-brand/40")}>
                    <Icon className={cx("h-5 w-5 shrink-0", payment === m ? "text-brand" : PAYMENT_COLOR[m])} />
                    <span className="leading-tight">{PAYMENTS[m]}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <div className="flex-1"><div className="text-sm font-semibold">Recibir propuestas de precio</div><p className="text-xs text-ink-soft">Los proveedores compatibles podrán enviarte sus ofertas.</p></div>
              <Toggle on={proposals} onChange={setProposals} label="Recibir propuestas" />
            </div>
          </section>

          <Button onClick={submit} disabled={busy} className="w-full rounded-xl py-4 text-lg">{busy ? "Publicando…" : "Publicar necesidad"}</Button>
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-24 space-y-4 p-5 text-sm">
            <div className="flex items-center gap-2 font-bold text-brand"><LuRadar className="h-5 w-5" /> Vista previa del algoritmo</div>
            <p className="text-ink-soft">{preview == null ? "Elige la subcategoría y el municipio para ver cuántos proveedores pueden atenderte." : <><b className="text-2xl text-ink">{preview}</b><br />proveedores de {serviceById(service).name.toLowerCase()} cubren {ubic.municipio ? "este municipio" : "esta zona"}.</>}</p>
            <ul className="space-y-2 border-t border-line pt-4 text-ink-soft">
              <li className="flex gap-2"><LuShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> Solo se notifica a proveedores de esa subcategoría cuya zona de cobertura incluye el lugar del servicio.</li>
              <li className="flex gap-2"><LuMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> Los proveedores ven solo el municipio y una zona aproximada. Tu dirección exacta solo la ve el proveedor que contrates.</li>
            </ul>
          </div>
        </aside>
      </div>

      <Modal open={placeModal} onClose={() => setPlaceModal(false)} title="Mis direcciones guardadas">
        <div className="space-y-2">
          {addresses.map((p) => (
            <button key={p.id} onClick={async () => { await getMunicipios(p.departamento); setUbic({ departamento: p.departamento, municipio: p.municipio }); setDireccion(p.address); setPlaceModal(false); setErr({}); }}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left ring-1 ring-line hover:bg-surface">
              <LuMapPin className="h-5 w-5 text-brand" />
              <div><div className="font-semibold">{p.name}</div><div className="text-sm text-ink-soft">{p.address} · {p.label}</div></div>
            </button>
          ))}
          <Link to="/perfil/direcciones" className="block pt-2 text-center text-sm font-semibold text-brand">Administrar direcciones</Link>
        </div>
      </Modal>
    </AppShell>
  );
}

// =====================================================================
//  Orquestación: animación del emparejamiento (4 pasos de la arquitectura)
// =====================================================================
export function Searching({ id }: { id: string }) {
  const { findRequest, getProvider, visibleApplicants, phase } = useStore();
  const r = findRequest(id);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const ts = [700, 1500, 2400, 3300].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, []);
  if (!r) return <NotFoundReq />;
  const trace = r.trace ?? { total: 0, byCategory: 0, byCoverage: r.matched.length, bySchedule: r.matched.length };
  const apps = visibleApplicants(r);
  const steps = [
    { icon: LuMapPin, t: "Mapa GPS", d: r.location.label },
    { icon: LuFilter, t: "Filtros de solicitud", d: `${serviceById(r.service).name} · ${PAYMENTS[r.payment]}` },
    { icon: LuBrain, t: "Algoritmo de emparejamiento", d: `${trace.total} proveedores → ${trace.byCategory} por categoría → ${trace.byCoverage} por cobertura → ${trace.bySchedule} en horario` },
    { icon: LuBadgeCheck, t: "Proveedores compatibles", d: `${r.matchedCount} notificados en tiempo real` },
  ];

  return (
    <AppShell hideNav>
      <PageHeader title="Buscando proveedores" back="/solicitudes" sub={r.title} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card flex flex-col items-center justify-center gap-3 p-8 text-center lg:h-[440px]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand"><LuRadar className={cx("h-10 w-10", stage < 4 && "animate-pulse")} /></span>
          <div className="text-5xl font-extrabold">{stage >= 4 ? r.matchedCount : "…"}</div>
          <div className="font-semibold">proveedores compatibles notificados</div>
          <p className="max-w-xs text-sm text-ink-soft">{r.location.label}</p>
        </div>
        <div>
          <ol className="space-y-3">
            {steps.map((s, i) => {
              const done = stage > i, current = stage === i;
              return (
                <li key={s.t} className={cx("card flex items-center gap-4 p-4 transition", !done && !current && "opacity-50")}>
                  <span className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", done ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand")}>
                    {done ? <LuCheck className="h-6 w-6" strokeWidth={3} /> : <s.icon className={cx("h-6 w-6", current && "animate-pulse")} />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-ink-soft">PASO {i + 1}</div>
                    <div className="font-bold">{s.t}</div>
                    {done && <div className="animate-fade-up text-sm text-ink-soft">{s.d}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
          {stage >= 4 && (
            <div className="animate-fade-up mt-5 rounded-3xl bg-brand-50 p-5">
              {r.matchedCount === 0 ? (
                <>
                  <div className="font-bold">Todavía no hay proveedores registrados en tu zona para esta subcategoría.</div>
                  <p className="mt-1 text-sm text-ink-soft">Tu solicitud queda publicada. Los proveedores compatibles que se registren podrán verla y postularse.</p>
                  <Button className="mt-4 w-full" onClick={() => navigate("/solicitudes")}>Ir a mis solicitudes</Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">{apps.slice(0, 4).map((a) => { const p = getProvider(a.providerId); return p ? <Avatar key={a.providerId} name={p.name} photo={p.photo} size={40} /> : null; })}</div>
                    <div className="font-bold">{apps.length === 0 ? "Aún no hay postulaciones. Te avisaremos cuando un proveedor se postule." : `${apps.length} proveedor${apps.length > 1 ? "es" : ""} se postularon`}</div>
                  </div>
                  <Button className="mt-4 w-full" icon={LuArrowRight} onClick={() => navigate("/proveedores/" + r.id)}>Ver y comparar ofertas</Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// =====================================================================
//  Proveedores compatibles (postulaciones ordenadas por calificación)
// =====================================================================
export function CompatibleProviders({ id }: { id: string }) {
  const { findRequest, getProvider, visibleApplicants } = useStore();
  const r = findRequest(id);
  const [sort, setSort] = useState<"price" | "rating" | "distance">("price");
  const [nowOnly, setNowOnly] = useState(false);
  if (!r) return <NotFoundReq />;
  const apps = visibleApplicants(r);
  const rows = apps
    .map((a) => ({ a, p: getProvider(a.providerId)! }))
    .filter((x) => x.p)
    .map(({ a, p }) => ({ a, p, d: a.distanceKm ?? distanceKm(r.location, p), av: p.availability ?? availability(p.schedule) }))
    .filter((x) => !nowOnly || x.av === "ahora")
    .sort((x, y) => (sort === "price" ? x.a.price - y.a.price : sort === "rating" ? (y.p.reviews ? y.p.rating : 0) - (x.p.reviews ? x.p.rating : 0) : x.d - y.d));
  const minPrice = Math.min(...apps.map((a) => a.price));

  return (
    <AppShell>
      <PageHeader title="Compara las ofertas" back="/solicitudes" sub={<span className="hidden sm:inline">{r.title} · {serviceById(r.service).name}</span>} />
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        <Chip active={sort === "price"} onClick={() => setSort("price")}>Menor precio</Chip>
        <Chip active={sort === "rating"} onClick={() => setSort("rating")}>Mejor calificados</Chip>
        <Chip active={sort === "distance"} onClick={() => setSort("distance")}>Más cercanos</Chip>
        <Chip active={nowOnly} onClick={() => setNowOnly(!nowOnly)}>Disponible ahora</Chip>
      </div>
      {r.status !== "buscando" && (
        <div className="mt-4 rounded-2xl bg-ok-50 p-4 text-sm font-semibold text-ok">Esta solicitud ya tiene un acuerdo. <Link to={"/solicitud/" + r.id} className="underline">Ver detalle</Link></div>
      )}

      {rows.length > 1 && (
        <div className="card mt-5 overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-left text-sm" data-testid="comparar-ofertas">
            <thead className="bg-surface text-ink-soft">
              <tr><th className="px-4 py-3 font-semibold">Proveedor</th><th className="px-4 py-3 font-semibold">Precio propuesto</th><th className="px-4 py-3 font-semibold">Calificación</th><th className="px-4 py-3 font-semibold">Distancia</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ a, p, d }) => (
                <tr key={p.id}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2 font-semibold"><Avatar name={p.name} photo={p.photo} size={32} />{p.name}{p.test && <TestBadge />}</div></td>
                  <td className="px-4 py-3 font-extrabold">{money(a.price)}{a.price === minPrice && <Badge tone="ok" className="ml-2 px-2 py-0.5 text-[11px]">Menor</Badge>}</td>
                  <td className="px-4 py-3"><Rating value={p.rating} count={p.reviews} /></td>
                  <td className="px-4 py-3 text-ink-soft">{d.toFixed(1)} km</td>
                  <td className="px-4 py-3 text-right">{r.status === "buscando" && <Link to={`/acuerdo/${r.id}/${p.id}`} className="font-bold text-brand">Elegir</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ a, p, d, av }) => (
          <div key={p.id} className="card animate-fade-up p-5">
            <div className="flex gap-4">
              <Avatar name={p.name} photo={p.photo} size={88} dot={av === "ahora" ? "on" : "away"} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xl font-extrabold">{p.name}{p.test && <TestBadge />}</div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <Rating value={p.rating} count={p.reviews} />
                  <span className="inline-flex items-center gap-1 text-ink-soft"><LuMapPin className="h-4 w-4" />A {d.toFixed(1)} km</span>
                </div>
                <div className={cx("mt-1 flex items-center gap-1.5 text-sm font-semibold", av === "otro" ? "text-warn" : "text-ok")}>
                  {av === "ahora" ? <LuCircleCheck className="h-4 w-4" /> : <LuCircleDot className="h-4 w-4" />}{availabilityLabel[av]}
                </div>
                <div className="mt-2 text-2xl font-extrabold text-brand">{money(a.price)}</div>
                <div className="text-xs text-ink-soft">Propuesta enviada {timeAgo(a.at).toLowerCase()}</div>
              </div>
            </div>
            {a.note && <p className="mt-3 rounded-2xl bg-surface p-3 text-sm text-ink-soft">“{a.note}”</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="soft" onClick={() => navigate(`/proveedor/${p.id}?sol=${r.id}`)}>Ver perfil</Button>
              {r.status === "buscando" ? <Button onClick={() => navigate(`/acuerdo/${r.id}/${p.id}`)}>Elegir</Button> : <span />}
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <Empty icon={LuUsers} title="Aún no hay postulaciones" text={r.matchedCount ? `Notificamos a ${r.matchedCount} proveedor${r.matchedCount > 1 ? "es" : ""} compatible${r.matchedCount > 1 ? "s" : ""}. Te avisaremos cuando alguno se postule.` : "Todavía no hay proveedores registrados en tu zona para esta subcategoría."} />
      )}
    </AppShell>
  );
}

// =====================================================================
//  Perfil del proveedor / Selección del proveedor
// =====================================================================
export function ProviderProfile({ id }: { id: string }) {
  const { getProvider, loadProvider, findRequest, openConversation, toast, mode, myProvider, zona } = useStore();
  const sol = query().get("sol");
  const r = sol ? findRequest(sol) : undefined;
  const [tab, setTab] = useState<"info" | "portafolio" | "resenas">(r ? "portafolio" : "info");
  const [phone, setPhone] = useState(false);
  const [full, setFull] = useState<Provider | null>(null);
  const [state, setState] = useState<"cargando" | "listo" | "error">("cargando");
  // Datos completos del proveedor (incluye reseñas) desde la base de datos
  useEffect(() => {
    setState("cargando");
    loadProvider(id).then((x) => { setFull(x); setState(x ? "listo" : "error"); }).catch(() => setState("error"));
  }, [id]);
  const p = full ?? getProvider(id);
  if (!p) return <AppShell>{state === "cargando" ? <div className="card mx-auto h-64 max-w-3xl animate-pulse" /> : <Empty icon={LuUserRound} title="Proveedor no encontrado" />}</AppShell>;
  const av = p.availability ?? availability(p.schedule);
  const app = r?.applicants.find((a) => a.providerId === p.id);
  const ref = r?.location ?? (zona?.fuente === "gps" ? { lat: zona.lat!, lng: zona.lng! } : null);
  const d = app?.distanceKm ?? (ref ? distanceKm(ref, p) : null);
  const reviews = p.resenas ?? [];
  const isMe = myProvider?.id === p.id;

  const chat = async () => { const c = await openConversation({ provider: p.id }); navigate("/chat/" + c); };
  const hire = () => {
    if (r && r.status === "buscando") navigate(`/acuerdo/${r.id}/${p.id}`);
    else navigate(`/publicar?servicio=${p.services[0]}`);
  };

  const info = (
    <div className="space-y-5">
      {[
        [LuWrench, "Profesión", p.profession],
        [LuMapPin, "Ubicación", p.city],
        [LuRadar, "Cobertura", `Hasta ${p.coverageKm} km`],
        [LuTimer, "Horario de atención", scheduleLabel(p.schedule)],
        [LuBriefcase, "Empresa / marca", p.company],
      ].map(([I, t, v]: any) => (
        <div key={t} className="flex items-start gap-5"><I className="mt-0.5 h-7 w-7 shrink-0" /><div><div className="font-bold">{t}</div><div className="text-ink-soft">{v}</div></div></div>
      ))}
      <div className="border-t border-line pt-4">
        <div className="text-lg font-bold">Sobre mí</div>
        <p className="mt-1 text-ink-soft">{p.about}</p>
      </div>
    </div>
  );
  const portfolio = (
    <div>
      {p.portfolio.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">{p.portfolio.map((src) => <img key={src} src={src} alt="Trabajo realizado" className="aspect-[1.1] w-full rounded-2xl object-cover" />)}</div>
      ) : <p className="rounded-2xl bg-surface p-4 text-sm text-ink-soft">Este proveedor aún no ha subido fotos de sus trabajos.</p>}
      <div className="mt-6 text-lg font-bold">Servicios que ofrece</div>
      <ul className="mt-3 space-y-3">
        {p.offers.map((o) => <li key={o} className="flex items-center gap-3 text-ink-soft"><LuCheck className="h-6 w-6 text-brand" strokeWidth={2.5} />{o}</li>)}
      </ul>
    </div>
  );
  const resenas = (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-2xl bg-surface p-4">
        <div className="text-4xl font-extrabold">{p.rating.toFixed(1)}</div>
        <div><Stars value={p.rating} /><div className="mt-1 text-sm text-ink-soft">{p.reviews} reseñas · {p.completed} servicios realizados</div></div>
      </div>
      {reviews.length === 0 && <p className="text-sm text-ink-soft">Aún no hay reseñas escritas.</p>}
      {reviews.map((rv, i) => (
        <div key={i} className="rounded-2xl p-4 ring-1 ring-line">
          <div className="flex items-center justify-between"><div className="font-bold">{rv.name}</div><Stars value={rv.stars} size={14} /></div>
          <p className="mt-1 text-ink-soft">{rv.text}</p>
          <div className="mt-1 text-xs text-ink-soft">{rv.date}</div>
        </div>
      ))}
    </div>
  );

  return (
    <AppShell hideNav>
      <PageHeader title={r ? "Selección del proveedor" : <span className="flex items-center gap-2"><img src="img/logo.png" alt="" className="h-9 w-9" />Conecta<span className="-ml-2 text-brand-blue">+</span><span className="-ml-2 text-brand-gradient">PRO</span></span>} back={r ? "/proveedores/" + r.id : "/explorar"}
        right={<button onClick={async () => {
          const url = location.href.split("?")[0].replace(/#.*/, "") + "#/proveedor/" + p.id;
          try {
            if ((navigator as any).share) await (navigator as any).share({ title: p.name + " en ConectaPRO", url });
            else { await navigator.clipboard.writeText(url); toast("Enlace del perfil copiado"); }
          } catch { /* el usuario canceló */ }
        }} className="rounded-full p-2 hover:bg-white" aria-label="Compartir perfil"><LuEllipsisVertical className="h-6 w-6" /></button>} />
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="text-center lg:card lg:self-start lg:p-8">
          <Avatar name={p.name} photo={p.photo} size={176} verified={p.verified} className="mx-auto" />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{p.name}</h1>
          {p.test && <TestBadge className="mt-1" />}
          <div className="mt-1"><Rating value={p.rating} count={p.reviews} className="text-lg" /> <span className="text-ink-soft">reseñas</span></div>
          {p.verified && <Badge tone="ok" icon={LuCircleCheck} className="mt-2 px-4 py-1.5 text-base">Verificado</Badge>}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge tone="brand" icon={LuMapPin} className="px-4 py-2 text-base">{d != null ? `${app ? "A" : "≈"} ${d.toFixed(1)} km` : p.city.split(",")[0]}</Badge>
            <Badge tone={av === "otro" ? "warn" : "ok"} icon={LuCircleDot} className="px-4 py-2 text-base">{availabilityLabel[av]}</Badge>
          </div>
          <div className="mt-6 hidden gap-3 lg:grid">
            {!isMe && <Button onClick={hire} className="w-full py-4 text-lg" icon={r ? LuMessageCircle : undefined}>{r ? "Contratar" : "Contactar"}</Button>}
            {!isMe && <div className="grid grid-cols-2 gap-3"><Button variant="outline" icon={LuPhone} onClick={() => setPhone(true)}>Llamar</Button><Button variant="outline" icon={LuMessageCircle} onClick={chat}>Mensaje</Button></div>}
          </div>
        </div>

        <div className="lg:card lg:p-8">
          <div className="flex border-b border-line">
            {([["info", "Información"], ["portafolio", r ? "Portafolio" : "Servicios"], ["resenas", "Reseñas"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={cx("relative flex-1 pb-3 text-lg font-bold transition", tab === k ? "text-brand" : "text-ink-soft")}>
                {l}{tab === k && <span className="absolute inset-x-[10%] -bottom-px h-[3px] rounded-full bg-brand" />}
              </button>
            ))}
          </div>
          <div className="animate-fade-up pt-6" key={tab}>{tab === "info" ? info : tab === "portafolio" ? portfolio : resenas}</div>
        </div>
      </div>

      {/* Acciones fijas en móvil */}
      {!isMe && mode === "cliente" && (
        <div className="sticky bottom-0 -mx-4 mt-6 bg-gradient-to-t from-surface via-surface to-transparent px-4 pb-5 pt-6 lg:hidden">
          {r ? (
            <div className="grid grid-cols-[1fr_1.4fr] gap-3">
              <Button variant="soft" icon={LuPhone} className="py-4 text-lg" onClick={() => setPhone(true)}>Llamar</Button>
              <Button icon={LuMessageCircle} className="py-4 text-lg" onClick={hire}>Contratar</Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button className="flex-1 py-4 text-lg" onClick={hire}>Contactar</Button>
              <Button variant="outline" className="w-16 px-0" onClick={() => setPhone(true)} aria-label="Llamar"><LuPhone className="h-6 w-6 text-brand" /></Button>
              <Button variant="outline" className="w-16 px-0" onClick={chat} aria-label="Mensaje"><LuMessageCircle className="h-6 w-6 text-brand" /></Button>
            </div>
          )}
        </div>
      )}

      <Modal open={phone} onClose={() => setPhone(false)} title={`Llamar a ${p.name.split(" ")[0]}`}>
        <p className="text-ink-soft">Llamarás al número que el proveedor registró en ConectaPRO desde el teléfono de tu dispositivo. Te recomendamos acordar los detalles por el chat para que quede registro.</p>
        <div className="mt-4 rounded-2xl bg-surface p-4 text-center text-2xl font-extrabold tracking-wide">+57 {p.phone.replace(/\d{4}$/, "••••")}</div>
        <a href={"tel:+57" + p.phone.replace(/\s/g, "")} className="mt-4 block"><Button className="w-full" icon={LuPhone}>Llamar ahora</Button></a>
      </Modal>
    </AppShell>
  );
}

// =====================================================================
//  Acuerdo digital: Propuesta → Acuerdo → Confirmación
// =====================================================================
export function AgreementFlow({ rid, pid }: { rid: string; pid: string }) {
  const { findRequest, getProvider, confirmAgreement, openConversation } = useStore();
  const r = findRequest(rid);
  const p = getProvider(pid);
  const [busy, wrap] = useBusy();
  const app = r?.applicants.find((a) => a.providerId === pid);
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState("15:00");
  const [accept, setAccept] = useState(false);   // nunca premarcada
  const [contract, setContract] = useState(false);
  if (!r || !p) return <NotFoundReq />;
  if (!app) return (
    <AppShell hideNav><Empty icon={LuUsers} title="Este proveedor no se ha postulado" text="Solo puedes contratar a proveedores que enviaron una propuesta a tu solicitud."
      action={<Button onClick={() => navigate("/proveedores/" + r.id)}>Ver ofertas recibidas</Button>} /></AppShell>
  );
  const price = app.price;
  const date = localISO(Date.now() + day * 86400000);
  const slots = Array.from({ length: Math.max(0, Math.min(p.schedule.to, 23) - p.schedule.from) }, (_, i) => p.schedule.from + i)
    .filter((h) => day > 0 || h > new Date().getHours())
    .map((h) => String(h).padStart(2, "0") + ":00");
  const done = step === 2 && r.agreement;

  const rows = [
    [LuWrench, "Servicio", r.title],
    [LuUserRound, "Proveedor", p.name],
    [LuCalendarDays, "Fecha y hora", agreementWhen(date, time)],
    [LuMapPin, "Ubicación", r.location.label],
    [LuCircleDollarSign, "Costo acordado", money(price)],
    [LuCreditCard, "Método de pago", PAYMENTS[r.payment]],
  ] as const;

  return (
    <AppShell hideNav>
      <PageHeader title="Detalle del servicio" back={step === 0 ? `/proveedor/${pid}?sol=${rid}` : false} />
      <div className="mx-auto max-w-2xl">
        <Stepper steps={["Propuesta", "Acuerdo", "Confirmación"]} current={step} />

        {step === 0 && (
          <div className="card animate-fade-up mt-7 p-6">
            <div className="flex items-center gap-4">
              <Avatar name={p.name} photo={p.photo} size={64} verified={p.verified} />
              <div><div className="text-xl font-extrabold">{p.name}</div><Rating value={p.rating} count={p.reviews} /></div>
              <div className="ml-auto text-right"><div className="text-sm text-ink-soft">Propuesta</div><div className="text-2xl font-extrabold text-brand">{money(price)}</div></div>
            </div>
            {app?.note && <p className="mt-4 rounded-2xl bg-surface p-4 text-ink-soft">“{app.note}”</p>}
            <div className="mt-6 font-bold">¿Qué día?</div>
            <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none">
              {[0, 1, 2, 3, 4, 7, 30].map((dd) => (
                <Chip key={dd} active={day === dd} onClick={() => setDay(dd)}>
                  {dd === 0 ? "Hoy" : dd === 1 ? "Mañana" : new Date(Date.now() + dd * 86400000).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })}
                </Chip>
              ))}
            </div>
            {day >= 2 && <p className="mt-2 text-xs text-ink-soft">Los servicios programados a futuro generan un contrato digital automático con la fecha pactada.</p>}
            <div className="mt-5 font-bold">¿A qué hora?</div>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.length === 0 && <p className="col-span-full text-sm text-ink-soft">No hay horarios disponibles hoy. Elige otro día.</p>}
              {slots.map((s) => (
                <button key={s} onClick={() => setTime(s)} className={cx("rounded-xl py-2.5 text-sm font-semibold", time === s ? "bg-brand text-white" : "bg-surface hover:bg-brand-50")}>{clock(new Date(`2000-01-01T${s}:00`).getTime())}</button>
              ))}
            </div>
            <Button className="mt-6 w-full py-4 text-lg" disabled={!slots.includes(time)} onClick={() => setStep(1)}>Continuar</Button>
          </div>
        )}

        {step >= 1 && (
          <div className="card animate-fade-up mt-7 p-6">
            <h2 className="text-2xl font-extrabold">{done ? "¡Acuerdo confirmado!" : "Resumen del acuerdo"}</h2>
            {done && <p className="mt-1 text-ink-soft">Código del contrato digital: <b className="text-ink">{r.agreement!.code}</b></p>}
            <div className="mt-4 divide-y divide-line">
              {rows.map(([I, k, v]) => (
                <div key={k} className="flex items-center gap-4 py-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50"><I className="h-5 w-5" /></span>
                  <span className="w-28 shrink-0 text-ink-soft sm:w-40">{k}</span>
                  <span className="min-w-0 flex-1 font-medium">{v}</span>
                </div>
              ))}
            </div>
            {step === 1 && (
              <>
                <label className="mt-4 flex cursor-pointer items-center gap-4 rounded-2xl bg-surface p-4">
                  <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="h-7 w-7 shrink-0 accent-brand" />
                  <span className="text-ink-soft">Leí el <button type="button" className="font-semibold text-brand underline" onClick={() => setContract(true)}>contrato digital</button> y confirmo la contratación con {p.name.split(" ")[0]} por {money(price)}.</span>
                </label>
                <Button className="mt-5 w-full py-4 text-lg" disabled={!accept || busy} onClick={() => wrap(async () => { await confirmAgreement(r.id, p.id, date, time, price); setStep(2); })}>{busy ? "Guardando acuerdo…" : "Confirmar acuerdo"}</Button>
                <button onClick={() => setStep(0)} className="mt-3 w-full text-sm font-semibold text-ink-soft">Cambiar fecha u hora</button>
              </>
            )}
            {done && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button variant="soft" icon={LuFileText} onClick={() => setContract(true)}>Ver contrato</Button>
                <Button icon={LuMessageCircle} onClick={async () => navigate("/chat/" + (await openConversation({ provider: p.id })))}>Escribir a {p.name.split(" ")[0]}</Button>
                <Button variant="outline" className="sm:col-span-2" onClick={() => navigate("/solicitudes")}>Ir a mis solicitudes</Button>
              </div>
            )}
            <div className="mt-5 flex items-center gap-3 text-sm text-ink-soft">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface"><LuShieldCheck className="h-6 w-6 text-[#b08900]" /></span>
              Tu información está protegida por la Ley de Habeas Data (Ley 1581 de 2012).
            </div>
          </div>
        )}
      </div>
      <ContractModal open={contract} onClose={() => setContract(false)} r={r} p={p} date={date} time={time} price={price} code={r.agreement?.code} />
    </AppShell>
  );
}

export function ContractModal({ open, onClose, r, p, date, time, price, code }: { open: boolean; onClose: () => void; r: Request; p: Provider; date: string; time: string; price: number; code?: string }) {
  const { clientInfo } = useStore();
  return (
    <Modal open={open} onClose={onClose} title="Contrato digital de servicio">
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
        <p><b className="text-ink">Código:</b> {code ?? "Se asigna al confirmar"}</p>
        <p><b className="text-ink">Partes:</b> {clientInfo(r.clientKey).name} (cliente) y {p.name} – {p.company} (proveedor).</p>
        <p><b className="text-ink">Objeto:</b> {r.desc}</p>
        <p><b className="text-ink">Fecha pactada:</b> {agreementWhen(date, time)} en {r.location.label}. <b className="text-ink">Valor:</b> {money(price)} pagado en {PAYMENTS[r.payment].toLowerCase()}.</p>
        <p><b className="text-ink">1. Puntualidad y flexibilidad.</b> Si el proveedor se retrasa y el servicio no es urgente, el cliente puede otorgar un plazo adicional de hasta dos (2) días. El incumplimiento del plazo inicial queda registrado con una valoración negativa de puntualidad.</p>
        <p><b className="text-ink">2. Faltas graves (regla de “Tres Strikes”).</b> No realizar un trabajo acordado (proveedor) o no efectuar el pago (cliente) constituye una falta grave. Al acumular tres faltas la cuenta podrá ser suspendida definitivamente.</p>
        <p><b className="text-ink">3. Calificación mutua.</b> Al finalizar, ambas partes se califican; la reputación afecta la visibilidad en las búsquedas.</p>
        <p><b className="text-ink">4. Datos personales.</b> Tratamiento conforme a la Ley 1581 de 2012 (Habeas Data).</p>
      </div>
      <Button className="mt-5 w-full" onClick={onClose}>Entendido</Button>
    </Modal>
  );
}

// =====================================================================
//  Calificar servicio
// =====================================================================
export function RateService({ id }: { id: string }) {
  const { findRequest, getProvider, rate, toast } = useStore();
  const r = findRequest(id);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, wrap] = useBusy();
  if (!r) return <NotFoundReq />;
  const p = getProvider(r.providerId);
  if (!p) return <NotFoundReq />;
  if (r.rating) return (
    <AppShell hideNav><Empty icon={LuCircleCheck} title="Ya calificaste este servicio" text={`Le diste ${r.rating.stars} estrellas a ${p.name}.`} action={<Button onClick={() => navigate("/solicitud/" + r.id)}>Ver solicitud</Button>} /></AppShell>
  );
  const labels = ["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"];
  return (
    <AppShell hideNav>
      <PageHeader title="Calificar servicio" back={"/solicitud/" + r.id} />
      <div className="mx-auto max-w-xl text-center lg:card lg:p-10">
        <Avatar name={p.name} photo={p.photo} size={180} className="mx-auto" />
        <h1 className="mt-4 text-3xl font-extrabold">{p.name}</h1>
        <div className="text-xl font-semibold text-ink-soft">{serviceById(r.service).name}</div>
        <h2 className="mt-10 text-xl font-bold">¿Cómo fue tu experiencia?</h2>
        <div className="mt-4 flex justify-center"><Stars value={stars} size={52} onChange={setStars} /></div>
        <div className="mt-2 h-6 font-semibold text-brand">{labels[stars]}</div>
        <div className="mt-6 text-left text-lg font-bold">Comentario (opcional)</div>
        <textarea value={comment} maxLength={200} onChange={(e) => setComment(e.target.value)} placeholder="Excelente servicio, llegó puntual y solucionó el problema rápidamente." className="mt-3 h-32 w-full resize-none rounded-3xl bg-white p-5 text-lg outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50" />
        <div className="text-right text-ink-soft">{comment.length}/200</div>
        <Button className="mt-6 w-full py-[18px] text-xl" disabled={stars === 0 || busy} onClick={() => wrap(async () => { await rate(r.id, stars, comment); toast("¡Gracias! Tu calificación quedó guardada (+50 puntos)"); navigate("/solicitudes?tab=realizados"); })}>{busy ? "Guardando…" : "Enviar calificación"}</Button>
      </div>
    </AppShell>
  );
}

// =====================================================================
//  Mis solicitudes
// =====================================================================
const STATUS_BADGE = {
  buscando: { tone: "warn" as const, icon: LuRadar, label: "Buscando" },
  en_curso: { tone: "brand" as const, icon: LuClock, label: "En curso" },
  completada: { tone: "ok" as const, icon: LuCircleCheck, label: "Completado" },
  cancelada: { tone: "bad" as const, icon: LuCircleX, label: "Cancelada" },
};

export function MyRequests() {
  const { myRequests, getProvider } = useStore();
  const [tab, setTab] = useState<"sol" | "hechos">(query().get("tab") === "realizados" ? "hechos" : "sol");
  const [filter, setFilter] = useState<"todas" | "en_curso" | "completada" | "cancelada">("todas");
  const list = myRequests
    .filter((r) => (tab === "hechos" ? r.status === "completada" : filter === "todas" || r.status === filter || (filter === "en_curso" && r.status === "buscando")))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <AppShell>
      <PageHeader title="Mis solicitudes" back={false} />
      <div className="flex border-b border-line">
        {([["sol", "Solicitudes"], ["hechos", "Servicios realizados"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx("relative flex-1 pb-3 text-lg font-bold", tab === k ? "text-brand" : "text-ink-soft")}>
            {l}{tab === k && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-brand" />}
          </button>
        ))}
      </div>
      {tab === "sol" && (
        <div className="-mx-4 mt-5 flex gap-2.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          {([["todas", "Todas"], ["en_curso", "En curso"], ["completada", "Completadas"], ["cancelada", "Canceladas"]] as const).map(([k, l]) => (
            <Chip key={k} active={filter === k} onClick={() => setFilter(k)} className="px-6 py-2.5 text-base">{l}</Chip>
          ))}
        </div>
      )}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {list.map((r) => {
          const p = getProvider(r.providerId);
          const b = STATUS_BADGE[r.status];
          return (
            <Link key={r.id} to={r.status === "buscando" ? "/proveedores/" + r.id : "/solicitud/" + r.id} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
              <div className="relative shrink-0">
                {r.photo ? <img src={r.photo} alt="" className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28" /> : (
                  <span className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-brand-50 text-brand">{(() => { const I = SERVICE_ICON[r.service]; return <I className="h-12 w-12" />; })()}</span>
                )}
                {r.status !== "cancelada" && <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-ok ring-[3px] ring-white" />}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="text-lg font-extrabold leading-tight">{r.title}</div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-ink-soft">{serviceById(r.service).name}</span>
                  <Badge tone={b.tone} icon={b.icon}>{b.label}</Badge>
                </div>
                {(r.status === "completada" || r.status === "cancelada") && (
                  <div className="flex items-center gap-5 text-ink-soft">
                    <span className="inline-flex items-center gap-1.5"><LuCalendarDays className="h-4 w-4" />{shortDate(r.finishedAt ?? r.createdAt)}</span>
                    {r.rating && <span className="inline-flex items-center gap-1 font-semibold text-[#d98a00]"><LuStar className="h-4 w-4 fill-star text-star" />{r.rating.stars.toFixed(1)}</span>}
                  </div>
                )}
                {r.status === "en_curso" && r.agreement && <div className="text-sm font-semibold text-brand">{agreementWhen(r.agreement.date, r.agreement.time)}</div>}
                <div className="flex items-center gap-1.5 text-ink-soft"><LuUserRound className="h-4 w-4" />{p ? p.name : "Sin proveedor asignado"}</div>
              </div>
              <LuChevronRight className="h-6 w-6 shrink-0 text-brand" />
            </Link>
          );
        })}
      </div>
      {list.length === 0 && <Empty icon={LuClipboardList} title="No hay solicitudes aquí" text="Cuando publiques una solicitud aparecerá en esta lista." action={<Button onClick={() => navigate("/publicar")}>Publicar solicitud</Button>} />}
    </AppShell>
  );
}

// =====================================================================
//  Detalle de una solicitud (cliente)
// =====================================================================
export function RequestDetail({ id }: { id: string }) {
  const { findRequest, getProvider, cancelRequest, extendDeadline, openConversation, visibleApplicants, toast, editRequest, deleteRequest } = useStore();
  const r = findRequest(id);
  const [late, setLate] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [contract, setContract] = useState(false);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [busy, wrap] = useBusy();
  if (!r) return <NotFoundReq />;
  const p = getProvider(r.providerId);
  const b = STATUS_BADGE[r.status];
  const SIcon = SERVICE_ICON[r.service];

  return (
    <AppShell hideNav>
      <PageHeader title="Detalle de solicitud" back="/solicitudes" />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand"><SIcon className="h-7 w-7" /></span>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold leading-tight">{r.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2"><span className="text-ink-soft">{serviceById(r.service).name}</span><Badge tone={b.tone} icon={b.icon}>{b.label}</Badge></div>
            </div>
          </div>
          <p className="mt-5 rounded-2xl bg-surface p-4 text-ink-soft">{r.desc}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info icon={LuMapPin} k="Ubicación" v={r.location.label} />
            <Info icon={LuLocateFixed} k="Punto para el emparejamiento" v={r.gps ? `GPS exacto (±${r.gpsPrecision ?? "?"} m)` : "Centro del municipio"} />
            <Info icon={LuCreditCard} k="Método de pago" v={PAYMENTS[r.payment]} />
            <Info icon={LuCalendarDays} k="Publicada" v={`${shortDate(r.createdAt)} · ${clock(r.createdAt)}`} />
            <Info icon={LuUsers} k="Proveedores notificados" v={`${r.matchedCount} compatibles`} />
            {r.agreement && <Info icon={LuClock} k="Fecha pactada" v={agreementWhen(r.agreement.date, r.agreement.time) + (r.agreement.extendedDays ? ` (+${r.agreement.extendedDays} días)` : "")} />}
            {r.agreement && <Info icon={LuCircleDollarSign} k="Costo acordado" v={money(r.agreement.price)} />}
          </dl>
          {r.punctualityPenalty && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#fff4dc] p-3 text-sm font-medium text-[#9a5b00]"><LuTriangleAlert className="h-5 w-5" /> Se otorgó un plazo adicional de 2 días y se registró una valoración negativa de puntualidad al proveedor.</div>}
          {r.rating && (
            <div className="mt-5 rounded-2xl ring-1 ring-line p-4">
              <div className="text-sm font-bold text-ink-soft">Tu calificación</div>
              <div className="mt-1"><Stars value={r.rating.stars} /></div>
              {r.rating.comment && <p className="mt-2 text-ink-soft">“{r.rating.comment}”</p>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {p && (
            <div className="card p-5">
              <div className="text-sm font-bold text-ink-soft">Proveedor</div>
              <Link to={"/proveedor/" + p.id} className="mt-3 flex items-center gap-3">
                <Avatar name={p.name} photo={p.photo} size={56} verified={p.verified} />
                <div><div className="font-extrabold">{p.name}</div><Rating value={p.rating} count={p.reviews} className="text-sm" /></div>
              </Link>
              <Button variant="soft" icon={LuMessageCircle} className="mt-4 w-full" onClick={async () => navigate("/chat/" + (await openConversation({ provider: p.id })))}>Enviar mensaje</Button>
            </div>
          )}
          <div className="card space-y-3 p-5">
            {r.status === "buscando" && (
              <>
                <div className="font-bold">{visibleApplicants(r).length} postulaciones recibidas</div>
                <Button className="w-full" onClick={() => navigate("/proveedores/" + r.id)}>Ver y comparar ofertas</Button>
                <Button variant="outline" className="w-full" onClick={() => setEdit(true)}>Editar solicitud</Button>
                <Button variant="danger" className="w-full" disabled={busy} onClick={() => wrap(async () => { await cancelRequest(r.id, false); toast("Solicitud cancelada"); })}>Cancelar solicitud</Button>
              </>
            )}
            {r.status === "en_curso" && (
              <>
                <Button className="w-full" icon={LuCircleCheck} onClick={() => navigate("/calificar/" + r.id)}>El servicio finalizó · Calificar</Button>
                <Button variant="soft" className="w-full" icon={LuFileText} onClick={() => setContract(true)}>Ver contrato {r.agreement?.code}</Button>
                {!r.punctualityPenalty && <Button variant="outline" className="w-full" icon={LuClock} onClick={() => setLate(true)}>El proveedor se retrasó</Button>}
                <Button variant="danger" className="w-full" onClick={() => setCancel(true)}>Cancelar acuerdo</Button>
              </>
            )}
            {r.status === "completada" && (
              <>
                {!r.rating && <Button className="w-full" onClick={() => navigate("/calificar/" + r.id)}>Calificar servicio</Button>}
                <Button variant="soft" className="w-full" icon={LuRepeat} onClick={() => navigate(`/publicar?servicio=${r.service}&desc=${encodeURIComponent(r.desc)}`)}>Volver a solicitar</Button>
              </>
            )}
            {r.status === "cancelada" && <Button variant="soft" className="w-full" icon={LuRepeat} onClick={() => navigate(`/publicar?servicio=${r.service}&desc=${encodeURIComponent(r.desc)}`)}>Publicar de nuevo</Button>}
            {(r.status === "buscando" || r.status === "cancelada") && <button className="w-full pt-1 text-sm font-semibold text-bad" onClick={() => setDel(true)}>Eliminar solicitud</button>}
          </div>
        </div>
      </div>

      <Modal open={late} onClose={() => setLate(false)} title="¿El servicio es urgente?">
        <p className="text-ink-soft">Según las reglas de flexibilidad de ConectaPRO puedes darle al proveedor un plazo adicional. El retraso quedará registrado en su reputación.</p>
        <div className="mt-5 grid gap-3">
          <Button icon={LuClock} disabled={busy} onClick={() => wrap(async () => { await extendDeadline(r.id); setLate(false); toast("Plazo extendido 2 días. Se registró la falta de puntualidad."); })}>No es urgente: dar 2 días más</Button>
          <Button variant="danger" disabled={busy} onClick={() => wrap(async () => { await cancelRequest(r.id, false); setLate(false); toast("Acuerdo cancelado sin penalidad para ti"); })}>Es urgente: cancelar sin penalidad</Button>
        </div>
      </Modal>
      <Modal open={cancel} onClose={() => setCancel(false)} title="¿Cancelar el acuerdo?">
        <div className="flex gap-3 rounded-2xl bg-bad-50 p-4 text-sm text-bad"><LuTriangleAlert className="h-5 w-5 shrink-0" /> Cancelar un acuerdo confirmado sin justificación cuenta como <b>falta grave</b>. Con 3 faltas tu cuenta será suspendida.</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setCancel(false)}>Mantener acuerdo</Button>
          <Button variant="danger" disabled={busy} onClick={() => wrap(async () => { await cancelRequest(r.id, true); setCancel(false); })}>Sí, cancelar</Button>
        </div>
      </Modal>
      <EditRequestModal open={edit} onClose={() => setEdit(false)} r={r} onSave={(d, pay, dir) => editRequest(r.id, d, pay, dir).then(() => { setEdit(false); toast("Solicitud actualizada"); })} />
      <Modal open={del} onClose={() => setDel(false)} title="¿Eliminar esta solicitud?">
        <p className="text-ink-soft">Se borrará de la base de datos junto con sus postulaciones. Esta acción no se puede deshacer.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setDel(false)}>Volver</Button>
          <Button variant="danger" disabled={busy} onClick={() => wrap(async () => { await deleteRequest(r.id); toast("Solicitud eliminada"); navigate("/solicitudes", true); })}>Eliminar</Button>
        </div>
      </Modal>
      {p && r.agreement && <ContractModal open={contract} onClose={() => setContract(false)} r={r} p={p} date={r.agreement.date} time={r.agreement.time} price={r.agreement.price} code={r.agreement.code} />}
    </AppShell>
  );
}

export function Info({ icon: I, k, v }: { icon: any; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50"><I className="h-5 w-5" /></span>
      <div><dt className="text-sm text-ink-soft">{k}</dt><dd className="font-semibold">{v}</dd></div>
    </div>
  );
}

function NotFoundReq() {
  return <AppShell><Empty icon={LuClipboardList} title="Solicitud no encontrada" action={<Button onClick={() => navigate("/inicio")}>Ir al inicio</Button>} /></AppShell>;
}
export { NotFoundReq };

function EditRequestModal({ open, onClose, r, onSave }: { open: boolean; onClose: () => void; r: Request; onSave: (desc: string, pay: PaymentMethod, dir: string) => Promise<void> }) {
  const [desc, setDesc] = useState(r.desc);
  const [pay, setPay] = useState<PaymentMethod>(r.payment);
  const [dir, setDir] = useState(r.direccion ?? "");
  const [busy, wrap] = useBusy();
  useEffect(() => { if (open) { setDesc(r.desc); setPay(r.payment); setDir(r.direccion ?? ""); } }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Editar solicitud">
      <label className="block text-sm font-semibold">Descripción
        <textarea value={desc} maxLength={500} onChange={(e) => setDesc(e.target.value)} className="mt-1 h-28 w-full resize-none rounded-2xl bg-surface p-3 font-normal outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50" />
      </label>
      <label className="mt-3 block text-sm font-semibold">Dirección o barrio
        <input value={dir} onChange={(e) => setDir(e.target.value)} className="mt-1 w-full rounded-2xl bg-surface px-3 py-3 font-normal outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50" />
      </label>
      <label className="mt-3 block text-sm font-semibold">Método de pago
        <select value={pay} onChange={(e) => setPay(e.target.value as PaymentMethod)} className="mt-1 w-full rounded-2xl bg-surface px-3 py-3 font-normal outline-none ring-1 ring-line">
          {(Object.keys(PAYMENTS) as PaymentMethod[]).map((m) => <option key={m} value={m}>{PAYMENTS[m]}</option>)}
        </select>
      </label>
      <Button className="mt-5 w-full" disabled={busy} onClick={() => wrap(() => onSave(desc, pay, dir))}>{busy ? "Guardando…" : "Guardar cambios"}</Button>
    </Modal>
  );
}
