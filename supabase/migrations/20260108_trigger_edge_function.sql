-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to trigger Edge Function on new job
CREATE OR REPLACE FUNCTION trigger_process_book_job()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Construct the Edge Function URL
  edge_function_url := 'https://ywedqotuxqkccplappje.supabase.co/functions/v1/process-book-job';

  -- Get service role key from vault (or use directly if not using vault)
  -- For now, we'll pass the job_id in the body and the Edge Function handles auth internally

  -- Make async HTTP request to Edge Function
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZWRxb3R1eHFrY2NwbGFwcGplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY0NDcxNCwiZXhwIjoyMDgzMjIwNzE0fQ.r7QlvPBTKlxiw4yzzq070Goka_WzvigGbe06fzypMpM'
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
