
-- Store settings (single row, id=1)
CREATE TABLE public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  store_name TEXT NOT NULL DEFAULT 'LUXE TIME DZ',
  logo_url TEXT,
  phone TEXT DEFAULT '0555 00 00 00',
  whatsapp TEXT DEFAULT '213555000000',
  instagram_url TEXT,
  facebook_url TEXT,
  email TEXT DEFAULT 'contact@luxetime.dz',
  address TEXT DEFAULT 'الجزائر العاصمة',
  topbar_text TEXT DEFAULT 'توصيل لجميع ولايات الجزائر • الدفع عند الاستلام',
  free_shipping_threshold_dzd INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT ALL ON public.store_settings TO service_role;
GRANT UPDATE, INSERT ON public.store_settings TO authenticated;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_public_read" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write" ON public.store_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER trg_store_settings_updated BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for product-images bucket (bucket created separately)
CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product_images_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product_images_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product_images_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
