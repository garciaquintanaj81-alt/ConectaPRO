// =====================================================================
//  Service worker de ConectaPRO: recibe las notificaciones push aunque la
//  página esté cerrada y abre la pantalla correspondiente al tocarlas.
// =====================================================================
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data && event.data.text() }; }
  const title = d.title || "ConectaPRO";
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || "Tienes una novedad en ConectaPRO",
    icon: "img/icon-192.png",
    badge: "img/icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || "#/notificaciones" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data && event.notification.data.url || "#/notificaciones", self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.navigate ? c.navigate(url) : c.postMessage({ type: "cp-open", url }); return; }
    }
    await self.clients.openWindow(url);
  })());
});
