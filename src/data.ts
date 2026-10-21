// =====================================================================
//  Datos simulados de ConectaPRO
//  (en la fase final se reemplazan por la base de datos PostgreSQL)
// =====================================================================

export type PaymentMethod = "efectivo" | "nequi" | "transferencia" | "tarjeta";

export const PAYMENTS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi / Daviplata",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export type CategoryId =
  | "hogar" | "tecnologia" | "construccion" | "belleza"
  | "transporte" | "salud" | "mascotas" | "mas";

export const CATEGORIES: { id: CategoryId; name: string; tint: string }[] = [
  { id: "hogar", name: "Hogar", tint: "bg-[#eef0ff] text-brand" },
  { id: "tecnologia", name: "Tecnología", tint: "bg-[#e8f0ff] text-brand-blue" },
  { id: "construccion", name: "Construcción", tint: "bg-[#f1ecff] text-brand-violet" },
  { id: "belleza", name: "Belleza", tint: "bg-[#f4eeff] text-[#8b2cf0]" },
  { id: "transporte", name: "Transporte", tint: "bg-[#e7f3ff] text-brand-blue" },
  { id: "salud", name: "Salud", tint: "bg-[#fdeef3] text-[#e7336b]" },
  { id: "mascotas", name: "Mascotas", tint: "bg-[#e6f3ff] text-brand-blue" },
  { id: "mas", name: "Más", tint: "bg-[#eef0ff] text-brand" },
];

export type ServiceId =
  | "plomeria" | "electricidad" | "aire" | "pintura" | "albanileria" | "limpieza"
  | "computadores" | "celulares" | "peluqueria" | "manicure" | "mudanzas"
  | "conductor" | "enfermeria" | "paseo" | "veterinaria";

export const SERVICES: { id: ServiceId; name: string; short: string; category: CategoryId; photo?: string }[] = [
  { id: "plomeria", name: "Plomería", short: "Plomería", category: "hogar", photo: "img/plomeria.jpg" },
  { id: "electricidad", name: "Electricidad", short: "Electricidad", category: "hogar", photo: "img/electricidad.jpg" },
  { id: "aire", name: "Aire acondicionado", short: "Aire acond.", category: "hogar", photo: "img/aire.jpg" },
  { id: "pintura", name: "Pintura", short: "Pintura", category: "construccion", photo: "img/pintura.jpg" },
  { id: "limpieza", name: "Limpieza del hogar", short: "Limpieza", category: "hogar" },
  { id: "albanileria", name: "Albañilería", short: "Albañilería", category: "construccion" },
  { id: "computadores", name: "Reparación de computadores", short: "Computadores", category: "tecnologia" },
  { id: "celulares", name: "Reparación de celulares", short: "Celulares", category: "tecnologia" },
  { id: "peluqueria", name: "Corte de cabello", short: "Peluquería", category: "belleza" },
  { id: "manicure", name: "Manicure y pedicure", short: "Manicure", category: "belleza" },
  { id: "mudanzas", name: "Mudanzas y fletes", short: "Mudanzas", category: "transporte" },
  { id: "conductor", name: "Conductor elegido", short: "Conductor", category: "transporte" },
  { id: "enfermeria", name: "Cuidado y enfermería", short: "Enfermería", category: "salud" },
  { id: "paseo", name: "Paseo de perros", short: "Paseo perros", category: "mascotas" },
  { id: "veterinaria", name: "Veterinaria a domicilio", short: "Veterinaria", category: "mascotas" },
];

export const serviceById = (id: ServiceId) => SERVICES.find((s) => s.id === id)!;

// ---------------------------------------------------------------------
//  Ubicación base (Rionegro, Antioquia — igual que en los mockups)
// ---------------------------------------------------------------------
export const BASE = { lat: 6.1551, lng: -75.3737, label: "Rionegro, Antioquia" };
/** Desplaza la ubicación base X km al este y Y km al norte */
const at = (eastKm: number, northKm: number) => ({
  lat: BASE.lat + northKm / 110.574,
  lng: BASE.lng + eastKm / (111.32 * Math.cos((BASE.lat * Math.PI) / 180)),
});

export const CITIES = [
  "Rionegro, Antioquia", "Medellín, Antioquia", "Cúcuta, Norte de Santander",
  "Bucaramanga, Santander", "Bogotá D.C.", "Cali, Valle del Cauca", "Barranquilla, Atlántico",
];

// ---------------------------------------------------------------------
//  Proveedores
// ---------------------------------------------------------------------
export interface Schedule { days: number[]; from: number; to: number } // días 0=Dom..6=Sáb, horas 24h
export interface Provider {
  id: string;
  name: string;
  photo?: string;
  company: string;
  profession: string;
  services: ServiceId[];
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  city: string;
  coverageKm: number;
  schedule: Schedule;
  priceMin: number;
  priceMax: number;
  verified: boolean;
  about: string;
  offers: string[];
  portfolio: string[];
  phone: string;
  completed: number;
}

const LUN_SAB = [1, 2, 3, 4, 5, 6];
const LUN_VIE = [1, 2, 3, 4, 5];
const TODOS = [0, 1, 2, 3, 4, 5, 6];

export const PROVIDERS: Provider[] = [
  {
    id: "p1", name: "Carlos Ramírez", photo: "img/carlos.jpg", company: "Ramírez Plomería",
    profession: "Técnico en plomería", services: ["plomeria"], rating: 4.8, reviews: 32,
    ...at(0.8, 0.9), city: "Rionegro, Antioquia", coverageKm: 20, schedule: { days: LUN_SAB, from: 7, to: 18 },
    priceMin: 50000, priceMax: 80000, verified: true,
    about: "Más de 5 años de experiencia en servicios de plomería residencial y comercial.",
    offers: ["Instalación y reparación de tuberías", "Destapado de cañerías", "Instalación de grifería", "Mantenimiento general"],
    portfolio: ["img/port1.jpg", "img/port2.jpg", "img/port3.jpg"], phone: "300 123 4567", completed: 28,
  },
  {
    id: "p2", name: "Andrés Torres", photo: "img/andres.jpg", company: "Torres Soluciones",
    profession: "Plomero y electricista", services: ["plomeria", "electricidad"], rating: 4.7, reviews: 28,
    ...at(-1.6, 1.4), city: "Rionegro, Antioquia", coverageKm: 15, schedule: { days: TODOS, from: 6, to: 21 },
    priceMin: 40000, priceMax: 70000, verified: true,
    about: "Electricista certificado RETIE y plomero. Atiendo urgencias todos los días.",
    offers: ["Instalación de lámparas", "Revisión de redes eléctricas", "Reparación de fugas", "Cambio de breakers"],
    portfolio: ["img/sol2.jpg", "img/electricidad.jpg", "img/port2.jpg"], phone: "301 555 0101", completed: 41,
  },
  {
    id: "p3", name: "Luis Gómez", photo: "img/luis.jpg", company: "LG Mantenimientos",
    profession: "Maestro de obra", services: ["plomeria", "pintura"], rating: 4.6, reviews: 15,
    ...at(2.4, -1.8), city: "Rionegro, Antioquia", coverageKm: 12, schedule: { days: LUN_SAB, from: 13, to: 22 },
    priceMin: 60000, priceMax: 90000, verified: true,
    about: "Pintura, acabados y plomería. Trabajo limpio y garantizado.",
    offers: ["Pintura de interiores", "Estuco y acabados", "Reparación de tuberías"],
    portfolio: ["img/pintura.jpg", "img/sol3.jpg", "img/port3.jpg"], phone: "302 777 8899", completed: 19,
  },
  {
    id: "p4", name: "Diego Martínez", company: "Frío Express", profession: "Técnico en refrigeración",
    services: ["aire"], rating: 4.9, reviews: 41, ...at(1.1, 2.2), city: "Rionegro, Antioquia", coverageKm: 25,
    schedule: { days: LUN_SAB, from: 8, to: 18 }, priceMin: 80000, priceMax: 150000, verified: true,
    about: "Instalación y mantenimiento de aires acondicionados de todas las marcas.",
    offers: ["Mantenimiento preventivo", "Instalación de equipos", "Recarga de gas"],
    portfolio: ["img/aire.jpg", "img/sol4.jpg"], phone: "310 222 3344", completed: 57,
  },
  {
    id: "p5", name: "Sofía Herrera", company: "Sofi Estilo a Domicilio", profession: "Estilista profesional",
    services: ["peluqueria", "manicure"], rating: 4.9, reviews: 63, ...at(-0.6, -0.9), city: "Rionegro, Antioquia",
    coverageKm: 10, schedule: { days: LUN_SAB, from: 9, to: 19 }, priceMin: 25000, priceMax: 60000, verified: true,
    about: "Cortes, color y peinados a domicilio. Llevo todos mis implementos esterilizados.",
    offers: ["Corte de cabello dama y caballero", "Tintes y mechas", "Peinados para eventos"],
    portfolio: [], phone: "311 909 1212", completed: 112,
  },
  {
    id: "p6", name: "Camilo Rojas", company: "TecnoFix", profession: "Técnico en sistemas",
    services: ["computadores", "celulares"], rating: 4.7, reviews: 22, ...at(0.3, 3.1), city: "Rionegro, Antioquia",
    coverageKm: 15, schedule: { days: LUN_VIE, from: 8, to: 20 }, priceMin: 40000, priceMax: 120000, verified: true,
    about: "Formateo, cambio de pantallas, limpieza y repotenciación de equipos.",
    offers: ["Formateo e instalación de programas", "Cambio de pantalla", "Limpieza interna"],
    portfolio: [], phone: "312 456 7788", completed: 35,
  },
  {
    id: "p7", name: "Valentina Díaz", company: "Paseos Felices", profession: "Cuidadora de mascotas",
    services: ["paseo"], rating: 4.8, reviews: 30, ...at(-2.2, -0.4), city: "Rionegro, Antioquia",
    coverageKm: 6, schedule: { days: TODOS, from: 6, to: 19 }, priceMin: 15000, priceMax: 30000, verified: true,
    about: "Amo los perros. Paseos de 1 hora con reporte por foto.",
    offers: ["Paseo individual", "Paseo grupal", "Cuidado por días"],
    portfolio: [], phone: "313 101 2020", completed: 88,
  },
  {
    id: "p8", name: "Jorge Pérez", company: "Electro JP", profession: "Electricista",
    services: ["electricidad"], rating: 4.5, reviews: 12, ...at(3.5, 1.0), city: "Rionegro, Antioquia",
    coverageKm: 18, schedule: { days: LUN_SAB, from: 7, to: 17 }, priceMin: 45000, priceMax: 85000, verified: false,
    about: "Instalaciones eléctricas residenciales.", offers: ["Instalación de tomas", "Lámparas", "Tableros"],
    portfolio: [], phone: "314 333 2211", completed: 14,
  },
  {
    id: "p9", name: "Marta Ruiz", company: "Brillo Total", profession: "Servicios de limpieza",
    services: ["limpieza"], rating: 4.6, reviews: 25, ...at(-1.0, 2.5), city: "Rionegro, Antioquia",
    coverageKm: 12, schedule: { days: LUN_SAB, from: 7, to: 16 }, priceMin: 60000, priceMax: 110000, verified: true,
    about: "Limpieza profunda de casas y apartamentos.", offers: ["Limpieza general", "Limpieza profunda", "Post-obra"],
    portfolio: [], phone: "315 676 4343", completed: 47,
  },
  {
    id: "p10", name: "Felipe Castro", company: "Trasteos Castro", profession: "Transportador",
    services: ["mudanzas", "conductor"], rating: 4.4, reviews: 18, ...at(4.2, -2.6), city: "Rionegro, Antioquia",
    coverageKm: 40, schedule: { days: TODOS, from: 6, to: 20 }, priceMin: 120000, priceMax: 350000, verified: true,
    about: "Camión 3.5 t para trasteos locales y nacionales.", offers: ["Trasteos", "Fletes", "Conductor elegido"],
    portfolio: [], phone: "316 121 3434", completed: 52,
  },
  {
    id: "p11", name: "Natalia Gil", company: "Cuidar+", profession: "Auxiliar de enfermería",
    services: ["enfermeria"], rating: 4.9, reviews: 34, ...at(0.9, -2.9), city: "Rionegro, Antioquia",
    coverageKm: 15, schedule: { days: TODOS, from: 0, to: 24 }, priceMin: 50000, priceMax: 120000, verified: true,
    about: "Cuidado de adultos mayores, curaciones y toma de signos vitales.",
    offers: ["Acompañamiento", "Curaciones", "Aplicación de medicamentos"], portfolio: [], phone: "317 989 0000", completed: 76,
  },
  {
    id: "p12", name: "Esteban Mora", company: "Mora Pinturas", profession: "Pintor",
    services: ["pintura"], rating: 4.3, reviews: 9, ...at(28, 14), city: "Medellín, Antioquia",
    coverageKm: 10, schedule: { days: LUN_SAB, from: 7, to: 17 }, priceMin: 50000, priceMax: 90000, verified: true,
    about: "Pintura de fachadas e interiores (cubre solo Medellín).", offers: ["Pintura de interiores", "Fachadas"],
    portfolio: [], phone: "318 444 5555", completed: 11,
  },
  {
    id: "p13", name: "Ricardo León", company: "Construye RL", profession: "Maestro de construcción",
    services: ["albanileria", "pintura"], rating: 4.6, reviews: 20, ...at(-3.1, 1.9), city: "Rionegro, Antioquia",
    coverageKm: 25, schedule: { days: LUN_SAB, from: 7, to: 17 }, priceMin: 70000, priceMax: 200000, verified: true,
    about: "Remodelaciones, enchapes y obra blanca.", offers: ["Enchapes", "Muros y pañetes", "Remodelaciones"],
    portfolio: [], phone: "319 123 9876", completed: 39,
  },
  {
    id: "p14", name: "Andrea Ortiz", company: "VetCasa", profession: "Médica veterinaria",
    services: ["veterinaria"], rating: 4.9, reviews: 27, ...at(1.8, 0.4), city: "Rionegro, Antioquia",
    coverageKm: 20, schedule: { days: LUN_SAB, from: 8, to: 18 }, priceMin: 60000, priceMax: 140000, verified: true,
    about: "Consulta veterinaria, vacunación y desparasitación a domicilio.",
    offers: ["Consulta general", "Vacunación", "Desparasitación"], portfolio: [], phone: "320 765 4321", completed: 64,
  },
];

export const providerById = (id: string) => PROVIDERS.find((p) => p.id === id);

export const REVIEWS: Record<string, { name: string; stars: number; text: string; date: string }[]> = {
  p1: [
    { name: "Daniela J.", stars: 5, text: "Excelente servicio, llegó puntual y solucionó el problema rápidamente.", date: "15 oct. 2026" },
    { name: "Mauricio S.", stars: 5, text: "Muy profesional, dejó todo limpio. Lo recomiendo.", date: "2 oct. 2026" },
    { name: "Laura G.", stars: 4, text: "Buen trabajo, se demoró un poco en llegar pero cumplió.", date: "21 sep. 2026" },
  ],
  p2: [
    { name: "Daniela J.", stars: 5, text: "Instaló las lámparas en menos de una hora. Muy amable.", date: "12 oct. 2026" },
    { name: "Juan P.", stars: 4, text: "Buen precio y buena atención.", date: "30 sep. 2026" },
  ],
  p3: [{ name: "Santiago R.", stars: 5, text: "La habitación quedó como nueva.", date: "1 oct. 2026" }],
};

// ---------------------------------------------------------------------
//  Clientes que publican solicitudes (vistas del proveedor)
// ---------------------------------------------------------------------
export const CLIENTS: Record<string, { name: string; photo?: string; rating: number; reviews: number }> = {
  c1: { name: "María López", photo: "img/cliente1.jpg", rating: 4.9, reviews: 12 },
  c2: { name: "Juan Pérez", photo: "img/cliente2.jpg", rating: 4.7, reviews: 8 },
  c3: { name: "Santiago Ruiz", photo: "img/cliente3.jpg", rating: 4.8, reviews: 5 },
  c4: { name: "Laura Gómez", rating: 4.6, reviews: 9 },
  c5: { name: "Pedro Salazar", rating: 4.5, reviews: 3 },
  c6: { name: "Daniela Jaramillo", photo: "img/daniela.jpg", rating: 4.9, reviews: 14 },
};

// ---------------------------------------------------------------------
//  Cuentas de demostración (roles dinámicos)
// ---------------------------------------------------------------------
export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city: string;
  photo?: string;
  clientId: string;      // id como cliente
  providerId?: string;   // id como proveedor (si ya configuró su perfil)
}

export const DEMO_ACCOUNTS: Account[] = [
  { id: "u1", name: "Daniela Jaramillo", email: "daniela@conectapro.co", phone: "300 987 6543", document: "1.036.555.444",
    city: "Rionegro, Antioquia", photo: "img/daniela.jpg", clientId: "c6" },
  { id: "u2", name: "Carlos Ramírez", email: "carlos@conectapro.co", phone: "300 123 4567", document: "1.036.222.111",
    city: "Rionegro, Antioquia", photo: "img/carlos.jpg", clientId: "c7", providerId: "p1" },
];

// ---------------------------------------------------------------------
//  Utilidades
// ---------------------------------------------------------------------
export const money = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

const DAY = 86400000;
export const daysAgo = (d: number, hour = 10) => {
  const x = new Date(Date.now() - d * DAY);
  x.setHours(hour, 0, 0, 0);
  return x.getTime();
};
export const minutesAgo = (m: number) => Date.now() - m * 60000;
export { at };
