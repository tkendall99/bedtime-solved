-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to trigger Edge Function on new job
-- NOTE: This migration was updated to remove an accidentally committed secret.
-- The function now reads from Vault - see 20260109_fix_secret_use_vault.sql
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

  -- Make async HTTP request to Edge Function
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object('job_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on book_jobs table
DROP TRIGGER IF EXISTS on_book_job_created ON book_jobs;
CREATE TRIGGER on_book_job_created
  AFTER INSERT ON book_jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_process_book_job();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, service_role;
