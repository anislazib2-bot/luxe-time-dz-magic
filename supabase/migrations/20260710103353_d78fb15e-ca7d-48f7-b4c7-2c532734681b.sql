ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_image_url text;

DROP FUNCTION IF EXISTS public.lookup_order(text, text);

CREATE FUNCTION public.lookup_order(_order_number text, _phone text)
 RETURNS TABLE(order_number text, full_name text, phone text, wilaya_code smallint, commune text, address text, delivery_type delivery_type, subtotal_dzd integer, delivery_dzd integer, total_dzd integer, status order_status, created_at timestamp with time zone, custom_image_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT o.order_number, o.full_name, o.phone, o.wilaya_code, o.commune, o.address,
         o.delivery_type, o.subtotal_dzd, o.delivery_dzd, o.total_dzd, o.status, o.created_at,
         o.custom_image_url
  FROM public.orders o
  WHERE o.order_number = _order_number AND o.phone = _phone
  LIMIT 1
$function$;

CREATE POLICY "order_uploads_public_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'order-uploads');

CREATE POLICY "order_uploads_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'order-uploads');