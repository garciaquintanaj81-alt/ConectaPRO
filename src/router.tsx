// Enrutador mínimo basado en el "hash" de la URL (#/ruta).
// Funciona en GitHub Pages sin configuración extra del servidor.
import { useEffect, useState } from "react";

const current = () => (window.location.hash.replace(/^#/, "") || "/").split("?")[0];

export function useRoute() {
  const [path, setPath] = useState(current());
  useEffect(() => {
    const on = () => {
      setPath(current());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return path;
}

export function navigate(to: string, replace = false) {
  const url = "#" + to;
  if (replace) {
    history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = to;
  }
}

/** Vuelve a la pantalla anterior; si no hay historial, va a la ruta indicada */
export function goBack(fallback = "/inicio") {
  if (history.length > 1 && document.referrer !== undefined && sessionStorage.getItem("cp-nav") === "1") history.back();
  else navigate(fallback);
}

// Marca que ya hubo navegación interna (para saber si "atrás" es seguro)
window.addEventListener("hashchange", () => sessionStorage.setItem("cp-nav", "1"));

/** Compara una ruta con un patrón tipo "/proveedor/:id" y devuelve los parámetros */
export function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function Link({ to, className, children, onClick }: { to: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <a href={"#" + to} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
