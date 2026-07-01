import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from "@/lib/admin.functions";
import { adminUploadImage } from "@/lib/settings.functions";
import { listCategories } from "@/lib/catalog.functions";
import { formatDZD } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";

export const Route = createFileRoute("/admin/products")({ component: ProductsPage });

type FormState = {
  id?: string;
  slug: string; name_ar: string; name_fr: string; name_en: string;
  description_ar: string; brand: string; gender: "men" | "women" | "unisex";
  category_id: string | null; price_dzd: number; discount_price_dzd: number | null;
  stock: number; images: string; featured: boolean; is_new: boolean; is_limited: boolean; is_active: boolean;
};

const empty: FormState = {
  slug: "", name_ar: "", name_fr: "", name_en: "", description_ar: "",
  brand: "", gender: "men", category_id: null, price_dzd: 0, discount_price_dzd: null,
  stock: 0, images: "", featured: false, is_new: false, is_limited: false, is_active: true,
};

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function ProductsPage() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts() });
  const cats = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const [form, setForm] = useState<FormState | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList | null) {
    if (!files || !form) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: أكبر من 5MB`); continue; }
        const dataUrl = await fileToDataUrl(file);
        const res: any = await adminUploadImage({ data: { filename: file.name, dataUrl, folder: "products" } as any } as any);
        urls.push(res.url);
      }
      if (urls.length) {
        const existing = form.images ? form.images.split("\n").map((s) => s.trim()).filter(Boolean) : [];
        setForm({ ...form, images: [...existing, ...urls].join("\n") });
        toast.success(`تم رفع ${urls.length} صورة`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        slug: f.slug, name_ar: f.name_ar,
        name_fr: f.name_fr?.trim() || f.name_ar,
        name_en: f.name_en?.trim() || f.name_ar,
        description_ar: f.description_ar || null, description_fr: null, description_en: null,
        brand: f.brand, gender: f.gender, category_id: f.category_id,
        price_dzd: f.price_dzd, discount_price_dzd: f.discount_price_dzd, stock: f.stock,
        images: f.images.split("\n").map((s) => s.trim()).filter(Boolean),
        specs: {}, featured: f.featured, is_new: f.is_new, is_limited: f.is_limited, is_active: f.is_active,
      };
      if (f.id) return adminUpdateProduct({ data: { id: f.id, ...payload } as any } as any);
      return adminCreateProduct({ data: payload as any } as any);
    },
    onSuccess: () => {
      toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["home-data"] });
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteProduct({ data: { id } } as any),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-products"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">المنتجات</h1>
        <Button onClick={() => setForm(empty)} className="gold-gradient text-ink"><Plus className="me-1 h-4 w-4" /> إضافة منتج</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase"><tr>
            <th className="p-3 text-start">المنتج</th><th className="p-3 text-start">السعر</th><th className="p-3 text-start">المخزون</th><th></th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {(products.data ?? []).map((p: any) => (
              <tr key={p.id}>
                <td className="p-3"><div className="flex items-center gap-2">{p.images?.[0] && <img src={p.images[0]} className="h-10 w-10 rounded object-cover" alt="" />}<div><p className="font-medium">{p.name_ar}</p><p className="text-xs text-muted-foreground">{p.brand}</p></div></div></td>
                <td className="p-3">{formatDZD(p.price_dzd)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-end">
                  <Button size="icon" variant="ghost" onClick={() => setForm({
                    id: p.id, slug: p.slug, name_ar: p.name_ar, name_fr: p.name_fr, name_en: p.name_en,
                    description_ar: p.description_ar ?? "", brand: p.brand, gender: p.gender,
                    category_id: p.category_id, price_dzd: p.price_dzd, discount_price_dzd: p.discount_price_dzd,
                    stock: p.stock, images: (p.images ?? []).join("\n"),
                    featured: !!p.featured, is_new: !!p.is_new, is_limited: !!p.is_limited, is_active: p.is_active !== false,
                  })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm(`حذف ${p.name_ar}؟`) && del.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Dialog open onOpenChange={(o) => !o && setForm(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "تعديل المنتج" : "إضافة منتج"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const imgs = form.images.split("\n").map((s) => s.trim()).filter(Boolean);
              if (imgs.length === 0) { toast.error("أضف صورة واحدة على الأقل"); return; }
              if (!form.name_fr.trim()) setForm({ ...form, name_fr: form.name_ar });
              if (!form.name_en.trim()) setForm({ ...form, name_en: form.name_ar });
              save.mutate(form);
            }} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>الاسم (عربي)</Label><Input required value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
                <div><Label>Slug</Label><Input required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
                <div><Label>الاسم (فرنسي)</Label><Input required value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} /></div>
                <div><Label>الاسم (إنجليزي)</Label><Input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
                <div><Label>الماركة</Label><Input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
                <div>
                  <Label>النوع</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="men">رجالي</SelectItem><SelectItem value="women">نسائي</SelectItem><SelectItem value="unisex">للجنسين</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الفئة</Label>
                  <Select value={form.category_id ?? "_none"} onValueChange={(v) => setForm({ ...form, category_id: v === "_none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">بدون</SelectItem>
                      {(cats.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>السعر (دج)</Label><Input type="number" required min={0} value={form.price_dzd} onChange={(e) => setForm({ ...form, price_dzd: Number(e.target.value) })} /></div>
                <div><Label>سعر التخفيض (اختياري)</Label><Input type="number" min={0} value={form.discount_price_dzd ?? ""} onChange={(e) => setForm({ ...form, discount_price_dzd: e.target.value ? Number(e.target.value) : null })} /></div>
                <div><Label>المخزون</Label><Input type="number" required min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
              </div>
              <div><Label>الوصف</Label><Textarea rows={3} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>الصور</Label>
                <div className="flex flex-wrap gap-2">
                  {form.images.split("\n").map((s) => s.trim()).filter(Boolean).map((url, i) => (
                    <div key={i} className="relative h-20 w-20 overflow-hidden rounded border border-border">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const arr = form.images.split("\n").map((s) => s.trim()).filter(Boolean);
                          arr.splice(i, 1);
                          setForm({ ...form, images: arr.join("\n") });
                        }}
                        className="absolute end-1 top-1 rounded-full bg-black/70 p-0.5 text-white"
                        aria-label="حذف"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-border text-xs text-muted-foreground hover:border-gold hover:text-gold">
                    <Upload className="h-4 w-4" />
                    {uploading ? "..." : "رفع"}
                    <input type="file" accept="image/*" multiple className="hidden" disabled={uploading}
                      onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }} />
                  </label>
                </div>
                <Textarea rows={2} placeholder="أو ألصق روابط الصور (رابط في كل سطر)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2"><Checkbox checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: !!v })} /> مميّز</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.is_new} onCheckedChange={(v) => setForm({ ...form, is_new: !!v })} /> جديد</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.is_limited} onCheckedChange={(v) => setForm({ ...form, is_limited: !!v })} /> إصدار محدود</label>
                <label className="flex items-center gap-2"><Checkbox checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} /> نشط</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="gold-gradient text-ink" disabled={save.isPending}>{save.isPending ? "..." : "حفظ"}</Button>
                <Button type="button" variant="outline" onClick={() => setForm(null)}>إلغاء</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
