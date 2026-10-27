// =====================================================================
//  Términos y condiciones, condiciones de uso y aviso de privacidad
//  · /legal       lectura pública (sin cuenta)
//  · TermsGate    pantalla de aceptación para cuentas que aún no aceptan
//                 la versión vigente (se registra versión y fecha)
//  · LegalConsent casillas del registro (sin marcar por defecto)
//  · /pruebas     acceso a las 4 cuentas de prueba (QA)
// =====================================================================
import { useEffect, useState } from "react";
import { LuFileText, LuShieldCheck, LuScale, LuLogOut, LuFlaskConical, LuArrowLeft, LuCircleCheck, LuInfo } from "react-icons/lu";
import { LEGAL_DOCS, LegalDoc, TERMS_DATE, TERMS_VERSION } from "../legal";
import { useStore } from "../store";
import { navigate, goBack } from "../router";
import { Avatar, Button, Logo, Modal, TestBadge, cx } from "../ui";
import { rpc } from "../api";

const DOC_ICON = { terminos: LuScale, uso: LuFileText, privacidad: LuShieldCheck };

function DocBody({ doc }: { doc: LegalDoc }) {
  return (
    <article className="space-y-5 text-[15px] leading-relaxed text-ink-soft">
      <p className="text-ink">{doc.intro}</p>
      {doc.sections.map((s) => (
        <section key={s.h}>
          <h3 className="font-bold text-ink">{s.h}</h3>
          {s.p.map((t, i) => <p key={i} className="mt-1.5">{t}</p>)}
        </section>
      ))}
      <p className="text-xs">Versión {TERMS_VERSION} · vigente desde el {TERMS_DATE}.</p>
    </article>
  );
}

function DocTabs({ tab, setTab }: { tab: LegalDoc["id"]; setTab: (t: LegalDoc["id"]) => void }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" role="tablist">
      {LEGAL_DOCS.map((d) => {
        const I = DOC_ICON[d.id];
        return (
          <button key={d.id} role="tab" aria-selected={tab === d.id} onClick={() => setTab(d.id)}
            className={cx("inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition", tab === d.id ? "bg-brand text-white" : "bg-white ring-1 ring-line hover:ring-brand/40")}>
            <I className="h-4 w-4" />{d.title}
          </button>
        );
      })}
    </div>
  );
}

/** Página pública para leer los documentos legales */
export function LegalPage() {
  const initial = (new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("doc") as LegalDoc["id"]) || "terminos";
  const [tab, setTab] = useState<LegalDoc["id"]>(LEGAL_DOCS.some((d) => d.id === initial) ? initial : "terminos");
  const doc = LEGAL_DOCS.find((d) => d.id === tab)!;
  return (
    <div className="min-h-screen bg-surface px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack("/")} className="rounded-full p-2 hover:bg-white" aria-label="Volver"><LuArrowLeft className="h-6 w-6" /></button>
          <Logo size="sm" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Términos, condiciones y privacidad</h1>
        <div className="mt-4"><DocTabs tab={tab} setTab={setTab} /></div>
        <div className="card mt-4 p-6"><h2 className="mb-4 text-xl font-extrabold">{doc.title}</h2><DocBody doc={doc} /></div>
      </div>
    </div>
  );
}

/** Modal para leer un documento sin salir del formulario */
export function LegalModal({ open, onClose, initial = "terminos" }: { open: boolean; onClose: () => void; initial?: LegalDoc["id"] }) {
  const [tab, setTab] = useState<LegalDoc["id"]>(initial);
  useEffect(() => { if (open) setTab(initial); }, [open, initial]);
  const doc = LEGAL_DOCS.find((d) => d.id === tab)!;
  return (
    <Modal open={open} onClose={onClose} title="Términos, condiciones y privacidad">
      <DocTabs tab={tab} setTab={setTab} />
      <div className="mt-4"><DocBody doc={doc} /></div>
      <Button className="mt-6 w-full" onClick={onClose}>Cerrar</Button>
    </Modal>
  );
}

/** Casillas de aceptación (nunca vienen marcadas) */
export function LegalConsent({ value, onChange, error }: { value: { terms: boolean; privacy: boolean }; onChange: (v: { terms: boolean; privacy: boolean }) => void; error?: string }) {
  const [open, setOpen] = useState<LegalDoc["id"] | null>(null);
  const link = (id: LegalDoc["id"], label: string) => (
    <button type="button" onClick={(e) => { e.preventDefault(); setOpen(id); }} className="font-semibold text-brand underline underline-offset-2">{label}</button>
  );
  return (
    <div className={cx("space-y-3 rounded-2xl bg-white p-4 text-left text-sm ring-1", error ? "ring-2 ring-bad/50" : "ring-line")}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="acepto_terminos" checked={value.terms} onChange={(e) => onChange({ ...value, terms: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
        <span className="text-ink-soft">He leído y acepto los {link("terminos", "Términos y condiciones")} y las {link("uso", "Condiciones de uso")}.</span>
      </label>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="autorizo_datos" checked={value.privacy} onChange={(e) => onChange({ ...value, privacy: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
        <span className="text-ink-soft">Autorizo el tratamiento de mis datos personales según el {link("privacidad", "Aviso de privacidad")} (Ley 1581 de 2012).</span>
      </label>
      <p className="text-xs text-ink-soft">Aceptar no implica renunciar a tus derechos como consumidor ni como titular de datos personales.</p>
      {error && <p className="text-xs font-semibold text-bad">{error}</p>}
      <LegalModal open={!!open} onClose={() => setOpen(null)} initial={open ?? "terminos"} />
    </div>
  );
}

/** Pantalla que aparece cuando la cuenta no ha aceptado la versión vigente */
export function TermsGate() {
  const { acceptTerms, logout, account } = useStore();
  const [tab, setTab] = useState<LegalDoc["id"]>("terminos");
  const [ok, setOk] = useState({ terms: false, privacy: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const doc = LEGAL_DOCS.find((d) => d.id === tab)!;
  const accept = async () => {
    if (!ok.terms || !ok.privacy) { setErr("Marca las dos casillas para continuar"); return; }
    setBusy(true); setErr("");
    try { await acceptTerms(); navigate("/inicio", true); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-surface px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Logo size="sm" />
        <div className="mt-6 flex items-start gap-3">
          <LuInfo className="mt-1 h-6 w-6 shrink-0 text-brand" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Antes de continuar{account ? `, ${account.name.split(" ")[0]}` : ""}</h1>
            <p className="mt-1 text-ink-soft">Lee los términos y condiciones, las condiciones de uso y el aviso de privacidad de ConectaPRO (versión del {TERMS_DATE}). Debes aceptarlos para publicar, postularte, contratar o enviar mensajes.</p>
          </div>
        </div>
        <div className="mt-5"><DocTabs tab={tab} setTab={setTab} /></div>
        <div className="card mt-4 max-h-[46vh] overflow-y-auto p-6" tabIndex={0} aria-label={doc.title}><h2 className="mb-4 text-xl font-extrabold">{doc.title}</h2><DocBody doc={doc} /></div>
        <div className="mt-4"><LegalConsent value={ok} onChange={(v) => { setOk(v); setErr(""); }} error={err} /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Button icon={LuCircleCheck} disabled={busy} onClick={accept} className="py-4">{busy ? "Guardando…" : "Aceptar y continuar"}</Button>
          <Button variant="outline" icon={LuLogOut} onClick={() => logout().then(() => navigate("/", true))}>Ahora no, cerrar sesión</Button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-soft">Registraremos la versión aceptada y la fecha. Puedes volver a leer estos documentos en Mi perfil → Seguridad y privacidad.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Cuentas de prueba (QA): escenario "desayuno sorpresa"
// ---------------------------------------------------------------------
export function TestAccounts() {
  const { loginTest, session, logout, account } = useStore();
  const [list, setList] = useState<{ email: string; name: string; role: string; city: string }[] | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { rpc("api_cuentas_prueba").then(setList).catch((e) => { setErr(e.message); setList([]); }); }, []);
  const go = async (email: string) => {
    setBusy(email); setErr("");
    try {
      if (session) await logout();
      await loginTest(email);
      navigate("/inicio", true);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(""); }
  };
  return (
    <div className="min-h-screen bg-surface px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack("/")} className="rounded-full p-2 hover:bg-white" aria-label="Volver"><LuArrowLeft className="h-6 w-6" /></button>
          <Logo size="sm" />
        </div>
        <div className="mt-6 flex items-center gap-2"><LuFlaskConical className="h-7 w-7 text-[#b45309]" /><h1 className="text-3xl font-extrabold tracking-tight">Cuentas de prueba</h1></div>
        <p className="mt-2 text-ink-soft">Escenario: una persona publica que necesita un <b className="text-ink">desayuno sorpresa</b> y tres proveedores se postulan con su propuesta y precio. Todo se guarda en la base de datos y <b className="text-ink">nadie responde automáticamente</b>: cada paso lo haces tú ingresando a cada cuenta (puedes usar varias pestañas o navegadores).</p>
        <div className="mt-4 rounded-2xl bg-[#fff4dc] p-4 text-sm text-[#7a4a00]">Estas cuentas solo se ven entre ellas: los usuarios reales nunca las ven y siempre llevan la etiqueta <TestBadge className="align-middle" />. Contraseña de las cuatro: <b>Prueba2026*</b></div>
        {account && <p className="mt-4 text-sm text-ink-soft">Sesión actual: <b className="text-ink">{account.name}</b>. Al elegir otra cuenta se cerrará esta sesión.</p>}
        {err && <p className="mt-4 rounded-xl bg-bad-50 px-4 py-3 text-sm font-medium text-bad">{err}</p>}
        <div className="mt-5 space-y-3">
          {list === null && [0, 1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse" />)}
          {list?.map((a, i) => (
            <button key={a.email} disabled={!!busy} onClick={() => go(a.email)} className="card flex w-full items-center gap-4 p-4 text-left transition hover:ring-brand/40 disabled:opacity-60">
              <Avatar name={a.name} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-extrabold">{a.name}<TestBadge /></div>
                <div className="truncate text-sm text-ink-soft">{a.role} · {a.city}</div>
                <div className="truncate text-xs text-ink-soft">{a.email}</div>
              </div>
              <span className="text-sm font-bold text-brand">{busy === a.email ? "Ingresando…" : i === 0 ? "Paso 1" : "Ingresar"}</span>
            </button>
          ))}
          {list?.length === 0 && !err && <p className="card p-5 text-center text-ink-soft">Aún no se han creado las cuentas de prueba en la base de datos (ejecuta supabase/instalar.sql).</p>}
        </div>
        <ol className="card mt-6 list-decimal space-y-2 p-5 pl-10 text-sm text-ink-soft">
          <li><b className="text-ink">Cliente Prueba</b> acepta los términos y publica la necesidad: sector <i>Eventos</i> → <i>Desayunos y detalles sorpresa</i>, en Cúcuta.</li>
          <li>Cada <b className="text-ink">Proveedor Prueba</b> ve la oportunidad, escribe su precio y se postula.</li>
          <li><b className="text-ink">Cliente Prueba</b> abre la solicitud, compara las tres ofertas y contrata una.</li>
          <li>Para repetir la prueba: Mi perfil → Seguridad y privacidad → <i>Reiniciar escenario de prueba</i>.</li>
        </ol>
      </div>
    </div>
  );
}
