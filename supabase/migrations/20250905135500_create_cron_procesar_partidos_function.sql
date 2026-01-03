-- ============================================================================
-- Crear función para procesar resultados de partidos desde cron jobs
-- Esta función puede ser llamada manualmente desde cron jobs configurados
-- con diferentes horarios según las necesidades
-- ============================================================================

-- Función helper para obtener secrets del Vault y llamar a la Edge Function
CREATE OR REPLACE FUNCTION public.cron_procesar_partidos()
RETURNS void AS $$
DECLARE
  internal_secret_value text;
  supabase_url_value text;
BEGIN
  -- Obtener INTERNAL_FUNCTION_SECRET del Vault
  SELECT decrypted_secret INTO internal_secret_value
  FROM vault.decrypted_secrets
  WHERE name = 'INTERNAL_FUNCTION_SECRET';
  
  IF internal_secret_value IS NULL THEN
    RAISE EXCEPTION 'Secret "INTERNAL_FUNCTION_SECRET" not found in Supabase Vault.';
  END IF;

  -- Obtener SUPABASE_URL del Vault
  SELECT decrypted_secret INTO supabase_url_value
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_URL';
  
  IF supabase_url_value IS NULL THEN
    RAISE EXCEPTION 'Secret "SUPABASE_URL" not found in Supabase Vault.';
  END IF;

  -- Llamar a la Edge Function con autenticación segura
  PERFORM net.http_post(
    url := supabase_url_value || '/functions/v1/secure-run-process-matchday-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret_value
    ),
    body := jsonb_build_object(
      'internal_secret', internal_secret_value
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTA: Los cron jobs deben configurarse manualmente después de crear esta función
-- 
-- Ejemplo para crear un cron job:
-- SELECT cron.schedule(
--   'nombre_del_job',
--   'expresion_cron',  -- ej: '0 15-23 * * 6,0' para sábados y domingos 15:00-23:00
--   'SELECT public.cron_procesar_partidos();'
-- );
--
-- Para ver cron jobs existentes:
-- SELECT * FROM cron.job;
--
-- Para eliminar un cron job:
-- SELECT cron.unschedule('nombre_del_job');
-- ============================================================================

