ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.incident_updates FROM anon, authenticated;
