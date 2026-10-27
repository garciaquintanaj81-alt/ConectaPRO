// =====================================================================
//  Términos y condiciones, condiciones de uso y aviso de privacidad.
//  Si cambias el texto, cambia también TERMS_VERSION y el valor
//  'terminos_version' en supabase/schema.sql: todas las cuentas deberán
//  aceptar la nueva versión antes de seguir usando las funciones que la requieren.
// =====================================================================

export const TERMS_VERSION = "2026-10-26";
export const TERMS_DATE = "26 de octubre de 2026";

export interface LegalDoc { id: "terminos" | "uso" | "privacidad"; title: string; intro: string; sections: { h: string; p: string[] }[] }

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: "terminos",
    title: "Términos y condiciones",
    intro: "Estas reglas explican qué es ConectaPRO, qué puedes esperar de la plataforma y qué se espera de ti. Léelas antes de crear tu cuenta.",
    sections: [
      { h: "1. Quiénes somos", p: [
        "ConectaPRO es un proyecto de Ingeniería de Sistemas de la Universidad de Santander (UDES), Cúcuta, desarrollado por Julieth A. García Quintana y Daniela S. Junco Salazar. Es una plataforma en etapa de prototipo.",
        "Puedes escribirnos a soporte@conectapro.co para cualquier pregunta, queja o solicitud.",
      ] },
      { h: "2. Qué hace ConectaPRO", p: [
        "ConectaPRO conecta a personas que necesitan un servicio (clientes) con personas o empresas que lo ofrecen (proveedores). Permite publicar necesidades, recibir postulaciones con precio, firmar un acuerdo digital, conversar y calificarse mutuamente.",
        "ConectaPRO no presta directamente los servicios publicados ni es empleador de los proveedores. El servicio se acuerda entre el cliente y el proveedor.",
        "Actualmente ConectaPRO no procesa pagos: el pago se hace directamente entre las partes con el método acordado.",
      ] },
      { h: "3. Tu cuenta", p: [
        "Debes ser mayor de 18 años y registrar datos verdaderos. Cada persona puede tener una sola cuenta y es responsable de cuidar su contraseña.",
        "La misma cuenta puede usarse como cliente y como proveedor.",
        "Puedes eliminar tu cuenta cuando quieras desde Mi perfil → Seguridad y privacidad.",
      ] },
      { h: "4. Acuerdos digitales", p: [
        "Cuando un cliente elige una postulación se genera un acuerdo digital con código, servicio, fecha, hora, precio y método de pago. El acuerdo queda guardado como mensaje de datos y sirve como constancia de lo pactado entre las partes.",
        "Si el proveedor se retrasa, el cliente puede darle hasta 2 días adicionales o cancelar sin penalidad si el servicio es urgente.",
      ] },
      { h: "5. Calificaciones y faltas graves", p: [
        "Al terminar un servicio, cliente y proveedor pueden calificarse. Las calificaciones deben corresponder a experiencias reales.",
        "No realizar un trabajo acordado (proveedor) o cancelar sin justificación un acuerdo confirmado (cliente) se registra como falta grave. Al acumular 3 faltas graves la cuenta se suspende. Puedes pedir la revisión de una falta escribiendo a soporte.",
      ] },
      { h: "6. Responsabilidad", p: [
        "ConectaPRO verifica que al registrarte haya una persona frente a la cámara, pero no comprueba tu identidad contra documentos oficiales ni la calidad de los servicios. Te recomendamos revisar el perfil, las calificaciones y conversar antes de contratar.",
        "Nada de lo dispuesto en estos términos limita los derechos que te reconoce la ley colombiana, en particular el Estatuto del Consumidor (Ley 1480 de 2011) y la Ley de Protección de Datos Personales (Ley 1581 de 2012). Aceptar estos términos no significa renunciar a ninguno de tus derechos.",
      ] },
      { h: "7. Cambios en los términos", p: [
        "Si estos términos cambian te lo informaremos dentro de la plataforma y te pediremos aceptar la nueva versión antes de seguir usando las funciones que la requieren. Si no estás de acuerdo puedes dejar de usar ConectaPRO y eliminar tu cuenta.",
        "Estos términos se rigen por las leyes de la República de Colombia.",
      ] },
    ],
  },
  {
    id: "uso",
    title: "Condiciones de uso",
    intro: "Reglas de convivencia para que la comunidad sea segura y confiable.",
    sections: [
      { h: "Publica información real", p: [
        "Describe tus necesidades y servicios de forma clara y honesta, con precios reales. No publiques servicios que no puedes prestar.",
      ] },
      { h: "Está prohibido", p: [
        "Ofrecer o solicitar actividades ilegales, armas, sustancias prohibidas o servicios sexuales.",
        "Suplantar a otra persona, crear cuentas falsas o publicar calificaciones que no correspondan a un servicio real.",
        "Acosar, insultar o discriminar a otras personas, o compartir sus datos sin autorización.",
        "Usar la información de otros usuarios para fines distintos a acordar el servicio.",
      ] },
      { h: "Seguridad", p: [
        "Conversa por el chat de ConectaPRO antes de compartir datos personales. Nunca compartas contraseñas ni números completos de tarjetas.",
        "Si algo te parece sospechoso, escríbenos a soporte@conectapro.co.",
      ] },
      { h: "Consecuencias", p: [
        "Podemos ocultar publicaciones o suspender cuentas que incumplan estas condiciones. Te informaremos el motivo y podrás pedir una revisión.",
      ] },
    ],
  },
  {
    id: "privacidad",
    title: "Aviso de privacidad",
    intro: "Cómo tratamos tus datos personales, conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.",
    sections: [
      { h: "Responsable", p: [
        "Equipo del proyecto ConectaPRO (UDES, Cúcuta). Contacto: soporte@conectapro.co.",
      ] },
      { h: "Qué datos recogemos", p: [
        "Identificación y contacto: nombre, número de documento, correo electrónico y celular.",
        "Ubicación administrativa: departamento, municipio y la dirección donde se prestará cada servicio.",
        "Ubicación del dispositivo: solo si la autorizas en tu navegador, para calcular qué proveedores o servicios están cerca.",
        "Foto de perfil (opcional), información de tus solicitudes, postulaciones, acuerdos, mensajes y calificaciones.",
        "Resultado de la validación facial (si se detectó un rostro, brillo y nitidez). La imagen de la cámara se analiza solo en tu dispositivo y nunca se envía ni se guarda.",
      ] },
      { h: "Para qué los usamos", p: [
        "Crear y administrar tu cuenta, conectar solicitudes con proveedores compatibles según categoría, distancia y horario, generar acuerdos digitales, permitir la mensajería y las calificaciones, enviarte notificaciones sobre tus servicios y atender tus solicitudes.",
      ] },
      { h: "Tu ubicación", p: [
        "La ubicación del dispositivo solo se usa cuando tú lo autorizas y puedes elegir manualmente otra ciudad en cualquier momento.",
        "La ubicación que usas para buscar no se guarda. En una solicitud solo se guarda el punto GPS si tú eliges usarlo.",
        "Los demás usuarios nunca ven tu ubicación exacta sin tu autorización: los proveedores ven el municipio y una zona aproximada; la dirección exacta solo la ve el proveedor que contrates. Si eres proveedor, tu punto exacto solo se muestra si activas esa opción.",
      ] },
      { h: "Tu foto de perfil", p: [
        "Se guarda en un servicio de almacenamiento de archivos asociado a tu cuenta. Puedes elegir si la ven todos los usuarios o solo las personas con las que tienes una conversación, postulación o acuerdo, y puedes cambiarla o eliminarla cuando quieras.",
      ] },
      { h: "Con quién compartimos datos", p: [
        "No vendemos tus datos. Usamos Supabase (base de datos, autenticación y almacenamiento) y GitHub Pages (publicación de la aplicación) como proveedores tecnológicos; sus servidores pueden estar fuera de Colombia.",
        "Los otros usuarios ven solo lo necesario para acordar un servicio: nombre, foto según tu configuración, calificación y municipio.",
      ] },
      { h: "Tus derechos", p: [
        "Puedes conocer, actualizar, rectificar y suprimir tus datos, solicitar prueba de esta autorización, revocarla y presentar quejas ante la Superintendencia de Industria y Comercio. La mayoría de datos los puedes editar o eliminar desde tu perfil; para lo demás escribe a soporte@conectapro.co.",
        "Responder preguntas sobre datos sensibles (como la validación facial) es facultativo.",
      ] },
      { h: "Conservación y vigencia", p: [
        "Conservamos tus datos mientras tengas una cuenta activa. Al eliminar tu cuenta se borran tu perfil, solicitudes, mensajes y demás información asociada.",
        "Este aviso rige desde la fecha de su versión y podrá actualizarse; te avisaremos y pediremos tu aceptación cuando cambie.",
      ] },
    ],
  },
];
