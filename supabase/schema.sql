-- =====================================================================
--  ConectaPRO · Esquema de base de datos (PostgreSQL / Supabase)
--  Tablas + API (funciones RPC) + seguridad.
--
--  Seguridad: las tablas NO son accesibles directamente desde internet
--  (RLS activado sin políticas). Todo pasa por funciones api_* que
--  validan quién es el usuario (auth.uid()) y qué puede hacer.
-- =====================================================================

-- ---------------------------------------------------------------------
--  1. Catálogos
-- ---------------------------------------------------------------------
create table if not exists departamentos (
  codigo text primary key,
  nombre text not null,
  lat double precision,
  lng double precision
);

create table if not exists municipios (
  codigo text primary key,
  departamento text not null references departamentos(codigo) on delete cascade,
  nombre text not null,
  lat double precision not null,
  lng double precision not null
);
create index if not exists municipios_depto_idx on municipios(departamento, nombre);

create table if not exists categorias (
  id text primary key,
  nombre text not null,
  orden int not null default 0
);

create table if not exists servicios (
  id text primary key,
  nombre text not null,
  corto text not null,
  categoria text not null references categorias(id),
  foto text,
  orden int not null default 0
);

create table if not exists aliados (
  id serial primary key,
  marca text not null,
  oferta text not null,
  costo int not null check (costo > 0),
  color text
);

create table if not exists config (
  clave text primary key,
  valor text not null
);

-- ---------------------------------------------------------------------
--  2. Usuarios y proveedores
-- ---------------------------------------------------------------------
create table if not exists perfiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique,                       -- usuario de autenticación (auth.users.id)
  nombre text not null,
  documento text unique,
  celular text,
  correo text unique,
  departamento text references departamentos(codigo),
  municipio text references municipios(codigo),
  foto text,
  rol_activo text not null default 'cliente' check (rol_activo in ('cliente','proveedor')),
  puntos int not null default 100,
  verificado boolean not null default false,
  calificacion numeric(2,1) not null default 5.0,
  num_resenas int not null default 0,
  notif_push boolean not null default true,
  notif_email boolean not null default true,
  notif_ia boolean not null default true,
  demo boolean not null default false,       -- datos de ejemplo
  creado timestamptz not null default now()
);

create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references perfiles(id) on delete cascade,
  empresa text not null,
  profesion text not null,
  departamento text not null references departamentos(codigo),
  municipio text not null references municipios(codigo),
  lat double precision not null,
  lng double precision not null,
  cobertura_km int not null default 10 check (cobertura_km between 1 and 100),
  dias int[] not null default '{1,2,3,4,5,6}',
  hora_desde int not null default 8 check (hora_desde between 0 and 24),
  hora_hasta int not null default 18 check (hora_hasta between 0 and 24),
  precio_min int not null default 0,
  precio_max int not null default 0,
  descripcion text not null default '',
  ofrece text[] not null default '{}',
  telefono text,
  calificacion numeric(2,1) not null default 5.0,
  num_resenas int not null default 0,
  completados int not null default 0,
  verificado boolean not null default true,
  activo boolean not null default true,
  calificacion_ini numeric(2,1), resenas_ini int, completados_ini int,   -- valores de ejemplo (para reiniciar demo)
  creado timestamptz not null default now()
);
create index if not exists proveedores_ubic_idx on proveedores(departamento, municipio);

create table if not exists proveedor_servicios (
  proveedor_id uuid not null references proveedores(id) on delete cascade,
  servicio_id text not null references servicios(id),
  primary key (proveedor_id, servicio_id)
);

create table if not exists portafolio (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references proveedores(id) on delete cascade,
  imagen text not null,
  orden int not null default 0,
  creado timestamptz not null default now()
);

create table if not exists direcciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  nombre text not null,
  direccion text not null,
  departamento text not null references departamentos(codigo),
  municipio text not null references municipios(codigo),
  creado timestamptz not null default now()
);

create table if not exists metodos_pago (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  tipo text not null check (tipo in ('efectivo','nequi','transferencia','tarjeta')),
  detalle text not null default '',
  predeterminado boolean not null default false,
  creado timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  3. Solicitudes, emparejamiento y acuerdos
-- ---------------------------------------------------------------------
create table if not exists solicitudes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references perfiles(id) on delete cascade,
  titulo text not null,
  descripcion text not null,
  servicio_id text not null references servicios(id),
  departamento text not null references departamentos(codigo),
  municipio text not null references municipios(codigo),
  lat double precision not null,
  lng double precision not null,
  direccion text not null default '',
  metodo_pago text not null check (metodo_pago in ('efectivo','nequi','transferencia','tarjeta')),
  recibir_propuestas boolean not null default true,
  estado text not null default 'buscando' check (estado in ('buscando','en_curso','completada','cancelada')),
  proveedor_id uuid references proveedores(id) on delete set null,
  foto text,
  penalizacion_puntualidad boolean not null default false,
  traza jsonb,
  creado timestamptz not null default now(),
  finalizado timestamptz
);
create index if not exists solicitudes_cliente_idx on solicitudes(cliente_id);
create index if not exists solicitudes_estado_idx on solicitudes(estado, servicio_id);
create index if not exists solicitudes_prov_idx on solicitudes(proveedor_id);

create table if not exists solicitud_notificados (
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  proveedor_id uuid not null references proveedores(id) on delete cascade,
  distancia_km numeric(6,2),
  primary key (solicitud_id, proveedor_id)
);

create table if not exists postulaciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  proveedor_id uuid not null references proveedores(id) on delete cascade,
  precio int not null check (precio > 0),
  nota text,
  visible_desde timestamptz not null default now(),
  creado timestamptz not null default now(),
  unique (solicitud_id, proveedor_id)
);

create table if not exists descartes (
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  proveedor_id uuid not null references proveedores(id) on delete cascade,
  primary key (solicitud_id, proveedor_id)
);

create sequence if not exists acuerdo_seq start 500;
create table if not exists acuerdos (
  solicitud_id uuid primary key references solicitudes(id) on delete cascade,
  codigo text not null unique,
  fecha date not null,
  hora time not null,
  precio int not null,
  plazo_extra_dias int not null default 0,
  firmado timestamptz not null default now()
);

create table if not exists calificaciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  autor_id uuid not null references perfiles(id) on delete cascade,
  rol_autor text not null check (rol_autor in ('cliente','proveedor')),
  estrellas int not null check (estrellas between 1 and 5),
  comentario text not null default '',
  creado timestamptz not null default now(),
  unique (solicitud_id, rol_autor)
);

create table if not exists faltas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  solicitud_id uuid references solicitudes(id) on delete set null,
  motivo text not null,
  creado timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  4. Mensajería y notificaciones
-- ---------------------------------------------------------------------
create table if not exists conversaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_a uuid not null references perfiles(id) on delete cascade,
  usuario_b uuid not null references perfiles(id) on delete cascade,
  creado timestamptz not null default now(),
  check (usuario_a < usuario_b),
  unique (usuario_a, usuario_b)
);

create table if not exists mensajes (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references conversaciones(id) on delete cascade,
  autor_id uuid references perfiles(id) on delete cascade,   -- null = mensaje del sistema
  texto text,
  imagen text,
  creado timestamptz not null default now()
);
create index if not exists mensajes_conv_idx on mensajes(conversacion_id, creado);

create table if not exists lecturas (
  conversacion_id uuid not null references conversaciones(id) on delete cascade,
  perfil_id uuid not null references perfiles(id) on delete cascade,
  leido_hasta timestamptz not null default now(),
  primary key (conversacion_id, perfil_id)
);

create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  tipo text not null,
  texto text not null,
  enlace text,
  leida boolean not null default false,
  creado timestamptz not null default now()
);
create index if not exists notificaciones_perfil_idx on notificaciones(perfil_id, creado desc);

-- ---------------------------------------------------------------------
--  5. Trueque y fidelización
-- ---------------------------------------------------------------------
create table if not exists trueque_ofertas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  ofrece text not null references servicios(id),
  necesita text not null references servicios(id),
  nota text not null default '',
  activo boolean not null default true,
  creado timestamptz not null default now()
);

create table if not exists canjes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfiles(id) on delete cascade,
  aliado_id int not null references aliados(id),
  codigo text not null,
  creado timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Migraciones (versión 2): se aplican también sobre una base ya instalada
-- ---------------------------------------------------------------------
alter table categorias add column if not exists corto text;
alter table categorias add column if not exists descripcion text;
alter table servicios add column if not exists palabras text not null default '';
alter table solicitudes add column if not exists ubicacion_gps boolean not null default false;  -- true = coordenadas exactas del GPS
alter table solicitudes add column if not exists precision_m int;                               -- precisión reportada por el GPS
alter table perfiles add column if not exists verificacion jsonb;                                -- resultado de la detección facial (sin imagen)
drop function if exists api_buscar_proveedores(text, text, text, text, boolean, text);
drop function if exists api_publicar(text, text, text, text, double precision, double precision, text, text, boolean);
drop function if exists api_completar_registro(text, text, text, text, text);

-- ---------------------------------------------------------------------
--  6. Seguridad: nadie accede a las tablas directamente
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on sequence acuerdo_seq from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- =====================================================================
--  FUNCIONES AUXILIARES
-- =====================================================================
create or replace function cp_ms(t timestamptz) returns bigint
language sql immutable as $$ select (extract(epoch from t) * 1000)::bigint $$;

-- "Municipio, Departamento" (sin repetir cuando son iguales, p. ej. Bogotá D.C.)
create or replace function cp_lugar(mun text, dep text) returns text
language sql immutable as $$ select case when mun = dep then mun else mun || ', ' || dep end $$;

-- Distancia en km (fórmula de Haversine)
create or replace function cp_dist(a_lat double precision, a_lng double precision, b_lat double precision, b_lng double precision)
returns double precision language sql immutable as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(b_lat - a_lat) / 2), 2) +
    cos(radians(a_lat)) * cos(radians(b_lat)) * power(sin(radians(b_lng - a_lng) / 2), 2)))
$$;

-- ¿El proveedor está en su horario? (hora de Colombia)
create or replace function cp_disponibilidad(p_dias int[], p_desde int, p_hasta int)
returns text language sql stable as $$
  with n as (select (now() at time zone 'America/Bogota') as t)
  select case
    when extract(dow from t)::int = any(p_dias) then
      case
        when extract(hour from t) + extract(minute from t) / 60 >= p_desde
         and extract(hour from t) + extract(minute from t) / 60 < p_hasta then 'ahora'
        when extract(hour from t) < p_desde then 'hoy'
        else 'otro' end
    else 'otro' end
  from n
$$;

-- Perfil del usuario que hace la petición
create or replace function cp_yo() returns uuid
language sql stable security definer set search_path = public as $$
  select id from perfiles where auth_id = auth.uid()
$$;

create or replace function cp_req() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from perfiles where auth_id = auth.uid();
  if v is null then raise exception 'Debes iniciar sesión para continuar' using errcode = '28000'; end if;
  return v;
end $$;

create or replace function cp_faltas(p uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from faltas where perfil_id = p
$$;

create or replace function cp_no_suspendido(p uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if cp_faltas(p) >= 3 then
    raise exception 'Tu cuenta está suspendida por acumular 3 faltas graves';
  end if;
end $$;

create or replace function cp_notificar(p_perfil uuid, p_tipo text, p_texto text, p_enlace text)
returns void language sql security definer set search_path = public as $$
  insert into notificaciones (perfil_id, tipo, texto, enlace) values (p_perfil, p_tipo, p_texto, p_enlace)
$$;

create or replace function cp_mi_proveedor(p uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from proveedores where perfil_id = p
$$;

-- Proveedor en formato JSON (el mismo formato que usa la aplicación)
create or replace function cp_proveedor_json(pid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'userId', p.perfil_id, 'name', pe.nombre, 'photo', pe.foto,
    'company', p.empresa, 'profession', p.profesion,
    'services', coalesce((select jsonb_agg(servicio_id order by servicio_id) from proveedor_servicios where proveedor_id = p.id), '[]'::jsonb),
    'rating', p.calificacion, 'reviews', p.num_resenas, 'lat', p.lat, 'lng', p.lng,
    'departamento', p.departamento, 'municipio', p.municipio,
    'city', cp_lugar(m.nombre, d.nombre), 'coverageKm', p.cobertura_km,
    'schedule', jsonb_build_object('days', to_jsonb(p.dias), 'from', p.hora_desde, 'to', p.hora_hasta),
    'priceMin', p.precio_min, 'priceMax', p.precio_max, 'verified', p.verificado,
    'about', p.descripcion, 'offers', to_jsonb(p.ofrece),
    'portfolio', coalesce((select jsonb_agg(imagen order by orden, creado) from portafolio where proveedor_id = p.id), '[]'::jsonb),
    'phone', p.telefono, 'completed', p.completados,
    'availability', cp_disponibilidad(p.dias, p.hora_desde, p.hora_hasta))
  from proveedores p
  join perfiles pe on pe.id = p.perfil_id
  join municipios m on m.codigo = p.municipio
  join departamentos d on d.codigo = p.departamento
  where p.id = pid
$$;

-- Solicitud en formato JSON
create or replace function cp_solicitud_json(sid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', s.id, 'ownerAccountId', s.cliente_id, 'clientKey', s.cliente_id,
    'title', s.titulo, 'desc', s.descripcion, 'service', s.servicio_id,
    'location', jsonb_build_object('lat', s.lat, 'lng', s.lng,
       'label', coalesce(nullif(s.direccion, '') || ' · ', '') || cp_lugar(m.nombre, d.nombre)),
    'departamento', s.departamento, 'municipio', s.municipio,
    'municipioNombre', m.nombre, 'departamentoNombre', d.nombre, 'direccion', s.direccion,
    'payment', s.metodo_pago, 'wantsProposals', s.recibir_propuestas,
    'createdAt', cp_ms(s.creado), 'status', s.estado,
    'matched', coalesce((select jsonb_agg(proveedor_id) from solicitud_notificados where solicitud_id = s.id), '[]'::jsonb),
    'applicants', coalesce((select jsonb_agg(jsonb_build_object('providerId', proveedor_id, 'price', precio, 'at', cp_ms(visible_desde), 'note', nota) order by visible_desde)
                            from postulaciones where solicitud_id = s.id), '[]'::jsonb),
    'declinedBy', coalesce((select jsonb_agg(proveedor_id) from descartes where solicitud_id = s.id), '[]'::jsonb),
    'providerId', s.proveedor_id,
    'agreement', (select jsonb_build_object('date', to_char(a.fecha, 'YYYY-MM-DD'), 'time', to_char(a.hora, 'HH24:MI'),
                    'price', a.precio, 'code', a.codigo, 'signedAt', cp_ms(a.firmado), 'extendedDays', nullif(a.plazo_extra_dias, 0))
                  from acuerdos a where a.solicitud_id = s.id),
    'rating', (select jsonb_build_object('stars', estrellas, 'comment', comentario, 'at', cp_ms(creado))
               from calificaciones where solicitud_id = s.id and rol_autor = 'cliente'),
    'clientRating', (select jsonb_build_object('stars', estrellas, 'comment', comentario, 'at', cp_ms(creado))
               from calificaciones where solicitud_id = s.id and rol_autor = 'proveedor'),
    'finishedAt', cp_ms(s.finalizado), 'photo', s.foto,
    'punctualityPenalty', s.penalizacion_puntualidad, 'trace', s.traza,
    'gps', s.ubicacion_gps, 'gpsPrecision', s.precision_m)
  from solicitudes s
  join municipios m on m.codigo = s.municipio
  join departamentos d on d.codigo = s.departamento
  where s.id = sid
$$;

create or replace function cp_cliente_json(p uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'name', nombre, 'photo', foto, 'rating', calificacion, 'reviews', num_resenas)
  from perfiles where id = p
$$;

-- =====================================================================
--  ALGORITMO DE EMPAREJAMIENTO GEORREFERENCIADO
--  1) categoría  2) distancia (Haversine) dentro de la cobertura
--  3) disponibilidad horaria  4) ordena por reputación y cercanía
-- =====================================================================
create or replace function cp_match(p_servicio text, p_lat double precision, p_lng double precision, p_excluir uuid default null)
returns table (proveedor_id uuid, perfil_id uuid, distancia double precision, disponibilidad text, puntaje double precision)
language sql stable security definer set search_path = public as $$
  select p.id, p.perfil_id, d.km, a.disp,
         p.calificacion * 20 - d.km * 1.5
           + case when a.disp = 'ahora' then 6 else 0 end
           + case when p.verificado then 3 else 0 end
  from proveedores p
  join proveedor_servicios ps on ps.proveedor_id = p.id and ps.servicio_id = p_servicio
  cross join lateral (select cp_dist(p_lat, p_lng, p.lat, p.lng) as km) d
  cross join lateral (select cp_disponibilidad(p.dias, p.hora_desde, p.hora_hasta) as disp) a
  where p.activo and d.km <= p.cobertura_km
    and (p_excluir is null or p.perfil_id <> p_excluir)
  order by 5 desc
$$;

-- =====================================================================
--  API PÚBLICA (no requiere sesión)
-- =====================================================================
create or replace function api_catalogo() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'categorias', (select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.nombre, 'short', coalesce(c.corto, c.nombre), 'description', c.descripcion,
                      'providers', (select count(distinct ps.proveedor_id) from proveedor_servicios ps join servicios s on s.id = ps.servicio_id where s.categoria = c.id)) order by c.orden) from categorias c),
    'servicios', (select jsonb_agg(jsonb_build_object('id', id, 'name', nombre, 'short', corto, 'category', categoria, 'photo', foto) order by orden) from servicios))
$$;

create or replace function api_departamentos() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('codigo', codigo, 'nombre', nombre) order by nombre), '[]'::jsonb) from departamentos
$$;

create or replace function api_municipios(p_departamento text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('codigo', codigo, 'nombre', nombre, 'lat', lat, 'lng', lng) order by nombre), '[]'::jsonb)
  from municipios where departamento = p_departamento
$$;

-- Municipio más cercano a unas coordenadas GPS
create or replace function api_municipio_cercano(p_lat double precision, p_lng double precision) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('codigo', m.codigo, 'nombre', m.nombre, 'departamento', m.departamento,
                            'departamentoNombre', d.nombre, 'distanciaKm', round(cp_dist(p_lat, p_lng, m.lat, m.lng)::numeric, 1))
  from municipios m join departamentos d on d.codigo = m.departamento
  order by cp_dist(p_lat, p_lng, m.lat, m.lng) limit 1
$$;

create or replace function api_aliados() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'brand', marca, 'offer', oferta, 'cost', costo, 'color', color) order by costo), '[]'::jsonb) from aliados
$$;

create or replace function api_demo_cuentas() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('email', pe.correo, 'name', pe.nombre, 'photo', pe.foto,
           'role', case when p.id is null then 'Cliente' else 'Proveedor' end) order by pe.creado), '[]'::jsonb)
  from perfiles pe left join proveedores p on p.perfil_id = pe.id
  where pe.demo and pe.correo in (select valor from config where clave like 'demo_login_%')
$$;

-- Búsqueda de proveedores por ubicación administrativa (departamento / municipio),
-- sector, subcategoría y texto. Si se envía la ubicación GPS del usuario, las
-- distancias se calculan desde ese punto (sin cambiar el filtro de municipio).
create or replace function api_buscar_proveedores(
  p_departamento text default null, p_municipio text default null, p_categoria text default null,
  p_servicio text default null, p_texto text default null, p_solo_ahora boolean default false,
  p_orden text default 'rating', p_lat double precision default null, p_lng double precision default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_lat double precision; v_lng double precision; v_yo uuid := cp_yo(); v_ref text; res jsonb; v_desde text := 'municipio';
begin
  p_departamento := nullif(p_departamento, ''); p_municipio := nullif(p_municipio, '');
  p_categoria := nullif(p_categoria, ''); p_servicio := nullif(p_servicio, '');
  p_texto := nullif(trim(coalesce(p_texto, '')), '');
  if p_municipio is not null then
    select m.lat, m.lng, cp_lugar(m.nombre, d.nombre) into v_lat, v_lng, v_ref
    from municipios m join departamentos d on d.codigo = m.departamento where m.codigo = p_municipio;
  elsif p_departamento is not null then
    select lat, lng, nombre into v_lat, v_lng, v_ref from departamentos where codigo = p_departamento;
  end if;
  -- Referencia para medir distancias: el GPS del usuario si lo autorizó
  if p_lat is not null and p_lng is not null then
    v_desde := 'gps';
  else
    p_lat := v_lat; p_lng := v_lng;
  end if;

  with base as (
    select p.*, pe.nombre as pnombre,
           case when p_lat is null then null else cp_dist(p_lat, p_lng, p.lat, p.lng) end as km,
           case when v_lat is null then null else cp_dist(v_lat, v_lng, p.lat, p.lng) end as km_zona,
           cp_disponibilidad(p.dias, p.hora_desde, p.hora_hasta) as disp
    from proveedores p join perfiles pe on pe.id = p.perfil_id
    where p.activo and (v_yo is null or p.perfil_id <> v_yo)
  ), filtrados as (
    select b.*, case when p_municipio is not null and b.municipio <> p_municipio then 'cobertura' else 'local' end as ubic
    from base b
    where (p_municipio is null or b.municipio = p_municipio or b.km_zona <= b.cobertura_km)
      and (p_municipio is not null or p_departamento is null or b.departamento = p_departamento)
      and (p_categoria is null or exists (
            select 1 from proveedor_servicios ps join servicios s on s.id = ps.servicio_id
            where ps.proveedor_id = b.id and s.categoria = p_categoria))
      and (p_servicio is null or exists (select 1 from proveedor_servicios ps where ps.proveedor_id = b.id and ps.servicio_id = p_servicio))
      and (p_texto is null or (b.pnombre || ' ' || b.profesion || ' ' || b.empresa || ' ' || b.descripcion || ' ' || coalesce((
            select string_agg(s.nombre || ' ' || s.palabras, ' ') from proveedor_servicios ps join servicios s on s.id = ps.servicio_id where ps.proveedor_id = b.id), ''))
            ilike '%' || p_texto || '%')
      and (not p_solo_ahora or b.disp = 'ahora')
  )
  select jsonb_build_object(
    'referencia', v_ref,
    'distanciaDesde', v_desde,
    'total', (select count(*) from filtrados),
    'resultados', coalesce((select jsonb_agg(cp_proveedor_json(f.id) || jsonb_build_object('distanceKm', round(f.km::numeric, 1), 'ubicacion', f.ubic)
        order by case when p_orden = 'distance' then f.km end asc nulls last,
                 case when f.ubic = 'local' then 0 else 1 end, f.calificacion desc, f.num_resenas desc)
      from filtrados f), '[]'::jsonb))
  into res;
  return res;
end $$;

create or replace function api_proveedor(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select cp_proveedor_json(p_id) || jsonb_build_object('resenas', coalesce((
    select jsonb_agg(jsonb_build_object('name', split_part(pe.nombre, ' ', 1) || ' ' || left(split_part(pe.nombre, ' ', 2), 1) || '.',
                                        'stars', c.estrellas, 'text', c.comentario, 'date', to_char(c.creado, 'DD/MM/YYYY')) order by c.creado desc)
    from calificaciones c join solicitudes s on s.id = c.solicitud_id join perfiles pe on pe.id = c.autor_id
    where s.proveedor_id = p_id and c.rol_autor = 'cliente' and c.comentario <> ''), '[]'::jsonb))
$$;

create or replace function api_vista_previa(p_servicio text, p_municipio text) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from municipios m, cp_match(p_servicio, m.lat, m.lng, cp_yo()) where m.codigo = p_municipio
$$;

-- =====================================================================
--  API DE CUENTA
-- =====================================================================
create or replace function cp_cuenta_json(p uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', pe.id, 'name', pe.nombre, 'email', pe.correo, 'phone', coalesce(pe.celular, ''), 'document', coalesce(pe.documento, ''),
    'departamento', pe.departamento, 'municipio', pe.municipio,
    'city', coalesce(cp_lugar(m.nombre, d.nombre), ''), 'photo', pe.foto, 'clientId', pe.id,
    'providerId', (select id from proveedores where perfil_id = pe.id), 'verified', pe.verificado, 'demo', pe.demo)
  from perfiles pe left join municipios m on m.codigo = pe.municipio left join departamentos d on d.codigo = pe.departamento
  where pe.id = p
$$;

-- Se llama después de crear el usuario de autenticación
create or replace function api_completar_registro(
  p_nombre text default null, p_documento text default null, p_celular text default null,
  p_departamento text default null, p_municipio text default null, p_verificacion jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v uuid; v_correo text;
begin
  if uid is null then raise exception 'Debes iniciar sesión' using errcode = '28000'; end if;
  select id into v from perfiles where auth_id = uid;
  if v is not null then return cp_cuenta_json(v); end if;
  v_correo := lower(coalesce(auth.jwt() ->> 'email', (select email from auth.users where id = uid)));
  -- Cuentas de demostración: se vinculan al perfil de ejemplo con el mismo correo
  update perfiles set auth_id = uid where lower(correo) = v_correo and demo and auth_id is null returning id into v;
  if v is not null then return cp_cuenta_json(v); end if;

  if length(trim(coalesce(p_nombre, ''))) < 3 or position(' ' in trim(p_nombre)) = 0 then raise exception 'Escribe tu nombre y apellido'; end if;
  if coalesce(p_documento, '') !~ '^[0-9.]{6,15}$' then raise exception 'Número de documento no válido'; end if;
  if length(regexp_replace(coalesce(p_celular, ''), '\D', '', 'g')) <> 10 then raise exception 'El celular debe tener 10 dígitos'; end if;
  if not exists (select 1 from municipios where codigo = p_municipio and departamento = p_departamento) then
    raise exception 'Selecciona un departamento y un municipio válidos'; end if;
  if exists (select 1 from perfiles where documento = p_documento) then raise exception 'Ya existe una cuenta con ese número de documento'; end if;

  -- La detección facial ocurre en el dispositivo; aquí solo se guarda el resultado (nunca la imagen)
  if coalesce((p_verificacion ->> 'rostroDetectado')::boolean, false) is not true then
    raise exception 'Completa la validación facial: debemos detectar tu rostro frente a la cámara';
  end if;
  insert into perfiles (auth_id, nombre, documento, celular, correo, departamento, municipio, verificado, verificacion, puntos)
  values (uid, trim(p_nombre), p_documento, p_celular, v_correo, p_departamento, p_municipio, true,
          p_verificacion || jsonb_build_object('fecha', now()), 100)
  returning id into v;
  perform cp_notificar(v, 'info', '¡Bienvenido a ConectaPRO! Detectamos tu rostro en la validación facial. Ganaste 100 puntos de bienvenida.', '/perfil/beneficios');
  return cp_cuenta_json(v);
end $$;

create or replace function api_set_modo(p_modo text) returns void
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  if p_modo not in ('cliente', 'proveedor') then raise exception 'Modo no válido'; end if;
  if p_modo = 'proveedor' and cp_mi_proveedor(yo) is null then raise exception 'Primero configura tu perfil de proveedor'; end if;
  update perfiles set rol_activo = p_modo where id = yo;
end $$;

create or replace function api_actualizar_perfil(p_datos jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  if p_datos ? 'name' and length(trim(p_datos->>'name')) < 3 then raise exception 'El nombre es muy corto'; end if;
  if p_datos ? 'phone' and length(regexp_replace(p_datos->>'phone', '\D', '', 'g')) <> 10 then raise exception 'El celular debe tener 10 dígitos'; end if;
  if p_datos ? 'municipio' and not exists (select 1 from municipios where codigo = p_datos->>'municipio' and departamento = p_datos->>'departamento') then
    raise exception 'Selecciona un departamento y un municipio válidos'; end if;
  if p_datos ? 'photo' and length(coalesce(p_datos->>'photo', '')) > 600000 then raise exception 'La foto es demasiado grande'; end if;
  update perfiles set
    nombre = coalesce(trim(p_datos->>'name'), nombre),
    celular = coalesce(p_datos->>'phone', celular),
    departamento = coalesce(p_datos->>'departamento', departamento),
    municipio = coalesce(p_datos->>'municipio', municipio),
    foto = case when p_datos ? 'photo' then p_datos->>'photo' else foto end
  where id = yo;
  return cp_cuenta_json(yo);
end $$;

create or replace function api_preferencias(p_push boolean, p_email boolean, p_ia boolean) returns void
language sql security definer set search_path = public as $$
  update perfiles set notif_push = p_push, notif_email = p_email, notif_ia = p_ia where id = cp_req()
$$;

-- Elimina la cuenta y todos sus datos
create or replace function api_eliminar_cuenta() returns void
language plpgsql security definer set search_path = public, auth as $$
declare yo uuid := cp_req(); uid uuid := auth.uid();
begin
  delete from perfiles where id = yo;
  begin
    delete from auth.users where id = uid;
  exception when insufficient_privilege then
    null;  -- si no hay permiso sobre auth.users, al menos se borran todos los datos del perfil
  end;
end $$;

-- =====================================================================
--  ESTADO COMPLETO DEL USUARIO (lo que la app necesita para pintar)
-- =====================================================================
create or replace function api_estado() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  yo uuid := cp_req(); prov uuid := cp_mi_proveedor(yo);
  pv record; mis jsonb; ops jsonb; trab jsonb; convs jsonb; provs jsonb; clis jsonb;
begin
  select * into pv from proveedores where id = prov;

  select coalesce(jsonb_agg(cp_solicitud_json(id) order by creado desc), '[]'::jsonb) into mis
  from solicitudes where cliente_id = yo;

  if prov is not null then
    select coalesce(jsonb_agg(jsonb_build_object('r', cp_solicitud_json(s.id), 'distance', round(cp_dist(pv.lat, pv.lng, s.lat, s.lng)::numeric, 2)) order by s.creado desc), '[]'::jsonb)
    into ops
    from solicitudes s
    where s.estado = 'buscando' and s.cliente_id <> yo
      and s.servicio_id in (select servicio_id from proveedor_servicios where proveedor_id = prov)
      and cp_dist(pv.lat, pv.lng, s.lat, s.lng) <= pv.cobertura_km
      and not exists (select 1 from descartes d where d.solicitud_id = s.id and d.proveedor_id = prov);

    select coalesce(jsonb_agg(cp_solicitud_json(id) order by creado desc), '[]'::jsonb) into trab
    from solicitudes where proveedor_id = prov;
  end if;

  -- Proveedores mencionados en mis solicitudes
  select coalesce(jsonb_object_agg(x.pid, cp_proveedor_json(x.pid)), '{}'::jsonb) into provs from (
    select proveedor_id as pid from solicitudes where cliente_id = yo and proveedor_id is not null
    union select po.proveedor_id from postulaciones po join solicitudes s on s.id = po.solicitud_id where s.cliente_id = yo
    union select prov where prov is not null
  ) x where x.pid is not null;

  -- Clientes mencionados (oportunidades, trabajos, conversaciones)
  select coalesce(jsonb_object_agg(x.cid, cp_cliente_json(x.cid)), '{}'::jsonb) into clis from (
    select s.cliente_id as cid from solicitudes s where prov is not null and (s.proveedor_id = prov or s.estado = 'buscando')
    union select case when c.usuario_a = yo then c.usuario_b else c.usuario_a end from conversaciones c where yo in (c.usuario_a, c.usuario_b)
  ) x;

  select coalesce(jsonb_agg(conv order by ult desc nulls last), '[]'::jsonb) into convs from (
    select jsonb_build_object(
      'id', c.id,
      'peerKey', coalesce(pp.id, pe.id), 'peerUserId', pe.id, 'peerName', pe.nombre, 'peerPhoto', pe.foto,
      'peerRole', coalesce(pp.profesion, 'Cliente'),
      'unread', (select count(*) from mensajes m where m.conversacion_id = c.id and m.autor_id is distinct from yo
                 and m.creado > coalesce((select leido_hasta from lecturas l where l.conversacion_id = c.id and l.perfil_id = yo), 'epoch'::timestamptz)),
      'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id,
                    'from', case when m.autor_id is null then 'system' when m.autor_id = yo then 'me' else 'peer' end,
                    'text', m.texto, 'image', m.imagen, 'at', cp_ms(m.creado)) order by m.creado)
                  from (select * from mensajes where conversacion_id = c.id order by creado desc limit 100) m), '[]'::jsonb)) as conv,
      (select max(creado) from mensajes where conversacion_id = c.id) as ult
    from conversaciones c
    join perfiles pe on pe.id = case when c.usuario_a = yo then c.usuario_b else c.usuario_a end
    left join proveedores pp on pp.perfil_id = pe.id
    where yo in (c.usuario_a, c.usuario_b)
  ) z;

  return jsonb_build_object(
    'cuenta', cp_cuenta_json(yo),
    'modo', (select rol_activo from perfiles where id = yo),
    'puntos', (select puntos from perfiles where id = yo),
    'faltas', cp_faltas(yo),
    'prefs', (select jsonb_build_object('push', notif_push, 'email', notif_email, 'ia', notif_ia) from perfiles where id = yo),
    'proveedor', case when prov is null then null else cp_proveedor_json(prov) end,
    'solicitudes', mis,
    'oportunidades', coalesce(ops, '[]'::jsonb),
    'trabajos', coalesce(trab, '[]'::jsonb),
    'proveedores', provs,
    'clientes', clis,
    'conversaciones', convs,
    'notificaciones', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'kind', tipo, 'text', texto, 'link', enlace, 'read', leida, 'at', cp_ms(creado)) order by creado desc)
                       from (select * from notificaciones where perfil_id = yo order by creado desc limit 60) n), '[]'::jsonb),
    'direcciones', coalesce((select jsonb_agg(jsonb_build_object('id', di.id, 'name', di.nombre, 'address', di.direccion,
                       'departamento', di.departamento, 'municipio', di.municipio, 'label', cp_lugar(m.nombre, d.nombre)) order by di.creado)
                       from direcciones di join municipios m on m.codigo = di.municipio join departamentos d on d.codigo = di.departamento
                       where di.perfil_id = yo), '[]'::jsonb),
    'metodosPago', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'type', tipo, 'detail', detalle, 'default', predeterminado) order by creado)
                       from metodos_pago where perfil_id = yo), '[]'::jsonb),
    'misTrueques', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'offers', ofrece, 'needs', necesita, 'note', nota) order by creado desc)
                       from trueque_ofertas where perfil_id = yo and activo), '[]'::jsonb),
    'serverTime', cp_ms(now()));
end $$;

-- =====================================================================
--  PROVEEDOR: parametrización del oferente
-- =====================================================================
create or replace function api_guardar_proveedor(p_datos jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); pid uuid; v_lat double precision; v_lng double precision; s text; img text; i int := 0;
  v_dias int[]; v_desde int; v_hasta int; v_gps boolean := false;
begin
  if length(trim(coalesce(p_datos->>'company', ''))) < 2 then raise exception 'Escribe el nombre de tu empresa, emprendimiento o marca'; end if;
  if jsonb_array_length(coalesce(p_datos->'services', '[]'::jsonb)) = 0 then raise exception 'Selecciona al menos una categoría de servicio'; end if;
  select lat, lng into v_lat, v_lng from municipios where codigo = p_datos->>'municipio' and departamento = p_datos->>'departamento';
  if not found then raise exception 'Selecciona el departamento y municipio base'; end if;
  select coalesce(array_agg(x::int order by x::int), '{}') into v_dias from jsonb_array_elements_text(coalesce(p_datos->'days', '[]'::jsonb)) x;
  if cardinality(v_dias) = 0 then raise exception 'Selecciona los días de atención'; end if;
  v_desde := (p_datos->>'from')::int; v_hasta := (p_datos->>'to')::int;
  if v_hasta <= v_desde then raise exception 'La hora de cierre debe ser posterior a la de apertura'; end if;
  if length(trim(coalesce(p_datos->>'about', ''))) < 15 then raise exception 'Describe lo que haces (mínimo 15 caracteres)'; end if;
  if (p_datos->>'priceMax')::int < (p_datos->>'priceMin')::int then raise exception 'El precio máximo debe ser mayor o igual al mínimo'; end if;
  -- Punto GPS opcional: solo si está dentro del municipio elegido (menos de 25 km de su centro)
  v_gps := p_datos ? 'lat' and p_datos ? 'lng'
           and cp_dist((p_datos->>'lat')::double precision, (p_datos->>'lng')::double precision, v_lat, v_lng) < 25;

  pid := cp_mi_proveedor(yo);
  if pid is null then
    insert into proveedores (perfil_id, empresa, profesion, departamento, municipio, lat, lng, cobertura_km, dias, hora_desde, hora_hasta,
                             precio_min, precio_max, descripcion, ofrece, telefono, calificacion, num_resenas)
    values (yo, trim(p_datos->>'company'), coalesce(nullif(trim(p_datos->>'profession'), ''), 'Proveedor'),
            p_datos->>'departamento', p_datos->>'municipio',
            case when v_gps then (p_datos->>'lat')::double precision else v_lat end,
            case when v_gps then (p_datos->>'lng')::double precision else v_lng end,
            (p_datos->>'coverageKm')::int, v_dias, v_desde, v_hasta,
            (p_datos->>'priceMin')::int, (p_datos->>'priceMax')::int, trim(p_datos->>'about'),
            array(select jsonb_array_elements_text(coalesce(p_datos->'offers', '[]'::jsonb))),
            (select celular from perfiles where id = yo), 5.0, 0)
    returning id into pid;
  else
    update proveedores set empresa = trim(p_datos->>'company'),
      profesion = coalesce(nullif(trim(p_datos->>'profession'), ''), profesion),
      departamento = p_datos->>'departamento', municipio = p_datos->>'municipio',
      lat = case when v_gps then (p_datos->>'lat')::double precision when municipio = p_datos->>'municipio' then lat else v_lat end,
      lng = case when v_gps then (p_datos->>'lng')::double precision when municipio = p_datos->>'municipio' then lng else v_lng end,
      cobertura_km = (p_datos->>'coverageKm')::int, dias = v_dias, hora_desde = v_desde, hora_hasta = v_hasta,
      precio_min = (p_datos->>'priceMin')::int, precio_max = (p_datos->>'priceMax')::int, descripcion = trim(p_datos->>'about'),
      ofrece = array(select jsonb_array_elements_text(coalesce(p_datos->'offers', '[]'::jsonb)))
    where id = pid;
  end if;

  delete from proveedor_servicios where proveedor_id = pid;
  for s in select jsonb_array_elements_text(p_datos->'services') loop
    if not exists (select 1 from servicios where id = s) then raise exception 'Servicio no válido: %', s; end if;
    insert into proveedor_servicios values (pid, s);
  end loop;

  if p_datos ? 'portfolio' then
    delete from portafolio where proveedor_id = pid;
    for img in select jsonb_array_elements_text(p_datos->'portfolio') loop
      if length(img) > 600000 then raise exception 'Una de las fotos es demasiado grande'; end if;
      insert into portafolio (proveedor_id, imagen, orden) values (pid, img, i);
      i := i + 1;
      exit when i >= 8;
    end loop;
  end if;

  update perfiles set rol_activo = 'proveedor' where id = yo;
  return cp_proveedor_json(pid);
end $$;

-- =====================================================================
--  CLIENTE: publicar solicitud (orquestación + emparejamiento)
-- =====================================================================
create or replace function api_publicar(
  p_descripcion text, p_servicio text, p_departamento text, p_municipio text,
  p_lat double precision default null, p_lng double precision default null,
  p_direccion text default '', p_pago text default 'efectivo', p_propuestas boolean default true,
  p_precision int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  yo uuid := cp_req(); v_id uuid; v_lat double precision; v_lng double precision; v_titulo text; v_serv text;
  tr jsonb; n int := 0; r record; i int := 0; auto boolean; v_gps boolean := false;
begin
  perform cp_no_suspendido(yo);
  if length(trim(coalesce(p_descripcion, ''))) < 10 then raise exception 'Describe tu necesidad (mínimo 10 caracteres)'; end if;
  if length(p_descripcion) > 500 then raise exception 'La descripción no puede superar 500 caracteres'; end if;
  select nombre into v_serv from servicios where id = p_servicio;
  if v_serv is null then raise exception 'Selecciona una categoría de servicio válida'; end if;
  select lat, lng into v_lat, v_lng from municipios where codigo = p_municipio and departamento = p_departamento;
  if not found then raise exception 'Selecciona un departamento y un municipio válidos'; end if;
  if length(trim(coalesce(p_direccion, ''))) < 5 then raise exception 'Escribe la dirección donde se prestará el servicio'; end if;
  -- El municipio (división administrativa) lo elige la persona. El GPS solo se usa para
  -- precisar el punto si está dentro de ese municipio (a menos de 25 km de su centro).
  if p_lat is not null and p_lng is not null and cp_dist(p_lat, p_lng, v_lat, v_lng) < 25 then
    v_lat := p_lat; v_lng := p_lng; v_gps := true;
  end if;
  if p_pago not in ('efectivo', 'nequi', 'transferencia', 'tarjeta') then raise exception 'Método de pago no válido'; end if;

  v_titulo := left(trim(regexp_replace(trim(p_descripcion), '[.,\n].*$', '')), 48);
  if v_titulo = '' then v_titulo := v_serv; end if;

  tr := jsonb_build_object(
    'total', (select count(*) from proveedores where activo),
    'byCategory', (select count(*) from proveedor_servicios ps join proveedores p on p.id = ps.proveedor_id
                   where p.activo and ps.servicio_id = p_servicio and p.perfil_id <> yo),
    'byCoverage', (select count(*) from cp_match(p_servicio, v_lat, v_lng, yo)),
    'bySchedule', (select count(*) from cp_match(p_servicio, v_lat, v_lng, yo) where disponibilidad <> 'otro'));

  insert into solicitudes (cliente_id, titulo, descripcion, servicio_id, departamento, municipio, lat, lng, direccion,
                           metodo_pago, recibir_propuestas, foto, traza, ubicacion_gps, precision_m)
  values (yo, v_titulo, trim(p_descripcion), p_servicio, p_departamento, p_municipio, v_lat, v_lng, trim(p_direccion),
          p_pago, p_propuestas, (select foto from servicios where id = p_servicio), tr, v_gps, case when v_gps then p_precision end)
  returning id into v_id;

  select coalesce((select valor = 'true' from config where clave = 'auto_respuesta_demo'), true) into auto;

  for r in
    select m.proveedor_id, m.perfil_id, m.distancia, p.precio_min, p.precio_max, pe.auth_id, pe.demo
    from cp_match(p_servicio, v_lat, v_lng, yo) m
    join proveedores p on p.id = m.proveedor_id join perfiles pe on pe.id = m.perfil_id
  loop
    insert into solicitud_notificados values (v_id, r.proveedor_id, round(r.distancia::numeric, 2));
    perform cp_notificar(r.perfil_id, 'match',
      format('Nueva oportunidad de %s a %s km: "%s"', lower(v_serv), round(r.distancia::numeric, 1), v_titulo), '/oportunidad/' || v_id);
    n := n + 1;
    -- Proveedores de ejemplo (sin cuenta de acceso) responden solos para que la plataforma se pueda probar
    if auto and r.demo and r.auth_id is null and i < 3 then
      insert into postulaciones (solicitud_id, proveedor_id, precio, visible_desde)
      values (v_id, r.proveedor_id, greatest(5000, round((r.precio_min + r.precio_max) / 2.0 / 5000) * 5000), now() + make_interval(secs => 4 + i * 3));
      i := i + 1;
    end if;
  end loop;

  perform cp_notificar(yo, 'match', format('Notificamos a %s proveedores compatibles para "%s"', n, v_titulo), '/buscando/' || v_id);
  return jsonb_build_object('id', v_id, 'notificados', n, 'trace', tr, 'gps', v_gps);
end $$;

create or replace function api_editar_solicitud(p_id uuid, p_descripcion text, p_pago text, p_direccion text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  if length(trim(coalesce(p_descripcion, ''))) < 10 then raise exception 'Describe tu necesidad (mínimo 10 caracteres)'; end if;
  if p_pago not in ('efectivo', 'nequi', 'transferencia', 'tarjeta') then raise exception 'Método de pago no válido'; end if;
  update solicitudes set descripcion = trim(p_descripcion), metodo_pago = p_pago,
         direccion = coalesce(trim(p_direccion), direccion),
         titulo = coalesce(nullif(left(trim(regexp_replace(trim(p_descripcion), '[.,\n].*$', '')), 48), ''), titulo)
  where id = p_id and cliente_id = yo and estado = 'buscando';
  if not found then raise exception 'Solo puedes editar tus solicitudes que aún buscan proveedor'; end if;
  return cp_solicitud_json(p_id);
end $$;

create or replace function api_eliminar_solicitud(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  delete from solicitudes where id = p_id and cliente_id = yo and estado in ('buscando', 'cancelada');
  if not found then raise exception 'Solo puedes eliminar solicitudes que buscan proveedor o están canceladas'; end if;
end $$;

-- =====================================================================
--  PROVEEDOR: postularse / descartar
-- =====================================================================
create or replace function api_postular(p_solicitud uuid, p_precio int, p_nota text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); prov uuid := cp_mi_proveedor(yo); s solicitudes; v_nombre text;
begin
  if prov is null then raise exception 'Primero configura tu perfil de proveedor'; end if;
  perform cp_no_suspendido(yo);
  select * into s from solicitudes where id = p_solicitud;
  if s.id is null then raise exception 'La solicitud no existe'; end if;
  if s.cliente_id = yo then raise exception 'No puedes postularte a tu propia solicitud'; end if;
  if s.estado <> 'buscando' then raise exception 'Esta solicitud ya fue asignada'; end if;
  if not exists (select 1 from proveedor_servicios where proveedor_id = prov and servicio_id = s.servicio_id) then
    raise exception 'Esta solicitud no corresponde a tus categorías'; end if;
  if coalesce(p_precio, 0) < 5000 then raise exception 'El precio mínimo es $5.000'; end if;
  insert into postulaciones (solicitud_id, proveedor_id, precio, nota) values (p_solicitud, prov, p_precio, nullif(trim(coalesce(p_nota, '')), ''))
  on conflict (solicitud_id, proveedor_id) do update set precio = excluded.precio, nota = excluded.nota;
  select nombre into v_nombre from perfiles where id = yo;
  perform cp_notificar(s.cliente_id, 'match', format('%s aceptó tu solicitud "%s"', v_nombre, s.titulo), '/proveedores/' || s.id);
  return cp_solicitud_json(p_solicitud);
end $$;

create or replace function api_descartar(p_solicitud uuid) returns void
language plpgsql security definer set search_path = public as $$
declare prov uuid := cp_mi_proveedor(cp_req());
begin
  if prov is null then raise exception 'Primero configura tu perfil de proveedor'; end if;
  insert into descartes values (p_solicitud, prov) on conflict do nothing;
end $$;

-- =====================================================================
--  ACUERDO DIGITAL
-- =====================================================================
create or replace function cp_conversacion(a uuid, b uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid; x uuid := least(a, b); y uuid := greatest(a, b);
begin
  if a = b then raise exception 'No puedes escribirte a ti mismo'; end if;
  select id into v from conversaciones where usuario_a = x and usuario_b = y;
  if v is null then
    insert into conversaciones (usuario_a, usuario_b) values (x, y) on conflict do nothing returning id into v;
    if v is null then select id into v from conversaciones where usuario_a = x and usuario_b = y; end if;
  end if;
  return v;
end $$;

create or replace function api_confirmar_acuerdo(p_solicitud uuid, p_proveedor uuid, p_fecha date, p_hora text, p_precio int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); s solicitudes; v_codigo text; v_prov_perfil uuid; v_prov_nombre text; v_conv uuid;
begin
  select * into s from solicitudes where id = p_solicitud for update;
  if s.id is null or s.cliente_id <> yo then raise exception 'Solicitud no encontrada'; end if;
  if s.estado <> 'buscando' then raise exception 'Esta solicitud ya tiene un acuerdo'; end if;
  if not exists (select 1 from postulaciones where solicitud_id = p_solicitud and proveedor_id = p_proveedor and visible_desde <= now()) then
    raise exception 'Este proveedor no se ha postulado a tu solicitud'; end if;
  if p_fecha < (now() at time zone 'America/Bogota')::date then raise exception 'La fecha no puede ser anterior a hoy'; end if;

  v_codigo := 'CP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('acuerdo_seq')::text, 4, '0');
  insert into acuerdos (solicitud_id, codigo, fecha, hora, precio) values (p_solicitud, v_codigo, p_fecha, p_hora::time, p_precio);
  update solicitudes set estado = 'en_curso', proveedor_id = p_proveedor where id = p_solicitud;

  select p.perfil_id, pe.nombre into v_prov_perfil, v_prov_nombre from proveedores p join perfiles pe on pe.id = p.perfil_id where p.id = p_proveedor;
  perform cp_notificar(yo, 'agreement', format('Acuerdo digital %s confirmado con %s', v_codigo, v_prov_nombre), '/solicitud/' || p_solicitud);
  perform cp_notificar(v_prov_perfil, 'agreement', format('¡Te eligieron! Nuevo acuerdo %s: "%s"', v_codigo, s.titulo), '/trabajo/' || p_solicitud);
  v_conv := cp_conversacion(yo, v_prov_perfil);
  insert into mensajes (conversacion_id, autor_id, texto) values (v_conv, null, format('Acuerdo %s confirmado · %s', v_codigo, s.titulo));
  return cp_solicitud_json(p_solicitud) || jsonb_build_object('conversationId', v_conv);
end $$;

-- =====================================================================
--  CALIFICACIÓN MUTUA
-- =====================================================================
create or replace function api_calificar(p_solicitud uuid, p_estrellas int, p_comentario text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); s solicitudes; v_prov_perfil uuid; v_rol text; ya_completa boolean;
begin
  select * into s from solicitudes where id = p_solicitud for update;
  if s.id is null or s.proveedor_id is null then raise exception 'Solicitud no encontrada'; end if;
  if s.estado not in ('en_curso', 'completada') then raise exception 'Este servicio no se puede calificar'; end if;
  if p_estrellas not between 1 and 5 then raise exception 'Elige de 1 a 5 estrellas'; end if;
  select perfil_id into v_prov_perfil from proveedores where id = s.proveedor_id;
  if yo = s.cliente_id then v_rol := 'cliente';
  elsif yo = v_prov_perfil then v_rol := 'proveedor';
  else raise exception 'No participaste en este servicio'; end if;
  if exists (select 1 from calificaciones where solicitud_id = p_solicitud and rol_autor = v_rol) then
    raise exception 'Ya calificaste este servicio'; end if;

  insert into calificaciones (solicitud_id, autor_id, rol_autor, estrellas, comentario)
  values (p_solicitud, yo, v_rol, p_estrellas, left(coalesce(trim(p_comentario), ''), 200));

  ya_completa := s.estado = 'completada';
  update solicitudes set estado = 'completada', finalizado = coalesce(finalizado, now()) where id = p_solicitud;
  update perfiles set puntos = puntos + 50 where id = yo;

  if v_rol = 'cliente' then
    update proveedores set calificacion = round(((calificacion * num_resenas + p_estrellas) / (num_resenas + 1))::numeric, 1),
           num_resenas = num_resenas + 1, completados = completados + case when ya_completa then 0 else 1 end
    where id = s.proveedor_id;
    perform cp_notificar(v_prov_perfil, 'rating', format('Recibiste una calificación de %s estrellas por "%s"', p_estrellas, s.titulo), '/trabajo/' || s.id);
  else
    update perfiles set calificacion = round(((calificacion * num_resenas + p_estrellas) / (num_resenas + 1))::numeric, 1),
           num_resenas = num_resenas + 1 where id = s.cliente_id;
    if not ya_completa then update proveedores set completados = completados + 1 where id = s.proveedor_id; end if;
    perform cp_notificar(s.cliente_id, 'rating', format('El proveedor marcó "%s" como realizado. ¡Califícalo!', s.titulo), '/calificar/' || s.id);
  end if;
  perform cp_notificar(yo, 'rating', '¡Ganaste 50 puntos ConectaPRO por calificar!', '/perfil/beneficios');
  return cp_solicitud_json(p_solicitud);
end $$;

-- =====================================================================
--  FLEXIBILIDAD, CANCELACIONES Y REGLA DE "TRES STRIKES"
-- =====================================================================
create or replace function api_extender_plazo(p_solicitud uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); s solicitudes; v_prov_perfil uuid;
begin
  select * into s from solicitudes where id = p_solicitud and cliente_id = yo and estado = 'en_curso';
  if s.id is null then raise exception 'Solicitud no encontrada o no está en curso'; end if;
  if s.penalizacion_puntualidad then raise exception 'Ya otorgaste un plazo adicional'; end if;
  update acuerdos set plazo_extra_dias = 2 where solicitud_id = p_solicitud;
  update solicitudes set penalizacion_puntualidad = true where id = p_solicitud;
  select perfil_id into v_prov_perfil from proveedores where id = s.proveedor_id;
  update proveedores set calificacion = greatest(1, calificacion - 0.1) where id = s.proveedor_id;
  perform cp_notificar(v_prov_perfil, 'strike', format('Se registró un incumplimiento de puntualidad en "%s". Tienes 2 días adicionales.', s.titulo), '/trabajo/' || s.id);
  return cp_solicitud_json(p_solicitud);
end $$;

create or replace function api_cancelar(p_solicitud uuid, p_con_falta boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); s solicitudes; v_prov_perfil uuid; n int;
begin
  select * into s from solicitudes where id = p_solicitud and cliente_id = yo;
  if s.id is null then raise exception 'Solicitud no encontrada'; end if;
  if s.estado not in ('buscando', 'en_curso') then raise exception 'Esta solicitud ya terminó'; end if;
  update solicitudes set estado = 'cancelada', finalizado = now() where id = p_solicitud;
  if s.estado = 'en_curso' then
    select perfil_id into v_prov_perfil from proveedores where id = s.proveedor_id;
    perform cp_notificar(v_prov_perfil, 'info', format('El cliente canceló el acuerdo de "%s"', s.titulo), '/trabajo/' || s.id);
    if p_con_falta then
      insert into faltas (perfil_id, solicitud_id, motivo) values (yo, p_solicitud, 'Cancelación de un acuerdo confirmado');
      n := cp_faltas(yo);
      perform cp_notificar(yo, 'strike', format('Se registró una falta grave (%s/3). Al llegar a 3 tu cuenta será suspendida.', n), '/perfil/seguridad');
    end if;
  end if;
  return cp_solicitud_json(p_solicitud);
end $$;

create or replace function api_no_asistir(p_solicitud uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); prov uuid := cp_mi_proveedor(yo); s solicitudes; n int;
begin
  select * into s from solicitudes where id = p_solicitud and proveedor_id = prov and estado = 'en_curso';
  if s.id is null then raise exception 'Trabajo no encontrado o no está en curso'; end if;
  update solicitudes set estado = 'cancelada', finalizado = now() where id = p_solicitud;
  insert into faltas (perfil_id, solicitud_id, motivo) values (yo, p_solicitud, 'No realizó un trabajo acordado');
  n := cp_faltas(yo);
  perform cp_notificar(yo, 'strike', format('Se registró una falta grave por no realizar un trabajo acordado (%s/3).', n), '/perfil/seguridad');
  perform cp_notificar(s.cliente_id, 'info', format('El proveedor canceló "%s". Puedes volver a publicar tu solicitud.', s.titulo), '/solicitud/' || s.id);
  return cp_solicitud_json(p_solicitud);
end $$;

-- =====================================================================
--  MENSAJERÍA Y NOTIFICACIONES
-- =====================================================================
create or replace function api_abrir_conversacion(p_perfil uuid default null, p_proveedor uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); otro uuid := p_perfil;
begin
  if otro is null and p_proveedor is not null then select perfil_id into otro from proveedores where id = p_proveedor; end if;
  if otro is null or not exists (select 1 from perfiles where id = otro) then raise exception 'Usuario no encontrado'; end if;
  return cp_conversacion(yo, otro);
end $$;

create or replace function api_enviar_mensaje(p_conversacion uuid, p_texto text default null, p_imagen text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); c conversaciones; otro uuid; v_id uuid; v_nombre text;
begin
  select * into c from conversaciones where id = p_conversacion and yo in (usuario_a, usuario_b);
  if c.id is null then raise exception 'Conversación no encontrada'; end if;
  if coalesce(trim(p_texto), '') = '' and p_imagen is null then raise exception 'El mensaje está vacío'; end if;
  if length(coalesce(p_texto, '')) > 2000 then raise exception 'El mensaje es demasiado largo'; end if;
  if length(coalesce(p_imagen, '')) > 600000 then raise exception 'La imagen es demasiado grande'; end if;
  insert into mensajes (conversacion_id, autor_id, texto, imagen) values (p_conversacion, yo, nullif(trim(p_texto), ''), p_imagen) returning id into v_id;
  insert into lecturas values (p_conversacion, yo, now()) on conflict (conversacion_id, perfil_id) do update set leido_hasta = now();
  otro := case when c.usuario_a = yo then c.usuario_b else c.usuario_a end;
  select nombre into v_nombre from perfiles where id = yo;
  perform cp_notificar(otro, 'message', format('%s: %s', split_part(v_nombre, ' ', 1), coalesce(left(nullif(trim(p_texto), ''), 80), '📷 Foto')), '/chat/' || p_conversacion);
  return jsonb_build_object('id', v_id);
end $$;

create or replace function api_leer_conversacion(p_conversacion uuid) returns void
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  if not exists (select 1 from conversaciones where id = p_conversacion and yo in (usuario_a, usuario_b)) then return; end if;
  insert into lecturas values (p_conversacion, yo, now()) on conflict (conversacion_id, perfil_id) do update set leido_hasta = now();
  update notificaciones set leida = true where perfil_id = yo and enlace = '/chat/' || p_conversacion and not leida;
end $$;

create or replace function api_leer_notificaciones() returns void
language sql security definer set search_path = public as $$
  update notificaciones set leida = true where perfil_id = cp_req() and not leida
$$;

-- =====================================================================
--  DIRECCIONES Y MÉTODOS DE PAGO (CRUD)
-- =====================================================================
create or replace function api_direccion_guardar(p_id uuid, p_nombre text, p_direccion text, p_departamento text, p_municipio text) returns void
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  if length(trim(coalesce(p_nombre, ''))) < 2 or length(trim(coalesce(p_direccion, ''))) < 4 then raise exception 'Escribe el nombre y la dirección'; end if;
  if not exists (select 1 from municipios where codigo = p_municipio and departamento = p_departamento) then raise exception 'Selecciona un departamento y un municipio válidos'; end if;
  if p_id is null then
    insert into direcciones (perfil_id, nombre, direccion, departamento, municipio) values (yo, trim(p_nombre), trim(p_direccion), p_departamento, p_municipio);
  else
    update direcciones set nombre = trim(p_nombre), direccion = trim(p_direccion), departamento = p_departamento, municipio = p_municipio
    where id = p_id and perfil_id = yo;
    if not found then raise exception 'Dirección no encontrada'; end if;
  end if;
end $$;

create or replace function api_direccion_eliminar(p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from direcciones where id = p_id and perfil_id = cp_req()
$$;

create or replace function api_pago_guardar(p_tipo text, p_detalle text) returns void
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  if p_tipo not in ('efectivo', 'nequi', 'transferencia', 'tarjeta') then raise exception 'Método de pago no válido'; end if;
  insert into metodos_pago (perfil_id, tipo, detalle, predeterminado)
  values (yo, p_tipo, coalesce(trim(p_detalle), ''), not exists (select 1 from metodos_pago where perfil_id = yo));
end $$;

create or replace function api_pago_predeterminado(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update metodos_pago set predeterminado = (id = p_id) where perfil_id = cp_req()
$$;

create or replace function api_pago_eliminar(p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from metodos_pago where id = p_id and perfil_id = cp_req()
$$;

-- =====================================================================
--  TRUEQUE
-- =====================================================================
create or replace function api_trueque_buscar(p_ofrece text, p_necesita text, p_departamento text default null) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id, 'userId', pe.id, 'name', pe.nombre, 'photo', pe.foto, 'offers', t.ofrece, 'needs', t.necesita, 'note', t.nota,
      'city', cp_lugar(m.nombre, d.nombre), 'perfect', (t.ofrece = p_necesita and t.necesita = p_ofrece))
    order by (t.ofrece = p_necesita and t.necesita = p_ofrece) desc, t.creado desc), '[]'::jsonb)
  from trueque_ofertas t join perfiles pe on pe.id = t.perfil_id
  left join municipios m on m.codigo = pe.municipio left join departamentos d on d.codigo = pe.departamento
  where t.activo and pe.id is distinct from cp_yo()
    and (t.ofrece = p_necesita or t.necesita = p_ofrece)
    and (nullif(p_departamento, '') is null or pe.departamento = p_departamento)
$$;

create or replace function api_trueque_publicar(p_ofrece text, p_necesita text, p_nota text) returns void
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req();
begin
  if p_ofrece = p_necesita then raise exception 'Lo que ofreces y lo que necesitas deben ser distintos'; end if;
  if length(trim(coalesce(p_nota, ''))) < 5 then raise exception 'Escribe una nota corta de tu propuesta'; end if;
  insert into trueque_ofertas (perfil_id, ofrece, necesita, nota) values (yo, p_ofrece, p_necesita, trim(p_nota));
end $$;

create or replace function api_trueque_eliminar(p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from trueque_ofertas where id = p_id and perfil_id = cp_req()
$$;

-- =====================================================================
--  FIDELIZACIÓN
-- =====================================================================
create or replace function api_canjear(p_aliado int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare yo uuid := cp_req(); a aliados; v_codigo text;
begin
  select * into a from aliados where id = p_aliado;
  if a.id is null then raise exception 'Beneficio no encontrado'; end if;
  update perfiles set puntos = puntos - a.costo where id = yo and puntos >= a.costo;
  if not found then raise exception 'No tienes puntos suficientes'; end if;
  v_codigo := 'CP-' || upper(substr(md5(random()::text), 1, 6));
  insert into canjes (perfil_id, aliado_id, codigo) values (yo, p_aliado, v_codigo);
  return jsonb_build_object('code', v_codigo, 'brand', a.marca);
end $$;

-- =====================================================================
--  Permisos de ejecución de la API
-- =====================================================================
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  api_catalogo(), api_departamentos(), api_municipios(text), api_municipio_cercano(double precision, double precision),
  api_aliados(), api_demo_cuentas(), api_buscar_proveedores(text, text, text, text, text, boolean, text, double precision, double precision), api_proveedor(uuid),
  api_vista_previa(text, text), api_trueque_buscar(text, text, text)
to anon, authenticated;
grant execute on function
  api_completar_registro(text, text, text, text, text, jsonb), api_set_modo(text), api_actualizar_perfil(jsonb),
  api_preferencias(boolean, boolean, boolean), api_eliminar_cuenta(), api_estado(), api_guardar_proveedor(jsonb),
  api_publicar(text, text, text, text, double precision, double precision, text, text, boolean, int),
  api_editar_solicitud(uuid, text, text, text), api_eliminar_solicitud(uuid), api_postular(uuid, int, text), api_descartar(uuid),
  api_confirmar_acuerdo(uuid, uuid, date, text, int), api_calificar(uuid, int, text), api_extender_plazo(uuid),
  api_cancelar(uuid, boolean), api_no_asistir(uuid), api_abrir_conversacion(uuid, uuid), api_enviar_mensaje(uuid, text, text),
  api_leer_conversacion(uuid), api_leer_notificaciones(), api_direccion_guardar(uuid, text, text, text, text),
  api_direccion_eliminar(uuid), api_pago_guardar(text, text), api_pago_predeterminado(uuid), api_pago_eliminar(uuid),
  api_trueque_publicar(text, text, text), api_trueque_eliminar(uuid), api_canjear(int)
to authenticated;
