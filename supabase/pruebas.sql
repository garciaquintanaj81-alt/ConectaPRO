-- =====================================================================
--  Cuentas de PRUEBA (QA) · escenario "desayuno sorpresa"
--
--  4 cuentas independientes marcadas con perfiles.prueba = true:
--    · prueba.cliente@conectapro.co      → publica la necesidad
--    · prueba.proveedor1@conectapro.co   → ofrece desayunos sorpresa
--    · prueba.proveedor2@conectapro.co   → ofrece desayunos sorpresa
--    · prueba.proveedor3@conectapro.co   → ofrece desayunos sorpresa
--  Contraseña de las cuatro: Prueba2026*  (el acceso se crea la primera vez que se ingresa)
--
--  Funcionan exactamente como cuentas reales (todo se guarda en la base de datos y
--  nadie responde automáticamente), pero viven en su propio "mundo": solo se ven
--  entre ellas, nunca aparecen a usuarios reales y llevan la etiqueta "Cuenta de prueba".
--  Este archivo NO crea solicitudes: el escenario lo ejecutan las propias cuentas.
-- =====================================================================
begin;

insert into perfiles (id, nombre, correo, celular, documento, departamento, municipio, puntos, calificacion, num_resenas,
                      verificado, demo, prueba, rol_activo) values
('e0000000-0000-4000-8000-000000000001', 'Cliente Prueba',        'prueba.cliente@conectapro.co',    '3000000001', '9000000001', '54', '54001', 100, 5.0, 0, false, false, true, 'cliente'),
('e0000000-0000-4000-8000-000000000002', 'Proveedor Prueba Uno',  'prueba.proveedor1@conectapro.co', '3000000002', '9000000002', '54', '54001', 100, 5.0, 0, false, false, true, 'proveedor'),
('e0000000-0000-4000-8000-000000000003', 'Proveedor Prueba Dos',  'prueba.proveedor2@conectapro.co', '3000000003', '9000000003', '54', '54874', 100, 5.0, 0, false, false, true, 'proveedor'),
('e0000000-0000-4000-8000-000000000004', 'Proveedor Prueba Tres', 'prueba.proveedor3@conectapro.co', '3000000004', '9000000004', '54', '54405', 100, 5.0, 0, false, false, true, 'proveedor')
on conflict (id) do update set nombre = excluded.nombre, correo = excluded.correo, departamento = excluded.departamento,
  municipio = excluded.municipio, demo = false, prueba = true;

insert into proveedores (id, perfil_id, empresa, profesion, departamento, municipio, lat, lng, cobertura_km, dias, hora_desde, hora_hasta,
                         precio_min, precio_max, descripcion, ofrece, telefono, calificacion, num_resenas, completados, verificado) values
('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'Desayunos Prueba Uno', 'Desayunos sorpresa',
  '54', '54001', 7.8990, -72.5010, 15, '{0,1,2,3,4,5,6}', 6, 20, 60000, 95000,
  'Cuenta de prueba. Desayunos sorpresa con frutas, jugo natural y globos.', '{Desayuno sorpresa clásico,Tarjeta personalizada}', '3000000002', 5.0, 0, 0, false),
('f0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003', 'Desayunos Prueba Dos', 'Desayunos sorpresa',
  '54', '54874', 7.8338889, -72.4741667, 15, '{0,1,2,3,4,5,6}', 6, 20, 75000, 130000,
  'Cuenta de prueba. Desayunos sorpresa con decoración y entrega a domicilio.', '{Desayuno sorpresa premium,Decoración con globos}', '3000000003', 5.0, 0, 0, false),
('f0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000004', 'Desayunos Prueba Tres', 'Desayunos sorpresa',
  '54', '54405', 7.8383333, -72.5133333, 15, '{0,1,2,3,4,5,6}', 6, 20, 50000, 85000,
  'Cuenta de prueba. Desayunos sorpresa sencillos y anchetas.', '{Desayuno sorpresa sencillo,Ancheta}', '3000000004', 5.0, 0, 0, false)
on conflict (id) do update set empresa = excluded.empresa, profesion = excluded.profesion, departamento = excluded.departamento,
  municipio = excluded.municipio, lat = excluded.lat, lng = excluded.lng, cobertura_km = excluded.cobertura_km, activo = true;

insert into proveedor_servicios (proveedor_id, servicio_id) values
('f0000000-0000-4000-8000-000000000002', 'desayunos_sorpresa'),
('f0000000-0000-4000-8000-000000000003', 'desayunos_sorpresa'),
('f0000000-0000-4000-8000-000000000004', 'desayunos_sorpresa')
on conflict do nothing;

-- Deja las cuentas de prueba como nuevas (borra solo los datos de las cuentas de prueba)
create or replace function cp_reiniciar_pruebas() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from solicitudes where cliente_id in (select id from perfiles where prueba);
  delete from conversaciones where usuario_a in (select id from perfiles where prueba) or usuario_b in (select id from perfiles where prueba);
  delete from notificaciones where perfil_id in (select id from perfiles where prueba);
  delete from faltas where perfil_id in (select id from perfiles where prueba);
  delete from canjes where perfil_id in (select id from perfiles where prueba);
  delete from trueque_ofertas where perfil_id in (select id from perfiles where prueba);
  update proveedores set calificacion = 5.0, num_resenas = 0, completados = 0, activo = true
   where perfil_id in (select id from perfiles where prueba);
  update perfiles set calificacion = 5.0, num_resenas = 0, puntos = 100,
         rol_activo = case when exists (select 1 from proveedores p where p.perfil_id = perfiles.id) then 'proveedor' else 'cliente' end
   where prueba;
end $$;

create or replace function api_reiniciar_pruebas() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from perfiles where id = cp_req() and prueba) then
    raise exception 'Solo las cuentas de prueba pueden reiniciar el escenario de prueba';
  end if;
  perform cp_reiniciar_pruebas();
end $$;

revoke execute on function cp_reiniciar_pruebas() from public, anon, authenticated;
grant execute on function api_reiniciar_pruebas() to authenticated;

commit;
