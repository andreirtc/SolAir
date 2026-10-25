ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_photos FROM anon,authenticated;
GRANT ALL ON TABLE public.profile_photos TO service_role;
