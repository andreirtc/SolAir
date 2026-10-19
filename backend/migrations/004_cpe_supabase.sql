-- PostgreSQL/Supabase only, after portable 003_cpe.sql.
ALTER TABLE public.cpe_samples ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cpe_samples FROM anon, authenticated;
GRANT SELECT ON TABLE public.cpe_samples TO service_role;
