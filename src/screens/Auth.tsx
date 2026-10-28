import { ReactNode, useEffect, useRef, useState } from "react";
import {
  LuSearch, LuCirclePlus, LuChevronRight, LuUserRound, LuLock, LuEye, LuEyeOff, LuUser, LuIdCard,
  LuSmartphone, LuMail, LuMapPin, LuChevronDown, LuScanFace, LuShieldCheck, LuUsers, LuSparkles, LuCircleCheck,
  LuArrowRight, LuArrowLeft, LuCamera,
} from "react-icons/lu";
import { useStore } from "../store";
import { navigate, Link, goBack } from "../router";
import { Button, Field, Logo, Stepper, cx, inputCls, Avatar } from "../ui";
import { rpc } from "../api";
import { UbicacionSelect } from "../geo";
import { CHECK_MSG, Check, FrameAnalysis, VerificationResult, createAnalyzer, evaluate, loadDetector } from "../face/detector";
import { SimulatorLink } from "./Simulator";
import { LegalConsent } from "./Legal";
import { TERMS_VERSION } from "../legal";

// ---------------------------------------------------------------------
//  Marco de las pantallas de acceso: en computador se divide en dos
// ---------------------------------------------------------------------
function AuthFrame({ children, aside = true }: { children: ReactNode; aside?: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="blobs" />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        {aside && (
          <section className="hidden flex-col justify-between p-12 lg:flex">
            <Logo size="md" />
            <div>
              <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
                Únete a una<br />comunidad que<br /><span className="text-brand-gradient">hace la diferencia</span>
              </h2>
              <p className="mt-5 max-w-md text-lg text-ink-soft">
                Conecta con personas, ofrece o solicita servicios de forma segura, rápida y confiable.
              </p>
              <ul className="mt-10 space-y-5">
                {[
                  [LuShieldCheck, "Seguridad", "Verificamos tu identidad con reconocimiento facial"],
                  [LuUsers, "Más oportunidades", "El algoritmo te conecta con personas cerca de ti"],
                  [LuSparkles, "Servicios reales", "Acuerdos digitales y calificaciones confiables"],
                ].map(([Icon, t, d]: any) => (
                  <li key={t} className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-line"><Icon className="h-6 w-6" /></span>
                    <div><div className="font-bold">{t}</div><div className="text-sm text-ink-soft">{d}</div></div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="font-[cursive] text-2xl italic text-ink/80">Conectamos personas,<br />hacemos servicios reales</p>
          </section>
        )}
        <section className={cx("flex items-center justify-center px-5 py-8 sm:px-8", !aside && "lg:col-span-2")}>
          <div className={cx("w-full", aside ? "max-w-md lg:card lg:max-w-lg lg:p-10" : "max-w-md")}>{children}</div>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Bienvenida (carrusel)
// ---------------------------------------------------------------------
const SLIDES = [
  { a: "Conectamos", b: "personas,", c: "hacemos servicios", d: "reales", text: "Encuentra o ofrece servicios de forma segura, rápida y cerca de ti." },
  { a: "Publica lo", b: "que necesitas,", c: "te avisamos", d: "al instante", text: "Nuestro algoritmo notifica solo a los proveedores compatibles con tu solicitud." },
  { a: "Confianza", b: "en cada", c: "servicio", d: "acordado", text: "Identidad verificada, acuerdos digitales y calificaciones de ambas partes." },
];

export function Welcome() {
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 5000); return () => clearInterval(t); }, []);
  const s = SLIDES[i];
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#e9ecff] via-surface to-surface">
      <div className="blobs" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex flex-1 flex-col"
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : SLIDES.length - 1)) % SLIDES.length);
            touch.current = null;
          }}>
          <Logo size="lg" className="mx-auto mt-6 lg:mx-0 lg:mt-0" />
          <div key={i} className="animate-fade-up mt-14 lg:mt-16">
            <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              {s.a}<br />{s.b}<br /><span className="text-brand-gradient">{s.c}<br />{s.d}</span>
            </h1>
            <p className="mt-6 max-w-md text-xl text-ink-soft">{s.text}</p>
          </div>
          <div className="mt-10 flex justify-center gap-3 lg:justify-start">
            {SLIDES.map((_, k) => (
              <button key={k} aria-label={`Diapositiva ${k + 1}`} onClick={() => setI(k)} className={cx("h-3 rounded-full transition-all", k === i ? "w-8 bg-brand" : "w-3 bg-brand-100")} />
            ))}
          </div>
        </div>

        <div className="mt-auto w-full space-y-4 pt-10 lg:mt-0 lg:max-w-md lg:pt-0">
          <img src="img/ilustracion_app.jpg" alt="Cliente y proveedor conectados por ConectaPRO" className="hidden max-h-[420px] w-full rounded-3xl object-cover object-top shadow-sm lg:block" />
          <button onClick={() => navigate("/registro?rol=cliente")} className="flex w-full items-center gap-4 rounded-2xl bg-brand-gradient px-5 py-5 text-left text-lg font-bold text-white shadow-brand transition hover:brightness-110 active:scale-[.99]">
            <LuSearch className="h-8 w-8 rounded-full border-2 border-white p-1" />
            <span className="border-l border-white/40 pl-4">Quiero solicitar un servicio</span>
            <LuChevronRight className="ml-auto h-6 w-6" />
          </button>
          <button onClick={() => navigate("/registro?rol=proveedor")} className="flex w-full items-center gap-4 rounded-2xl bg-white px-5 py-5 text-left text-lg font-bold text-ink ring-1 ring-line transition hover:ring-brand/40 active:scale-[.99]">
            <LuCirclePlus className="h-8 w-8 text-brand" />
            <span className="border-l border-line pl-4">Quiero ofrecer un servicio</span>
            <LuChevronRight className="ml-auto h-6 w-6" />
          </button>
          <p className="pt-3 text-center text-lg text-ink-soft">
            ¿Ya tienes cuenta? <Link to="/login" className="font-bold text-brand-violet">Iniciar sesión</Link>
          </p>
          <SimulatorLink className="mt-2" />
          <p className="text-center text-sm text-ink-soft"><Link to="/legal" className="font-semibold underline underline-offset-2">Términos, condiciones y privacidad</Link></p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Iniciar sesión (con accesos rápidos de demostración)
// ---------------------------------------------------------------------
export function Login() {
  const { login, toast } = useStore();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async (fn: () => Promise<void>) => {
    setBusy(true); setErr("");
    try { await fn(); navigate("/inicio", true); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(user.trim())) return setErr("Escribe el correo electrónico con el que te registraste");
    if (pass.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres");
    go(() => login(user, pass));
  };

  return (
    <AuthFrame>
      <Logo size="lg" className="mx-auto justify-center lg:hidden" />
      <h1 className="mt-10 text-center text-[34px] font-extrabold tracking-tight lg:mt-0">Bienvenido de nuevo</h1>
      <p className="mt-1 text-center text-xl text-ink-soft">Ingresa para continuar</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field icon={LuUserRound}>
          <input type="email" className={cx(inputCls, "py-2.5")} placeholder="Correo electrónico" value={user} onChange={(e) => { setUser(e.target.value); setErr(""); }} autoComplete="username" />
        </Field>
        <Field icon={LuLock} trailing={
          <button type="button" onClick={() => setShow(!show)} aria-label="Mostrar contraseña" className="text-ink">{show ? <LuEyeOff className="h-6 w-6" /> : <LuEye className="h-6 w-6" />}</button>
        }>
          <input type={show ? "text" : "password"} className={cx(inputCls, "py-2.5")} placeholder="Contraseña" value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} autoComplete="current-password" />
        </Field>
        <div className="text-right">
          <button type="button" onClick={() => toast("Escribe a soporte@conectapro.co para recuperar tu contraseña")} className="font-semibold text-brand-violet">¿Olvidaste tu contraseña?</button>
        </div>
        {err && <p className="rounded-xl bg-bad-50 px-4 py-3 text-sm font-medium text-bad">{err}</p>}
        <Button type="submit" disabled={busy} className="w-full py-4 text-lg">{busy ? "Ingresando…" : "Iniciar sesión"}</Button>
      </form>

      <div className="my-7 flex items-center gap-4 text-ink-soft"><span className="h-px flex-1 bg-line" />o continúa con<span className="h-px flex-1 bg-line" /></div>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Google", <svg key="g" viewBox="0 0 48 48" className="h-8 w-8"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>],
          ["Apple", <svg key="a" viewBox="0 0 24 24" className="h-8 w-8 fill-ink"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.300-.8-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.8-4.2zM14 5.2c.7-.8 1.2-2 1-3.2-1 0-2.2.7-3 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.4z"/></svg>],
          ["Facebook", <svg key="f" viewBox="0 0 24 24" className="h-8 w-8"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M15.1 12.8h-2.2V20h-3v-7.2H8.4v-2.6h1.5V8.6c0-2 .9-3.2 3.3-3.2h2v2.6h-1.3c-.9 0-1 .4-1 1.1v1.1h2.4l-.2 2.6z"/></svg>],
        ].map(([name, icon]: any) => (
          <button key={name} type="button" aria-label={name} onClick={() => toast(`El inicio de sesión con ${name} estará disponible próximamente`)} className="flex h-16 items-center justify-center rounded-2xl bg-white ring-1 ring-line hover:ring-brand/40">{icon}</button>
        ))}
      </div>

      <SimulatorLink className="mt-7" />
      <p className="mt-3 text-center text-sm text-ink-soft"><Link to="/pruebas" className="font-semibold underline underline-offset-2">Cuentas de prueba (QA)</Link> · <Link to="/legal" className="font-semibold underline underline-offset-2">Términos y privacidad</Link></p>
      <p className="mt-7 text-center text-lg text-ink-soft">¿No tienes una cuenta?<br /><Link to="/registro" className="font-bold text-brand-violet">Registrarme</Link></p>
    </AuthFrame>
  );
}

// ---------------------------------------------------------------------
//  Registro: 1) datos  2) validación facial  3) ¡Listo!
// ---------------------------------------------------------------------
export function Register() {
  const { register } = useStore();
  const wantsProvider = window.location.hash.includes("rol=proveedor");
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", document: "", phone: "", email: "", password: "" });
  const [ubic, setUbic] = useState({ departamento: "", municipio: "" });
  const [verif, setVerif] = useState<VerificationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Aceptación expresa: las casillas empiezan sin marcar
  const [consent, setConsent] = useState({ terms: false, privacy: false });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: "" }); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().split(/\s+/).length < 2) e.name = "Escribe tu nombre y apellido";
    if (!/^\d[\d.]{5,14}$/.test(f.document.trim())) e.document = "Número de documento no válido";
    if (f.phone.replace(/\D/g, "").length !== 10) e.phone = "El celular debe tener 10 dígitos";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Correo no válido";
    if (f.password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!ubic.departamento) e.departamento = "Selecciona tu departamento";
    if (!ubic.municipio) e.municipio = "Selecciona tu ciudad o municipio";
    if (!consent.terms || !consent.privacy) e.consent = "Para crear tu cuenta debes aceptar los términos y autorizar el tratamiento de tus datos";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const startFace = () => { if (validate()) { setServerErr(""); setStep(1); } };

  const finish = async (v: VerificationResult) => {
    setBusy(true); setServerErr("");
    try {
      await register({ ...f, phone: f.phone.replace(/\D/g, ""), ...ubic, verification: v, terms: TERMS_VERSION });
      setStep(2);
    } catch (e: any) {
      setServerErr(e.message); setStep(0); setVerif(null);
    } finally { setBusy(false); }
  };

  return (
    <AuthFrame>
      <div className="relative">
        {step === 0 && (
          <button onClick={() => goBack("/")} className="absolute -left-1 top-1 rounded-full p-2 hover:bg-white lg:hidden" aria-label="Volver"><LuArrowLeft className="h-6 w-6" /></button>
        )}
        <Logo size="md" className="justify-center lg:hidden" />
      </div>
      <div className="mt-6 lg:mt-0"><Stepper steps={["Registro", "Validación facial", "¡Listo!"]} current={step} /></div>

      {step === 0 && (
        <div className="animate-fade-up">
          <h1 className="mt-7 text-center text-[32px] font-extrabold tracking-tight">Crea tu cuenta</h1>
          <p className="text-center text-lg text-ink-soft">Ingresa tus datos para comenzar.</p>
          {serverErr && <p className="mt-4 rounded-xl bg-bad-50 px-4 py-3 text-sm font-medium text-bad">{serverErr}</p>}
          <div className="mt-6 space-y-3">
            {([
              ["name", LuUser, "Nombre completo", "Ingresa tu nombre completo", "text"],
              ["document", LuIdCard, "Número de documento", "Ingresa tu número de documento", "text"],
              ["phone", LuSmartphone, "Número de celular", "Ingresa tu número de celular", "tel"],
              ["email", LuMail, "Correo electrónico", "Ingresa tu correo electrónico", "email"],
            ] as const).map(([k, Icon, label, ph, type]) => (
              <div key={k}>
                <Field icon={Icon} label={label} className={errors[k] ? "ring-2 ring-bad/50" : ""}>
                  <input name={k} type={type} inputMode={k === "phone" || k === "document" ? "numeric" : undefined} className={cx(inputCls, "text-sm")} placeholder={ph} value={f[k]} onChange={set(k)} />
                </Field>
                {errors[k] && <p className="mt-1 pl-4 text-xs font-medium text-bad">{errors[k]}</p>}
              </div>
            ))}
            <div>
              <Field icon={LuLock} label="Contraseña" className={errors.password ? "ring-2 ring-bad/50" : ""}
                trailing={<button type="button" onClick={() => setShowPass(!showPass)} aria-label="Mostrar contraseña">{showPass ? <LuEyeOff className="h-5 w-5" /> : <LuEye className="h-5 w-5" />}</button>}>
                <input name="password" type={showPass ? "text" : "password"} autoComplete="new-password" className={cx(inputCls, "text-sm")} placeholder="Mínimo 6 caracteres" value={f.password} onChange={set("password")} />
              </Field>
              {errors.password && <p className="mt-1 pl-4 text-xs font-medium text-bad">{errors.password}</p>}
            </div>
            <UbicacionSelect value={ubic} onChange={(v) => { setUbic(v); setErrors({ ...errors, departamento: "", municipio: "" }); }}
              errors={{ departamento: errors.departamento, municipio: errors.municipio }} />
            <LegalConsent value={consent} onChange={(v) => { setConsent(v); setErrors({ ...errors, consent: "" }); }} error={errors.consent} />
          </div>

          <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#eef0ff] to-[#f3eeff] p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-24 shrink-0 items-center justify-center text-brand-blue">
                <LuScanFace className="h-16 w-16" strokeWidth={1.4} />
              </div>
              <div>
                <div className="font-bold">Validación por reconocimiento facial</div>
                <p className="text-sm text-ink-soft">Presiona el botón para iniciar la verificación de tu identidad.</p>
              </div>
            </div>
            <Button onClick={startFace} className="mt-3 w-full bg-gradient-to-r from-brand-blue to-brand-violet" icon={LuScanFace}>Iniciar reconocimiento facial</Button>
          </div>
          <Button variant="dark" disabled className="mt-4 w-full py-4">Registrarme en Conecta+PRO</Button>
          <p className="mt-1 text-center text-xs text-ink-soft">Primero completa la validación facial</p>
          <p className="mt-5 text-center text-ink-soft">¿Ya tienes una cuenta? <Link to="/login" className="font-bold text-brand-violet">Iniciar sesión</Link></p>
        </div>
      )}

      {step === 1 && (
        <FaceScan
          busy={busy}
          result={verif}
          onBack={() => { setStep(0); setVerif(null); }}
          onDone={(r) => { if (verif) finish(r); else setVerif(r); }}
        />
      )}

      {step === 2 && (
        <div className="animate-fade-up mt-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-ok-50 text-ok"><LuCircleCheck className="h-14 w-14" /></div>
          <h1 className="mt-6 text-3xl font-extrabold">¡Listo, {f.name.split(" ")[0]}!</h1>
          <p className="mx-auto mt-2 max-w-sm text-lg text-ink-soft">Tu cuenta quedó guardada y activa. Ganaste <b className="text-ink">100 puntos</b> de bienvenida.</p>
          <Button className="mt-8 w-full py-4" icon={LuArrowRight} onClick={() => navigate(wantsProvider ? "/mi-servicio" : "/rol", true)}>Continuar</Button>
        </div>
      )}
    </AuthFrame>
  );
}

function FaceScan({ busy, onBack, onDone, result }: { busy?: boolean; onBack: () => void; onDone: (r: VerificationResult) => void; result: VerificationResult | null }) {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState<"pendiente" | "activa" | "denegada" | "no-disponible">("pendiente");
  const [phase, setPhase] = useState<"listo" | "rostro" | "movimiento" | "hecho" | "fallo">("listo");
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [detectorErr, setDetectorErr] = useState("");
  const run = useRef({ active: false, good: 0, scores: [] as number[], xs: [] as number[], start: 0, last: "ok" as Check, bright: 0, sharp: 0 });

  useEffect(() => {
    let stream: MediaStream | null = null;
    loadDetector().catch((e) => setDetectorErr(e.message));
    if (!navigator.mediaDevices?.getUserMedia) { setCamera("no-disponible"); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
      .then((st) => { stream = st; if (video.current) { video.current.srcObject = st; setCamera("activa"); } })
      .catch((e) => setCamera(e?.name === "NotAllowedError" ? "denegada" : "no-disponible"));
    return () => { run.current.active = false; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const drawBox = (a: FrameAnalysis, ok: boolean) => {
    const cv = overlay.current, v = video.current;
    if (!cv || !v) return;
    cv.width = cv.clientWidth; cv.height = cv.clientHeight;
    const g = cv.getContext("2d")!;
    g.clearRect(0, 0, cv.width, cv.height);
    // El video se muestra "cover" dentro del marco: se calcula la escala real
    const scale = Math.max(cv.width / a.width, cv.height / a.height);
    const ox = (cv.width - a.width * scale) / 2, oy = (cv.height - a.height * scale) / 2;
    for (const f of a.faces.slice(0, 3)) {
      const x = cv.width - (ox + f.col * scale), y = oy + f.row * scale, r = (f.size * scale) / 2; // espejo horizontal
      g.strokeStyle = ok ? "#16a34a" : "#f59e0b"; g.lineWidth = 3;
      g.beginPath(); g.ellipse(x, y, r * 0.8, r, 0, 0, Math.PI * 2); g.stroke();
    }
  };

  const start = async () => {
    setDetectorErr("");
    let classify;
    try { classify = await loadDetector(); } catch (e: any) { setDetectorErr(e.message); return; }
    const analyze = createAnalyzer(classify, { video: true });
    const R = run.current;
    Object.assign(R, { active: true, good: 0, scores: [], xs: [], start: Date.now(), last: "sin-rostro" });
    setPhase("rostro"); setProgress(0); setMsg("Mira de frente a la cámara…");
    let lastT = 0;
    const loop = (t: number) => {
      if (!R.active) return;
      const v = video.current;
      if (v && v.readyState >= 2 && t - lastT > 90) {
        lastT = t;
        const a = analyze(v, v.videoWidth, v.videoHeight);
        const c = evaluate(a);
        drawBox(a, c === "ok");
        R.last = c; R.bright = a.brightness; R.sharp = a.sharpness;
        if (c === "ok") {
          R.good++; R.scores.push(a.faces[0].score); R.xs.push(a.faces[0].col / a.width);
        } else {
          R.good = Math.max(0, R.good - 2);
        }
        const moveRange = R.xs.length > 3 ? Math.max(...R.xs.slice(-40)) - Math.min(...R.xs.slice(-40)) : 0;
        if (R.good < 12) {
          setPhase("rostro"); setMsg(c === "ok" ? "Rostro detectado. Mantente quieto…" : CHECK_MSG[c]);
          setProgress(Math.min(50, (R.good / 12) * 50));
        } else if (moveRange < 0.07) {
          setPhase("movimiento"); setMsg(c === "ok" ? "Ahora mueve la cabeza lentamente hacia un lado y luego al otro." : CHECK_MSG[c]);
          setProgress(50 + Math.min(45, (moveRange / 0.07) * 45));
        } else {
          R.active = false;
          setProgress(100); setPhase("hecho"); setMsg("¡Listo! Detectamos tu rostro y movimiento natural.");
          onDone({
            rostroDetectado: true, metodo: "camara", cuadrosValidos: R.scores.length,
            confianzaMedia: Math.round(R.scores.reduce((x, y) => x + y, 0) / R.scores.length),
            movimiento: true, brillo: Math.round(R.bright), nitidez: Math.round(R.sharp), detector: "pico.js (en el dispositivo)",
          });
          return;
        }
        if (Date.now() - R.start > 45000) {
          R.active = false; setPhase("fallo");
          setMsg("No pudimos validar tu rostro. " + CHECK_MSG[R.last === "ok" ? "sin-rostro" : R.last]);
          return;
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  // Alternativa sin cámara: analizar una selfie
  const fromPhoto = async (file: File) => {
    setDetectorErr("");
    try {
      const classify = await loadDetector();
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const a = createAnalyzer(classify)(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      const c = evaluate(a);
      if (c === "ok" || c === "descentrado") {
        setPhase("hecho"); setProgress(100); setMsg("¡Listo! Detectamos un rostro en la foto.");
        onDone({ rostroDetectado: true, metodo: "foto", cuadrosValidos: 1, confianzaMedia: Math.round(a.faces[0].score), movimiento: false,
          brillo: Math.round(a.brightness), nitidez: Math.round(a.sharpness), detector: "pico.js (en el dispositivo)" });
      } else { setPhase("fallo"); setMsg("La foto no sirve: " + CHECK_MSG[c]); }
    } catch { setPhase("fallo"); setMsg("No pudimos leer la imagen. Intenta con otra foto."); }
  };

  const done = phase === "hecho" && !!result;
  return (
    <div className="animate-fade-up mt-7 text-center">
      <h1 className="text-[26px] font-extrabold tracking-tight">Validación facial</h1>
      <p className="text-sm text-ink-soft">Ubica tu rostro dentro del marco, con buena luz y sin gafas oscuras.</p>
      <div className="relative mx-auto mt-5 aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-[28px] bg-[#e8ebf7]">
        <video ref={video} autoPlay playsInline muted className={cx("absolute inset-0 h-full w-full -scale-x-100 object-cover", camera !== "activa" && "hidden")} />
        <canvas ref={overlay} className="absolute inset-0 h-full w-full" />
        {camera !== "activa" && <LuScanFace className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 text-brand-blue/60" strokeWidth={1} />}
        {done && <div className="absolute inset-0 flex items-center justify-center bg-ok/15"><LuCircleCheck className="h-16 w-16 rounded-full bg-white text-ok" /></div>}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/40"><div className="h-full bg-ok transition-all" style={{ width: progress + "%" }} /></div>
      </div>

      <p role="status" aria-live="polite" data-testid="face-msg" className={cx("mx-auto mt-4 min-h-10 max-w-xs text-sm font-semibold", phase === "fallo" ? "text-bad" : done ? "text-ok" : "text-ink")}>
        {detectorErr || msg || (camera === "pendiente" ? "Solicitando acceso a la cámara…" : camera === "activa" ? "Cámara lista." :
          camera === "denegada" ? "No diste permiso para usar la cámara. Actívalo en el navegador o valida con una selfie." : "No encontramos una cámara disponible. Puedes validar con una selfie.")}
      </p>

      {!done && camera === "activa" && (phase === "listo" || phase === "fallo") && (
        <Button className="mt-3 w-full" icon={LuCamera} onClick={start}>{phase === "fallo" ? "Intentar de nuevo" : "Iniciar validación"}</Button>
      )}
      {!done && (camera === "denegada" || camera === "no-disponible" || phase === "fallo") && (
        <>
          <Button variant="outline" className="mt-3 w-full" onClick={() => fileRef.current?.click()}>Validar con una selfie</Button>
          <input ref={fileRef} type="file" accept="image/*" capture="user" hidden data-testid="selfie" onChange={(e) => { const f = e.target.files?.[0]; if (f) fromPhoto(f); e.target.value = ""; }} />
        </>
      )}
      {done && <Button variant="dark" className="mt-3 w-full py-4" disabled={busy} onClick={() => onDone(result!)}>{busy ? "Guardando tu cuenta…" : "Registrarme en Conecta+PRO"}</Button>}

      <p className="mx-auto mt-4 max-w-sm text-left text-xs leading-relaxed text-ink-soft">
        La imagen se analiza solo en tu dispositivo y <b>no se guarda ni se envía</b>; solo registramos que se detectó un rostro.
        Esta validación comprueba que hay una persona frente a la cámara, pero <b>no reconoce tu identidad</b> ni la compara con tu documento.
      </p>
      <button onClick={onBack} className="mt-3 text-sm font-semibold text-ink-soft hover:text-ink">Volver a mis datos</button>
    </div>
  );
}

// ---------------------------------------------------------------------
//  ¡Hola! ¿Qué quieres hacer hoy? (selección de rol dinámico)
// ---------------------------------------------------------------------
export function RoleSelect() {
  const { account, setMode, myProvider } = useStore();
  const go = async (m: "cliente" | "proveedor") => {
    if (m === "proveedor" && !myProvider) return navigate("/mi-servicio");
    await setMode(m).catch(() => null);
    navigate("/inicio");
  };
  return (
    <AuthFrame aside={false}>
      <Logo size="md" className="justify-center" />
      <div className="mt-10 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">¡Hola{account ? `, ${account.name.split(" ")[0]}` : ""}!</h1>
        <p className="mt-2 text-xl text-ink-soft">¿Qué quieres hacer hoy en ConectaPRO?</p>
      </div>
      <div className="mt-8 space-y-4">
        <button onClick={() => go("proveedor")} className="flex w-full items-center gap-4 rounded-3xl bg-[#eaf1ff] p-4 text-left ring-1 ring-line transition hover:ring-brand/40">
          <img src="img/worker.jpg" alt="" className="h-24 w-24 rounded-2xl object-cover" />
          <div className="flex-1">
            <div className="text-lg font-extrabold">Quiero ofrecer un servicio</div>
            <p className="text-sm text-ink-soft">Regístrate para publicar tus servicios y conectar con más personas.</p>
          </div>
          <LuChevronRight className="h-9 w-9 rounded-full bg-white p-2 text-brand" />
        </button>
        <button onClick={() => go("cliente")} className="flex w-full items-center gap-4 rounded-3xl bg-[#e8f7f1] p-4 text-left ring-1 ring-line transition hover:ring-brand/40">
          <img src="img/girl.jpg" alt="" className="h-24 w-24 rounded-2xl object-cover" />
          <div className="flex-1">
            <div className="text-lg font-extrabold">Quiero pedir un servicio</div>
            <p className="text-sm text-ink-soft">Busca y contacta profesionales para lo que necesitas.</p>
          </div>
          <LuChevronRight className="h-9 w-9 rounded-full bg-white p-2 text-brand" />
        </button>
      </div>
      <p className="mt-10 text-center font-[cursive] text-xl italic text-ink/80">Conectamos personas,<br />hacemos servicios reales</p>
    </AuthFrame>
  );
}
