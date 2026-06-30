import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { ProductRow, CategoryRow, WilayaRow } from "./types";

function pubClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } }
  );
}

const PRODUCT_COLS = "id,slug,name_ar,name_fr,name_en,description_ar,description_fr,description_en,brand,gender,category_id,price_dzd,discount_price_dzd,stock,images,specs,featured,is_new,is_limited,is_active,created_at";

function mapProduct(r: any): ProductRow {
  return { ...r, images: Array.isArray(r.images) ? r.images : [], specs: r.specs ?? {} };
}

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        search: z.string().optional(),
        brand: z.string().optional(),
        gender: z.enum(["men", "women", "unisex"]).optional(),
        category: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        inStock: z.boolean().optional(),
        sort: z.enum(["newest", "price_asc", "price_desc", "name"]).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }) => {
    const supabase = pubClient();
    let q = supabase.from("products").select(PRODUCT_COLS).eq("is_active", true);
    if (data.search) q = q.or(`name_ar.ilike.%${data.search}%,name_fr.ilike.%${data.search}%,name_en.ilike.%${data.search}%,brand.ilike.%${data.search}%`);
    if (data.brand) q = q.eq("brand", data.brand);
    if (data.gender) q = q.eq("gender", data.gender);
    if (data.category) {
      const { data: cat } = await supabase.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    if (data.minPrice != null) q = q.gte("price_dzd", data.minPrice);
    if (data.maxPrice != null) q = q.lte("price_dzd", data.maxPrice);
    if (data.inStock) q = q.gt("stock", 0);
    switch (data.sort) {
      case "price_asc": q = q.order("price_dzd", { ascending: true }); break;
      case "price_desc": q = q.order("price_dzd", { ascending: false }); break;
      case "name": q = q.order("name_ar", { ascending: true }); break;
      default: q = q.order("created_at", { ascending: false });
    }
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapProduct);
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const supabase = pubClient();
    const { data: row, error } = await supabase.from("products").select(PRODUCT_COLS).eq("slug", data.slug).eq("is_active", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return mapProduct(row);
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = pubClient();
  const { data, error } = await supabase.from("categories").select("id,slug,name_ar,name_fr,name_en,sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
});

export const listWilayas = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = pubClient();
  const { data, error } = await supabase.from("wilayas").select("code,name_ar,name_fr,delivery_home_dzd,delivery_office_dzd").order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as WilayaRow[];
});

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = pubClient();
  const { data, error } = await supabase.from("products").select("brand").eq("is_active", true);
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((d: any) => d.brand))).sort();
});

// Home page bundle
export const homePageData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = pubClient();
  const [featured, newest, limited] = await Promise.all([
    supabase.from("products").select(PRODUCT_COLS).eq("is_active", true).eq("featured", true).order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select(PRODUCT_COLS).eq("is_active", true).eq("is_new", true).order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select(PRODUCT_COLS).eq("is_active", true).eq("is_limited", true).order("created_at", { ascending: false }).limit(6),
  ]);
  return {
    featured: (featured.data ?? []).map(mapProduct),
    newest: (newest.data ?? []).map(mapProduct),
    limited: (limited.data ?? []).map(mapProduct),
  };
});
