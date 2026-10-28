// =====================================================================
//  Función de Supabase (Edge Function) "enviar-push"
//  Se ejecuta cada vez que se crea una fila en la tabla "notificaciones"
//  (Database Webhook) y envía la notificación push a todos los
//  dispositivos que la persona activó.
//
//  Secretos necesarios (Edge Functions → Secrets):
//    VAPID_PUBLIC_KEY   la misma clave pública de public/config.js
//    VAPID_PRIVATE_KEY  la clave privada (nunca se publica)
//    VAPID_SUBJECT      mailto:soporte@conectapro.co
//    WEBHOOK_SECRET     texto secreto que también va en la cabecera del webhook
//  SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase automáticamente.
// =====================================================================
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:soporte@conectapro.co",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const TITULOS: Record<string, string> = {
  match: "Nueva oportunidad", message: "Nuevo mensaje", proposal: "Propuesta", agreement: "Contratación",
  rating: "Calificación", strike: "Aviso importante", info: "ConectaPRO", ia: "Recordatorio",
};

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("No autorizado", { status: 401 });
  }
  const payload = await req.json().catch(() => null);
  const n = payload?.record;
  if (!n?.perfil_id) return new Response("Sin notificación", { status: 400 });

  // Respeta la preferencia "Notificaciones push" de la persona
  const { data: perfil } = await supabase.from("perfiles").select("notif_push").eq("id", n.perfil_id).maybeSingle();
  if (perfil && perfil.notif_push === false) return Response.json({ enviados: 0, motivo: "desactivadas" });

  const { data: subs } = await supabase.from("push_suscripciones").select("id, endpoint, p256dh, auth").eq("perfil_id", n.perfil_id);
  const body = JSON.stringify({
    title: TITULOS[n.tipo] ?? "ConectaPRO",
    body: n.texto,
    url: n.enlace ? "#" + n.enlace : "#/notificaciones",
    tag: n.id,
  });
  let enviados = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 86400, urgency: "high" });
      enviados++;
    } catch (e) {
      // 404/410: el dispositivo ya no existe o retiró el permiso → se borra la suscripción
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await supabase.from("push_suscripciones").delete().eq("id", s.id);
    }
  }));
  return Response.json({ enviados });
});
