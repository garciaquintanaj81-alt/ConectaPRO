// Componentes visuales reutilizables de ConectaPRO
import { ReactNode, useEffect, useState } from "react";
import {
  LuArrowLeft, LuStar, LuHouse, LuLaptop, LuWrench, LuPaintRoller, LuCar, LuHeart, LuPawPrint, LuEllipsis,
  LuZap, LuAirVent, LuBrickWall, LuSmartphone, LuScissors, LuSparkles, LuTruck, LuHeartPulse, LuDog, LuBrush,
  LuBanknote, LuArrowLeftRight, LuCreditCard, LuWallet, LuMapPin, LuCheck, LuKeyRound, LuWashingMachine,
  LuFlower2, LuBug, LuHammer, LuFlame, LuLayers, LuUmbrella, LuWifi, LuCctv, LuCodeXml, LuPackage, LuDroplets,
  LuActivity, LuBrain, LuApple, LuDumbbell, LuBath, LuGraduationCap, LuBookOpen, LuLanguages, LuMusic, LuBike,
  LuUtensils, LuCakeSlice, LuShoppingBag, LuMegaphone, LuSprout, LuTractor, LuWheat, LuCalculator, LuScale,
  LuPalette, LuDraftingCompass, LuPartyPopper, LuCamera, LuDisc3, LuChefHat, LuBaby, LuHandHeart, LuStore,
  LuBriefcase, LuHardHat, LuStethoscope, LuBone, LuMilk, LuCircleHelp, LuBookA, LuCoffee, LuFlaskConical, LuChevronDown,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { CATEGORIES, Category, CategoryId, PaymentMethod, ServiceId, serviceById } from "./data";
import { goBack } from "./router";
import { photoSrc } from "./api";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------------------------------------------------------------------
//  Íconos de sectores y subcategorías (solo presentación; los datos
//  vienen de la base de datos). Si llega una subcategoría nueva se usa
//  el ícono de su sector.
// ---------------------------------------------------------------------
const CAT_ICONS: Record<string, IconType> = {
  hogar: LuHouse, construccion: LuHardHat, tecnologia: LuLaptop, belleza: LuScissors, transporte: LuCar,
  salud: LuStethoscope, mascotas: LuPawPrint, educacion: LuGraduationCap, comercio: LuStore, agricultura: LuSprout,
  profesionales: LuBriefcase, eventos: LuPartyPopper, mas: LuEllipsis,
};
export const CATEGORY_ICON: Record<CategoryId, IconType> = new Proxy(CAT_ICONS, { get: (t, k: string) => t[k] ?? LuCircleHelp });

const SRV_ICONS: Record<string, IconType> = {
  plomeria: LuWrench, electricidad: LuZap, aire: LuAirVent, limpieza: LuBrush, cerrajeria: LuKeyRound,
  electrodomesticos: LuWashingMachine, jardineria: LuFlower2, fumigacion: LuBug,
  pintura: LuPaintRoller, albanileria: LuBrickWall, carpinteria: LuHammer, soldadura: LuFlame, drywall: LuLayers, impermeabilizacion: LuUmbrella,
  computadores: LuLaptop, celulares: LuSmartphone, redes: LuWifi, camaras: LuCctv, desarrollo_web: LuCodeXml,
  peluqueria: LuScissors, barberia: LuScissors, manicure: LuSparkles, maquillaje: LuPalette, depilacion: LuSparkles,
  mudanzas: LuTruck, conductor: LuCar, mensajeria: LuPackage, mecanica: LuWrench, lavado_autos: LuDroplets,
  enfermeria: LuHeartPulse, fisioterapia: LuActivity, psicologia: LuBrain, nutricion: LuApple, entrenador: LuDumbbell,
  paseo: LuDog, veterinaria: LuPawPrint, peluqueria_canina: LuBath, cuidado_mascotas: LuHouse, adiestramiento: LuBone,
  refuerzo_escolar: LuBookOpen, idiomas: LuLanguages, musica: LuMusic, preicfes: LuBookA, clases_programacion: LuCodeXml,
  domicilios: LuBike, comida_casera: LuUtensils, reposteria: LuCakeSlice, ventas_catalogo: LuShoppingBag, marketing_redes: LuMegaphone,
  jornaleros: LuWheat, fumigacion_cultivos: LuBug, asistencia_agro: LuSprout, maquinaria_agricola: LuTractor, veterinaria_rural: LuMilk,
  contabilidad: LuCalculator, asesoria_legal: LuScale, diseno_grafico: LuPalette, traduccion: LuLanguages, arquitectura: LuDraftingCompass,
  decoracion_eventos: LuPartyPopper, fotografia_video: LuCamera, musica_dj: LuDisc3, catering: LuChefHat, animacion_infantil: LuSparkles, desayunos_sorpresa: LuCoffee,
  cuidado_ninos: LuBaby, adulto_mayor: LuHandHeart, mandados: LuPackage, otro: LuEllipsis,
};
export const SERVICE_ICON: Record<ServiceId, IconType> = new Proxy(SRV_ICONS, {
  get: (t, k: string) => t[k] ?? CAT_ICONS[serviceById(k).category] ?? LuCircleHelp,
});
export const PAYMENT_ICON: Record<PaymentMethod, IconType> = {
  efectivo: LuBanknote, nequi: LuWallet, transferencia: LuArrowLeftRight, tarjeta: LuCreditCard,
};
export const PAYMENT_COLOR: Record<PaymentMethod, string> = {
  efectivo: "text-ok", nequi: "text-[#d6246e]", transferencia: "text-ok", tarjeta: "text-brand-blue",
};

// ---------------------------------------------------------------------
//  Marca
// ---------------------------------------------------------------------
export function Logo({ size = "md", tagline = true, className }: { size?: "sm" | "md" | "lg"; tagline?: boolean; className?: string }) {
  const s = { sm: ["h-9 w-9", "text-xl", "text-[10px]"], md: ["h-12 w-12", "text-[26px]", "text-[11px]"], lg: ["h-20 w-20", "text-4xl sm:text-[42px]", "text-sm"] }[size];
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <img src="img/logo.png" alt="" className={cx(s[0], "shrink-0 object-contain")} />
      <div className="leading-none">
        <div className={cx(s[1], "font-extrabold tracking-tight text-ink")}>
          Conecta<span className="text-brand-blue">+</span><span className="text-brand-gradient">PRO</span>
        </div>
        {tagline && <div className={cx(s[2], "mt-1 font-medium text-ink-soft")}>Tu red de servicios, más cerca</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Avatares, estrellas, insignias
// ---------------------------------------------------------------------
const AVATAR_BG = ["bg-[#e0e7ff] text-brand", "bg-[#fce7f3] text-[#be185d]", "bg-[#dcfce7] text-[#15803d]", "bg-[#fef3c7] text-[#b45309]", "bg-[#e0f2fe] text-[#0369a1]"];
export function Avatar({ name, photo, size = 48, dot, verified, className }: { name: string; photo?: string; size?: number; dot?: "on" | "away" | null; verified?: boolean; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const bg = AVATAR_BG[name.length % AVATAR_BG.length];
  return (
    <div className={cx("relative shrink-0", className)} style={{ width: size, height: size }}>
      {photo ? (
        <img src={photoSrc(photo)} alt={name} className="h-full w-full rounded-full object-cover ring-4 ring-white shadow-sm" />
      ) : (
        <div className={cx("flex h-full w-full items-center justify-center rounded-full font-bold ring-4 ring-white", bg)} style={{ fontSize: size * 0.36 }}>{initials}</div>
      )}
      {dot && <span className={cx("absolute bottom-[4%] right-[4%] rounded-full ring-[3px] ring-white", dot === "on" ? "bg-ok" : "bg-warn")} style={{ width: Math.max(10, size * 0.17), height: Math.max(10, size * 0.17) }} />}
      {verified && (
        <span className="absolute bottom-[2%] right-[2%] flex items-center justify-center rounded-full bg-brand text-white ring-[3px] ring-white" style={{ width: size * 0.22, height: size * 0.22 }}>
          <LuCheck style={{ width: size * 0.13, height: size * 0.13 }} strokeWidth={3.5} />
        </span>
      )}
    </div>
  );
}

export function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const Star = (
          <LuStar
            style={{ width: size, height: size }}
            className={cx(filled ? "fill-star text-star drop-shadow-[0_2px_3px_rgba(245,158,11,.35)]" : "fill-[#d5dbea] text-[#d5dbea]", "transition-transform")}
          />
        );
        return onChange ? (
          <button key={i} type="button" aria-label={`${i} estrellas`} onClick={() => onChange(i)} className="hover:scale-110 active:scale-95">
            {Star}
          </button>
        ) : (
          <span key={i}>{Star}</span>
        );
      })}
    </div>
  );
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  // Sin reseñas no se muestra un puntaje inventado
  if (count === 0) return <span className={cx("inline-flex shrink-0 items-center gap-1 font-semibold text-ink-soft", className)}><LuStar className="h-[1.1em] w-[1.1em] text-[#c9cfe0]" /> <span title="Aún no tiene reseñas">Nuevo</span></span>;
  return (
    <span className={cx("inline-flex items-center gap-1 font-bold text-[#8a5a00]", className)}>
      <LuStar className="h-[1.1em] w-[1.1em] fill-star text-star" /> {value.toFixed(1)}
      {count !== undefined && <span className="font-medium text-ink-soft">({count})</span>}
    </span>
  );
}

export function Badge({ tone = "brand", children, icon: Icon, className }: { tone?: "brand" | "ok" | "bad" | "warn" | "soft" | "solidOk"; children: ReactNode; icon?: IconType; className?: string }) {
  const t = {
    brand: "bg-brand-50 text-brand",
    ok: "bg-ok-50 text-ok",
    bad: "bg-bad-50 text-bad",
    warn: "bg-[#fff4dc] text-[#b45309]",
    soft: "bg-surface text-ink-soft",
    solidOk: "bg-[#4cb963] text-white",
  }[tone];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold", t, className)}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </span>
  );
}

/** Etiqueta visible en las cuentas de prueba (QA) para no confundirlas con usuarios reales */
export function TestBadge({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full bg-[#fff4dc] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#9a5b00] ring-1 ring-[#f5d58a]", className)} title="Cuenta de prueba: no es un usuario real">
      <LuFlaskConical className="h-3 w-3" /> Cuenta de prueba
    </span>
  );
}

// ---------------------------------------------------------------------
//  Sectores: se muestran los 3 principales y el resto con "Ver más"
// ---------------------------------------------------------------------
export function mainCategories(): Category[] {
  const main = CATEGORIES.filter((c) => c.main);
  return (main.length ? main : CATEGORIES).slice(0, 3);
}

export function CategoryPicker({ value, onChange, variant = "tiles", hrefFor, showCount }: {
  value?: string;
  onChange?: (id: string) => void;
  variant?: "tiles" | "list" | "chips";
  /** Si se indica, cada sector es un enlace (pantalla de inicio) */
  hrefFor?: (id: string) => string;
  showCount?: boolean;
}) {
  const main = mainCategories();
  const selectedIsExtra = !!value && !main.some((c) => c.id === value);
  const [more, setMore] = useState(selectedIsExtra);
  useEffect(() => { if (selectedIsExtra) setMore(true); }, [selectedIsExtra]);
  const list = more ? [...main, ...CATEGORIES.filter((c) => !main.includes(c))] : main;
  const item = (c: Category) => {
    const Icon = CATEGORY_ICON[c.id];
    const active = value === c.id;
    const inner = variant === "chips" ? (
      <><Icon className="h-4 w-4" />{c.short}{showCount && c.providers != null && <span className={cx("text-xs", active ? "text-white/80" : "text-ink-soft")}>({c.providers})</span>}</>
    ) : (
      <>
        <span className={cx("flex shrink-0 items-center justify-center rounded-lg", c.tint, variant === "tiles" ? "h-10 w-10" : "h-9 w-9")}><Icon className={variant === "tiles" ? "h-5 w-5" : "h-[18px] w-[18px]"} /></span>
        <span className={cx("min-w-0 font-semibold leading-tight", variant === "tiles" ? "text-[13px] sm:text-[14px]" : "text-sm")}>{variant === "tiles" ? c.short : c.name}</span>
      </>
    );
    const cls = variant === "chips"
      ? cx("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition", active ? "bg-brand text-white shadow-brand" : "bg-white ring-1 ring-line hover:ring-brand/40")
      : variant === "tiles"
        ? cx("group flex min-w-0 flex-col items-center gap-2 rounded-xl bg-white px-1.5 py-3 text-center ring-1 transition hover:ring-brand/40", active ? "ring-2 ring-brand" : "ring-line")
        : cx("flex items-center gap-2.5 rounded-xl p-3 text-left ring-1 transition hover:ring-brand/40", active ? "bg-brand-50 ring-2 ring-brand" : "ring-line");
    return hrefFor
      ? <a key={c.id} href={"#" + hrefFor(c.id)} className={cls} title={c.description}>{inner}</a>
      : <button key={c.id} type="button" onClick={() => onChange?.(active && variant === "chips" ? "" : c.id)} className={cls} title={c.description} aria-pressed={active}>{inner}</button>;
  };
  const moreBtn = (
    <button type="button" onClick={() => setMore(!more)} aria-expanded={more}
      className={cx(variant === "chips"
        ? "inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold text-brand ring-1 ring-brand/30 hover:bg-brand-50"
        : variant === "tiles"
          ? "flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand/40 px-1 py-3 text-center text-[12.5px] font-semibold leading-tight text-brand hover:bg-brand-50"
          : "flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand/40 p-3 text-sm font-semibold text-brand hover:bg-brand-50")}>
      {variant === "tiles" && !more && <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50"><LuEllipsis className="h-5 w-5" /></span>}
      {more ? "Ver menos" : `Ver más (${CATEGORIES.length - main.length})`}
      {variant !== "tiles" && <LuChevronDown className={cx("h-4 w-4 transition", more && "rotate-180")} />}
    </button>
  );
  const grid = variant === "chips" ? "flex flex-wrap gap-2" : variant === "tiles" ? "grid grid-cols-4 gap-2.5 sm:grid-cols-4 lg:grid-cols-4 2xl:grid-cols-6" : "grid grid-cols-2 gap-2 sm:grid-cols-3";
  return <div className={grid} role="list" aria-label="Sectores">{list.map(item)}{CATEGORIES.length > main.length && moreBtn}</div>;
}

// ---------------------------------------------------------------------
//  Botones y campos
// ---------------------------------------------------------------------
export function Button({ children, variant = "primary", className, icon: Icon, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "outline" | "dark" | "ghost" | "danger"; icon?: IconType }) {
  const v = {
    primary: "bg-brand-gradient text-white shadow-brand hover:brightness-110",
    soft: "bg-brand-50 text-brand hover:bg-brand-100",
    outline: "bg-white text-ink ring-1 ring-line hover:ring-brand/40 hover:text-brand",
    dark: "bg-ink text-white hover:bg-[#1a2270]",
    ghost: "text-brand hover:bg-brand-50",
    danger: "bg-bad-50 text-bad hover:bg-[#fbd5de]",
  }[variant];
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-bold transition active:scale-[.98] disabled:opacity-50 disabled:active:scale-100",
        v, className
      )}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
}

export function Field({ icon: Icon, label, children, trailing, className }: { icon?: IconType; label?: string; children: ReactNode; trailing?: ReactNode; className?: string }) {
  return (
    <label className={cx("flex items-center gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-brand/50", className)}>
      {Icon && <Icon className="h-6 w-6 shrink-0 text-ink" />}
      <div className="min-w-0 flex-1">
        {label && <div className="text-[13px] font-semibold text-ink">{label}</div>}
        {children}
      </div>
      {trailing}
    </label>
  );
}

export const inputCls = "w-full bg-transparent text-[15px] text-ink placeholder:text-ink-soft/70 outline-none";

export function Chip({ active, children, onClick, className }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? "bg-brand text-white shadow-brand" : "bg-white text-ink ring-1 ring-line hover:ring-brand/40",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx("relative h-8 w-14 shrink-0 rounded-full transition", on ? "bg-brand-blue" : "bg-[#d5dbea]")}
    >
      <span className={cx("absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all", on ? "left-7" : "left-1")} />
    </button>
  );
}

// ---------------------------------------------------------------------
//  Encabezado de pantalla (móvil) con botón atrás
// ---------------------------------------------------------------------
export function PageHeader({ title, back, right, sub, className }: { title: ReactNode; back?: string | false; right?: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx("relative mb-5 flex min-h-12 items-center justify-center", className)}>
      {back !== false && (
        <button onClick={() => goBack(back || "/inicio")} aria-label="Volver" className="absolute left-0 rounded-full p-2 text-ink hover:bg-white lg:-left-2">
          <LuArrowLeft className="h-7 w-7" />
        </button>
      )}
      <div className="px-12 text-center">
        <h1 className="text-[22px] font-extrabold tracking-tight sm:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-ink-soft">{sub}</p>}
      </div>
      {right && <div className="absolute right-0">{right}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xl font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Paso a paso (Registro / Acuerdo)
// ---------------------------------------------------------------------
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mx-auto flex w-full max-w-md items-start">
      {steps.map((s, i) => (
        <div key={s} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && <div className={cx("absolute right-1/2 top-5 h-[3px] w-full -translate-y-1/2", i <= current ? "bg-brand-blue" : "bg-brand-100")} />}
          <div
            className={cx(
              "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-base font-bold transition",
              i < current ? "bg-brand-blue text-white" : i === current ? "bg-brand-blue text-white ring-4 ring-brand-100" : "bg-brand-100 text-ink-soft"
            )}
          >
            {i < current ? <LuCheck className="h-5 w-5" strokeWidth={3} /> : i + 1}
          </div>
          <div className={cx("mt-2 text-[13px] font-semibold leading-tight", i <= current ? "text-brand-blue" : "text-ink-soft")}>{s}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Mapa simulado (en producción: Google Maps / Mapbox)
// ---------------------------------------------------------------------
export function MapMock({ className, pins = [], pulse = true, children }: { className?: string; pins?: { x: number; y: number; photo?: string; label?: string }[]; pulse?: boolean; children?: ReactNode }) {
  return (
    <div className={cx("relative overflow-hidden rounded-3xl bg-[#eef0f4] ring-1 ring-line", className)}>
      <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect width="400" height="220" fill="#eceef3" />
        <path d="M20 0 L80 60 L40 140 L0 120Z" fill="#cfe9cf" />
        <path d="M150 90 L210 70 L235 130 L170 150Z" fill="#cfe9cf" />
        <path d="M300 160 L380 140 L400 220 L310 220Z" fill="#cfe9cf" />
        <path d="M250 0 Q300 40 360 20 L400 0Z" fill="#cfe3f7" />
        <g stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round">
          <path d="M-10 40 L410 120" /><path d="M-10 170 L410 60" /><path d="M120 -10 L180 230" />
          <path d="M260 -10 L230 230" /><path d="M340 -10 L380 230" /><path d="M40 -10 L20 230" />
        </g>
        <g stroke="#fff" strokeWidth="4" fill="none">
          <path d="M-10 95 L410 20" /><path d="M-10 210 L410 170" /><path d="M80 -10 L60 230" /><path d="M300 -10 L320 230" /><path d="M200 -10 L150 230" />
        </g>
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {pulse && <span className="animate-ping-soft absolute -inset-10 rounded-full bg-brand-blue/25" />}
        <span className="absolute -inset-10 rounded-full bg-brand-blue/10" />
        <LuMapPin className="relative h-12 w-12 -translate-y-3 fill-brand-blue text-white drop-shadow-lg" strokeWidth={1.6} />
      </div>
      {pins.map((p, i) => (
        <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 animate-fade-up" style={{ left: p.x + "%", top: p.y + "%", animationDelay: i * 120 + "ms" }} title={p.label}>
          {p.photo ? (
            <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover ring-[3px] ring-white shadow-md" />
          ) : (
            <span className="block h-4 w-4 rounded-full bg-brand-violet ring-[3px] ring-white shadow-md" />
          )}
        </div>
      ))}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Modal y vacío
// ---------------------------------------------------------------------
export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="animate-fade-up max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-lg sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="mb-4 text-xl font-extrabold">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: IconType; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand"><Icon className="h-8 w-8" /></div>
      <div className="text-lg font-bold">{title}</div>
      {text && <p className="mt-1 max-w-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Formatos de tiempo
// ---------------------------------------------------------------------
export function timeAgo(t: number) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "Hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Ayer" : `Hace ${d} días`;
}
export const clock = (t: number) => {
  const d = new Date(t);
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`;
};
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const shortDate = (t: number | string) => {
  const d = typeof t === "string" ? new Date(t + "T12:00:00") : new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}. ${d.getFullYear()}`;
};
/** Fecha local en formato AAAA-MM-DD */
export const localISO = (t: number = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function agreementWhen(date: string, time: string) {
  const d = new Date(date + "T" + time + ":00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(date + "T00:00:00").getTime() - today.getTime()) / 86400000);
  const day = diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
  return `${day}, ${clock(d.getTime())}`;
}

export function useNow(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((x) => x + 1), ms); return () => clearInterval(t); }, [ms]);
  return Date.now();
}
