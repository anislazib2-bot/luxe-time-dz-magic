
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled');
CREATE TYPE public.delivery_type AS ENUM ('home', 'office');
CREATE TYPE public.product_gender AS ENUM ('men', 'women', 'unisex');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "p_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "p_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "ur_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ur_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;
  SELECT COUNT(*) INTO c FROM public.user_roles WHERE role = 'admin';
  IF c > 0 THEN RETURN FALSE; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL, name_fr TEXT NOT NULL, name_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cat_admin_all" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL, name_fr TEXT NOT NULL, name_en TEXT NOT NULL,
  description_ar TEXT, description_fr TEXT, description_en TEXT,
  brand TEXT NOT NULL,
  gender public.product_gender NOT NULL DEFAULT 'unisex',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price_dzd INTEGER NOT NULL CHECK (price_dzd >= 0),
  discount_price_dzd INTEGER CHECK (discount_price_dzd IS NULL OR (discount_price_dzd >= 0 AND discount_price_dzd < price_dzd)),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_limited BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_products_gender ON public.products(gender);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_featured ON public.products(featured) WHERE featured = TRUE;
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = TRUE;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_public_active" ON public.products FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "prod_admin_all" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wilayas (
  code SMALLINT PRIMARY KEY,
  name_ar TEXT NOT NULL, name_fr TEXT NOT NULL,
  delivery_home_dzd INTEGER NOT NULL DEFAULT 800,
  delivery_office_dzd INTEGER NOT NULL DEFAULT 500
);
GRANT SELECT ON public.wilayas TO anon, authenticated;
GRANT ALL ON public.wilayas TO service_role;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "w_public" ON public.wilayas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "w_admin_all" ON public.wilayas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE SEQUENCE public.order_number_seq;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL, phone TEXT NOT NULL,
  wilaya_code SMALLINT NOT NULL REFERENCES public.wilayas(code),
  commune TEXT NOT NULL, address TEXT,
  delivery_type public.delivery_type NOT NULL DEFAULT 'home',
  subtotal_dzd INTEGER NOT NULL CHECK (subtotal_dzd >= 0),
  delivery_dzd INTEGER NOT NULL CHECK (delivery_dzd >= 0),
  total_dzd INTEGER NOT NULL CHECK (total_dzd >= 0),
  status public.order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_customer ON public.orders(customer_user_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "o_insert_anyone" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "o_select_own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = customer_user_id);
CREATE POLICY "o_admin_select" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "o_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'LTD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_set_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  price_snapshot INTEGER NOT NULL CHECK (price_snapshot >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oi_insert" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "oi_select_own" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_user_id = auth.uid()));
CREATE POLICY "oi_admin_select" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.lookup_order(_order_number TEXT, _phone TEXT)
RETURNS TABLE (
  order_number TEXT, full_name TEXT, phone TEXT, wilaya_code SMALLINT, commune TEXT, address TEXT,
  delivery_type public.delivery_type, subtotal_dzd INTEGER, delivery_dzd INTEGER, total_dzd INTEGER,
  status public.order_status, created_at TIMESTAMPTZ
) LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_number, o.full_name, o.phone, o.wilaya_code, o.commune, o.address,
         o.delivery_type, o.subtotal_dzd, o.delivery_dzd, o.total_dzd, o.status, o.created_at
  FROM public.orders o
  WHERE o.order_number = _order_number AND o.phone = _phone
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.lookup_order(TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.lookup_order_items(_order_number TEXT, _phone TEXT)
RETURNS TABLE (product_id UUID, name_snapshot TEXT, price_snapshot INTEGER, quantity INTEGER, image_url TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT oi.product_id, oi.name_snapshot, oi.price_snapshot, oi.quantity, oi.image_url
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.order_number = _order_number AND o.phone = _phone
$$;
GRANT EXECUTE ON FUNCTION public.lookup_order_items(TEXT, TEXT) TO anon, authenticated;

INSERT INTO public.wilayas (code, name_ar, name_fr, delivery_home_dzd, delivery_office_dzd) VALUES
(1,'أدرار','Adrar',1200,800),(2,'الشلف','Chlef',700,400),(3,'الأغواط','Laghouat',900,600),
(4,'أم البواقي','Oum El Bouaghi',800,500),(5,'باتنة','Batna',800,500),(6,'بجاية','Béjaïa',700,400),
(7,'بسكرة','Biskra',900,600),(8,'بشار','Béchar',1200,800),(9,'البليدة','Blida',500,300),
(10,'البويرة','Bouira',600,400),(11,'تمنراست','Tamanrasset',1500,1000),(12,'تبسة','Tébessa',900,600),
(13,'تلمسان','Tlemcen',800,500),(14,'تيارت','Tiaret',800,500),(15,'تيزي وزو','Tizi Ouzou',600,400),
(16,'الجزائر','Alger',400,250),(17,'الجلفة','Djelfa',900,600),(18,'جيجل','Jijel',700,400),
(19,'سطيف','Sétif',700,400),(20,'سعيدة','Saïda',800,500),(21,'سكيكدة','Skikda',700,400),
(22,'سيدي بلعباس','Sidi Bel Abbès',800,500),(23,'عنابة','Annaba',700,400),(24,'قالمة','Guelma',800,500),
(25,'قسنطينة','Constantine',700,400),(26,'المدية','Médéa',600,400),(27,'مستغانم','Mostaganem',700,400),
(28,'المسيلة','M''Sila',800,500),(29,'معسكر','Mascara',800,500),(30,'ورقلة','Ouargla',1000,700),
(31,'وهران','Oran',600,400),(32,'البيض','El Bayadh',1000,700),(33,'إليزي','Illizi',1500,1000),
(34,'برج بوعريريج','Bordj Bou Arréridj',700,400),(35,'بومرداس','Boumerdès',500,300),
(36,'الطارف','El Tarf',800,500),(37,'تندوف','Tindouf',1500,1000),(38,'تيسمسيلت','Tissemsilt',800,500),
(39,'الوادي','El Oued',1000,700),(40,'خنشلة','Khenchela',800,500),(41,'سوق أهراس','Souk Ahras',800,500),
(42,'تيبازة','Tipaza',500,300),(43,'ميلة','Mila',700,400),(44,'عين الدفلى','Aïn Defla',700,400),
(45,'النعامة','Naâma',1000,700),(46,'عين تموشنت','Aïn Témouchent',800,500),(47,'غرداية','Ghardaïa',1000,700),
(48,'غليزان','Relizane',800,500),(49,'تيميمون','Timimoun',1300,900),(50,'برج باجي مختار','Bordj Badji Mokhtar',1500,1000),
(51,'أولاد جلال','Ouled Djellal',900,600),(52,'بني عباس','Béni Abbès',1300,900),(53,'عين صالح','In Salah',1500,1000),
(54,'عين قزام','In Guezzam',1500,1000),(55,'تقرت','Touggourt',1000,700),(56,'جانت','Djanet',1500,1000),
(57,'المغير','El M''Ghair',1000,700),(58,'المنيعة','El Meniaa',1100,800);

INSERT INTO public.categories (slug, name_ar, name_fr, name_en, sort_order) VALUES
('chronograph','كرونوغراف','Chronographe','Chronograph',1),
('classic','كلاسيكي','Classique','Classic',2),
('sport','رياضي','Sport','Sport',3),
('luxury','فاخر','Luxe','Luxury',4),
('women-elegant','أنيقة نسائية','Élégance Femme','Women Elegant',5),
('bracelet-watch','ساعة سوار','Montre Bracelet','Bracelet Watch',6);

WITH cats AS (SELECT slug, id FROM public.categories)
INSERT INTO public.products (slug, name_ar, name_fr, name_en, description_ar, description_fr, description_en, brand, gender, category_id, price_dzd, discount_price_dzd, stock, images, specs, featured, is_new, is_limited) VALUES
('festina-chrono-silver','فستينا كرونوغراف فضي','Festina Chronographe Argent','Festina Chronograph Silver',
 'ساعة فستينا كرونوغراف بمينا فضي أنيق وسوار ستانلس ستيل فاخر. تصميم سويسري راقي يجمع بين الكلاسيكية والحداثة.',
 'Montre Festina chronographe avec cadran argenté élégant et bracelet en acier inoxydable de luxe.',
 'Festina chronograph watch with elegant silver dial and luxury stainless steel bracelet.',
 'Festina','men',(SELECT id FROM cats WHERE slug='chronograph'),45000,39900,12,
 '["/__l5e/assets-v1/e07276f5-ffc9-4d96-8545-0a13e02e6ff6/IMG_20260630_225837_024.jpg"]'::jsonb,
 '{"movement":"كوارتز سويسري","case":"ستانلس ستيل 42mm","water_resistance":"10 ATM","warranty":"24 شهر"}'::jsonb,
 true,true,false),
('festina-chrono-tiffany','فستينا كرونوغراف أزرق تيفاني','Festina Chronographe Bleu Tiffany','Festina Chronograph Tiffany Blue',
 'إصدار محدود من فستينا بمينا أزرق تيفاني نابض بالحياة. ساعة استثنائية لمن يبحث عن التميز.',
 'Édition limitée Festina avec cadran bleu Tiffany vibrant.',
 'Limited edition Festina with vibrant Tiffany blue dial.',
 'Festina','men',(SELECT id FROM cats WHERE slug='chronograph'),52000,NULL,5,
 '["/__l5e/assets-v1/b7f60384-e1d1-47ef-93f0-c4581c1345d0/IMG_20260630_225836_831.jpg"]'::jsonb,
 '{"movement":"كوارتز سويسري","case":"ستانلس ستيل 42mm","water_resistance":"10 ATM","warranty":"24 شهر"}'::jsonb,
 true,true,true),
('festina-ceramic-white','فستينا سيراميك أبيض','Festina Ceramic Blanc','Festina Ceramic White',
 'فستينا سيراميك بمينا أبيض ولمسات حمراء جريئة. مقاومة للماء حتى 10 بار.',
 'Festina Ceramic avec cadran blanc et touches rouges audacieuses.',
 'Festina Ceramic with white dial and bold red accents.',
 'Festina','men',(SELECT id FROM cats WHERE slug='sport'),38000,33000,15,
 '["/__l5e/assets-v1/4ec8ccb2-af6a-462e-a419-cc20c67e4fb3/IMG_20260630_225836_406.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"ستانلس ستيل + سيراميك 44mm","water_resistance":"10 BAR","warranty":"24 شهر"}'::jsonb,
 true,false,false),
('festina-ceramic-grey','فستينا سيراميك رمادي','Festina Ceramic Gris','Festina Ceramic Grey',
 'فستينا سيراميك بمينا رمادي عصري. تصميم رياضي قوي.',
 'Festina Ceramic avec cadran gris moderne.',
 'Festina Ceramic with modern grey dial.',
 'Festina','men',(SELECT id FROM cats WHERE slug='sport'),38000,NULL,8,
 '["/__l5e/assets-v1/511e5789-5293-4bab-9d05-05e2aca270b0/IMG_20260630_225837_177.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"ستانلس ستيل + سيراميك 44mm","water_resistance":"10 BAR","warranty":"24 شهر"}'::jsonb,
 false,true,false),
('festina-ceramic-blue','فستينا سيراميك أزرق','Festina Ceramic Bleu','Festina Ceramic Blue',
 'فستينا سيراميك بمينا أزرق ملكي عميق. أناقة لا تضاهى.',
 'Festina Ceramic avec cadran bleu royal profond.',
 'Festina Ceramic with deep royal blue dial.',
 'Festina','men',(SELECT id FROM cats WHERE slug='sport'),38000,34500,10,
 '["/__l5e/assets-v1/4b2b0b82-3bfc-45b0-aa63-310e7f3157fa/IMG_20260630_225836_933.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"ستانلس ستيل + سيراميك 44mm","water_resistance":"10 BAR","warranty":"24 شهر"}'::jsonb,
 true,false,false),
('ieke-chain-blue','IEKE سوار ذهبي مينا أزرق','IEKE Bracelet Or Cadran Bleu','IEKE Gold Chain Blue Dial',
 'ساعة IEKE الفاخرة بسوار ذهبي مميز ومينا أزرق مرصع بالكريستال.',
 'Montre IEKE de luxe avec bracelet doré et cadran bleu serti de cristaux.',
 'Luxury IEKE watch with gold chain bracelet and crystal-set blue dial.',
 'IEKE','women',(SELECT id FROM cats WHERE slug='women-elegant'),18500,15900,20,
 '["/__l5e/assets-v1/78b65077-da23-491e-8255-bb4444749288/IMG_20260630_225822_302.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"معدن مطلي بالذهب 22mm","crystal":"كريستال أصلي","warranty":"12 شهر"}'::jsonb,
 true,true,false),
('ieke-chain-green-chunky','IEKE سوار ضخم مينا أخضر','IEKE Bracelet Épais Vert','IEKE Chunky Chain Green',
 'IEKE بسوار ذهبي ضخم ومينا أخضر زمردي.',
 'IEKE avec bracelet doré épais et cadran vert émeraude.',
 'IEKE with chunky gold chain and emerald green dial.',
 'IEKE','women',(SELECT id FROM cats WHERE slug='bracelet-watch'),21000,NULL,7,
 '["/__l5e/assets-v1/92f0ec26-f672-4640-93a6-a36ea0a67b6a/IMG_20260630_225821_753.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"معدن مطلي بالذهب 22mm","crystal":"كريستال أصلي","warranty":"12 شهر"}'::jsonb,
 true,true,true),
('ieke-pink-pearl','IEKE وردي صدفي','IEKE Rose Nacré','IEKE Pink Mother of Pearl',
 'IEKE بمينا وردي صدفي ناعم. أنوثة وأناقة.',
 'IEKE avec cadran rose nacré doux.',
 'IEKE with soft pink mother of pearl dial.',
 'IEKE','women',(SELECT id FROM cats WHERE slug='women-elegant'),17500,14900,18,
 '["/__l5e/assets-v1/fff518a9-149a-4afc-8115-871cb86a9bbb/IMG_20260630_225822_222.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"معدن مطلي بالذهب 22mm","crystal":"كريستال أصلي","warranty":"12 شهر"}'::jsonb,
 false,true,false),
('ieke-black-gold','IEKE أسود ذهبي','IEKE Noir et Or','IEKE Black & Gold',
 'IEKE بمينا أسود فاخر مرصع بالكريستال وسوار ذهبي.',
 'IEKE avec cadran noir luxueux serti de cristaux et bracelet doré.',
 'IEKE with luxurious crystal-set black dial and gold chain.',
 'IEKE','women',(SELECT id FROM cats WHERE slug='luxury'),19500,NULL,12,
 '["/__l5e/assets-v1/49cba49e-2c5c-49aa-8bb3-6dcad8d0d96c/IMG_20260630_225822_384.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"معدن مطلي بالذهب 22mm","crystal":"كريستال أصلي","warranty":"12 شهر"}'::jsonb,
 true,false,false),
('ieke-green-hardware','IEKE سوار U أخضر','IEKE Bracelet U Vert','IEKE U-Link Green',
 'IEKE بسوار على شكل حرف U ومينا أخضر متلألئ.',
 'IEKE avec bracelet en U et cadran vert scintillant.',
 'IEKE with U-link chain and shimmering green dial.',
 'IEKE','women',(SELECT id FROM cats WHERE slug='bracelet-watch'),22500,19900,6,
 '["/__l5e/assets-v1/3fb84f04-fc70-4151-a5f5-77d7b699eea3/IMG_20260630_225822_307.jpg"]'::jsonb,
 '{"movement":"كوارتز","case":"معدن مطلي بالذهب 22mm","crystal":"كريستال أصلي","warranty":"12 شهر"}'::jsonb,
 true,true,true);
