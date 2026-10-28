// Configuración pública de ConectaPRO (Supabase).
// La clave "publishable" es pública por diseño: la seguridad está en la base de datos.
// vapidPublicKey: clave PÚBLICA para notificaciones push (la privada solo va en los secretos de Supabase).
window.CONECTAPRO_CONFIG = {
  supabaseUrl: "https://hokvruiikbqqkgavcxvj.supabase.co",
  anonKey: "sb_publishable_tnHmRlYoDAVAnpnmC8ieNA_elG_WoA2",
  vapidPublicKey: "BIdvhQqDxOfR4WPfNyAo4iUbyFCmEwfceP6Y2Njo0kVfmy4urhYOLUz9g8Z3egATFNG2WGrmI22YRAlI153KzBs",
};
