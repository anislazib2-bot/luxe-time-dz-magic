import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pubClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } }
  );
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("غير مصرح");
}

export const getStoreSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = pubClient();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

const SettingsSchema = z.object({
  store_name: z.string().trim().min(2, "الاسم قصير جداً").max(100),
  logo_url: z.string().trim().max(500).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  instagram_url: z.string().trim().max(200).nullable().optional(),
  facebook_url: z.string().trim().max(200).nullable().optional(),
  email: z.string().trim().max(200).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  topbar_text: z.string().trim().max(200).nullable().optional(),
  free_shipping_threshold_dzd: z.number().int().min(0).nullable().optional(),
});

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SettingsSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const { error } = await context.supabase.from("store_settings").update(data).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Upload a product image (base64 data URL) to storage; returns the proxy URL.
export const adminUploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      filename: z.string().min(1).max(120),
      dataUrl: z.string().min(20).max(15 * 1024 * 1024),
      folder: z.enum(["products", "logos"]).default("products"),
    }).parse(input)
  )
  .handler(async ({ context, data }) => {
    await assertAdmin({ supabase: context.supabase, userId: context.userId });
    const m = data.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) throw new Error("صورة غير صالحة");
    const contentType = m[1];
    const ext = (contentType.split("/")[1] || "jpg").replace("+xml", "").split(";")[0];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("الصورة أكبر من 5MB");
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const path = `${data.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("product-images").upload(path, bytes, {
      contentType, upsert: false,
    });
    if (error) throw new Error(error.message);
    return { url: `/api/public/product-images/${path}`, path };
  });
