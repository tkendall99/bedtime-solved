-- Migration: Fix exposed service role key by using Supabase Vault
--
-- IMPORTANT: Before running this migration, you MUST:
-- 1. Rotate your service role key in Supabase Dashboard (Settings > API > Regenerate)
-- 2. Store the NEW key in Vault by running this SQL in the SQL Editor:
--    SELECT vault.create_secret('your-new-service-role-key', 'service_role_key');
--
-- This migration updates the trigger function to read the service role key from Vault
-- instead of having it hardcoded in the function body.

-- Update the trigger function to use Vault
CREATE OR REPLACE FUNCTION trigger_process_book_job()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Construct the Edge Function URL
  edge_function_url := 'https://ywedqotuxqkccplappje.supabase.co/functions/v1/process-book-job';

  -- Get service role key from Vault (secure storage)
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  -- Check if the secret was found
  IF service_role_key IS NULL THEN
    RAISE WARNING 'service_role_key not found in vault. Please run: SELECT vault.create_secret(''your-key'', ''service_role_key'');';
    RETURN NEW;
  END IF;

  -- Make async HTTP request to Edge Function
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object('job_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger itself doesn't need to be recreated since we're just updating the function
