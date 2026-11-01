ALTER TABLE public.cpe_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cpe_commands FROM anon,authenticated;
GRANT ALL ON TABLE public.cpe_commands TO service_role;
