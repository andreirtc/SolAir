-- Apply only to Supabase after 001_core.sql. Browser clients never bypass the API.
DO $$
DECLARE t TEXT;
BEGIN
 FOREACH t IN ARRAY ARRAY['organizations','profiles','sessions','invitations','vehicles','assignments','devices','telemetry','energy_measurements','gps_records','security_events','help_requests','messages','bench_sessions','bench_results','calibrations','audit_logs','vehicle_images'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t);
  EXECUTE format('GRANT SELECT ON TABLE public.%I TO service_role',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['telemetry','security_events','help_requests','messages'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
   EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',t);
  END IF;
 END LOOP;
END $$;
