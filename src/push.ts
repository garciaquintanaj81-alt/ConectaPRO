// =====================================================================
//  Notificaciones web push
//  · El service worker (public/sw.js) muestra la notificación aunque la
//    página esté cerrada.
//  · Cada navegador/celular que la persona autoriza se guarda en la base de
//    datos (api_push_suscribir); el envío lo hace la función de Supabase
//    supabase/functions/enviar-push cuando se crea una notificación.
//  · Las notificaciones dentro de la app siguen funcionando siempre.
// =====================================================================
import * as api from "./api";

const cfg: { vapidPublicKey?: string } = (window as any).CONECTAPRO_CONFIG ?? {};

export type PushState = "no-soportado" | "ios-instalar" | "sin-configurar" | "bloqueado" | "inactivo" | "activo";

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;

/** Registra el service worker al abrir la app (no pide permisos) */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.register("sw.js").catch(() => null);
  // Si el service worker pide abrir una pantalla (al tocar una notificación)
  navigator.serviceWorker.addEventListener("message", (e) => { if (e.data?.type === "cp-open") location.href = e.data.url; });
}

export async function pushState(): Promise<PushState> {
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) {
    return isIOS() && !isStandalone() ? "ios-instalar" : "no-soportado";
  }
  if (!cfg.vapidPublicKey) return "sin-configurar";
  if (Notification.permission === "denied") return "bloqueado";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "activo" : "inactivo";
}

function keyToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Pide permiso, suscribe este dispositivo y lo guarda en la base de datos */
export async function enablePush(): Promise<PushState> {
  const st = await pushState();
  if (st === "no-soportado" || st === "ios-instalar" || st === "sin-configurar" || st === "bloqueado") return st;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "bloqueado" : "inactivo";
  const reg = await navigator.serviceWorker.register("sw.js");
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(cfg.vapidPublicKey!) });
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await api.rpc("api_push_suscribir", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_agente: navigator.userAgent });
  return "activo";
}

/** Deja de recibir notificaciones en este dispositivo */
export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await api.rpc("api_push_cancelar", { p_endpoint: sub.endpoint }).catch(() => null);
    await sub.unsubscribe().catch(() => null);
  }
  return "inactivo";
}
