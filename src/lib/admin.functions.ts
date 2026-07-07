import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("غير مصرح. هذه الصفحة للمشرفين فقط.");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { count } = await context.supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    return { isAdmin: !!data, adminExists: (count ?? 0) > 0, userId: context.userId };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin");
    if (error) throw new Error(error.message);
    return { claimed: !!data };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const [orders, products, recent] = await Promise.all([
      context.supabase.from("orders").select("status,total_dzd,created_at"),
      context.supabase.from("products").select("id,name_ar,stock,price_dzd"),
      context.supabase.from("orders").select("id,order_number,full_name,total_dzd,status,created_at").order("created_at", { ascending: false }).limit(10),
    ]);
    const allOrders = orders.data ?? [];
    const revenue = allOrders.filter((o: any) => o.status === "delivered").reduce((s: number, o: any) => s + o.total_dzd, 0);
    const byStatus: Record<string, number> = {};
    allOrders.forEach((o: any) => { byStatus[o.status] = (byStatus[o.status] ?? 0) + 1; });
    return {
      revenue,
      orderCount: allOrders.length,
      productCount: (products.data ?? []).length,
      lowStock: (products.data ?? []).filter((p: any) => p.stock < 5).length,
      byStatus,
      recentOrders: recent.data ?? [],
    };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ status: z.enum(["all","pending","confirmed","preparing","shipping","delivered","cancelled"]).optional() }).parse(input ?? {})
  )
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    let q = context.supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const [order, items] = await Promise.all([
      context.supabase.from("orders").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("order_items").select("*").eq("order_id", data.id),
    ]);
    if (order.error) throw new Error(order.error.message);
    return { order: order.data, items: items.data ?? [] };
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "preparing", "shipping", "delivered", "cancelled"]),
    }).parse(input)
  )
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { error } = await context.supabase.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ProductSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "صيغة slug غير صحيحة"),
  name_ar: z.string().min(2).max(200),
  name_fr: z.string().min(2).max(200),
  name_en: z.string().min(2).max(200),
  description_ar: z.string().max(2000).nullable().optional(),
  description_fr: z.string().max(2000).nullable().optional(),
  description_en: z.string().max(2000).nullable().optional(),
  brand: z.string().min(1).max(80),
  gender: z.enum(["men", "women", "unisex"]),
  category_id: z.string().uuid().nullable().optional(),
  price_dzd: z.number().int().min(0),
  discount_price_dzd: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  images: z.array(z.string().min(1)).min(1).max(10),
  specs: z.record(z.string(), z.string()).optional(),
  featured: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_limited: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { data, error } = await context.supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProductSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { data: row, error } = await context.supabase.from("products").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).merge(ProductSchema.partial()).parse(input)
  )
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase.from("products").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListWilayas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { data, error } = await context.supabase.from("wilayas").select("*").order("code");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateWilaya = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      code: z.number().int().min(1).max(58),
      delivery_home_dzd: z.number().int().min(0).max(100000),
      delivery_office_dzd: z.number().int().min(0).max(100000),
    }).parse(input)
  )
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { error } = await context.supabase
      .from("wilayas")
      .update({ delivery_home_dzd: data.delivery_home_dzd, delivery_office_dzd: data.delivery_office_dzd })
      .eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListCommuneRates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ wilaya_code: z.number().int().min(1).max(58).optional() }).parse(input ?? {})
  )
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    let q = context.supabase.from("commune_delivery_rates").select("*").order("wilaya_code").order("commune");
    if (data.wilaya_code) q = q.eq("wilaya_code", data.wilaya_code);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CommuneRateSchema = z.object({
  wilaya_code: z.number().int().min(1).max(58),
  commune: z.string().trim().min(2, "اسم البلدية قصير جدا").max(80, "اسم البلدية طويل جدا"),
  delivery_home_dzd: z.number().int().min(0, "لا يمكن أن يكون سالبا").max(100000, "قيمة كبيرة جدا"),
  delivery_office_dzd: z.number().int().min(0, "لا يمكن أن يكون سالبا").max(100000, "قيمة كبيرة جدا"),
});

export const adminUpsertCommuneRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid().optional() }).merge(CommuneRateSchema).parse(input)
  )
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const payload = {
      wilaya_code: data.wilaya_code,
      commune: data.commune,
      delivery_home_dzd: data.delivery_home_dzd,
      delivery_office_dzd: data.delivery_office_dzd,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("commune_delivery_rates").update(payload).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("commune_delivery_rates")
      .upsert(payload, { onConflict: "wilaya_code,commune" })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteCommuneRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { error } = await context.supabase.from("commune_delivery_rates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
