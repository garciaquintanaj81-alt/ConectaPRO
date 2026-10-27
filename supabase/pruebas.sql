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
--  Cada vez que el cliente de prueba publica, el escenario anterior se borra solo
--  (solicitudes, postulaciones, acuerdos, chats y notificaciones de las cuentas de prueba).
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
('f0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002', 'Dulce Despertar', 'Desayunos sorpresa clásicos y saludables',
  '54', '54001', 7.8990, -72.5010, 15, '{0,1,2,3,4,5,6}', 5, 12, 60000, 95000,
  'Preparo desayunos sorpresa caseros con fruta fresca de la plaza, croissants horneados el mismo día, jugo natural y café de Norte de Santander. Entrego a la hora que me digas desde las 5:00 a.m., con tarjeta escrita a mano.',
  '{Desayuno clásico: fruta picada, croissant, jugo natural y café,Desayuno saludable: bowl de frutas, avena y jugo verde,Tarjeta escrita a mano incluida,Entrega desde las 5:00 a.m.}',
  '3000000002', 5.0, 0, 0, false),
('f0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000003', 'Globos & Café', 'Desayunos sorpresa premium con decoración',
  '54', '54874', 7.8338889, -72.4741667, 15, '{0,1,2,3,4,5,6}', 6, 14, 90000, 160000,
  'Desayunos sorpresa premium: waffles o pancakes con frutos rojos, flores naturales, globos metalizados y caja de regalo. Ideales para cumpleaños, aniversarios y declaraciones. Personalizo colores y mensaje.',
  '{Waffles o pancakes con frutos rojos,Arreglo de flores naturales,Set de globos metalizados con mensaje,Caja de regalo decorada,Desayuno para dos (aniversario)}',
  '3000000003', 5.0, 0, 0, false),
('f0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000004', 'Detalles Express', 'Desayunos sorpresa económicos y anchetas',
  '54', '54405', 7.8383333, -72.5133333, 15, '{0,1,2,3,4,5,6}', 6, 18, 45000, 80000,
  'Desayunos sorpresa sencillos y anchetas a buen precio, con entrega rápida en Los Patios, Cúcuta y Villa del Rosario. Puedes pedir el mismo día.',
  '{Desayuno sencillo: sándwich, jugo y chocolatina,Ancheta con frutas, pan y café,Combo express con entrega el mismo día,Tarjeta impresa con tu mensaje}',
  '3000000004', 5.0, 0, 0, false)
on conflict (id) do update set empresa = excluded.empresa, profesion = excluded.profesion, departamento = excluded.departamento,
  municipio = excluded.municipio, lat = excluded.lat, lng = excluded.lng, cobertura_km = excluded.cobertura_km, dias = excluded.dias,
  hora_desde = excluded.hora_desde, hora_hasta = excluded.hora_hasta, precio_min = excluded.precio_min, precio_max = excluded.precio_max,
  descripcion = excluded.descripcion, ofrece = excluded.ofrece, activo = true;

-- Solo la subcategoría del escenario: desayunos sorpresa
delete from proveedor_servicios where proveedor_id in ('f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000004');
insert into proveedor_servicios (proveedor_id, servicio_id) values
('f0000000-0000-4000-8000-000000000002', 'desayunos_sorpresa'),
('f0000000-0000-4000-8000-000000000003', 'desayunos_sorpresa'),
('f0000000-0000-4000-8000-000000000004', 'desayunos_sorpresa');

-- El cliente de prueba no tiene perfil de proveedor
delete from proveedores where perfil_id = 'e0000000-0000-4000-8000-000000000001';

-- Logo de cada proveedor (si no ha subido su propia foto) y portafolio de trabajos.
-- Las imágenes son ilustrativas (están en /public/img/pruebas) y lo dicen en la propia imagen.
update perfiles set foto = 'img/pruebas/logo' || (right(id::text, 1)::int - 1) || '.svg'
 where id in ('e0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000004')
   and foto_ruta is null;
update perfiles set rol_activo = 'cliente' where id = 'e0000000-0000-4000-8000-000000000001';
update perfiles set rol_activo = 'proveedor' where id in ('e0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000004');
delete from portafolio where proveedor_id in ('f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000004');
insert into portafolio (proveedor_id, imagen, orden) values
('f0000000-0000-4000-8000-000000000002', 'img/pruebas/p1-1.svg', 0), ('f0000000-0000-4000-8000-000000000002', 'img/pruebas/p1-2.svg', 1), ('f0000000-0000-4000-8000-000000000002', 'img/pruebas/p1-3.svg', 2),
('f0000000-0000-4000-8000-000000000003', 'img/pruebas/p2-1.svg', 0), ('f0000000-0000-4000-8000-000000000003', 'img/pruebas/p2-2.svg', 1), ('f0000000-0000-4000-8000-000000000003', 'img/pruebas/p2-3.svg', 2),
('f0000000-0000-4000-8000-000000000004', 'img/pruebas/p3-1.svg', 0), ('f0000000-0000-4000-8000-000000000004', 'img/pruebas/p3-2.svg', 1), ('f0000000-0000-4000-8000-000000000004', 'img/pruebas/p3-3.svg', 2);

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

-- Reinicio del escenario. Solo borra datos de las cuentas de prueba, por eso se permite
-- desde la página /pruebas sin iniciar sesión. (Además, api_publicar lo hace solo cada vez
-- que el cliente de prueba publica una nueva necesidad.)
create or replace function api_reiniciar_pruebas() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform cp_reiniciar_pruebas();
end $$;

revoke execute on function cp_reiniciar_pruebas() from public, anon, authenticated;
revoke execute on function api_reiniciar_pruebas() from public;
grant execute on function api_reiniciar_pruebas() to anon, authenticated;

commit;
