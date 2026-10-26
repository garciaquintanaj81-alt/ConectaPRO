#!/usr/bin/env python3
"""Genera supabase/seed.sql: datos geográficos de Colombia (DIVIPOLA) + catálogo + datos de ejemplo.

Uso:  python3 supabase/generar_seed.py ruta/municipios_por_departamento.csv ruta/departamentos.csv
Fuente geográfica: https://github.com/edamazzio/municipios_departamentos_colombia_csv (DIVIPOLA, con correcciones).
"""
import csv, math, sys, os

MUN_CSV, DEP_CSV = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed.sql")

def q(v):
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"

# ---------------------------------------------------------------- geografía
deps = {}
with open(DEP_CSV, encoding="utf-8") as f:
    r = csv.reader(f); next(r)
    for row in r:
        if len(row) < 4: continue
        deps[row[0].strip()] = [row[1].strip(), float(row[2].replace(",", ".")), float(row[3].replace(",", "."))]
deps["88"][0] = "Archipiélago de San Andrés, Providencia y Santa Catalina"
deps["11"] = ["Bogotá D.C.", 4.6097, -74.0817]

NAME_FIX = {"05615": "Rionegro", "68615": "Rionegro", "76001": "Cali", "23001": "Montería", "52001": "Pasto",
            "11001": "Bogotá D.C."}
# Municipios sin coordenadas (o con errores) en la fuente
COORD_FIX = {"27245": (5.8992, -76.1428), "52258": (1.4269, -77.0975), "23350": (8.0497, -75.3361),
             "27425": (5.9950, -76.7822), "27430": (5.1919, -76.6950), "70823": (9.4517, -75.4394),
             "47980": (10.7631, -74.1450), "27077": (4.9561, -77.3653), "68235": (6.6980, -73.5110)}
NAME_FIX.update({"23350": "La Apartada", "70823": "Tolúviejo", "47980": "Zona Bananera", "27077": "Bajo Baudó"})
muns = {}
with open(MUN_CSV, encoding="utf-8") as f:
    r = csv.reader(f); next(r)
    for row in r:
        if len(row) < 6: continue
        cod, nom, dep = row[0].strip(), row[1].strip(), row[2].strip()
        if cod in COORD_FIX: lat, lng = COORD_FIX[cod]
        else: lat, lng = float(row[4].replace(",", ".").strip("` ")), float(row[5].replace(",", ".").strip("` "))
        muns[cod] = [dep, NAME_FIX.get(cod, nom), lat, lng]
muns["11001"][0] = "11"                    # Bogotá es distrito capital, no municipio de Cundinamarca
muns["11001"][2:] = [4.6097, -74.0817]
for cod, dep, nom, lat, lng in [
    ("68307", "68", "Girón", 7.0731, -73.1681),
    ("88001", "88", "San Andrés", 12.5847, -81.7006),
    ("94343", "94", "Barrancominas", 3.4936, -69.8072),
]:
    muns.setdefault(cod, [dep, nom, lat, lng])
muns["05615"][2:] = [6.1551, -75.3737]     # centro urbano de Rionegro (Antioquia)
muns["54001"][2:] = [7.8939, -72.5078]     # centro de Cúcuta

# ---------------------------------------------------------------- catálogo
CATEGORIAS = [("hogar", "Hogar"), ("tecnologia", "Tecnología"), ("construccion", "Construcción"), ("belleza", "Belleza"),
              ("transporte", "Transporte"), ("salud", "Salud"), ("mascotas", "Mascotas"), ("mas", "Más")]
SERVICIOS = [
    ("plomeria", "Plomería", "Plomería", "hogar", "img/plomeria.jpg"),
    ("electricidad", "Electricidad", "Electricidad", "hogar", "img/electricidad.jpg"),
    ("aire", "Aire acondicionado", "Aire acond.", "hogar", "img/aire.jpg"),
    ("pintura", "Pintura", "Pintura", "construccion", "img/pintura.jpg"),
    ("limpieza", "Limpieza del hogar", "Limpieza", "hogar", None),
    ("albanileria", "Albañilería", "Albañilería", "construccion", None),
    ("computadores", "Reparación de computadores", "Computadores", "tecnologia", None),
    ("celulares", "Reparación de celulares", "Celulares", "tecnologia", None),
    ("peluqueria", "Corte de cabello", "Peluquería", "belleza", None),
    ("manicure", "Manicure y pedicure", "Manicure", "belleza", None),
    ("mudanzas", "Mudanzas y fletes", "Mudanzas", "transporte", None),
    ("conductor", "Conductor elegido", "Conductor", "transporte", None),
    ("enfermeria", "Cuidado y enfermería", "Enfermería", "salud", None),
    ("paseo", "Paseo de perros", "Paseo perros", "mascotas", None),
    ("veterinaria", "Veterinaria a domicilio", "Veterinaria", "mascotas", None),
]
ALIADOS = [("Homecenter", "10% en herramientas y materiales", 300, "bg-[#fff1e0] text-[#c2410c]"),
           ("Juan Valdez", "Café gratis por tu buena reputación", 150, "bg-[#f3eadf] text-[#7c4a1e]"),
           ("Rappi", "Envío gratis en tu próximo pedido", 200, "bg-[#ffe7e3] text-[#e11d48]"),
           ("Cine Colombia", "2x1 en boletas de lunes a jueves", 400, "bg-[#e8ecff] text-brand")]

def pid(n): return f"a0000000-0000-4000-8000-{n:012d}"      # perfiles de ejemplo
def vid(n): return f"b0000000-0000-4000-8000-{n:012d}"      # proveedores de ejemplo

def at(muni, east, north):
    _, _, lat, lng = muns[muni]
    return (round(lat + north / 110.574, 6), round(lng + east / (111.32 * math.cos(math.radians(lat))), 6))

LS = [1, 2, 3, 4, 5, 6]; LV = [1, 2, 3, 4, 5]; TD = [0, 1, 2, 3, 4, 5, 6]
# (n, nombre, correo, foto, celular, municipio, puntos, calif, resenas)
PERSONAS = [
    (1, "Daniela Jaramillo", "daniela@conectapro.co", "img/daniela.jpg", "3009876543", "05615", 320, 4.9, 14),
    (2, "Carlos Ramírez", "carlos@conectapro.co", "img/carlos.jpg", "3001234567", "05615", 540, 4.8, 6),
    (3, "Juan Pérez", "juan@conectapro.co", "img/cliente2.jpg", "3012223344", "05615", 180, 4.7, 8),
    (4, "Andrés Torres", "andres@conectapro.co", "img/andres.jpg", "3015550101", "05615", 410, 4.7, 5),
    (5, "María López", "maria.lopez@ejemplo.co", "img/cliente1.jpg", "3101112233", "05615", 100, 4.9, 12),
    (6, "Santiago Ruiz", "santiago.ruiz@ejemplo.co", "img/cliente3.jpg", "3102223344", "05615", 100, 4.8, 5),
    (7, "Laura Gómez", "laura.gomez@ejemplo.co", None, "3103334455", "05615", 100, 4.6, 9),
    (8, "Pedro Salazar", "pedro.salazar@ejemplo.co", None, "3104445566", "05615", 100, 4.5, 3),
    (9, "Valeria Contreras", "valeria.contreras@ejemplo.co", None, "3165556677", "54001", 100, 4.8, 7),
    (10, "Óscar Jaimes", "oscar.jaimes@ejemplo.co", None, "3166667788", "54001", 100, 4.6, 4),
    (11, "Natalia Pabón", "natalia.pabon@ejemplo.co", None, "3167778899", "54874", 100, 4.9, 6),
    (12, "Camila Ortega", "camila.ortega@ejemplo.co", None, "3178889900", "68001", 100, 4.7, 5),
    (13, "Felipe Arango", "felipe.arango@ejemplo.co", None, "3189990011", "11001", 100, 4.8, 3),
]
# Proveedores: (n, nombre, foto, empresa, profesion, servicios, calif, resenas, muni, este, norte, cobertura, dias, desde, hasta, pmin, pmax, verif, about, ofrece, portafolio, completados)
PROV = [
    (2, None, None, "Ramírez Plomería", "Técnico en plomería", ["plomeria"], 4.8, 32, "05615", 0.8, 0.9, 20, LS, 7, 18, 50000, 80000, True,
     "Más de 5 años de experiencia en servicios de plomería residencial y comercial.",
     ["Instalación y reparación de tuberías", "Destapado de cañerías", "Instalación de grifería", "Mantenimiento general"],
     ["img/port1.jpg", "img/port2.jpg", "img/port3.jpg"], 28),
    (4, None, None, "Torres Soluciones", "Plomero y electricista", ["plomeria", "electricidad"], 4.7, 28, "05615", -1.6, 1.4, 15, TD, 6, 21, 40000, 70000, True,
     "Electricista certificado RETIE y plomero. Atiendo urgencias todos los días.",
     ["Instalación de lámparas", "Revisión de redes eléctricas", "Reparación de fugas", "Cambio de breakers"],
     ["img/sol2.jpg", "img/electricidad.jpg", "img/port2.jpg"], 41),
    (20, "Luis Gómez", "img/luis.jpg", "LG Mantenimientos", "Maestro de obra", ["plomeria", "pintura"], 4.6, 15, "05615", 2.4, -1.8, 12, LS, 13, 22, 60000, 90000, True,
     "Pintura, acabados y plomería. Trabajo limpio y garantizado.", ["Pintura de interiores", "Estuco y acabados", "Reparación de tuberías"],
     ["img/pintura.jpg", "img/sol3.jpg", "img/port3.jpg"], 19),
    (21, "Diego Martínez", None, "Frío Express", "Técnico en refrigeración", ["aire"], 4.9, 41, "05615", 1.1, 2.2, 25, LS, 8, 18, 80000, 150000, True,
     "Instalación y mantenimiento de aires acondicionados de todas las marcas.", ["Mantenimiento preventivo", "Instalación de equipos", "Recarga de gas"],
     ["img/aire.jpg", "img/sol4.jpg"], 57),
    (22, "Sofía Herrera", None, "Sofi Estilo a Domicilio", "Estilista profesional", ["peluqueria", "manicure"], 4.9, 63, "05615", -0.6, -0.9, 10, LS, 9, 19, 25000, 60000, True,
     "Cortes, color y peinados a domicilio. Llevo todos mis implementos esterilizados.", ["Corte de cabello dama y caballero", "Tintes y mechas", "Peinados para eventos"], [], 112),
    (23, "Camilo Rojas", None, "TecnoFix", "Técnico en sistemas", ["computadores", "celulares"], 4.7, 22, "05615", 0.3, 3.1, 15, LV, 8, 20, 40000, 120000, True,
     "Formateo, cambio de pantallas, limpieza y repotenciación de equipos.", ["Formateo e instalación de programas", "Cambio de pantalla", "Limpieza interna"], [], 35),
    (24, "Valentina Díaz", None, "Paseos Felices", "Cuidadora de mascotas", ["paseo"], 4.8, 30, "05615", -2.2, -0.4, 6, TD, 6, 19, 15000, 30000, True,
     "Amo los perros. Paseos de 1 hora con reporte por foto.", ["Paseo individual", "Paseo grupal", "Cuidado por días"], [], 88),
    (25, "Jorge Pérez", None, "Electro JP", "Electricista", ["electricidad"], 4.5, 12, "05615", 3.5, 1.0, 18, LS, 7, 17, 45000, 85000, False,
     "Instalaciones eléctricas residenciales.", ["Instalación de tomas", "Lámparas", "Tableros"], ["img/electricidad.jpg"], 14),
    (26, "Marta Ruiz", None, "Brillo Total", "Servicios de limpieza", ["limpieza"], 4.6, 25, "05615", -1.0, 2.5, 12, LS, 7, 16, 60000, 110000, True,
     "Limpieza profunda de casas y apartamentos.", ["Limpieza general", "Limpieza profunda", "Post-obra"], [], 47),
    (27, "Felipe Castro", None, "Trasteos Castro", "Transportador", ["mudanzas", "conductor"], 4.4, 18, "05615", 4.2, -2.6, 40, TD, 6, 20, 120000, 350000, True,
     "Camión 3.5 t para trasteos locales y nacionales.", ["Trasteos", "Fletes", "Conductor elegido"], [], 52),
    (28, "Natalia Gil", None, "Cuidar+", "Auxiliar de enfermería", ["enfermeria"], 4.9, 34, "05615", 0.9, -2.9, 15, TD, 0, 24, 50000, 120000, True,
     "Cuidado de adultos mayores, curaciones y toma de signos vitales.", ["Acompañamiento", "Curaciones", "Aplicación de medicamentos"], [], 76),
    (29, "Esteban Mora", None, "Mora Pinturas", "Pintor", ["pintura"], 4.3, 9, "05001", 0.5, -0.4, 10, LS, 7, 17, 50000, 90000, True,
     "Pintura de fachadas e interiores en Medellín.", ["Pintura de interiores", "Fachadas"], ["img/pintura.jpg"], 11),
    (30, "Ricardo León", None, "Construye RL", "Maestro de construcción", ["albanileria", "pintura"], 4.6, 20, "05615", -3.1, 1.9, 25, LS, 7, 17, 70000, 200000, True,
     "Remodelaciones, enchapes y obra blanca.", ["Enchapes", "Muros y pañetes", "Remodelaciones"], [], 39),
    (31, "Andrea Ortiz", None, "VetCasa", "Médica veterinaria", ["veterinaria"], 4.9, 27, "05615", 1.8, 0.4, 20, LS, 8, 18, 60000, 140000, True,
     "Consulta veterinaria, vacunación y desparasitación a domicilio.", ["Consulta general", "Vacunación", "Desparasitación"], [], 64),
    (32, "Hernán Quintero", None, "Transportes HQ", "Conductor", ["conductor", "mudanzas"], 4.6, 16, "05440", 0.2, 0.1, 25, TD, 6, 22, 60000, 200000, True,
     "Conductor elegido y acarreos en el Oriente antioqueño.", ["Conductor elegido", "Acarreos"], [], 33),
    (33, "Paula Vargas", None, "Nails by Pau", "Manicurista", ["manicure", "peluqueria"], 4.8, 40, "05266", 0.1, 0.2, 12, LS, 9, 19, 25000, 70000, True,
     "Manicure, pedicure y uñas acrílicas a domicilio.", ["Manicure tradicional", "Semipermanente", "Uñas acrílicas"], [], 95),
    (34, "Mauricio Silva", None, "CelularMed", "Técnico en celulares", ["celulares", "computadores"], 4.5, 21, "05001", -0.3, 0.4, 15, LS, 9, 19, 30000, 150000, True,
     "Reparación de celulares y computadores con garantía.", ["Cambio de pantallas", "Baterías", "Software"], [], 44),
    # ---- Norte de Santander
    (40, "Jhon Jairo Peñaranda", None, "Plomería JJ", "Plomero", ["plomeria"], 4.7, 26, "54001", 0.6, 0.8, 15, LS, 7, 19, 40000, 75000, True,
     "Plomero con 10 años de experiencia en Cúcuta y su área metropolitana.", ["Fugas y goteos", "Destapes", "Instalación de tanques"], ["img/plomeria.jpg"], 61),
    (41, "Mónica Rangel", None, "Mónica Estilistas", "Estilista", ["peluqueria", "manicure"], 4.9, 48, "54001", -0.9, 0.3, 10, LS, 8, 19, 20000, 55000, True,
     "Peluquería y manicure a domicilio en Cúcuta.", ["Cortes", "Cepillados", "Manicure"], [], 130),
    (42, "Luis Fernando Ibarra", None, "Electro Ibarra", "Electricista", ["electricidad"], 4.6, 19, "54001", 1.4, -0.6, 18, LS, 7, 18, 45000, 90000, True,
     "Instalaciones y reparaciones eléctricas certificadas.", ["Tableros", "Iluminación", "Revisión de cortos"], ["img/electricidad.jpg"], 37),
    (43, "Yesica Duarte", None, "Limpieza Total Cúcuta", "Servicios de limpieza", ["limpieza"], 4.7, 31, "54001", -1.2, -1.1, 12, LS, 7, 17, 50000, 100000, True,
     "Aseo de casas, apartamentos y oficinas.", ["Aseo general", "Limpieza profunda", "Oficinas"], [], 58),
    (44, "Alexander Contreras", None, "FrioCúcuta", "Técnico en aire acondicionado", ["aire"], 4.8, 37, "54001", 0.3, 1.6, 20, LS, 7, 18, 70000, 160000, True,
     "En Cúcuta el aire es vital: mantenimiento e instalación el mismo día.", ["Mantenimiento", "Instalación", "Carga de gas"], ["img/aire.jpg"], 89),
    (45, "Wilmer Galvis", None, "Obras Galvis", "Maestro de obra", ["albanileria", "pintura"], 4.5, 14, "54001", 2.1, 0.9, 25, LS, 7, 17, 60000, 220000, True,
     "Remodelaciones, pintura y obra blanca.", ["Pintura", "Enchapes", "Drywall"], ["img/pintura.jpg"], 22),
    (46, "Karen Villamizar", None, "Cuidados Karen", "Enfermera", ["enfermeria"], 4.9, 22, "54001", -0.4, -1.8, 15, TD, 0, 24, 60000, 130000, True,
     "Enfermera profesional: curaciones, inyectología y acompañamiento.", ["Curaciones", "Inyectología", "Acompañamiento nocturno"], [], 40),
    (47, "Daniel Sanabria", None, "TecnoNorte", "Técnico en sistemas", ["computadores", "celulares"], 4.6, 17, "54001", 0.9, -0.2, 15, LV, 8, 19, 35000, 120000, True,
     "Soporte técnico a domicilio y reparación de equipos.", ["Formateo", "Redes WiFi", "Cambio de pantalla"], [], 29),
    (48, "Sergio Pabón", None, "Trasteos del Norte", "Transportador", ["mudanzas", "conductor"], 4.4, 11, "54001", 3.0, 2.0, 40, TD, 6, 20, 100000, 400000, True,
     "Trasteos en Cúcuta, Villa del Rosario y Los Patios.", ["Trasteos", "Fletes", "Conductor elegido"], [], 25),
    (49, "Laura Jácome", None, "PetCare Cúcuta", "Veterinaria", ["veterinaria", "paseo"], 4.8, 20, "54001", -1.7, 0.7, 15, LS, 8, 18, 30000, 120000, True,
     "Consulta veterinaria y paseo de mascotas.", ["Consulta", "Vacunación", "Paseos"], [], 33),
    (50, "Edwin Ramírez", None, "ER Servicios", "Plomero y electricista", ["plomeria", "electricidad"], 4.5, 13, "54874", 0.2, 0.3, 15, TD, 7, 20, 35000, 70000, True,
     "Plomería y electricidad en Villa del Rosario y Cúcuta.", ["Fugas", "Tomas e interruptores", "Duchas eléctricas"], [], 21),
    (51, "Claudia Moreno", None, "Hogar Brillante", "Servicios de limpieza", ["limpieza"], 4.6, 15, "54405", 0.1, 0.1, 12, LS, 7, 16, 45000, 90000, True,
     "Limpieza de hogares en Los Patios.", ["Aseo general", "Planchado"], [], 18),
    (52, "Gustavo Parada", None, "Pinturas Parada", "Pintor", ["pintura"], 4.7, 12, "54518", 0.0, 0.2, 15, LS, 7, 17, 50000, 120000, True,
     "Pintura de casas en Pamplona.", ["Interiores", "Fachadas"], [], 16),
    (53, "Ana Milena Quintero", None, "Belleza Ocaña", "Estilista", ["peluqueria"], 4.8, 19, "54498", 0.1, -0.1, 10, LS, 8, 18, 20000, 50000, True,
     "Cortes y peinados a domicilio en Ocaña.", ["Cortes", "Peinados"], [], 27),
    # ---- Santander
    (60, "Julián Serrano", None, "Hidro Santander", "Plomero", ["plomeria"], 4.7, 24, "68001", 0.5, 0.6, 15, LS, 7, 18, 45000, 85000, True,
     "Plomería en Bucaramanga y Floridablanca.", ["Fugas", "Calentadores", "Destapes"], ["img/plomeria.jpg"], 42),
    (61, "Diana Gómez", None, "Diana Beauty", "Estilista", ["peluqueria", "manicure"], 4.9, 33, "68001", -0.7, 0.2, 10, LS, 9, 19, 25000, 70000, True,
     "Belleza a domicilio en Bucaramanga.", ["Cortes", "Manicure", "Maquillaje"], [], 70),
    (62, "Fabián Ardila", None, "Clima Ardila", "Técnico en refrigeración", ["aire", "electricidad"], 4.6, 18, "68276", 0.3, 0.1, 20, LS, 8, 18, 60000, 150000, True,
     "Aires acondicionados y electricidad en el área metropolitana.", ["Mantenimiento de aires", "Instalaciones eléctricas"], ["img/aire.jpg"], 31),
    # ---- Bogotá y otras capitales
    (70, "Carolina Méndez", None, "Casa Impecable", "Servicios de limpieza", ["limpieza"], 4.8, 52, "11001", 1.0, 2.0, 15, LS, 7, 17, 70000, 130000, True,
     "Aseo de apartamentos en Bogotá.", ["Aseo general", "Limpieza profunda"], [], 120),
    (71, "Andrés Felipe Rojas", None, "SoporteBogotá", "Ingeniero de sistemas", ["computadores"], 4.7, 29, "11001", -1.5, 3.0, 20, LV, 8, 19, 50000, 150000, True,
     "Soporte técnico a domicilio en Bogotá.", ["Formateo", "Redes", "Recuperación de datos"], [], 66),
    (72, "Óscar Beltrán", None, "Plomería Capital", "Plomero", ["plomeria"], 4.5, 16, "11001", 2.5, -1.0, 20, LS, 7, 18, 50000, 95000, True,
     "Plomero en el norte y centro de Bogotá.", ["Fugas", "Calentadores", "Destapes"], ["img/plomeria.jpg"], 30),
    (73, "Yuliana Mosquera", None, "Yuli Trenzas", "Estilista", ["peluqueria"], 4.9, 44, "76001", 0.3, 0.4, 12, LS, 9, 19, 25000, 80000, True,
     "Trenzas, cortes y peinados en Cali.", ["Trenzas", "Cortes", "Peinados"], [], 98),
    (74, "Rafael Barrios", None, "Brisa Fría", "Técnico en aire acondicionado", ["aire"], 4.7, 38, "08001", 0.4, 0.2, 20, LS, 7, 19, 70000, 170000, True,
     "Aires acondicionados en Barranquilla.", ["Mantenimiento", "Instalación"], ["img/aire.jpg"], 85),
    (75, "Kelly Julio", None, "Kelly Nails", "Manicurista", ["manicure"], 4.8, 26, "13001", 0.1, 0.1, 10, LS, 9, 19, 25000, 60000, True,
     "Manicure y pedicure en Cartagena.", ["Manicure", "Pedicure"], [], 61),
]

L = []
w = L.append
w("-- Generado por supabase/generar_seed.py — NO editar a mano.\n")
w("-- Departamentos y municipios de Colombia (DIVIPOLA) + catálogo + datos de ejemplo.\n")
w("begin;\n")
w("insert into departamentos (codigo, nombre, lat, lng) values\n" + ",\n".join(
    f"({q(c)},{q(n)},{lat},{lng})" for c, (n, lat, lng) in sorted(deps.items())) + "\non conflict (codigo) do update set nombre = excluded.nombre, lat = excluded.lat, lng = excluded.lng;\n")
w("insert into municipios (codigo, departamento, nombre, lat, lng) values\n" + ",\n".join(
    f"({q(c)},{q(d)},{q(n)},{lat},{lng})" for c, (d, n, lat, lng) in sorted(muns.items())) +
  "\non conflict (codigo) do update set departamento = excluded.departamento, nombre = excluded.nombre, lat = excluded.lat, lng = excluded.lng;\n")
w("insert into categorias (id, nombre, orden) values\n" + ",\n".join(f"({q(i)},{q(n)},{k})" for k, (i, n) in enumerate(CATEGORIAS)) +
  "\non conflict (id) do update set nombre = excluded.nombre, orden = excluded.orden;\n")
w("insert into servicios (id, nombre, corto, categoria, foto, orden) values\n" + ",\n".join(
    f"({q(i)},{q(n)},{q(c)},{q(cat)},{q(f)},{k})" for k, (i, n, c, cat, f) in enumerate(SERVICIOS)) +
  "\non conflict (id) do update set nombre = excluded.nombre, corto = excluded.corto, categoria = excluded.categoria, foto = excluded.foto, orden = excluded.orden;\n")
w("insert into aliados (id, marca, oferta, costo, color) values\n" + ",\n".join(
    f"({k+1},{q(m)},{q(o)},{c},{q(col)})" for k, (m, o, c, col) in enumerate(ALIADOS)) +
  "\non conflict (id) do update set marca = excluded.marca, oferta = excluded.oferta, costo = excluded.costo, color = excluded.color;\n")
w("select setval('aliados_id_seq', (select max(id) from aliados));\n")
w("insert into config (clave, valor) values ('auto_respuesta_demo','true'),"
  "('demo_login_1','daniela@conectapro.co'),('demo_login_2','carlos@conectapro.co'),"
  "('demo_login_3','juan@conectapro.co'),('demo_login_4','andres@conectapro.co') on conflict (clave) do update set valor = excluded.valor;\n")

# Personas de ejemplo
personas = {p[0]: p for p in PERSONAS}
for pr in PROV:
    if pr[1]:
        n = pr[0]
        personas[n] = (n, pr[1], pr[1].lower().split()[0] + "." + pr[1].lower().split()[-1] + "@ejemplo.co", pr[2],
                       "31" + str(70000000 + n * 1234)[:8], pr[8], 100, 4.8, 3)
import unicodedata
def ascii_mail(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
rows = []
for n, (n_, nombre, correo, foto, cel, muni, puntos, cal, res) in sorted(personas.items()):
    dep = muns[muni][0]
    rows.append(f"({q(pid(n))},{q(nombre)},{q(ascii_mail(correo))},{q(foto)},{q(cel)},{q('1000' + str(n).zfill(6))},{q(dep)},{q(muni)},{puntos},{cal},{res},true,true)")
w("insert into perfiles (id, nombre, correo, foto, celular, documento, departamento, municipio, puntos, calificacion, num_resenas, verificado, demo) values\n" +
  ",\n".join(rows) + "\non conflict (id) do update set nombre = excluded.nombre, foto = excluded.foto, departamento = excluded.departamento, municipio = excluded.municipio;\n")

prows, srows, frows = [], [], []
for (n, nombre, foto, emp, prof, servs, cal, res, muni, e, no, cob, dias, de, ha, pmin, pmax, ver, about, ofrece, port, comp) in PROV:
    lat, lng = at(muni, e, no)
    dep = muns[muni][0]
    tel = personas[n][4]
    arr = "'{" + ",".join(str(d) for d in dias) + "}'"
    of = "array[" + ",".join(q(o) for o in ofrece) + "]::text[]"
    prows.append(f"({q(vid(n))},{q(pid(n))},{q(emp)},{q(prof)},{q(dep)},{q(muni)},{lat},{lng},{cob},{arr},{de},{ha},{pmin},{pmax},{q(about)},{of},{q(tel[:3] + ' ' + tel[3:6] + ' ' + tel[6:])},{cal},{res},{comp},{q(ver)},{cal},{res},{comp})")
    for s in servs: srows.append(f"({q(vid(n))},{q(s)})")
    for k, img in enumerate(port): frows.append(f"({q(vid(n))},{q(img)},{k})")
w("insert into proveedores (id, perfil_id, empresa, profesion, departamento, municipio, lat, lng, cobertura_km, dias, hora_desde, hora_hasta, precio_min, precio_max, descripcion, ofrece, telefono, calificacion, num_resenas, completados, verificado, calificacion_ini, resenas_ini, completados_ini) values\n" +
  ",\n".join(prows) + "\non conflict (id) do nothing;\n")
w("insert into proveedor_servicios (proveedor_id, servicio_id) values\n" + ",\n".join(srows) + "\non conflict do nothing;\n")
w("delete from portafolio where proveedor_id in (select p.id from proveedores p join perfiles pe on pe.id = p.perfil_id where pe.demo);\n")
w("insert into portafolio (proveedor_id, imagen, orden) values\n" + ",\n".join(frows) + ";\n")

TRUEQUES = [(23, "computadores", "paseo", "Arreglo tu computador si paseas a mi perro Toby 2 veces."),
            (24, "paseo", "computadores", "Paseo a tu perro a cambio de formatear mi portátil."),
            (22, "peluqueria", "pintura", "Corte de cabello a cambio de pintar mi local."),
            (20, "pintura", "peluqueria", "Pinto una habitación a cambio de cortes para mi familia."),
            (4, "electricidad", "limpieza", "Instalo lámparas a cambio de una limpieza profunda."),
            (26, "limpieza", "electricidad", "Limpio tu casa a cambio de revisar mi instalación eléctrica."),
            (47, "computadores", "mudanzas", "Reparo tu computador a cambio de un acarreo pequeño."),
            (48, "mudanzas", "computadores", "Te hago un flete a cambio de formatear dos computadores."),
            (41, "peluqueria", "limpieza", "Cortes para toda la familia a cambio de un aseo general.")]
w("delete from trueque_ofertas where perfil_id in (select id from perfiles where demo);\n")
w("insert into trueque_ofertas (perfil_id, ofrece, necesita, nota) values\n" + ",\n".join(
    f"({q(pid(n))},{q(o)},{q(ne)},{q(nota)})" for n, o, ne, nota in TRUEQUES) + ";\n")

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo.sql"), encoding="utf-8") as f:
    w(f.read())
w("select cp_sembrar_demo();\n")
w("commit;\n")
open(OUT, "w", encoding="utf-8").write("\n".join(L))
print("seed.sql:", sum(len(x) for x in L) // 1024, "KB ·", len(deps), "departamentos ·", len(muns), "municipios ·", len(PROV), "proveedores ·", len(personas), "perfiles")
