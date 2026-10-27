-- =====================================================================
--  Almacenamiento de fotos de perfil (Supabase Storage)
--
--  Bucket "fotos-perfil":
--    · Cada usuario solo puede subir, ver en el listado y borrar archivos dentro
--      de su propia carpeta (<id de usuario>/archivo.jpg).
--    · Los archivos tienen nombres aleatorios y la app solo entrega la ruta a quien
--      tiene permiso de verla (privacidad "todos" o "contactos", ver cp_foto).
--    · Máximo 2 MB; solo JPG, PNG o WEBP.
--  En un PostgreSQL local (sin Supabase) este bloque no hace nada.
-- =====================================================================
do $$
begin
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise notice 'Supabase Storage no está disponible en esta base de datos: se omite la configuración de fotos';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('fotos-perfil', 'fotos-perfil', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  drop policy if exists "fotos_perfil_subir_propia" on storage.objects;
  create policy "fotos_perfil_subir_propia" on storage.objects for insert to authenticated
    with check (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = (select auth.uid()::text));

  drop policy if exists "fotos_perfil_ver_propia" on storage.objects;
  create policy "fotos_perfil_ver_propia" on storage.objects for select to authenticated
    using (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = (select auth.uid()::text));

  drop policy if exists "fotos_perfil_borrar_propia" on storage.objects;
  create policy "fotos_perfil_borrar_propia" on storage.objects for delete to authenticated
    using (bucket_id = 'fotos-perfil' and (storage.foldername(name))[1] = (select auth.uid()::text));
exception when others then
  raise warning 'No se pudo configurar el almacenamiento de fotos: %. Créalo desde Storage → New bucket ("fotos-perfil", público) y vuelve a ejecutar este bloque.', sqlerrm;
end $$;
