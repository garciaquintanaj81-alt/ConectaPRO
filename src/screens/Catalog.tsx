// =====================================================================
//  Catálogo del proveedor: crear, editar y eliminar servicios con fotos,
//  precios o rangos de precios y condiciones. Las fotos se guardan en
//  Supabase Storage (carpeta del usuario).
// =====================================================================
import { useEffect, useRef, useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuImagePlus, LuX, LuEyeOff, LuStore, LuLayoutGrid } from "react-icons/lu";
import { AppShell } from "../Layout";
import { useBusy, useStore } from "../store";
import { navigate } from "../router";
import { Badge, Button, Empty, Modal, MoneyInput, PageHeader, Toggle, cx } from "../ui";
import { CATEGORIES, CatalogItem, SERVICES, money, serviceById } from "../data";
import { photoSrc } from "../api";

type Draft = { id?: string; service: string; title: string; description: string; priceMin: number | null; priceMax: number | null; conditions: string; active: boolean; photos: (string | Blob)[] };
const empty = (service = ""): Draft => ({ service, title: "", description: "", priceMin: null, priceMax: null, conditions: "", active: true, photos: [] });

/** Reduce una imagen a JPEG (lado mayor = max px) antes de subirla */
function toJpeg(file: File, max = 1024): Promise<Blob> {
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

function Thumb({ src }: { src: string | Blob }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (typeof src === "string") { setUrl(photoSrc(src.startsWith("img/") || src.startsWith("sb:") ? src : "sb:fotos-perfil/" + src)!); return; }
    const u = URL.createObjectURL(src); setUrl(u); return () => URL.revokeObjectURL(u);
  }, [src]);
  return url ? <img src={url} alt="" className="aspect-square w-full rounded-xl object-cover" /> : <div className="aspect-square w-full rounded-xl bg-surface" />;
}

export function MyCatalog() {
  const { myProvider, saveCatalogItem, deleteCatalogItem, toast } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<CatalogItem | null>(null);
  const [busy, wrap] = useBusy();
  if (!myProvider) return (
    <AppShell><Empty icon={LuStore} title="Configura tu perfil de proveedor" text="Primero registra tu negocio para poder crear tu catálogo de servicios." action={<Button onClick={() => navigate("/mi-servicio")}>Configurar ahora</Button>} /></AppShell>
  );
  const items = myProvider.catalog ?? [];
  const edit = (it: CatalogItem) => setDraft({ id: it.id, service: it.service, title: it.title, description: it.description, priceMin: it.priceMin, priceMax: it.priceMax, conditions: it.conditions, active: it.active, photos: it.photos.map((f) => f.replace(/^sb:fotos-perfil\//, "")) });

  return (
    <AppShell>
      <PageHeader title="Mi catálogo" back="/perfil" sub="Los servicios que ofreces, con fotos, precios y condiciones" />
      <div className="mb-4 flex justify-end"><Button icon={LuPlus} onClick={() => setDraft(empty(myProvider.services[0] ?? ""))}>Nuevo servicio</Button></div>
      {items.length === 0 ? (
        <Empty icon={LuLayoutGrid} title="Tu catálogo está vacío" text="Agrega los servicios que ofreces para que los clientes conozcan tu trabajo, tus precios y tus condiciones." action={<Button icon={LuPlus} onClick={() => setDraft(empty(myProvider.services[0] ?? ""))}>Agregar mi primer servicio</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="catalogo">
          {items.map((it) => (
            <div key={it.id} className={cx("card flex gap-4 p-4", !it.active && "opacity-70")}>
              <div className="w-28 shrink-0">{it.photos[0] ? <Thumb src={it.photos[0]} /> : <div className="flex aspect-square items-center justify-center rounded-xl bg-surface text-ink-soft"><LuImagePlus className="h-7 w-7" /></div>}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-extrabold">{it.title}{!it.active && <Badge tone="soft" icon={LuEyeOff} className="px-2 py-0.5 text-[11px]">Pausado</Badge>}</div>
                <div className="text-xs text-ink-soft">{serviceById(it.service).name}</div>
                <div className="mt-1 text-sm font-bold text-brand">{it.priceMin != null ? (it.priceMax != null && it.priceMax !== it.priceMin ? `${money(it.priceMin)} – ${money(it.priceMax)}` : money(it.priceMin)) : "Precio a convenir"}</div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{it.description}</p>
                <div className="mt-2 flex gap-2">
                  <Button variant="soft" icon={LuPencil} className="px-3 py-2 text-sm" onClick={() => edit(it)}>Editar</Button>
                  <Button variant="ghost" icon={LuTrash2} className="px-3 py-2 text-sm text-bad" onClick={() => setDel(it)}>Eliminar</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {draft && <ItemForm draft={draft} onClose={() => setDraft(null)} onSave={async (d) => { await saveCatalogItem(d); toast(d.id ? "Servicio actualizado" : "Servicio agregado al catálogo"); setDraft(null); }} />}
      <Modal open={!!del} onClose={() => setDel(null)} title="¿Eliminar este servicio?">
        <p className="text-ink-soft">“{del?.title}” y sus fotos se borrarán de tu catálogo.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setDel(null)}>Cancelar</Button>
          <Button variant="danger" disabled={busy} onClick={() => wrap(async () => { await deleteCatalogItem(del!.id); toast("Servicio eliminado"); setDel(null); })}>Eliminar</Button>
        </div>
      </Modal>
    </AppShell>
  );
}

function ItemForm({ draft, onClose, onSave }: { draft: Draft; onClose: () => void; onSave: (d: Draft) => Promise<void> }) {
  const [d, setD] = useState<Draft>(draft);
  const [err, setErr] = useState("");
  const [busy, wrap] = useBusy();
  const file = useRef<HTMLInputElement>(null);
  const cls = "mt-1 w-full rounded-2xl bg-surface px-4 py-3 font-normal outline-none ring-1 ring-line focus:ring-2 focus:ring-brand/50";
  const save = () => wrap(async () => {
    if (d.title.trim().length < 3) return setErr("Escribe el nombre del servicio");
    if (!d.service) return setErr("Elige la subcategoría");
    if (d.priceMin != null && d.priceMax != null && d.priceMax < d.priceMin) return setErr("El precio máximo debe ser mayor o igual al mínimo");
    setErr("");
    await onSave(d);
  });
  return (
    <Modal open onClose={onClose} title={d.id ? "Editar servicio" : "Nuevo servicio"}>
      <div className="space-y-3">
        <label className="block text-sm font-semibold">Nombre del servicio
          <input name="titulo" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} maxLength={80} placeholder="Ej. Desayuno sorpresa premium" className={cls} />
        </label>
        <label className="block text-sm font-semibold">Subcategoría
          <select name="subcategoria" value={d.service} onChange={(e) => setD({ ...d, service: e.target.value })} className={cls}>
            <option value="">Elige la subcategoría</option>
            {CATEGORIES.map((c) => <optgroup key={c.id} label={c.name}>{SERVICES.filter((x) => x.category === c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Descripción
          <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} maxLength={600} placeholder="Qué incluye, materiales, tiempos…" className={cx(cls, "h-24 resize-none")} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Precio desde<MoneyInput className="mt-1" value={d.priceMin} onChange={(v) => setD({ ...d, priceMin: v })} placeholder="Opcional" ariaLabel="Precio desde" /></label>
          <label className="block text-sm font-semibold">Precio hasta<MoneyInput className="mt-1" value={d.priceMax} onChange={(v) => setD({ ...d, priceMax: v })} placeholder="Opcional" ariaLabel="Precio hasta" /></label>
        </div>
        <label className="block text-sm font-semibold">Condiciones
          <textarea value={d.conditions} onChange={(e) => setD({ ...d, conditions: e.target.value })} maxLength={600} placeholder="Ej. Pedido con 1 día de anticipación. Abono del 50 %." className={cx(cls, "h-20 resize-none")} />
        </label>
        <div>
          <div className="text-sm font-semibold">Fotos ({d.photos.length}/6)</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {d.photos.map((f, i) => (
              <div key={i} className="relative">
                <Thumb src={f} />
                <button type="button" onClick={() => setD({ ...d, photos: d.photos.filter((_, k) => k !== i) })} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-bad shadow" aria-label="Quitar foto"><LuX className="h-4 w-4" /></button>
              </div>
            ))}
            {d.photos.length < 6 && (
              <button type="button" onClick={() => file.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand/40 text-xs font-semibold text-brand hover:bg-brand-50">
                <LuImagePlus className="h-6 w-6" />Agregar
              </button>
            )}
          </div>
          <input ref={file} type="file" accept="image/*" multiple hidden data-testid="catalogo-fotos" onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 6 - d.photos.length);
            e.target.value = "";
            try { const blobs = await Promise.all(files.map((f) => toJpeg(f))); setD((x) => ({ ...x, photos: [...x.photos, ...blobs] })); }
            catch (er: any) { setErr(er.message); }
          }} />
        </div>
        <div className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-line">
          <div className="flex-1"><div className="text-sm font-semibold">Visible para los clientes</div><div className="text-xs text-ink-soft">Si lo desactivas, el servicio queda pausado.</div></div>
          <Toggle on={d.active} onChange={(v) => setD({ ...d, active: v })} label="Visible" />
        </div>
      </div>
      {err && <p className="mt-3 rounded-xl bg-bad-50 px-3 py-2 text-sm font-medium text-bad">{err}</p>}
      <Button className="mt-4 w-full" disabled={busy} onClick={save}>{busy ? "Guardando…" : "Guardar servicio"}</Button>
    </Modal>
  );
}
