import { useEffect, useMemo, useState } from "react";
import {
  LuSearch, LuSlidersHorizontal, LuChevronRight, LuMapPin, LuClock, LuCircleCheck, LuCrosshair, LuCircleDot,
  LuWallet, LuUsers, LuShieldCheck, LuMessageCircle, LuPhone, LuEllipsisVertical, LuWrench, LuBriefcase,
  LuTimer, LuCheck, LuCalendarDays, LuUserRound, LuCircleDollarSign, LuCreditCard, LuFileText, LuSparkles,
  LuFilter, LuBrain, LuCircleX, LuTriangleAlert, LuRepeat, LuArrowRight, LuClipboardList, LuRadar, LuStar,
  LuChevronDown, LuZap, LuBadgeCheck, LuX,
} from "react-icons/lu";
import { AppShell, MobileTopBar } from "../Layout";
import { useStore, Request } from "../store";
import { Link, navigate } from "../router";
import {
  Avatar, Badge, Button, Chip, Empty, MapMock, Modal, PageHeader, Rating, SectionTitle, Stars, Stepper, Toggle,
  CATEGORY_ICON, localISO, PAYMENT_COLOR, PAYMENT_ICON, SERVICE_ICON, agreementWhen, clock, cx, shortDate, timeAgo,
} from "../ui";
import { BASE, CATEGORIES, CategoryId, PAYMENTS, PaymentMethod, Provider, SERVICES, ServiceId, money, serviceById, REVIEWS } from "../data";
import { availability, availabilityLabel, distanceKm, matchProviders, predictRoutines, scheduleLabel } from "../matching";

const query = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "");

// =====================================================================
//  Inicio (cliente)
// =====================================================================
export function ClientHome() {
  const { account, myRequests, getProvider, db } = useStore();
  const [q, setQ] = useState("");
  const [slide, setSlide] = useState(0);
  useEffect(() => { const t = setInterval(() => setSlide((s) => (s + 1) % 3), 4500); return () => clearInterval(t); }, []);

  const prefs = account ? db.prefs[account.id] : undefined;
  const suggestions = useMemo(() => {
    if (prefs && !prefs.ia) return [];
    return predictRoutines(myRequests.filter((r) => r.status === "completada").map((r) => ({ service: r.service, date: r.finishedAt ?? r.createdAt, providerId: r.providerId })));
  }, [myRequests, prefs]);

  const active = myRequests.filter((r) => r.status === "en_curso" || r.status === "buscando");
  const featured = useMemo(() => [...db.customProviders, ...["p1", "p4", "p5", "p2"].map((id) => getProvider(id)!)].filter(Boolean).slice(0, 4), [db.customProviders]);
  const banners = [
    { t: "Conecta con profesionales verificados en tu zona", img: "img/banner_manos.jpg" },
    { t: "Califica tus servicios y gana puntos con marcas aliadas", img: "img/girl.jpg" },
    { t: "¿Sin efectivo? Prueba el match por trueque", img: "img/worker.jpg", to: "/trueque" },
  ];

  return (
    <AppShell>
      <MobileTopBar />
      <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <h1 className="text-[40px] font-extrabold leading-tight tracking-tight">Hola, {account?.name.split(" ")[0]} 👋</h1>
          <p className="text-xl text-ink-soft">¿Qué servicio necesitas hoy?</p>

          <form className="mt-6 flex gap-3" onSubmit={(e) => { e.preventDefault(); navigate("/explorar?q=" + encodeURIComponent(q)); }}>
            <label className="flex flex-1 items-center gap-3 rounded-2xl bg-[#e9ecfb] px-5 py-4">
              <LuSearch className="h-6 w-6 text-ink" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar servicios..." className="w-full bg-transparent text-lg outline-none placeholder:text-ink-soft" />
            </label>
            <Link to="/explorar" className="flex w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-line" aria-label="Filtros"><LuSlidersHorizontal className="h-6 w-6" /></Link>
          </form>

          <div className="mt-7 grid grid-cols-4 gap-x-3 gap-y-5 md:grid-cols-8">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICON[c.id];
              return (
                <Link key={c.id} to={"/explorar?cat=" + c.id} className="group flex flex-col items-center gap-2 text-center">
                  <span className={cx("flex aspect-[1.4] w-full items-center justify-center rounded-2xl transition group-hover:scale-105", c.tint)}><Icon className="h-10 w-10" strokeWidth={2.2} /></span>
                  <span className="text-[15px] font-medium">{c.name}</span>
                </Link>
              );
            })}
          </div>

          {suggestions.map((s) => {
            const p = getProvider(s.providerId);
            return (
              <div key={s.service} className="animate-fade-up mt-7 flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-[#f3eeff] to-[#eaf0ff] p-5 ring-1 ring-brand-100 sm:flex-row sm:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-violet shadow-sm"><LuBrain className="h-6 w-6" /></span>
                <div className="flex-1">
                  <div className="text-xs font-bold uppercase tracking-wide text-brand-violet">Recomendación inteligente</div>
                  <p className="mt-0.5 font-semibold">Se acerca la fecha en la que normalmente solicitas tu {serviceById(s.service).name.toLowerCase()}. ¿Quieres volver a contactar a {p ? p.name.split(" ")[0] : "tu proveedor"}?</p>
                  <p className="mt-1 text-xs text-ink-soft">Lo has pedido {s.times} veces, aproximadamente cada {s.intervalDays} días.</p>
                </div>
                <Button className="shrink-0" onClick={() => navigate(p ? "/proveedor/" + p.id : "/publicar?servicio=" + s.service)}>Contactar</Button>
              </div>
            );
          })}

          {/* Banner */}
          <div className="relative mt-7 overflow-hidden rounded-3xl bg-gradient-to-r from-[#2463ff] via-[#4b3cf3] to-[#8a2cf0] text-white">
            <div className="flex min-h-[170px] items-center">
              <div className="relative z-10 max-w-[62%] p-6 sm:p-8">
                <p key={slide} className="animate-fade-up text-2xl font-bold leading-snug sm:text-[28px]">{banners[slide].t}</p>
                {banners[slide].to && <Link to={banners[slide].to!} className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline">Probar ahora <LuArrowRight /></Link>}
                <div className="mt-5 flex gap-2">
                  {banners.map((_, i) => <button key={i} aria-label={`Banner ${i + 1}`} onClick={() => setSlide(i)} className={cx("h-2.5 w-2.5 rounded-full", i === slide ? "bg-white" : "bg-white/40")} />)}
                </div>
              </div>
              <img key={banners[slide].img} src={banners[slide].img} alt="" className="animate-page absolute bottom-0 right-0 h-full w-[48%] object-cover object-center sm:w-[40%]" style={{ maskImage: "linear-gradient(90deg, transparent, #000 30%)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 30%)" }} />
            </div>
          </div>

          <div className="mt-8">
            <SectionTitle action={<Link to="/explorar" className="text-lg font-semibold text-brand-violet">Ver todos</Link>}>Servicios populares</SectionTitle>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
              {SERVICES.filter((s) => s.photo).map((s) => (
                <Link key={s.id} to={"/publicar?servicio=" + s.id} className="card w-36 shrink-0 overflow-hidden transition hover:-translate-y-0.5 sm:w-auto">
                  <img src={s.photo} alt={s.name} className="aspect-[1.15] w-full object-cover" />
                  <div className="py-3 text-center text-[15px] font-semibold">{s.short}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha (escritorio) / bloques extra en móvil */}
        <aside className="space-y-6">
          <div>
            <SectionTitle action={<Link to="/solicitudes" className="text-sm font-semibold text-brand-violet">Ver todas</Link>}>Mis servicios activos</SectionTitle>
            {active.length === 0 ? (
              <div className="card p-5 text-center text-ink-soft">
                No tienes servicios activos.
                <Button className="mt-4 w-full" onClick={() => navigate("/publicar")}>Publicar solicitud</Button>
              </div>
            ) : (
              <div className="space-y-3">{active.slice(0, 3).map((r) => <ActiveCard key={r.id} r={r} />)}</div>
            )}
          </div>
          <div>
            <SectionTitle>Proveedores destacados</SectionTitle>
            <div className="card divide-y divide-line">
              {featured.map((p) => (
                <Link key={p.id} to={"/proveedor/" + p.id} className="flex items-center gap-3 p-4 hover:bg-surface/60">
                  <Avatar name={p.name} photo={p.photo} size={48} dot={availability(p.schedule) === "ahora" ? "on" : "away"} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{p.name}</div>
                    <div className="truncate text-sm text-ink-soft">{p.profession}</div>
                  </div>
                  <Rating value={p.rating} className="text-sm" />
                </Link>
              ))}
            </div>
          </div>
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
    <Link to={r.status === "buscando" ? "/proveedores/" + r.id : "/solicitud/" + r.id} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand"><Icon className="h-6 w-6" /></span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{r.title}</div>
        {r.status === "en_curso" && r.agreement ? (
          <div className="text-sm text-ink-soft">{p?.name} · {agreementWhen(r.agreement.date, r.agreement.time)}</div>
        ) : (
          <div className="text-sm font-semibold text-brand">{apps > 0 ? `${apps} proveedor${apps > 1 ? "es" : ""} aceptaron` : "Buscando proveedores…"}</div>
        )}
      </div>
      <LuChevronRight className="h-5 w-5 text-brand" />
    </Link>
  );
}

// =====================================================================
//  Explorar proveedores
// =====================================================================
export function Explore() {
  const { allProviders, account, myProvider } = useStore();
  const qp = query();
  const [q, setQ] = useState(qp.get("q") ?? "");
  const [cat, setCat] = useState<CategoryId | "todas">((qp.get("cat") as CategoryId) ?? "todas");
  const [sort, setSort] = useState<"rating" | "distance">("rating");
  const [onlyNow, setOnlyNow] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return allProviders
      .filter((p) => p.id !== myProvider?.id)
      .map((p) => ({ p, d: distanceKm(BASE, p), av: availability(p.schedule) }))
      .filter(({ p }) => cat === "todas" || cat === "mas" || p.services.some((s) => serviceById(s).category === cat))
      .filter(({ p }) => !t || [p.name, p.profession, p.company, ...p.services.map((s) => serviceById(s).name)].join(" ").toLowerCase().includes(t))
      .filter(({ av }) => !onlyNow || av === "ahora")
      .sort((a, b) => (sort === "rating" ? b.p.rating - a.p.rating : a.d - b.d));
  }, [q, cat, sort, onlyNow, allProviders]);

  return (
    <AppShell>
      <PageHeader title="Explorar servicios" back="/inicio" className="lg:justify-start [&>div]:lg:px-0 [&>div]:lg:text-left [&>button]:lg:hidden" />
      <div className="flex gap-3">
        <label className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-5 py-3.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand/50">
          <LuSearch className="h-5 w-5" />
          <input autoFocus={!!qp.get("q")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plomero, peluquería, mudanza…" className="w-full bg-transparent outline-none" />
          {q && <button onClick={() => setQ("")} aria-label="Limpiar"><LuX className="h-5 w-5 text-ink-soft" /></button>}
        </label>
        <Button variant="outline" onClick={() => setSort(sort === "rating" ? "distance" : "rating")} className="shrink-0 px-4" icon={LuSlidersHorizontal}>
          <span className="hidden sm:inline">{sort === "rating" ? "Mejor calificados" : "Más cercanos"}</span>
        </Button>
      </div>
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={cat === "todas"} onClick={() => setCat("todas")}>Todas</Chip>
        {CATEGORIES.filter((c) => c.id !== "mas").map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>)}
        <Chip active={onlyNow} onClick={() => setOnlyNow(!onlyNow)}>● Disponible ahora</Chip>
      </div>
      <div className="mt-2 text-sm text-ink-soft">{list.length} proveedores cerca de {account?.city.split(",")[0]}</div>

      <Link to="/trueque" className="mt-4 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-[#e8f7f1] to-[#eaf1ff] p-4 ring-1 ring-line">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ok"><LuRepeat className="h-5 w-5" /></span>
        <div className="flex-1"><div className="font-bold">Match por trueque</div><div className="text-sm text-ink-soft">Intercambia habilidades sin usar dinero</div></div>
        <LuChevronRight className="h-5 w-5 text-brand" />
      </Link>

      {list.length === 0 ? (
        <div className="mt-6"><Empty icon={LuSearch} title="Sin resultados" text="Prueba con otra palabra o publica tu solicitud y el algoritmo buscará por ti." action={<Button onClick={() => navigate("/publicar")}>Publicar solicitud</Button>} /></div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map(({ p, d, av }) => (
            <Link key={p.id} to={"/proveedor/" + p.id} className="card flex gap-4 p-4 transition hover:-translate-y-0.5">
              <Avatar name={p.name} photo={p.photo} size={72} dot={av === "ahora" ? "on" : "away"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-extrabold">{p.name}{p.verified && <LuBadgeCheck className="h-4 w-4 text-brand" />}</div>
                <div className="truncate text-sm text-ink-soft">{p.profession}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Rating value={p.rating} count={p.reviews} />
                  <span className="inline-flex items-center gap-1 text-ink-soft"><LuMapPin className="h-4 w-4" />{d.toFixed(1)} km</span>
                </div>
                <div className="mt-1 text-sm font-bold">{money(p.priceMin)} - {money(p.priceMax)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

// =====================================================================
//  Publica tu solicitud
// =====================================================================
const SAVED_PLACES = [
  { label: "Rionegro, Antioquia", sub: "Casa · Cra. 50 #45-20", ...BASE },
  { label: "Rionegro - Centro", sub: "Oficina · Calle 49 #50-12", lat: BASE.lat + 0.006, lng: BASE.lng + 0.004 },
  { label: "San Antonio de Pereira", sub: "Casa de mis papás", lat: BASE.lat - 0.02, lng: BASE.lng + 0.01 },
];

export function Publish() {
  const { publishRequest, toast, strikes, allProviders } = useStore();
  const pre = query().get("servicio") as ServiceId | null;
  const [desc, setDesc] = useState(query().get("desc") ?? "");
  const [service, setService] = useState<ServiceId>(pre ?? "plomeria");
  const [loc, setLoc] = useState({ ...BASE, label: BASE.label, sub: "Ubicación actual" });
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [proposals, setProposals] = useState(true);
  const [placeModal, setPlaceModal] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");
  const SIcon = SERVICE_ICON[service];

  const preview = useMemo(() => matchProviders(service, loc, { includeLater: true, pool: allProviders }).matches.length, [service, loc, allProviders]);

  const useGps = () => {
    if (!navigator.geolocation) return toast("Tu navegador no permite GPS");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (distanceKm(here, BASE) > 60) {
          toast("GPS detectado. Los proveedores de la demo están en Rionegro: usaremos esa zona");
          setLoc({ ...BASE, label: BASE.label, sub: "Ubicación por GPS (zona demo)" });
        } else setLoc({ ...here, label: "Mi ubicación actual", sub: `GPS: ${here.lat.toFixed(4)}, ${here.lng.toFixed(4)}` });
      },
      () => { setLocating(false); toast("No pudimos acceder a tu ubicación. Ingrésala manualmente."); },
      { timeout: 8000 }
    );
  };

  const submit = () => {
    if (strikes >= 3) return toast("Tu cuenta está suspendida por acumular 3 faltas graves");
    if (desc.trim().length < 10) { setErr("Describe tu necesidad (mínimo 10 caracteres)"); return; }
    const id = publishRequest({ desc: desc.trim(), service, location: { lat: loc.lat, lng: loc.lng, label: loc.label }, payment, wantsProposals: proposals });
    navigate("/buscando/" + id);
  };

  return (
    <AppShell hideNav>
      <PageHeader title="Publica tu solicitud" back="/inicio" right={<img src="img/logo.png" alt="" className="h-12 w-12 lg:hidden" />} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-2.5 flex items-center gap-2.5 text-lg font-bold"><LuCircleCheck className="h-7 w-7 fill-ink text-white" /> Descripción del servicio</h2>
            <textarea
              value={desc}
              maxLength={500}
              onChange={(e) => { setDesc(e.target.value); setErr(""); }}
              placeholder="Ej. Necesito reparar una tubería rota, se presenta una fuga de agua en la cocina..."
              className={cx("h-32 w-full resize-none rounded-2xl bg-[#eef1fb] p-5 text-[17px] outline-none ring-1 ring-line placeholder:text-ink-soft/80 focus:ring-2 focus:ring-brand/50", err && "ring-2 ring-bad/50")}
            />
            <div className="flex justify-between text-sm"><span className="font-medium text-bad">{err}</span><span className="text-ink-soft">{desc.length}/500</span></div>
          </section>

          <section>
            <h2 className="mb-2.5 flex items-center gap-2.5 text-lg font-bold"><LuUsers className="h-6 w-6" /> Categoría del servicio</h2>
            <label className="relative flex items-center gap-4 rounded-2xl bg-[#eef1fb] px-5 py-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand/50">
              <SIcon className="h-8 w-8 text-brand-blue" />
              <select value={service} onChange={(e) => setService(e.target.value as ServiceId)} className="w-full appearance-none bg-transparent text-lg outline-none">
                {CATEGORIES.filter((c) => c.id !== "mas").map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {SERVICES.filter((s) => s.category === c.id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </optgroup>
                ))}
              </select>
              <LuChevronDown className="pointer-events-none h-6 w-6" />
            </label>
          </section>

          <section>
            <h2 className="mb-2.5 flex items-center gap-2.5 text-lg font-bold"><LuMapPin className="h-6 w-6 fill-ink text-white" /> Ubicación</h2>
            <MapMock className="h-48 sm:h-56">
              <button onClick={useGps} className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-md">
                <LuCircleDot className={cx("h-5 w-5", locating && "animate-spin")} /> {locating ? "Ubicando…" : "Usar mi ubicación"}
              </button>
            </MapMock>
            <button onClick={() => setPlaceModal(true)} className="mt-3 flex w-full items-center gap-4 rounded-2xl bg-[#eef1fb] px-5 py-4 text-left ring-1 ring-line">
              <LuMapPin className="h-7 w-7" />
              <div className="flex-1"><div className="text-sm text-ink-soft">{loc.sub}</div><div className="text-lg font-bold">{loc.label}</div></div>
              <LuChevronRight className="h-6 w-6" />
            </button>
          </section>

          <section>
            <h2 className="mb-2.5 flex items-center gap-2.5 text-lg font-bold"><LuWallet className="h-6 w-6" /> Método de pago preferido</h2>
            <div className="grid grid-cols-4 gap-2.5">
              {(Object.keys(PAYMENTS) as PaymentMethod[]).map((m) => {
                const Icon = PAYMENT_ICON[m];
                return (
                  <button key={m} onClick={() => setPayment(m)} className={cx("flex flex-col items-center gap-2 rounded-2xl px-1 py-4 text-center text-sm font-medium transition sm:text-[15px]", payment === m ? "bg-[#e3ecff] ring-2 ring-brand-blue" : "bg-white ring-1 ring-line hover:ring-brand/40")}>
                    <Icon className={cx("h-8 w-8", payment === m ? "text-brand-blue" : PAYMENT_COLOR[m])} />
                    <span className="leading-tight">{PAYMENTS[m]}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex items-start gap-3">
            <LuCircleDot className="mt-0.5 h-6 w-6 shrink-0 text-brand-blue" />
            <div className="flex-1"><div className="text-lg font-bold">Quiero recibir propuestas</div><p className="text-ink-soft">Los proveedores cercanos podrán enviarte sus ofertas.</p></div>
            <Toggle on={proposals} onChange={setProposals} label="Quiero recibir propuestas" />
          </section>

          <Button onClick={submit} className="w-full py-[18px] text-xl">Publicar solicitud</Button>
        </div>

        {/* Panel lateral (escritorio) */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24 overflow-hidden p-6">
            <h3 className="text-2xl font-extrabold leading-tight">Tu solicitud,<br /><span className="text-brand">en manos correctas</span></h3>
            <p className="mt-2 text-sm text-ink-soft">Conecta con profesionales verificados, de manera rápida, segura y cerca de ti.</p>
            <ul className="mt-5 space-y-4 text-sm">
              {[[LuZap, "Publicación rápida", "En pocos pasos"], [LuShieldCheck, "Profesionales verificados", "Personas de confianza"], [LuMapPin, "Cerca de ti", "Encuentra ayuda en tu zona"], [LuMessageCircle, "Comunicación segura", "Todo en un solo lugar"]].map(([I, t, d]: any) => (
                <li key={t} className="flex gap-3"><I className="mt-0.5 h-5 w-5 text-brand" /><div><div className="font-bold">{t}</div><div className="text-ink-soft">{d}</div></div></li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl bg-brand-50 p-4 text-sm">
              <div className="flex items-center gap-2 font-bold text-brand"><LuRadar className="h-5 w-5" /> Vista previa del algoritmo</div>
              <p className="mt-1 text-ink-soft"><b className="text-ink">{preview}</b> proveedores de {serviceById(service).name.toLowerCase()} cubren esta ubicación.</p>
            </div>
            <img src="img/girl.jpg" alt="" className="mt-5 w-full rounded-2xl" />
          </div>
        </aside>
      </div>

      <Modal open={placeModal} onClose={() => setPlaceModal(false)} title="¿Dónde necesitas el servicio?">
        <div className="space-y-2">
          {SAVED_PLACES.map((p) => (
            <button key={p.sub} onClick={() => { setLoc(p); setPlaceModal(false); }} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-line hover:bg-surface">
              <LuMapPin className="h-6 w-6 text-brand" />
              <div><div className="font-bold">{p.label}</div><div className="text-sm text-ink-soft">{p.sub}</div></div>
            </button>
          ))}
          <ManualAddress onSave={(label) => { setLoc({ ...BASE, label, sub: "Dirección ingresada" }); setPlaceModal(false); }} />
        </div>
      </Modal>
    </AppShell>
  );
}

function ManualAddress({ onSave }: { onSave: (s: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (v.trim()) onSave(v.trim()); }} className="flex gap-2 pt-3">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Escribe otra dirección" className="flex-1 rounded-2xl bg-surface px-4 py-3 outline-none ring-1 ring-line focus:ring-brand/50" />
      <Button type="submit" className="px-4 py-3">Usar</Button>
    </form>
  );
}

// =====================================================================
//  Orquestación: animación del emparejamiento (4 pasos de la arquitectura)
// =====================================================================
export function Searching({ id }: { id: string }) {
  const { db, getProvider, allProviders, visibleApplicants } = useStore();
  const r = db.requests.find((x) => x.id === id);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const ts = [700, 1500, 2400, 3300].map((ms, i) => setTimeout(() => setStage(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, []);
  if (!r) return <NotFoundReq />;
  const { trace } = matchProviders(r.service, r.location, { includeLater: true, pool: allProviders });
  const apps = visibleApplicants(r);
  const steps = [
    { icon: LuMapPin, t: "Mapa GPS", d: r.location.label },
    { icon: LuFilter, t: "Filtros de solicitud", d: `${serviceById(r.service).name} · ${PAYMENTS[r.payment]}` },
    { icon: LuBrain, t: "Algoritmo de emparejamiento", d: `${trace.total} proveedores → ${trace.byCategory} por categoría → ${trace.byCoverage} por cobertura → ${trace.bySchedule} en horario` },
    { icon: LuBadgeCheck, t: "Proveedores compatibles", d: `${r.matched.length} notificados en tiempo real` },
  ];
  const pins = r.matched.slice(0, 6).map((pid, i) => ({ x: 50 + Math.cos(i * 1.7) * (22 + i * 4), y: 50 + Math.sin(i * 1.7) * (26 + i * 3), photo: getProvider(pid)?.photo }));

  return (
    <AppShell hideNav>
      <PageHeader title="Buscando proveedores" back="/solicitudes" sub={r.title} />
      <div className="grid gap-8 lg:grid-cols-2">
        <MapMock className="h-64 sm:h-80 lg:h-[440px]" pins={stage >= 4 ? pins : []} />
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
              {r.matched.length === 0 ? (
                <>
                  <div className="font-bold">No hay proveedores disponibles en tu zona para esta categoría.</div>
                  <p className="mt-1 text-sm text-ink-soft">Tu solicitud queda publicada y te avisaremos cuando alguien compatible se active.</p>
                  <Button className="mt-4 w-full" onClick={() => navigate("/solicitudes")}>Ir a mis solicitudes</Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">{apps.slice(0, 4).map((a) => { const p = getProvider(a.providerId)!; return <Avatar key={a.providerId} name={p.name} photo={p.photo} size={40} />; })}</div>
                    <div className="font-bold">{apps.length === 0 ? "Esperando respuestas…" : `${apps.length} proveedor${apps.length > 1 ? "es" : ""} aceptaron tu solicitud`}</div>
                  </div>
                  <Button className="mt-4 w-full" icon={LuArrowRight} onClick={() => navigate("/proveedores/" + r.id)}>Ver proveedores compatibles</Button>
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
  const { db, getProvider, visibleApplicants } = useStore();
  const r = db.requests.find((x) => x.id === id);
  const [sort, setSort] = useState<"rating" | "distance">("rating");
  const [nowOnly, setNowOnly] = useState(false);
  if (!r) return <NotFoundReq />;
  const apps = visibleApplicants(r);
  const pending = r.applicants.length - apps.length;
  const rows = apps
    .map((a) => { const p = getProvider(a.providerId)!; return { a, p, d: distanceKm(r.location, p), av: availability(p.schedule) }; })
    .filter((x) => !nowOnly || x.av === "ahora")
    .sort((x, y) => (sort === "rating" ? y.p.rating - x.p.rating : x.d - y.d));

  return (
    <AppShell>
      <PageHeader title="Proveedores compatibles" back="/solicitudes" sub={<span className="hidden sm:inline">{r.title} · {serviceById(r.service).name}</span>} />
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        <Chip active={sort === "distance"} onClick={() => setSort("distance")} className={sort === "distance" ? "" : "!bg-brand-50 !text-brand !ring-0"}>Cerca de ti <LuChevronDown className="inline h-4 w-4" /></Chip>
        <Chip active={nowOnly} onClick={() => setNowOnly(!nowOnly)}>Disponible ahora</Chip>
        <Chip active={sort === "rating"} onClick={() => setSort("rating")}>Mejor calificados</Chip>
      </div>
      {r.status !== "buscando" && (
        <div className="mt-4 rounded-2xl bg-ok-50 p-4 text-sm font-semibold text-ok">Esta solicitud ya tiene un acuerdo. <Link to={"/solicitud/" + r.id} className="underline">Ver detalle</Link></div>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ a, p, d, av }) => (
          <div key={p.id} className="card animate-fade-up p-5">
            <div className="flex gap-4">
              <Avatar name={p.name} photo={p.photo} size={96} dot={av === "ahora" ? "on" : "away"} />
              <div className="min-w-0 flex-1">
                <div className="text-xl font-extrabold">{p.name}</div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <Rating value={p.rating} count={p.reviews} className="text-lg" />
                  <span className="inline-flex items-center gap-1 text-ink-soft"><LuMapPin className="h-4 w-4" />A {d.toFixed(1)} km</span>
                </div>
                <div className={cx("mt-1 flex items-center gap-1.5 font-semibold", av === "otro" ? "text-warn" : "text-ok")}>
                  {av === "ahora" ? <LuCircleCheck className="h-5 w-5" /> : <LuCircleDot className="h-5 w-5" />}{availabilityLabel[av]}
                </div>
                <div className="mt-1 text-lg font-extrabold">{money(p.priceMin)} - {money(p.priceMax)}</div>
                <div className="text-sm text-ink-soft">Propuesta: <b className="text-brand">{money(a.price)}</b> · {timeAgo(a.at)}</div>
              </div>
            </div>
            <Button variant="soft" className="mt-4 w-full text-lg" onClick={() => navigate(`/proveedor/${p.id}?sol=${r.id}`)}>Ver perfil</Button>
          </div>
        ))}
        {r.status === "buscando" && Array.from({ length: Math.max(0, pending) }).map((_, i) => (
          <div key={"pending" + i} className="card flex animate-pulse items-center gap-4 p-5">
            <div className="h-24 w-24 rounded-full bg-brand-50" />
            <div className="flex-1 space-y-3"><div className="h-4 w-2/3 rounded bg-brand-50" /><div className="h-3 w-1/2 rounded bg-brand-50" /><div className="text-sm font-semibold text-brand">Esperando respuesta…</div></div>
          </div>
        ))}
      </div>
      {rows.length === 0 && pending === 0 && (
        <Empty icon={LuUsers} title="Aún no hay postulaciones" text={r.matched.length ? "Notificamos a los proveedores compatibles. Te avisaremos cuando acepten." : "No encontramos proveedores compatibles en tu zona para esta categoría."} />
      )}
    </AppShell>
  );
}

// =====================================================================
//  Perfil del proveedor / Selección del proveedor
// =====================================================================
export function ProviderProfile({ id }: { id: string }) {
  const { getProvider, db, openConversation, toast, mode, myProvider } = useStore();
  const p = getProvider(id);
  const sol = query().get("sol");
  const r = sol ? db.requests.find((x) => x.id === sol) : undefined;
  const [tab, setTab] = useState<"info" | "portafolio" | "resenas">(r ? "portafolio" : "info");
  const [phone, setPhone] = useState(false);
  if (!p) return <AppShell><Empty icon={LuUserRound} title="Proveedor no encontrado" /></AppShell>;
  const av = availability(p.schedule);
  const d = distanceKm(r?.location ?? BASE, p);
  const reviews = REVIEWS[p.id] ?? [];
  const isMe = myProvider?.id === p.id;

  const chat = () => { const c = openConversation(p.id, p.name, serviceById(p.services[0]).short, p.photo); navigate("/chat/" + c); };
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
        right={<button onClick={() => toast("Perfil compartido / reportado (simulado)")} className="rounded-full p-2 hover:bg-white" aria-label="Más opciones"><LuEllipsisVertical className="h-6 w-6" /></button>} />
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="text-center lg:card lg:self-start lg:p-8">
          <Avatar name={p.name} photo={p.photo} size={176} verified={p.verified} className="mx-auto" />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{p.name}</h1>
          <div className="mt-1"><Rating value={p.rating} count={p.reviews} className="text-lg" /> <span className="text-ink-soft">reseñas</span></div>
          {p.verified && <Badge tone="ok" icon={LuCircleCheck} className="mt-2 px-4 py-1.5 text-base">Verificado</Badge>}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge tone="brand" icon={LuMapPin} className="px-4 py-2 text-base">A {d.toFixed(1)} km</Badge>
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
        <p className="text-ink-soft">Por tu seguridad, la llamada se realiza a través de un número enmascarado de ConectaPRO.</p>
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
  const { db, getProvider, confirmAgreement, openConversation } = useStore();
  const r = db.requests.find((x) => x.id === rid);
  const p = getProvider(pid);
  const app = r?.applicants.find((a) => a.providerId === pid);
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState("15:00");
  const [accept, setAccept] = useState(true);
  const [contract, setContract] = useState(false);
  if (!r || !p) return <NotFoundReq />;
  const price = app?.price ?? Math.round((p.priceMin + p.priceMax) / 2);
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
                  <span className="text-ink-soft">Acepto los <button type="button" className="font-semibold text-brand underline" onClick={() => setContract(true)}>términos del servicio</button> y confirmo la contratación.</span>
                </label>
                <Button className="mt-5 w-full py-4 text-lg" disabled={!accept} onClick={() => { confirmAgreement(r.id, p.id, date, time, price); setStep(2); }}>Confirmar acuerdo</Button>
                <button onClick={() => setStep(0)} className="mt-3 w-full text-sm font-semibold text-ink-soft">Cambiar fecha u hora</button>
              </>
            )}
            {done && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button variant="soft" icon={LuFileText} onClick={() => setContract(true)}>Ver contrato</Button>
                <Button icon={LuMessageCircle} onClick={() => navigate("/chat/" + openConversation(p.id, p.name, serviceById(r.service).short, p.photo))}>Escribir a {p.name.split(" ")[0]}</Button>
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
  const { db, getProvider, rateService, toast } = useStore();
  const r = db.requests.find((x) => x.id === id);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  if (!r) return <NotFoundReq />;
  const p = getProvider(r.providerId)!;
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
        <Button className="mt-6 w-full py-[18px] text-xl" disabled={stars === 0} onClick={() => { rateService(r.id, stars, comment); toast("¡Gracias! Tu calificación mejora la comunidad (+50 puntos)"); navigate("/solicitudes?tab=realizados"); }}>Enviar calificación</Button>
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
  const { db, getProvider, cancelRequest, extendDeadline, openConversation, visibleApplicants, toast } = useStore();
  const r = db.requests.find((x) => x.id === id);
  const [late, setLate] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [contract, setContract] = useState(false);
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
            <Info icon={LuCreditCard} k="Método de pago" v={PAYMENTS[r.payment]} />
            <Info icon={LuCalendarDays} k="Publicada" v={`${shortDate(r.createdAt)} · ${clock(r.createdAt)}`} />
            <Info icon={LuUsers} k="Proveedores notificados" v={`${r.matched.length} compatibles`} />
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
              <Button variant="soft" icon={LuMessageCircle} className="mt-4 w-full" onClick={() => navigate("/chat/" + openConversation(p.id, p.name, serviceById(r.service).short, p.photo))}>Enviar mensaje</Button>
            </div>
          )}
          <div className="card space-y-3 p-5">
            {r.status === "buscando" && (
              <>
                <div className="font-bold">{visibleApplicants(r).length} postulaciones recibidas</div>
                <Button className="w-full" onClick={() => navigate("/proveedores/" + r.id)}>Ver proveedores compatibles</Button>
                <Button variant="danger" className="w-full" onClick={() => { cancelRequest(r.id, false); toast("Solicitud cancelada"); }}>Cancelar solicitud</Button>
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
          </div>
        </div>
      </div>

      <Modal open={late} onClose={() => setLate(false)} title="¿El servicio es urgente?">
        <p className="text-ink-soft">Según las reglas de flexibilidad de ConectaPRO puedes darle al proveedor un plazo adicional. El retraso quedará registrado en su reputación.</p>
        <div className="mt-5 grid gap-3">
          <Button icon={LuClock} onClick={() => { extendDeadline(r.id); setLate(false); toast("Plazo extendido 2 días. Se registró la falta de puntualidad."); }}>No es urgente: dar 2 días más</Button>
          <Button variant="danger" onClick={() => { cancelRequest(r.id, false); setLate(false); toast("Acuerdo cancelado sin penalidad para ti"); }}>Es urgente: cancelar sin penalidad</Button>
        </div>
      </Modal>
      <Modal open={cancel} onClose={() => setCancel(false)} title="¿Cancelar el acuerdo?">
        <div className="flex gap-3 rounded-2xl bg-bad-50 p-4 text-sm text-bad"><LuTriangleAlert className="h-5 w-5 shrink-0" /> Cancelar un acuerdo confirmado sin justificación cuenta como <b>falta grave</b>. Con 3 faltas tu cuenta será suspendida.</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setCancel(false)}>Mantener acuerdo</Button>
          <Button variant="danger" onClick={() => { cancelRequest(r.id, true); setCancel(false); }}>Sí, cancelar</Button>
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
