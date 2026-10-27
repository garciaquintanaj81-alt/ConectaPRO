#!/bin/sh
# Arma supabase/instalar.sql (el archivo que se pega en Supabase → SQL Editor)
# a partir de: schema.sql + seed.sql + pruebas.sql + storage.sql
set -e
cd "$(dirname "$0")"
{
  cat <<'EOF'
-- =====================================================================
--  ConectaPRO · INSTALACIÓN / ACTUALIZACIÓN COMPLETA PARA SUPABASE
--  Pega TODO este archivo en Supabase → SQL Editor → New query → Run.
--  Crea o actualiza tablas, API segura, 33 departamentos, 1.105 municipios,
--  datos del simulador, cuentas de prueba y el almacenamiento de fotos.
--  Se puede ejecutar más de una vez sin perder los datos de usuarios reales.
-- =====================================================================

EOF
  cat schema.sql
  echo
  cat seed.sql
  echo
  cat pruebas.sql
  echo
  cat storage.sql
} > instalar.sql
echo "instalar.sql listo ($(wc -c < instalar.sql) bytes)"
