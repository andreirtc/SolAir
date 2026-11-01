-- Study records stay behind authenticated, scoped server APIs.
ALTER TABLE public.battery_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_forecast_outcomes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.battery_references,public.research_records,public.research_forecast_outcomes FROM anon,authenticated;
GRANT ALL ON TABLE public.battery_references,public.research_records,public.research_forecast_outcomes TO service_role;
