import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pubClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } }
  );
}

const PhoneSchema = z.string().regex(/^0[567]\d{8}$/, "رقم هاتف جزائري غير صحيح");

const PlaceOrderSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: PhoneSchema,
  wilaya_code: z.number().int().min(1).max(58),
  commune: z.string().trim().min(2).max(80),
  address: z.string().trim().max(300).optional().nullable(),
  delivery_type: z.enum(["home", "office"]),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z
    .array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlaceOrderSchema.parse(input))
  .handler(async ({ data }) => {
    // Use admin client server-side: prices/stock are re-validated below,
    // and the insert needs RETURNING which anon can't SELECT under RLS.
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");

    // Re-fetch products server-side to get authoritative prices + stock
    const productIds = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id,slug,name_ar,price_dzd,discount_price_dzd,stock,images,is_active")
      .in("id", productIds);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== productIds.length) {
      throw new Error("بعض المنتجات لم تعد متوفرة");
    }

    let subtotal = 0;
    const itemsToInsert = data.items.map((line) => {
      const p = products.find((x: any) => x.id === line.product_id);
      if (!p || !p.is_active) throw new Error(`المنتج غير متاح`);
      if (p.stock < line.quantity) throw new Error(`الكمية المطلوبة من "${p.name_ar}" غير متوفرة`);
      const unit = p.discount_price_dzd ?? p.price_dzd;
      subtotal += unit * line.quantity;
      const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
      return {
        product_id: p.id,
        name_snapshot: p.name_ar,
        price_snapshot: unit,
        quantity: line.quantity,
        image_url: imgs[0] ?? null,
      };
    });

    // Delivery price: prefer commune-level override, fallback to wilaya
    const { data: cr } = await supabase
      .from("commune_delivery_rates")
      .select("delivery_home_dzd,delivery_office_dzd")
      .eq("wilaya_code", data.wilaya_code)
      .ilike("commune", data.commune.trim())
      .maybeSingle();
    let deliveryHome: number;
    let deliveryOffice: number;
    if (cr) {
      deliveryHome = cr.delivery_home_dzd;
      deliveryOffice = cr.delivery_office_dzd;
    } else {
      const { data: w, error: wErr } = await supabase
        .from("wilayas")
        .select("delivery_home_dzd,delivery_office_dzd")
        .eq("code", data.wilaya_code)
        .maybeSingle();
      if (wErr || !w) throw new Error("ولاية غير صحيحة");
      deliveryHome = w.delivery_home_dzd;
      deliveryOffice = w.delivery_office_dzd;
    }
    const delivery = data.delivery_type === "home" ? deliveryHome : deliveryOffice;
    const total = subtotal + delivery;

    // Insert order — RLS allows anyone to insert
    const { data: orderRow, error: oErr } = await supabase
      .from("orders")
      .insert({
        order_number: "", // trigger fills this
        full_name: data.full_name,
        phone: data.phone,
        wilaya_code: data.wilaya_code,
        commune: data.commune,
        address: data.address ?? null,
        delivery_type: data.delivery_type,
        subtotal_dzd: subtotal,
        delivery_dzd: delivery,
        total_dzd: total,
        notes: data.notes ?? null,
      })
      .select("id,order_number")
      .single();
    if (oErr || !orderRow) throw new Error(oErr?.message ?? "فشل إنشاء الطلب");

    const { error: iErr } = await supabase
      .from("order_items")
      .insert(itemsToInsert.map((it) => ({ ...it, order_id: orderRow.id })));
    if (iErr) throw new Error(iErr.message);

    return { order_number: orderRow.order_number, total_dzd: total };
  });

export const lookupOrder = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ order_number: z.string().min(3), phone: PhoneSchema }).parse(input)
  )
  .handler(async ({ data }) => {
    const supabase = pubClient();
    const [orderRes, itemsRes] = await Promise.all([
      supabase.rpc("lookup_order", { _order_number: data.order_number, _phone: data.phone }),
      supabase.rpc("lookup_order_items", { _order_number: data.order_number, _phone: data.phone }),
    ]);
    if (orderRes.error) throw new Error(orderRes.error.message);
    if (!orderRes.data || orderRes.data.length === 0) return null;
    return { order: orderRes.data[0], items: itemsRes.data ?? [] };
  });
