ALTER TABLE public.account_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_admin_guard ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.account_states,public.account_admin_guard FROM anon,authenticated;
GRANT ALL ON TABLE public.account_states,public.account_admin_guard TO service_role;
