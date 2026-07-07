
CREATE TABLE public.commune_delivery_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya_code smallint NOT NULL REFERENCES public.wilayas(code) ON DELETE CASCADE,
  commune text NOT NULL,
  delivery_home_dzd integer NOT NULL CHECK (delivery_home_dzd >= 0),
  delivery_office_dzd integer NOT NULL CHECK (delivery_office_dzd >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wilaya_code, commune)
);

GRANT SELECT ON public.commune_delivery_rates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.commune_delivery_rates TO authenticated;
GRANT ALL ON public.commune_delivery_rates TO service_role;

ALTER TABLE public.commune_delivery_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cdr_public_read" ON public.commune_delivery_rates
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cdr_admin_all" ON public.commune_delivery_rates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cdr_updated_at
  BEFORE UPDATE ON public.commune_delivery_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
