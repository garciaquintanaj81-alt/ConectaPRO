-- =====================================================================
--  Datos de ejemplo de solicitudes, acuerdos, chats y notificaciones.
--  cp_sembrar_demo() borra y vuelve a crear SOLO los datos de las
--  personas de ejemplo (perfiles.demo = true). Nunca toca usuarios reales.
-- =====================================================================
create or replace function cp_demo_sol(
  p_id uuid, p_cliente uuid, p_titulo text, p_desc text, p_servicio text, p_muni text, p_este double precision, p_norte double precision,
  p_pago text, p_creado timestamptz, p_estado text, p_proveedor uuid default null, p_foto text default null, p_final timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
declare m municipios;
begin
  select * into m from municipios where codigo = p_muni;
  insert into solicitudes (id, cliente_id, titulo, descripcion, servicio_id, departamento, municipio, lat, lng, metodo_pago,
                           estado, proveedor_id, foto, creado, finalizado)
  values (p_id, p_cliente, p_titulo, p_desc, p_servicio, m.departamento, p_muni,
          m.lat + p_norte / 110.574, m.lng + p_este / (111.32 * cos(radians(m.lat))),
          p_pago, p_estado, p_proveedor, coalesce(p_foto, (select foto from servicios where id = p_servicio)), p_creado, p_final);
  if p_estado = 'buscando' then
    insert into solicitud_notificados (solicitud_id, proveedor_id, distancia_km)
    select p_id, x.proveedor_id, round(x.distancia::numeric, 2)
    from solicitudes s, cp_match(p_servicio, s.lat, s.lng, p_cliente) x where s.id = p_id;
  end if;
end $$;

create or replace function cp_sembrar_demo() returns void
language plpgsql security definer set search_path = public as $$
declare
  hoy date := (now() at time zone 'America/Bogota')::date;
  -- perfiles
  dani uuid := 'a0000000-0000-4000-8000-000000000001'; carlos uuid := 'a0000000-0000-4000-8000-000000000002';
  juan uuid := 'a0000000-0000-4000-8000-000000000003'; andres uuid := 'a0000000-0000-4000-8000-000000000004';
  maria uuid := 'a0000000-0000-4000-8000-000000000005'; santiago uuid := 'a0000000-0000-4000-8000-000000000006';
  laura uuid := 'a0000000-0000-4000-8000-000000000007'; pedro uuid := 'a0000000-0000-4000-8000-000000000008';
  valeria uuid := 'a0000000-0000-4000-8000-000000000009'; oscar uuid := 'a0000000-0000-4000-8000-000000000010';
  nataliap uuid := 'a0000000-0000-4000-8000-000000000011'; camila uuid := 'a0000000-0000-4000-8000-000000000012';
  felipe uuid := 'a0000000-0000-4000-8000-000000000013'; sofia_pe uuid := 'a0000000-0000-4000-8000-000000000022';
  -- proveedores
  v_carlos uuid := 'b0000000-0000-4000-8000-000000000002'; v_andres uuid := 'b0000000-0000-4000-8000-000000000004';
  v_luis uuid := 'b0000000-0000-4000-8000-000000000020'; v_diego uuid := 'b0000000-0000-4000-8000-000000000021';
  v_sofia uuid := 'b0000000-0000-4000-8000-000000000022';
  c_dc uuid; c_mc uuid; c_da uuid; c_ds uuid;
  k int;
  t timestamptz;
begin
  -- 1. Limpia los datos transaccionales de las personas de ejemplo
  delete from solicitudes where cliente_id in (select id from perfiles where demo);
  delete from conversaciones where usuario_a in (select id from perfiles where demo) and usuario_b in (select id from perfiles where demo);
  delete from notificaciones where perfil_id in (select id from perfiles where demo);
  delete from faltas where perfil_id in (select id from perfiles where demo);
  delete from canjes where perfil_id in (select id from perfiles where demo);
  delete from direcciones where perfil_id in (select id from perfiles where demo);
  delete from metodos_pago where perfil_id in (select id from perfiles where demo);
  update proveedores set calificacion = calificacion_ini, num_resenas = resenas_ini, completados = completados_ini, activo = true
   where calificacion_ini is not null;
  update perfiles set puntos = case id when dani then 320 when carlos then 540 when juan then 180 when andres then 410 else 100 end,
         rol_activo = case when id in (carlos, andres) then 'proveedor' else 'cliente' end
   where demo;

  -- 2. Historial de Daniela
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000001', dani, 'Reparación de fuga de agua',
    'Necesito reparar una tubería rota, se presenta una fuga de agua en la cocina.', 'plomeria', '05615', 0, 0, 'efectivo',
    (hoy + time '08:15') at time zone 'America/Bogota', 'en_curso', v_carlos, 'img/sol1.jpg');
  insert into postulaciones (solicitud_id, proveedor_id, precio, visible_desde) values
    ('c0000000-0000-4000-8000-000000000001', v_carlos, 60000, (hoy + time '08:17') at time zone 'America/Bogota'),
    ('c0000000-0000-4000-8000-000000000001', v_andres, 55000, (hoy + time '08:19') at time zone 'America/Bogota');
  insert into acuerdos (solicitud_id, codigo, fecha, hora, precio, firmado) values
    ('c0000000-0000-4000-8000-000000000001', 'CP-2026-0481', hoy, '15:00', 60000, (hoy + time '11:40') at time zone 'America/Bogota');

  perform cp_demo_sol('c0000000-0000-4000-8000-000000000002', dani, 'Instalación de lámparas', 'Instalar 3 lámparas de techo en la sala.',
    'electricidad', '05615', 0, 0, 'transferencia', now() - interval '9 days', 'completada', v_andres, 'img/sol2.jpg', now() - interval '8 days');
  insert into postulaciones (solicitud_id, proveedor_id, precio, visible_desde) values ('c0000000-0000-4000-8000-000000000002', v_andres, 70000, now() - interval '9 days');
  insert into acuerdos (solicitud_id, codigo, fecha, hora, precio, firmado) values ('c0000000-0000-4000-8000-000000000002', 'CP-2026-0412', hoy - 8, '14:00', 70000, now() - interval '9 days');
  insert into calificaciones (solicitud_id, autor_id, rol_autor, estrellas, comentario, creado) values
    ('c0000000-0000-4000-8000-000000000002', dani, 'cliente', 5, 'Instaló las lámparas en menos de una hora. Muy amable.', now() - interval '8 days'),
    ('c0000000-0000-4000-8000-000000000002', andres, 'proveedor', 5, 'Clienta muy puntual con el pago.', now() - interval '8 days');

  perform cp_demo_sol('c0000000-0000-4000-8000-000000000003', dani, 'Pintura de habitación', 'Pintar habitación principal de 12 m².',
    'pintura', '05615', 0, 0, 'nequi', now() - interval '17 days', 'cancelada', v_luis, 'img/sol3.jpg', now() - interval '15 days');

  perform cp_demo_sol('c0000000-0000-4000-8000-000000000004', dani, 'Mantenimiento aire acond.', 'Mantenimiento preventivo de aire acondicionado de 12.000 BTU.',
    'aire', '05615', 0, 0, 'tarjeta', now() - interval '29 days', 'completada', v_diego, 'img/sol4.jpg', now() - interval '28 days');
  insert into postulaciones (solicitud_id, proveedor_id, precio, visible_desde) values ('c0000000-0000-4000-8000-000000000004', v_diego, 90000, now() - interval '29 days');
  insert into acuerdos (solicitud_id, codigo, fecha, hora, precio, firmado) values ('c0000000-0000-4000-8000-000000000004', 'CP-2026-0377', hoy - 28, '10:00', 90000, now() - interval '29 days');
  insert into calificaciones (solicitud_id, autor_id, rol_autor, estrellas, comentario, creado) values
    ('c0000000-0000-4000-8000-000000000004', dani, 'cliente', 5, 'Muy ordenado y explicó todo.', now() - interval '28 days');

  -- Rutina: corte de cabello aproximadamente cada mes (alimenta la IA predictiva)
  k := 0;
  foreach t in array array[now() - interval '92 days', now() - interval '61 days', now() - interval '31 days'] loop
    k := k + 1;
    perform cp_demo_sol(('c0000000-0000-4000-8000-00000000010' || k)::uuid, dani, 'Corte de cabello', 'Corte y cepillado a domicilio.',
      'peluqueria', '05615', 0, 0, 'nequi', t - interval '1 day', 'completada', v_sofia, null, t);
    insert into postulaciones (solicitud_id, proveedor_id, precio, visible_desde) values (('c0000000-0000-4000-8000-00000000010' || k)::uuid, v_sofia, 35000, t - interval '1 day');
    insert into acuerdos (solicitud_id, codigo, fecha, hora, precio, firmado) values (('c0000000-0000-4000-8000-00000000010' || k)::uuid, 'CP-2026-021' || k, (t at time zone 'America/Bogota')::date, '11:00', 35000, t - interval '1 day');
    insert into calificaciones (solicitud_id, autor_id, rol_autor, estrellas, comentario, creado) values (('c0000000-0000-4000-8000-00000000010' || k)::uuid, dani, 'cliente', 5, 'Siempre excelente.', t);
  end loop;

  -- 3. Solicitudes abiertas (oportunidades para proveedores)
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000011', maria, 'Fuga de agua en la cocina', 'Necesito reparar una fuga de agua en la cocina.', 'plomeria', '05615', 1.6, 1.8, 'efectivo', now() - interval '5 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000012', juan, 'Instalación de lámparas', 'Instalación de lámparas en apartamento.', 'electricidad', '05615', -0.5, 3.0, 'transferencia', now() - interval '18 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000013', santiago, 'Pintar habitación', 'Pintar habitación de 12 m².', 'pintura', '05615', 2.2, -0.4, 'nequi', now() - interval '25 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000014', laura, 'Cambio de grifería', 'Cambio de grifería del lavamanos y revisión del sanitario que gotea.', 'plomeria', '05615', -1.1, 0.2, 'tarjeta', now() - interval '48 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000015', pedro, 'Destapar cañería', 'Destapar cañería del baño principal, es urgente.', 'plomeria', '05615', 3.1, 2.4, 'efectivo', now() - interval '95 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000016', laura, 'Mantenimiento de aires', 'Mantenimiento de 2 aires acondicionados en local comercial.', 'aire', '05615', 0.4, 1.2, 'transferencia', now() - interval '70 minutes', 'buscando');
  -- Cúcuta y área metropolitana
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000021', valeria, 'Fuga en el baño', 'Se sale el agua por la base del sanitario, necesito plomero hoy.', 'plomeria', '54001', 0.4, 0.5, 'efectivo', now() - interval '12 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000022', oscar, 'Revisión eléctrica', 'Se botan los breakers cuando prendo el aire. Necesito revisión.', 'electricidad', '54001', 1.0, -0.4, 'nequi', now() - interval '40 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000023', nataliap, 'Corte y cepillado', 'Corte y cepillado a domicilio para el sábado.', 'peluqueria', '54874', 0.1, 0.2, 'efectivo', now() - interval '2 hours', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000024', valeria, 'Mantenimiento de aire', 'Mantenimiento de aire acondicionado de 18.000 BTU.', 'aire', '54001', 0.4, 0.5, 'transferencia', now() - interval '3 hours', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000025', oscar, 'Aseo general', 'Aseo general de apartamento de 3 habitaciones.', 'limpieza', '54001', 1.0, -0.4, 'efectivo', now() - interval '5 hours', 'buscando');
  -- Otras ciudades
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000031', camila, 'Aire no enfría', 'El aire acondicionado no enfría, posible falta de gas.', 'aire', '68001', 0.2, 0.3, 'tarjeta', now() - interval '30 minutes', 'buscando');
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000032', felipe, 'Portátil lento', 'Mi portátil está muy lento, necesito formateo y limpieza.', 'computadores', '11001', -1.0, 2.0, 'transferencia', now() - interval '50 minutes', 'buscando');

  -- Trabajo en curso de Carlos con María
  perform cp_demo_sol('c0000000-0000-4000-8000-000000000017', maria, 'Revisión de tubería del patio', 'Hay humedad en la pared del patio, posible tubería rota.', 'plomeria', '05615', 1.6, 1.8, 'efectivo', now() - interval '1 day', 'en_curso', v_carlos);
  insert into postulaciones (solicitud_id, proveedor_id, precio, visible_desde) values ('c0000000-0000-4000-8000-000000000017', v_carlos, 75000, now() - interval '1 day');
  insert into acuerdos (solicitud_id, codigo, fecha, hora, precio, firmado) values ('c0000000-0000-4000-8000-000000000017', 'CP-2026-0479', hoy + 1, '09:00', 75000, now() - interval '1 day');

  -- 4. Conversaciones
  c_dc := cp_conversacion(dani, carlos);
  insert into mensajes (conversacion_id, autor_id, texto, imagen, creado) values
    (c_dc, dani, 'Hola, buenas tardes, necesito que me repares una tubería en la cocina, ¿cuándo tienes disponibilidad?', null, (hoy + time '11:32') at time zone 'America/Bogota'),
    (c_dc, carlos, 'Sí, claro. ¿Me puedes enviar una foto de la fuga?', null, (hoy + time '11:33') at time zone 'America/Bogota'),
    (c_dc, dani, null, 'img/fuga.jpg', (hoy + time '11:34') at time zone 'America/Bogota'),
    (c_dc, carlos, 'Perfecto, puede ser que sea una unión. Te confirmo que puedo ir mañana en la mañana.', null, (hoy + time '11:37') at time zone 'America/Bogota'),
    (c_dc, dani, 'Listo, perfecto. ¿A qué hora podrías?', null, (hoy + time '11:38') at time zone 'America/Bogota');
  insert into lecturas values (c_dc, dani, (hoy + time '11:38') at time zone 'America/Bogota'), (c_dc, carlos, (hoy + time '11:37') at time zone 'America/Bogota')
    on conflict (conversacion_id, perfil_id) do update set leido_hasta = excluded.leido_hasta;
  c_mc := cp_conversacion(maria, carlos);
  insert into mensajes (conversacion_id, autor_id, texto, creado) values
    (c_mc, maria, 'Carlos, ¿mañana a las 9:00 a.m. sigue en pie?', now() - interval '3 hours'),
    (c_mc, carlos, 'Sí señora, allá estaré puntual.', now() - interval '170 minutes');
  insert into lecturas values (c_mc, carlos, now()) on conflict (conversacion_id, perfil_id) do update set leido_hasta = excluded.leido_hasta;
  c_da := cp_conversacion(dani, andres);
  insert into mensajes (conversacion_id, autor_id, texto, creado) values (c_da, andres, '¡Gracias por la calificación, Daniela! Quedo atento para lo que necesites.', now() - interval '8 days');
  insert into lecturas values (c_da, dani, now()) on conflict (conversacion_id, perfil_id) do update set leido_hasta = excluded.leido_hasta;
  c_ds := cp_conversacion(dani, sofia_pe);
  insert into mensajes (conversacion_id, autor_id, texto, creado) values (c_ds, sofia_pe, 'Hola Dani, cuando quieras agendamos tu próximo corte 💇‍♀️', now() - interval '30 days');
  insert into lecturas values (c_ds, dani, now()) on conflict (conversacion_id, perfil_id) do update set leido_hasta = excluded.leido_hasta;

  -- 5. Notificaciones
  insert into notificaciones (perfil_id, tipo, texto, enlace, leida, creado) values
    (dani, 'agreement', 'Carlos Ramírez confirmó el acuerdo: Reparación de fuga de agua, hoy 3:00 p.m.', '/solicitud/c0000000-0000-4000-8000-000000000001', false, (hoy + time '11:40') at time zone 'America/Bogota'),
    (dani, 'message', 'Carlos: Perfecto, puede ser que sea una unión.', '/chat/' || c_dc, false, (hoy + time '11:37') at time zone 'America/Bogota'),
    (dani, 'rating', '¡Ganaste 50 puntos ConectaPRO por calificar tu servicio de electricidad!', '/perfil/beneficios', true, now() - interval '8 days'),
    (carlos, 'match', 'Nueva oportunidad de plomería a 1.2 km: "Fuga de agua en la cocina"', '/oportunidad/c0000000-0000-4000-8000-000000000011', false, now() - interval '5 minutes'),
    (carlos, 'agreement', 'Daniela Jaramillo confirmó el acuerdo digital CP-2026-0481', '/trabajo/c0000000-0000-4000-8000-000000000001', false, (hoy + time '11:40') at time zone 'America/Bogota'),
    (juan, 'match', 'Notificamos a los proveedores compatibles para "Instalación de lámparas"', '/proveedores/c0000000-0000-4000-8000-000000000012', true, now() - interval '18 minutes'),
    (andres, 'match', 'Nueva oportunidad de electricidad: "Instalación de lámparas"', '/oportunidad/c0000000-0000-4000-8000-000000000012', false, now() - interval '18 minutes');

  -- 6. Direcciones y métodos de pago de Daniela
  insert into direcciones (perfil_id, nombre, direccion, departamento, municipio) values
    (dani, 'Casa', 'Cra. 50 #45-20', '05', '05615'), (dani, 'Oficina', 'Calle 49 #50-12', '05', '05615');
  insert into metodos_pago (perfil_id, tipo, detalle, predeterminado) values
    (dani, 'efectivo', 'Pago al finalizar el servicio', true), (dani, 'nequi', '•••• 6543', false), (dani, 'tarjeta', 'Visa •••• 4821', false);
end $$;

-- Reiniciar la demostración (solo lo pueden hacer las cuentas de ejemplo)
create or replace function api_reiniciar_demo() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from perfiles where id = cp_req() and demo) then
    raise exception 'Solo las cuentas de demostración pueden reiniciar los datos de ejemplo';
  end if;
  perform cp_sembrar_demo();
end $$;
revoke execute on function cp_sembrar_demo(), cp_demo_sol(uuid, uuid, text, text, text, text, double precision, double precision, text, timestamptz, text, uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function api_reiniciar_demo() to authenticated;
